declare const widgetApi: {
  onStatsUpdated: (cb: (data: BootstrapData) => void) => void;
  onStatsError: (cb: (data: { error: boolean; message: string }) => void) => void;
  onPinChanged: (cb: (pinned: boolean) => void) => void;
  onNeedsLogin: (cb: () => void) => void;
  onSigningIn: (cb: () => void) => void;
  onLocaleChange: (cb: (locale: string) => void) => void;
  t: (key: string) => string;
  refresh: () => void;
  collapse: () => void;
  expand: () => void;
  togglePin: () => void;
  openLogin: () => void;
  openTrendWindow: () => void;
};

interface PersonEntry {
  user_id: string; handle: string; display_name: string; avatar_url: string | null;
  rank: number; total_tokens: number; ai_time_mins: number;
  team_name: string | null; team_handle: string | null;
}
interface TeamEntry {
  rank: number; handle: string; name: string; avatar_url: string | null;
  member_count: number; active_members: number; total_tokens: number; boost_ratio: number;
}
interface ViewerOrg {
  id: string; name: string; slug: string; handle: string; avatar_url: string | null;
}
interface ViewerProfile {
  id: string; handle: string; display_name: string; avatar_url: string | null;
  initials?: string; organizations?: Record<string, ViewerOrg | null>;
}
interface DashboardSourceCard {
  source: string; tokens_used: number; provider_total_tokens: number;
  ai_time_mins: number; coding_time_mins: number; sessions: number;
}
interface DashboardStats {
  sourceCards: DashboardSourceCard[];
  periodSourceCards: Record<string, DashboardSourceCard[]>;
  totalTokens: number;
}
interface BootstrapData {
  periodId: string;
  people: PersonEntry[];
  teams: TeamEntry[];
  currentUserId: string | null;
  viewer: ViewerProfile | null;
  myPeopleRankChange?: number | null;
  myTeamRankChange?: number | null;
  myTokensDelta?: number | null;
  lastKnownRank?: number | null;
  lastKnownTokens?: number | null;
  lastKnownTeamRank?: number | null;
  dashboardStats?: DashboardStats | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function fmtMins(mins: number): string {
  if (mins < 1) return '0m';
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
}

function relativeTime(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  const intlLocale = currentLocale === 'en' ? 'en' : 'zh-CN';
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'always' });
  if (s < 60) return rtf.format(-s, 'second');
  if (s < 3600) return rtf.format(-Math.floor(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), 'hour');
  return rtf.format(-Math.floor(s / 86400), 'day');
}

function initials(name: string): string {
  return (name || '?').slice(0, 2).toUpperCase();
}

function avatarEl(url: string | null, name: string, cls: string, phCls: string): string {
  if (url) return `<img class="${cls}" src="${url}" alt="" onerror="this.style.display='none'">`;
  return `<div class="${phCls}">${initials(name)}</div>`;
}

function periodLabel(id: string): string {
  const [, date] = id.split(':');
  if (!date) return id;
  const d = new Date(date);
  const intlLocale = currentLocale === 'en' ? 'en-US' : 'zh-CN';
  return d.toLocaleDateString(intlLocale, { month: 'short', day: 'numeric' });
}

function rankTier(rank: number): string {
  if (rank === 1) return 'tier-gold';
  if (rank === 2) return 'tier-silver';
  if (rank === 3) return 'tier-bronze';
  if (rank <= 10) return 'tier-blue';
  return 'tier-green';
}

// ── State ─────────────────────────────────────────────────────────────────────

let currentTab: 'people' | 'teams' = 'people';
let lastData: BootstrapData | null = null;
let lastUpdated: Date | null = null;
let isCollapsed = false;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let currentLocale = 'zh';
let locked = false;

// ── DOM refs ──────────────────────────────────────────────────────────────────

const btnPin = document.getElementById('btn-pin') as HTMLButtonElement;
const btnRefresh = document.getElementById('btn-refresh') as HTMLButtonElement;
const btnCollapse = document.getElementById('btn-collapse') as HTMLButtonElement;
const updatedAt = document.getElementById('updated-at')!;
const ucName = document.getElementById('uc-name')!;
const ucTeam = document.getElementById('uc-team')!;
const ucTokens = document.getElementById('uc-tokens')!;
const ucTokensLabel = document.getElementById('uc-tokens-label')!;
const statTokensVal = document.getElementById('stat-tokens-val')!;
const statTokensSub = document.getElementById('stat-tokens-sub')!;
const statCodingVal = document.getElementById('stat-coding-val')!;
const statAiVal = document.getElementById('stat-ai-val')!;
const list = document.getElementById('list')!;
const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');

// ── Render user card ─────────────────────────────────────────────────────────

function renderUserCard(data: BootstrapData): void {
  const { viewer, people, currentUserId, dashboardStats } = data;
  const uid = viewer?.id ?? currentUserId;
  const me = (uid ? people.find((p) => p.user_id === uid) : undefined)
    ?? (viewer?.handle ? people.find((p) => p.handle === viewer.handle) : undefined);

  ucName.classList.remove('skeleton', 'skel-bar');
  ucTeam.classList.remove('skeleton', 'skel-bar');
  ucTokens.classList.remove('skeleton', 'skel-bar');
  ucName.removeAttribute('style');
  ucTeam.removeAttribute('style');
  ucTokens.removeAttribute('style');

  const avatarUrl = viewer?.avatar_url ?? me?.avatar_url ?? null;
  const profile = viewer ?? (me ? { id: me.user_id, handle: me.handle, display_name: me.display_name, avatar_url: avatarUrl } : null);

  if (profile) {
    const avatarWrap = document.getElementById('uc-avatar-wrap')!;
    avatarWrap.outerHTML = avatarUrl
      ? `<img id="uc-avatar-wrap" class="uc-avatar" src="${avatarUrl}" alt="" onerror="this.style.display='none'">`
      : `<div id="uc-avatar-wrap" class="uc-avatar-placeholder">${initials(profile.display_name || profile.handle)}</div>`;
    ucName.textContent = profile.display_name || profile.handle;
    const teamName = me?.team_name || viewer?.organizations?.team?.name || '';
    ucTeam.textContent = teamName;
  }

  // Determine period tokens from dashboard stats or live leaderboard
  const periodCards = dashboardStats?.periodSourceCards?.[data.periodId];
  const periodTokens = periodCards
    ? periodCards.reduce((s: number, c: DashboardSourceCard) => s + (c.provider_total_tokens ?? 0), 0)
    : me?.total_tokens ?? null;
  const periodCodingMins = periodCards
    ? periodCards.reduce((s: number, c: DashboardSourceCard) => s + (c.coding_time_mins ?? 0), 0)
    : me?.ai_time_mins ?? null;
  const periodAiMins = periodCards
    ? periodCards.reduce((s: number, c: DashboardSourceCard) => s + (c.ai_time_mins ?? 0), 0)
    : me?.ai_time_mins ?? null;

  if (periodTokens != null) {
    ucTokens.textContent = fmtTokens(periodTokens);
    ucTokensLabel.style.visibility = 'visible';
    ucTokensLabel.textContent = `tokens · ${periodLabel(data.periodId)}`;
    statTokensVal.textContent = fmtTokens(periodTokens);
    statTokensSub.textContent = periodLabel(data.periodId);
  } else {
    ucTokens.textContent = '—';
    ucTokensLabel.style.visibility = 'hidden';
    statTokensVal.textContent = '—';
    statTokensSub.textContent = '';
  }

  const deltaEl = document.getElementById('uc-tokens-delta')!;
  deltaEl.style.visibility = 'hidden';

  statCodingVal.textContent = periodCodingMins != null ? fmtMins(periodCodingMins) : '—';
  statAiVal.textContent = periodAiMins != null ? fmtMins(periodAiMins) : '—';
}

// ── Render list ───────────────────────────────────────────────────────────────

function renderPeople(people: PersonEntry[], currentUserId: string | null, viewerHandle: string | null = null): void {
  list.innerHTML = people.map((p) => {
    const isMe = p.user_id === currentUserId || (viewerHandle != null && p.handle === viewerHandle);
    const rCls = p.rank === 1 ? 'r1' : p.rank === 2 ? 'r2' : p.rank === 3 ? 'r3' : '';
    return `
      <div class="lb-row${isMe ? ' is-me' : ''}">
        <span class="lb-rank ${rCls}">${p.rank}</span>
        ${avatarEl(p.avatar_url, p.display_name || p.handle, 'lb-avatar', 'lb-avatar-ph')}
        <div class="lb-info">
          <div class="lb-name">${p.display_name || p.handle}</div>
          ${p.team_name ? `<div class="lb-sub">${p.team_name}</div>` : ''}
        </div>
        <span class="lb-val${isMe ? ' is-me' : ''}">${fmtTokens(p.total_tokens)}</span>
      </div>`;
  }).join('');
}

function renderTeams(teams: TeamEntry[]): void {
  list.innerHTML = teams.map((t) => {
    const rCls = t.rank === 1 ? 'r1' : t.rank === 2 ? 'r2' : t.rank === 3 ? 'r3' : '';
    return `
      <div class="lb-row">
        <span class="lb-rank ${rCls}">${t.rank}</span>
        ${avatarEl(t.avatar_url, t.name || t.handle, 'lb-avatar', 'lb-avatar-ph')}
        <div class="lb-info">
          <div class="lb-name">${t.name || t.handle}</div>
          <div class="lb-sub">${t.member_count} ${widgetApi.t('team.members')} · ${t.active_members} ${widgetApi.t('team.active')}</div>
        </div>
        <span class="lb-val">${fmtTokens(t.total_tokens)}</span>
      </div>`;
  }).join('');
}

function renderTab(): void {
  if (!lastData) return;
  if (currentTab === 'people') renderPeople(lastData.people, lastData.viewer?.id ?? lastData.currentUserId, lastData.viewer?.handle ?? null);
  else renderTeams(lastData.teams);
}

// ── Update timestamp ticker ───────────────────────────────────────────────────

function startTimeTicker(): void {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (lastUpdated) updatedAt.textContent = relativeTime(lastUpdated);
  }, 1_000);
}

// ── Refresh state ─────────────────────────────────────────────────────────────

function setRefreshing(_val: boolean): void {
  // refresh is now automatic (1-min polling); no spinner needed
}

// ── Auth overlay ──────────────────────────────────────────────────────────────

const LOCK_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

function showOverlay(type: 'needs-login' | 'signing-in'): void {
  const overlay = document.getElementById('auth-overlay')!;
  const graphic = document.getElementById('auth-overlay-graphic')!;
  const msg = document.getElementById('auth-overlay-msg')!;
  const sub = document.getElementById('auth-overlay-sub')!;
  const btnLogin = document.getElementById('btn-login')!;
  if (type === 'needs-login') {
    graphic.innerHTML = LOCK_SVG;
    graphic.className = 'auth-graphic';
    msg.textContent = widgetApi.t('overlay.needsLogin');
    sub.textContent = widgetApi.t('overlay.needsLoginSub');
    btnLogin.textContent = widgetApi.t('overlay.loginBtn');
    btnLogin.classList.remove('hidden');
  } else {
    graphic.innerHTML = '<div class="auth-spinner-ring"></div>';
    graphic.className = 'auth-graphic';
    msg.textContent = widgetApi.t('overlay.signingIn');
    sub.textContent = widgetApi.t('overlay.signingInSub');
    btnLogin.classList.add('hidden');
  }
  overlay.classList.remove('hidden');
}

function hideOverlay(): void {
  document.getElementById('auth-overlay')?.classList.add('hidden');
}

// ── i18n ──────────────────────────────────────────────────────────────────────

function applyLocale(): void {
  currentLocale = widgetApi.t('__locale__');
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')!;
    el.textContent = widgetApi.t(key);
  });
  btnPin.title = btnPin.classList.contains('pinned')
    ? widgetApi.t('btn.unpin')
    : widgetApi.t('btn.pinned');
  btnRefresh.title = widgetApi.t('btn.refresh');
  btnCollapse.title = widgetApi.t('btn.collapse');
  if (lastUpdated) updatedAt.textContent = relativeTime(lastUpdated);
  if (lastData) renderUserCard(lastData);
}

// ── Handlers ──────────────────────────────────────────────────────────────────

widgetApi.onStatsUpdated((data) => {
  if (!locked) hideOverlay();
  lastData = data;
  lastUpdated = new Date();
  updatedAt.textContent = '刚刚';
  setRefreshing(false);
  renderUserCard(data);
  renderTab();
});

widgetApi.onStatsError(() => {
  setRefreshing(false);
  if (lastUpdated) updatedAt.textContent = relativeTime(lastUpdated) + ' ⚠︎';
});

widgetApi.onPinChanged((pinned) => {
  btnPin.classList.toggle('pinned', pinned);
  btnPin.title = pinned ? widgetApi.t('btn.unpin') : widgetApi.t('btn.pinned');
});

widgetApi.onNeedsLogin(() => { locked = true; showOverlay('needs-login'); });
widgetApi.onSigningIn(() => { locked = false; showOverlay('signing-in'); });

btnRefresh.addEventListener('click', () => {
  btnRefresh.querySelector('svg')?.classList.add('spinning');
  widgetApi.refresh();
  setTimeout(() => btnRefresh.querySelector('svg')?.classList.remove('spinning'), 1000);
});

document.getElementById('btn-trend')?.addEventListener('click', () => {
  widgetApi.openTrendWindow();
});

document.getElementById('btn-login')?.addEventListener('click', () => {
  widgetApi.openLogin();
});

btnPin.addEventListener('click', () => {
  widgetApi.togglePin();
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    currentTab = tab.dataset.tab as 'people' | 'teams';
    tabs.forEach((t) => t.classList.toggle('active', t === tab));
    renderTab();
  });
});

btnCollapse.addEventListener('click', () => {
  isCollapsed = !isCollapsed;
  document.body.classList.toggle('collapsed', isCollapsed);
  if (isCollapsed) widgetApi.collapse();
  else widgetApi.expand();
});

startTimeTicker();
applyLocale();
widgetApi.onLocaleChange(() => applyLocale());
