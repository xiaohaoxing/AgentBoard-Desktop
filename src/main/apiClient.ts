import { net, ipcMain, session } from 'electron';
import Store from 'electron-store';
import fs from 'fs';
import os from 'os';

function debugLog(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(`${os.homedir()}/agentboard-debug.log`, line);
  console.log(msg);
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PersonEntry {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  rank: number;
  total_tokens: number;
  ai_time_mins: number;
  coding_time_mins: number;
  sessions: number;
  lines_added: number;
  lines_removed: number;
  boost_ratio: number;
  team_name: string | null;
  team_handle: string | null;
}

export interface TeamEntry {
  rank: number;
  handle: string;
  name: string;
  avatar_url: string | null;
  member_count: number;
  active_members: number;
  total_tokens: number;
  ai_time_mins: number;
  sessions: number;
  boost_ratio: number;
}

export interface ViewerOrg {
  id: string;
  name: string;
  slug: string;
  handle: string;
  avatar_url: string | null;
  invite_code?: string;
}

export interface ViewerProfile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  role?: string;
  initials?: string;
  timezone?: string;
  followingIds?: string[];
  organizations?: Record<string, ViewerOrg | null>;
}

export interface BootstrapData {
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

export interface NetworkError {
  type: 'network';
  message: string;
  status?: number;
}

export interface UsagePoint {
  label: string;
  tokens: number;
}

export type UsageHistoryRange = 'day' | 'week' | 'month';

// ── Persistent viewer cache ───────────────────────────────────────────────────

const viewerStore = new Store<{ viewer: ViewerProfile | null }>({
  name: 'viewer-profile',
  defaults: { viewer: null },
});

// ── Rank history ──────────────────────────────────────────────────────────────

interface RankSnapshot { peopleRank: number; totalTokens: number; teamRank?: number; timestamp: number; }
const rankHistoryStore = new Store<{ ranks: Record<string, RankSnapshot[]> }>({
  name: 'rank-history',
  defaults: { ranks: {} },
});

// ── Usage history (hourly snapshots, local-only) ───────────────────────────────

interface HourlyUsageSnap { tokens: number; periodId: string; }
// Key = local hour-bucket start timestamp (ms), value = latest poll value in that hour
const usageHistoryStore = new Store<{ snaps: Record<string, HourlyUsageSnap> }>({
  name: 'usage-history',
  defaults: { snaps: {} },
});

const H = 3_600_000;   // 1 hour in ms
const D = 86_400_000;  // 1 day in ms

function localHourStart(ts: number = Date.now()): number {
  const d = new Date(ts);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}

function localDayStart(ts: number = Date.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function saveUsageSnapshot(tokens: number, periodId: string): void {
  const key = String(localHourStart());
  const snaps = usageHistoryStore.get('snaps');
  snaps[key] = { tokens, periodId };
  usageHistoryStore.set('snaps', snaps);
}

export function clearUsageHistory(): void {
  usageHistoryStore.set('snaps', {});
}

function latestSnapIn(snaps: Record<string, HourlyUsageSnap>, from: number, to: number): HourlyUsageSnap | null {
  let best: HourlyUsageSnap | null = null;
  let bestTs = -1;
  for (const [k, v] of Object.entries(snaps)) {
    const ts = Number(k);
    if (ts >= from && ts < to && ts > bestTs) { best = v; bestTs = ts; }
  }
  return best;
}

function usageDelta(curr: HourlyUsageSnap | null, prev: HourlyUsageSnap | null): number {
  if (!curr) return 0;
  if (!prev || prev.periodId !== curr.periodId) return curr.tokens;
  return Math.max(0, curr.tokens - prev.tokens);
}

export function getUsageHistory(range: UsageHistoryRange, offset: number = 0): UsagePoint[] {
  const snaps = usageHistoryStore.get('snaps');

  if (range === 'day') {
    const shiftedNow = Date.now() + offset * 24 * H;
    const dayStart = localDayStart(shiftedNow);
    return Array.from({ length: 24 }, (_, i) => {
      const hStart = dayStart + i * H;
      const h = new Date(hStart).getHours();
      const label = `${String(h).padStart(2, '0')}:00`;
      const curr = latestSnapIn(snaps, hStart, hStart + H);
      const prev = latestSnapIn(snaps, hStart - H, hStart);
      return { label, tokens: usageDelta(curr, prev) };
    });
  }

  if (range === 'week') {
    // Natural calendar week: Monday–Sunday, offset in weeks
    const today = localDayStart();
    const todayDate = new Date(today);
    const dow = todayDate.getDay(); // 0=Sun, 1=Mon … 6=Sat
    const toMonday = dow === 0 ? -6 : 1 - dow;
    const weekStart = today + (toMonday + offset * 7) * D;
    return Array.from({ length: 7 }, (_, i) => {
      const dStart = weekStart + i * D;
      const d = new Date(dStart + 12 * H);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const label = `${mm}/${dd}`;
      const curr = latestSnapIn(snaps, dStart, dStart + D);
      const prev = latestSnapIn(snaps, dStart - D, dStart);
      return { label, tokens: usageDelta(curr, prev) };
    });
  }

  // Natural calendar month, offset in months
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + offset;
  while (month < 0) { month += 12; year -= 1; }
  while (month >= 12) { month -= 12; year += 1; }
  const monthStart = new Date(year, month, 1, 0, 0, 0, 0).getTime();
  const nextMonthStart = new Date(year, month + 1, 1, 0, 0, 0, 0).getTime();
  const daysInMonth = Math.round((nextMonthStart - monthStart) / D);
  return Array.from({ length: daysInMonth }, (_, i) => {
    const dStart = monthStart + i * D;
    const d = new Date(dStart + 12 * H);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const label = `${mm}/${dd}`;
    const curr = latestSnapIn(snaps, dStart, dStart + D);
    const prev = latestSnapIn(snaps, dStart - D, dStart);
    return { label, tokens: usageDelta(curr, prev) };
  });
}

export function getCachedViewer(): ViewerProfile | null {
  return viewerStore.get('viewer');
}

// ── Demo mode ─────────────────────────────────────────────────────────────────

let demoBootstrap: BootstrapData | null = null;

export function setDemoMode(data: BootstrapData): void {
  demoBootstrap = data;
}

function saveViewer(v: ViewerProfile): void {
  viewerStore.set('viewer', v);
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

const COOKIE_DOMAIN = 'agentboard.cc';
const SUPABASE_COOKIE_PREFIX = 'sb-vtgpooterdbtqcjvbvgl-auth-token';

async function getAuthCookies(): Promise<Electron.Cookie[]> {
  return session.defaultSession.cookies.get({ url: `https://${COOKIE_DOMAIN}` });
}

function parseCurrentUserIdFromCookies(cookies: Electron.Cookie[]): string | null {
  const part0 = cookies.find((c) => c.name === `${SUPABASE_COOKIE_PREFIX}.0`);
  if (!part0) return null;
  try {
    // The session JSON may be split across .0, .1, .2 … chunks of base64.
    // Collect all parts in order and concatenate before decoding.
    const parts = cookies
      .filter((c) => c.name.startsWith(`${SUPABASE_COOKIE_PREFIX}.`))
      .sort((a, b) => {
        const ai = parseInt(a.name.split('.').pop()!, 10);
        const bi = parseInt(b.name.split('.').pop()!, 10);
        return ai - bi;
      });

    const isBase64 = part0.value.startsWith('base64-');
    let raw: string;
    if (isBase64) {
      const combined = parts.map((p) => p.value.startsWith('base64-') ? p.value.slice(7) : p.value).join('');
      raw = Buffer.from(combined, 'base64').toString('utf8');
    } else {
      raw = parts.map((p) => p.value).join('');
    }
    const parsed = JSON.parse(raw);
    return parsed?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const cookies = await getAuthCookies();
  return parseCurrentUserIdFromCookies(cookies);
}

// ── HTTP request ──────────────────────────────────────────────────────────────

function requestJson(url: string): Promise<unknown | NetworkError> {
  return new Promise((resolve) => {
    const req = net.request({ method: 'GET', url, useSessionCookies: true });
    req.setHeader('Accept', '*/*');
    req.setHeader('User-Agent', 'Mozilla/5.0 AgentBoard-Desktop');

    let body = '';
    let settled = false;
    const settle = (value: unknown | NetworkError) => {
      if (!settled) { settled = true; resolve(value); }
    };

    req.on('response', (response) => {
      const status = response.statusCode;
      if (status === 401 || status === 400) {
        ipcMain.emit('auth:needs-login');
        settle({ type: 'network', message: 'Unauthorized', status });
        return;
      }
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        try {
          settle(JSON.parse(body));
        } catch {
          settle({ type: 'network', message: 'Invalid JSON' });
        }
      });
      response.on('error', (err: Error) => settle({ type: 'network', message: err.message }));
    });
    req.on('error', (err) => settle({ type: 'network', message: err.message }));
    req.end();
  });
}

function requestText(url: string, extraHeaders: Record<string, string> = {}): Promise<string | NetworkError> {
  return new Promise((resolve) => {
    const req = net.request({ method: 'GET', url, useSessionCookies: true });
    req.setHeader('Accept', 'text/html,*/*');
    req.setHeader('User-Agent', 'Mozilla/5.0 AgentBoard-Desktop');
    for (const [k, v] of Object.entries(extraHeaders)) req.setHeader(k, v);

    let body = '';
    let settled = false;
    const settle = (value: string | NetworkError) => {
      if (!settled) { settled = true; resolve(value); }
    };

    req.on('response', (response) => {
      const status = response.statusCode;
      if (status === 401 || status === 400) {
        settle({ type: 'network', message: 'Unauthorized', status });
        return;
      }
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => settle(body));
      response.on('error', (err: Error) => settle({ type: 'network', message: err.message }));
    });
    req.on('error', (err) => settle({ type: 'network', message: err.message }));
    req.end();
  });
}

export interface DashboardSourceCard {
  source: string;
  tokens_used: number;
  provider_total_tokens: number;
  ai_time_mins: number;
  coding_time_mins: number;
  sessions: number;
  lines_added: number;
  lines_removed: number;
}

export interface DashboardStats {
  sourceCards: DashboardSourceCard[];
  periodSourceCards: Record<string, DashboardSourceCard[]>;
  totalTokens: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  const raw = await requestText('https://agentboard.cc/dashboard', { 'RSC': '1' });
  if (typeof raw !== 'string') {
    debugLog(`[dashboard] fetch error: ${(raw as NetworkError).message}`);
    return null;
  }
  debugLog(`[dashboard] RSC payload length: ${raw.length}`);

  // RSC stream: newline-separated lines of the form "N:JSON"
  for (const line of raw.split('\n')) {
    if (!line.includes('sourceCards')) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const stats = parseSourceCards(line.slice(colon + 1));
    if (stats) {
      debugLog(`[dashboard] found sourceCards: ${stats.sourceCards.length} cards, total=${stats.totalTokens}`);
      return stats;
    }
  }

  debugLog('[dashboard] sourceCards not found in RSC payload');
  return null;
}

function extractJsonValue(text: string, key: string, openChar: string, closeChar: string): string | null {
  const needle = `"${key}":${openChar}`;
  const start = text.indexOf(needle);
  if (start < 0) return null;
  let depth = 0;
  let valueStart = start + needle.length - 1;
  for (let i = valueStart; i < text.length; i++) {
    if (text[i] === openChar) depth++;
    else if (text[i] === closeChar) {
      depth--;
      if (depth === 0) return text.slice(valueStart, i + 1);
    }
  }
  return null;
}

function parseSourceCards(text: string): DashboardStats | null {
  if (!text.includes('"sourceCards"')) return null;
  try {
    const cardsJson = extractJsonValue(text, 'sourceCards', '[', ']');
    if (!cardsJson) return null;
    const sourceCards = JSON.parse(cardsJson) as DashboardSourceCard[];
    const periodJson = extractJsonValue(text, 'periodSourceCards', '{', '}');
    const periodSourceCards = periodJson ? JSON.parse(periodJson) as Record<string, DashboardSourceCard[]> : {};
    const total = sourceCards.reduce((s, c) => s + (c.provider_total_tokens ?? 0), 0);
    return { sourceCards, periodSourceCards, totalTokens: total };
  } catch { return null; }
}

// ── Viewer fetch ──────────────────────────────────────────────────────────────

export async function fetchViewer(): Promise<ViewerProfile | null> {
  if (demoBootstrap) return demoBootstrap.viewer;

  // Only attempt if we actually have auth cookies
  const cookies = await getAuthCookies();
  const hasAuth = cookies.some((c) => c.name.startsWith(SUPABASE_COOKIE_PREFIX));
  if (!hasAuth) return null;

  const raw = await requestJson('https://agentboard.cc/api/leaderboard/viewer');
  debugLog(`[viewer] raw response: ${JSON.stringify(raw)}`);
  if ((raw as NetworkError).type === 'network') {
    debugLog('[viewer] network error, falling back to cache');
    return getCachedViewer();
  }

  const data = raw as { currentUser: ViewerProfile | null };
  if (data.currentUser) {
    debugLog(`[viewer] currentUser: ${JSON.stringify(data.currentUser)}`);
    saveViewer(data.currentUser);
    return data.currentUser;
  }
  // Cookies exist but server says no user — session is stale
  debugLog('[viewer] no currentUser in response, clearing stale session and triggering login');
  await Promise.all(
    cookies
      .filter((c) => c.name.startsWith(SUPABASE_COOKIE_PREFIX))
      .map((c) => session.defaultSession.cookies.remove(`https://${COOKIE_DOMAIN}`, c.name))
  );
  stopPolling();
  ipcMain.emit('auth:needs-login');
  return null;
}

// ── Bootstrap fetch ───────────────────────────────────────────────────────────

export async function fetchBootstrap(): Promise<BootstrapData | NetworkError> {
  if (demoBootstrap) return demoBootstrap;
  const cookies = await getAuthCookies();
  const hasAuth = cookies.some((c) => c.name.startsWith(SUPABASE_COOKIE_PREFIX));
  if (!hasAuth) {
    ipcMain.emit('auth:needs-login');
    return { type: 'network', message: 'No session' };
  }

  const [bootstrapRaw, viewer] = await Promise.all([
    requestJson('https://agentboard.cc/api/leaderboard/bootstrap'),
    fetchViewer(),
  ]);

  if ((bootstrapRaw as NetworkError).type === 'network') return bootstrapRaw as NetworkError;

  // API v2: bootstrap returns timeNavigator; snapshot data is a separate call
  const bootstrap = bootstrapRaw as {
    // v2 shape
    timeNavigator?: { defaultPeriodId?: string };
    // v1 shape (legacy fallback)
    snapshot?: { periodId: string; people: PersonEntry[]; teams: TeamEntry[] };
  };

  let periodId: string;
  let people: PersonEntry[];
  let teams: TeamEntry[];

  if (bootstrap.snapshot) {
    // v1: snapshot embedded in bootstrap
    periodId = bootstrap.snapshot.periodId;
    people = bootstrap.snapshot.people;
    teams = bootstrap.snapshot.teams;
  } else {
    // v2: fetch snapshot separately
    const defaultPeriodId = bootstrap.timeNavigator?.defaultPeriodId
      ?? `day:${new Date().toISOString().slice(0, 10)}`;
    const snapshotRaw = await requestJson(
      `https://agentboard.cc/api/leaderboard/snapshot?periodId=${encodeURIComponent(defaultPeriodId)}`
    );
    if ((snapshotRaw as NetworkError).type === 'network') return snapshotRaw as NetworkError;
    const snap = snapshotRaw as { periodId: string; people: PersonEntry[]; teams: TeamEntry[] };
    periodId = snap.periodId ?? defaultPeriodId;
    people = snap.people ?? [];
    teams = snap.teams ?? [];
  }

  const cookieUserId = parseCurrentUserIdFromCookies(cookies);
  const currentUserId = cookieUserId ?? viewer?.id ?? null;

  debugLog(`[bootstrap] viewer: ${viewer ? `id=${viewer.id} handle=${viewer.handle}` : 'null'}`);
  debugLog(`[bootstrap] cookieUserId: ${cookieUserId}`);
  debugLog(`[bootstrap] currentUserId (resolved): ${currentUserId}`);
  debugLog(`[bootstrap] periodId: ${periodId}`);
  debugLog(`[bootstrap] people count: ${people.length}`);
  debugLog(`[bootstrap] teams count: ${teams.length}`);
  debugLog(`[bootstrap] team handles: ${teams.map((t) => t.handle).join(', ')}`);
  const viewerTeamHandle = viewer?.organizations?.team?.handle ?? null;
  debugLog(`[bootstrap] viewer.organizations.team.handle: ${viewerTeamHandle}`);
  const teamInList = viewerTeamHandle ? teams.find((t) => t.handle === viewerTeamHandle) : null;
  debugLog(`[bootstrap] viewer team in teams list: ${teamInList ? `rank=${teamInList.rank}` : 'NOT FOUND'}`);
  const matchById = currentUserId ? people.find((p) => p.user_id === currentUserId) : null;
  const matchByHandle = viewer?.handle ? people.find((p) => p.handle === viewer.handle) : null;
  debugLog(`[bootstrap] match by id: ${matchById ? `rank=${matchById.rank}` : 'NOT FOUND'}`);
  debugLog(`[bootstrap] match by handle: ${matchByHandle ? `rank=${matchByHandle.rank}` : 'NOT FOUND'}`);

  return { periodId, people, teams, currentUserId, viewer };
}

// ── Polling ───────────────────────────────────────────────────────────────────

let pollingTimer: ReturnType<typeof setInterval> | null = null;

export function startPolling(intervalMs = 60_000): void {
  stopPolling();
  fetchAndBroadcast();
  pollingTimer = setInterval(fetchAndBroadcast, intervalMs);

  ipcMain.removeAllListeners('stats:refresh');
  ipcMain.on('stats:refresh', () => fetchAndBroadcast());
}

export function stopPolling(): void {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

async function fetchAndBroadcast(): Promise<void> {
  if (demoBootstrap) {
    ipcMain.emit('stats:updated', null, demoBootstrap);
    return;
  }
  const result = await fetchBootstrap();
  if ((result as NetworkError).type === 'network') {
    ipcMain.emit('stats:error', null, { error: true, message: (result as NetworkError).message });
    return;
  }
  const data = result as BootstrapData;

  const uid = data.viewer?.id ?? data.currentUserId;
  let myPeopleRankChange: number | null = null;
  let myTeamRankChange: number | null = null;
  let myTokensDelta: number | null = null;
  let lastKnownRank: number | null = null;
  let lastKnownTokens: number | null = null;
  let lastKnownTeamRank: number | null = null;
  if (uid) {
    const me = data.people.find((p) => p.user_id === uid)
      ?? (data.viewer?.handle ? data.people.find((p) => p.handle === data.viewer!.handle) : undefined);
    debugLog(`[broadcast] uid=${uid}, me=${me ? `rank=${me.rank} tokens=${me.total_tokens}` : 'NOT IN PEOPLE'}`);
    debugLog(`[broadcast] viewer.organizations=${JSON.stringify(data.viewer?.organizations)}`);
    debugLog(`[broadcast] teams in list: ${data.teams.map((t) => t.handle).join(', ')}`);
    if (me) {
      const myTeam = me.team_handle ? data.teams.find((t) => t.handle === me.team_handle) : null;
      const history = rankHistoryStore.get('ranks');
      const userHistory: RankSnapshot[] = history[uid] ?? [];

      for (let i = userHistory.length - 1; i >= 0; i--) {
        if (userHistory[i].peopleRank !== me.rank) {
          myPeopleRankChange = userHistory[i].peopleRank - me.rank;
          break;
        }
      }
      for (let i = userHistory.length - 1; i >= 0; i--) {
        if ((userHistory[i].totalTokens ?? 0) !== me.total_tokens) {
          myTokensDelta = me.total_tokens - (userHistory[i].totalTokens ?? 0);
          break;
        }
      }
      if (myTeam) {
        for (let i = userHistory.length - 1; i >= 0; i--) {
          if (userHistory[i].teamRank != null && userHistory[i].teamRank !== myTeam.rank) {
            myTeamRankChange = userHistory[i].teamRank! - myTeam.rank;
            break;
          }
        }
      }

      userHistory.push({ peopleRank: me.rank, totalTokens: me.total_tokens, teamRank: myTeam?.rank, timestamp: Date.now() });
      if (userHistory.length > 60) userHistory.splice(0, userHistory.length - 60);
      rankHistoryStore.set('ranks', { ...history, [uid]: userHistory });

      saveUsageSnapshot(me.total_tokens, data.periodId);
    } else {
      // User not in current leaderboard — surface last known snapshot from history
      const history = rankHistoryStore.get('ranks');
      const userHistory: RankSnapshot[] = history[uid] ?? [];
      if (userHistory.length > 0) {
        const last = userHistory[userHistory.length - 1];
        lastKnownRank = last.peopleRank ?? null;
        lastKnownTokens = last.totalTokens ?? null;
        lastKnownTeamRank = last.teamRank ?? null;
        debugLog(`[broadcast] last known: rank=${lastKnownRank} tokens=${lastKnownTokens} teamRank=${lastKnownTeamRank}`);
      }
    }
  }

  // Fetch dashboard stats when user is not in leaderboard to get real token data
  let dashboardStats: DashboardStats | null = null;
  const meInLeaderboard = uid ? (data.people.find((p) => p.user_id === uid)
    ?? (data.viewer?.handle ? data.people.find((p) => p.handle === data.viewer!.handle) : undefined)) : undefined;
  if (!meInLeaderboard) {
    dashboardStats = await fetchDashboardStats();
    if (dashboardStats) {
      debugLog(`[broadcast] dashboard totalTokens=${dashboardStats.totalTokens}, cards=${dashboardStats.sourceCards.length}`);
    }
  }

  ipcMain.emit('stats:updated', null, { ...data, myPeopleRankChange, myTeamRankChange, myTokensDelta, lastKnownRank, lastKnownTokens, lastKnownTeamRank, dashboardStats });
}
