import { net, ipcMain, session } from 'electron';
import Store from 'electron-store';

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

export interface ViewerProfile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
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

export function getUsageHistory(range: UsageHistoryRange): UsagePoint[] {
  const snaps = usageHistoryStore.get('snaps');
  const now = Date.now();

  if (range === 'day') {
    const curHour = localHourStart(now);
    return Array.from({ length: 24 }, (_, i) => {
      const hStart = curHour - (23 - i) * H;
      const h = new Date(hStart).getHours();
      const label = `${String(h).padStart(2, '0')}:00`;
      const curr = latestSnapIn(snaps, hStart, hStart + H);
      const prev = latestSnapIn(snaps, hStart - H, hStart);
      return { label, tokens: usageDelta(curr, prev) };
    });
  }

  const buckets = range === 'month' ? 30 : 7;
  const today = localDayStart(now);
  return Array.from({ length: buckets }, (_, i) => {
    const dStart = today - (buckets - 1 - i) * D;
    const d = new Date(dStart + 12 * H); // noon → correct local date in any TZ
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
    const raw = part0.value.startsWith('base64-')
      ? Buffer.from(part0.value.slice(7), 'base64').toString('utf8')
      : part0.value;
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
    req.on('response', (response) => {
      const status = response.statusCode;
      if (status === 401 || status === 400) {
        ipcMain.emit('auth:needs-login');
        resolve({ type: 'network', message: 'Unauthorized', status });
        return;
      }
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ type: 'network', message: 'Invalid JSON' });
        }
      });
    });
    req.on('error', (err) => resolve({ type: 'network', message: err.message }));
    req.end();
  });
}

// ── Viewer fetch ──────────────────────────────────────────────────────────────

export async function fetchViewer(): Promise<ViewerProfile | null> {
  if (demoBootstrap) return demoBootstrap.viewer;
  const raw = await requestJson('https://agentboard.cc/api/leaderboard/viewer');
  console.log('[viewer] raw response:', JSON.stringify(raw));
  if ((raw as NetworkError).type === 'network') {
    console.log('[viewer] network error, falling back to cache');
    return getCachedViewer();
  }

  const data = raw as { currentUser: ViewerProfile | null };
  if (data.currentUser) {
    console.log('[viewer] currentUser:', JSON.stringify(data.currentUser));
    saveViewer(data.currentUser);
    return data.currentUser;
  }
  console.log('[viewer] no currentUser in response, clearing stale session and triggering login');
  const staleCookies = await getAuthCookies();
  await Promise.all(
    staleCookies
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

  const data = bootstrapRaw as {
    snapshot: { periodId: string; people: PersonEntry[]; teams: TeamEntry[] };
  };

  const cookieUserId = parseCurrentUserIdFromCookies(cookies);
  const currentUserId = cookieUserId ?? viewer?.id ?? null;

  console.log('[bootstrap] viewer:', viewer ? `id=${viewer.id} handle=${viewer.handle}` : 'null');
  console.log('[bootstrap] cookieUserId:', cookieUserId);
  console.log('[bootstrap] currentUserId (resolved):', currentUserId);
  console.log('[bootstrap] people count:', data.snapshot.people.length);
  if (data.snapshot.people.length > 0) {
    console.log('[bootstrap] first person sample:', JSON.stringify(data.snapshot.people[0]));
  }
  const matchById = currentUserId ? data.snapshot.people.find((p) => p.user_id === currentUserId) : null;
  const matchByHandle = viewer?.handle ? data.snapshot.people.find((p) => p.handle === viewer.handle) : null;
  console.log('[bootstrap] match by id:', matchById ? `rank=${matchById.rank}` : 'NOT FOUND');
  console.log('[bootstrap] match by handle:', matchByHandle ? `rank=${matchByHandle.rank}` : 'NOT FOUND');

  return {
    periodId: data.snapshot.periodId,
    people: data.snapshot.people,
    teams: data.snapshot.teams,
    currentUserId,
    viewer,
  };
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
  if (uid) {
    const me = data.people.find((p) => p.user_id === uid)
      ?? (data.viewer?.handle ? data.people.find((p) => p.handle === data.viewer!.handle) : undefined);
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
    }
  }

  ipcMain.emit('stats:updated', null, { ...data, myPeopleRankChange, myTeamRankChange, myTokensDelta });
}
