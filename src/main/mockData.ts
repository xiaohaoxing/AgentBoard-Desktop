import type { BootstrapData, PersonEntry, TeamEntry, ViewerProfile, UsagePoint, UsageHistoryRange } from './apiClient';

export const DEMO_VIEWER: ViewerProfile = {
  id: 'demo-user-007',
  handle: 'alex_chen',
  display_name: 'Alex Chen',
  avatar_url: null,
  role: 'user',
};

const DEMO_PEOPLE: PersonEntry[] = [
  { user_id: 'demo-p-001', handle: 'kai_yamamoto', display_name: 'Kai Yamamoto', avatar_url: null, rank: 1, total_tokens: 11_840_000, ai_time_mins: 3120, coding_time_mins: 5400, sessions: 142, lines_added: 28400, lines_removed: 9200, boost_ratio: 3.2, team_name: 'Tensor Forge', team_handle: 'tensor-forge' },
  { user_id: 'demo-p-002', handle: 'maya_patel', display_name: 'Maya Patel', avatar_url: null, rank: 2, total_tokens: 9_520_000, ai_time_mins: 2640, coding_time_mins: 4380, sessions: 118, lines_added: 22100, lines_removed: 7300, boost_ratio: 2.9, team_name: 'Tensor Forge', team_handle: 'tensor-forge' },
  { user_id: 'demo-p-003', handle: 'felix_bauer', display_name: 'Felix Bauer', avatar_url: null, rank: 3, total_tokens: 7_780_000, ai_time_mins: 2180, coding_time_mins: 3960, sessions: 97, lines_added: 18700, lines_removed: 5900, boost_ratio: 2.6, team_name: 'Code Wizards', team_handle: 'code-wizards' },
  { user_id: 'demo-p-004', handle: 'zoe_kim', display_name: 'Zoe Kim', avatar_url: null, rank: 4, total_tokens: 6_210_000, ai_time_mins: 1760, coding_time_mins: 3240, sessions: 84, lines_added: 15300, lines_removed: 4800, boost_ratio: 2.4, team_name: 'Neural Squad', team_handle: 'neural-squad' },
  { user_id: 'demo-p-005', handle: 'luca_rossi', display_name: 'Luca Rossi', avatar_url: null, rank: 5, total_tokens: 5_090_000, ai_time_mins: 1460, coding_time_mins: 2820, sessions: 71, lines_added: 13100, lines_removed: 4200, boost_ratio: 2.2, team_name: 'Code Wizards', team_handle: 'code-wizards' },
  { user_id: 'demo-p-006', handle: 'priya_nair', display_name: 'Priya Nair', avatar_url: null, rank: 6, total_tokens: 4_310_000, ai_time_mins: 1240, coding_time_mins: 2400, sessions: 62, lines_added: 11200, lines_removed: 3600, boost_ratio: 2.0, team_name: 'Tensor Forge', team_handle: 'tensor-forge' },
  { user_id: 'demo-user-007', handle: 'alex_chen', display_name: 'Alex Chen', avatar_url: null, rank: 7, total_tokens: 3_250_000, ai_time_mins: 940, coding_time_mins: 1980, sessions: 53, lines_added: 9400, lines_removed: 3100, boost_ratio: 1.8, team_name: 'Neural Squad', team_handle: 'neural-squad' },
  { user_id: 'demo-p-008', handle: 'tom_warren', display_name: 'Tom Warren', avatar_url: null, rank: 8, total_tokens: 2_780_000, ai_time_mins: 810, coding_time_mins: 1740, sessions: 47, lines_added: 8100, lines_removed: 2700, boost_ratio: 1.7, team_name: 'Byte Pirates', team_handle: 'byte-pirates' },
  { user_id: 'demo-p-009', handle: 'sara_johansson', display_name: 'Sara Johansson', avatar_url: null, rank: 9, total_tokens: 2_290_000, ai_time_mins: 670, coding_time_mins: 1500, sessions: 41, lines_added: 6900, lines_removed: 2300, boost_ratio: 1.6, team_name: 'Neural Squad', team_handle: 'neural-squad' },
  { user_id: 'demo-p-010', handle: 'ben_carter', display_name: 'Ben Carter', avatar_url: null, rank: 10, total_tokens: 1_920_000, ai_time_mins: 560, coding_time_mins: 1320, sessions: 36, lines_added: 5800, lines_removed: 1900, boost_ratio: 1.5, team_name: 'Byte Pirates', team_handle: 'byte-pirates' },
  { user_id: 'demo-p-011', handle: 'mia_tanaka', display_name: 'Mia Tanaka', avatar_url: null, rank: 11, total_tokens: 1_540_000, ai_time_mins: 455, coding_time_mins: 1140, sessions: 31, lines_added: 4900, lines_removed: 1600, boost_ratio: 1.4, team_name: 'Stack Smashers', team_handle: 'stack-smashers' },
  { user_id: 'demo-p-012', handle: 'raj_sharma', display_name: 'Raj Sharma', avatar_url: null, rank: 12, total_tokens: 1_210_000, ai_time_mins: 362, coding_time_mins: 960, sessions: 26, lines_added: 4100, lines_removed: 1300, boost_ratio: 1.4, team_name: 'Stack Smashers', team_handle: 'stack-smashers' },
  { user_id: 'demo-p-013', handle: 'elena_volkov', display_name: 'Elena Volkov', avatar_url: null, rank: 13, total_tokens: 940_000, ai_time_mins: 285, coding_time_mins: 780, sessions: 22, lines_added: 3400, lines_removed: 1100, boost_ratio: 1.3, team_name: 'Dev Hunters', team_handle: 'dev-hunters' },
  { user_id: 'demo-p-014', handle: 'oscar_silva', display_name: 'Oscar Silva', avatar_url: null, rank: 14, total_tokens: 720_000, ai_time_mins: 218, coding_time_mins: 620, sessions: 18, lines_added: 2800, lines_removed: 900, boost_ratio: 1.2, team_name: 'Dev Hunters', team_handle: 'dev-hunters' },
  { user_id: 'demo-p-015', handle: 'noah_andersen', display_name: 'Noah Andersen', avatar_url: null, rank: 15, total_tokens: 510_000, ai_time_mins: 156, coding_time_mins: 480, sessions: 14, lines_added: 2100, lines_removed: 700, boost_ratio: 1.1, team_name: 'Byte Pirates', team_handle: 'byte-pirates' },
];

const DEMO_TEAMS: TeamEntry[] = [
  { rank: 1, handle: 'tensor-forge', name: 'Tensor Forge', avatar_url: null, member_count: 8, active_members: 6, total_tokens: 51_800_000, ai_time_mins: 14200, sessions: 624, boost_ratio: 2.7 },
  { rank: 2, handle: 'neural-squad', name: 'Neural Squad', avatar_url: null, member_count: 7, active_members: 5, total_tokens: 38_400_000, ai_time_mins: 10800, sessions: 481, boost_ratio: 2.4 },
  { rank: 3, handle: 'code-wizards', name: 'Code Wizards', avatar_url: null, member_count: 6, active_members: 5, total_tokens: 27_100_000, ai_time_mins: 7600, sessions: 342, boost_ratio: 2.1 },
  { rank: 4, handle: 'byte-pirates', name: 'Byte Pirates', avatar_url: null, member_count: 5, active_members: 4, total_tokens: 18_600_000, ai_time_mins: 5200, sessions: 247, boost_ratio: 1.9 },
  { rank: 5, handle: 'stack-smashers', name: 'Stack Smashers', avatar_url: null, member_count: 4, active_members: 3, total_tokens: 12_000_000, ai_time_mins: 3400, sessions: 163, boost_ratio: 1.6 },
  { rank: 6, handle: 'dev-hunters', name: 'Dev Hunters', avatar_url: null, member_count: 3, active_members: 2, total_tokens: 7_300_000, ai_time_mins: 2100, sessions: 98, boost_ratio: 1.4 },
];

export function getDemoBootstrap(): BootstrapData {
  return {
    periodId: 'week:2026-04-21',
    people: DEMO_PEOPLE,
    teams: DEMO_TEAMS,
    currentUserId: DEMO_VIEWER.id,
    viewer: DEMO_VIEWER,
    myPeopleRankChange: 3,
    myTeamRankChange: 1,
    myTokensDelta: 150_000,
  };
}

// Seeded pseudo-random for reproducible mock data
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function getDemoUsageHistory(range: UsageHistoryRange): UsagePoint[] {
  const rand = seededRand(42);
  const now = new Date('2026-04-30T18:00:00');

  if (range === 'day') {
    return Array.from({ length: 24 }, (_, i) => {
      const h = (now.getHours() - 23 + i + 24) % 24;
      const label = `${String(h).padStart(2, '0')}:00`;
      // Peak usage during working hours (9-18)
      const base = (h >= 9 && h <= 18) ? 28_000 : 4_000;
      const tokens = Math.round(base * (0.6 + rand() * 0.8));
      return { label, tokens };
    });
  }

  if (range === 'week') {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const weekdayBase = [420_000, 510_000, 480_000, 550_000, 490_000, 180_000, 90_000];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - 6 + i);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const label = `${mm}/${dd} ${days[d.getDay() === 0 ? 6 : d.getDay() - 1]}`;
      const tokens = Math.round(weekdayBase[i] * (0.75 + rand() * 0.5));
      return { label, tokens };
    });
  }

  // month
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 29 + i);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const label = `${mm}/${dd}`;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const base = isWeekend ? 120_000 : 400_000;
    const tokens = Math.round(base * (0.5 + rand() * 1.0));
    return { label, tokens };
  });
}
