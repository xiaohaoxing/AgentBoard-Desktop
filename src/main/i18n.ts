import Store from 'electron-store';

export type Locale = 'zh' | 'en';

// ── String resources ──────────────────────────────────────────────────────────

const resources: Record<Locale, Record<string, string>> = {
  zh: {
    // Internal locale identifier (used by renderer to pick Intl locale)
    '__locale__': 'zh',
    // App menu
    'menu.settings': '设置',
    'menu.quit': '退出',
    // Tray
    'tray.show': '显示 AgentBoard',
    'tray.checkUpdates': '检查更新',
    'tray.logout': '登出',
    'tray.quit': '退出',
    // Widget titlebar
    'widget.title': 'AgentBoard',
    // Widget tabs
    'tab.people': '用户榜',
    'tab.teams': '团队榜',
    // Widget user card
    'badge.people': '用户',
    'badge.teams': '团队',
    // Widget actions
    'btn.refresh': '刷新',
    'btn.pinned': '始终置顶',
    'btn.unpin': '取消置顶',
    'btn.collapse': '折叠',
    // Auth overlay
    'overlay.needsLogin': '需要登录',
    'overlay.needsLoginSub': '请在弹出的登录窗口完成登录',
    'overlay.signingIn': '登录中',
    'overlay.signingInSub': '正在获取数据…',
    // Magic link bar
    'magiclink.placeholder': '粘贴 Magic Link 或回调 URL…',
    'magiclink.go': '跳转',
    // Auth window title
    'auth.windowTitle': 'AgentBoard — 登录',
    'team.members': '成员',
    'team.active': '活跃',
    // Settings window
    'settings.title': '设置',
    'settings.language': '语言',
    'settings.langZh': '中文',
    'settings.langEn': 'English',
  },
  en: {
    // Internal locale identifier
    '__locale__': 'en',
    // App menu
    'menu.settings': 'Settings',
    'menu.quit': 'Quit',
    // Tray
    'tray.show': 'Show AgentBoard',
    'tray.checkUpdates': 'Check for Updates',
    'tray.logout': 'Log Out',
    'tray.quit': 'Quit',
    // Widget titlebar
    'widget.title': 'AgentBoard',
    // Widget tabs
    'tab.people': 'Users',
    'tab.teams': 'Teams',
    // Widget user card
    'badge.people': 'User',
    'badge.teams': 'Team',
    // Widget actions
    'btn.refresh': 'Refresh',
    'btn.pinned': 'Keep on Top',
    'btn.unpin': 'Unpin',
    'btn.collapse': 'Collapse',
    // Auth overlay
    'overlay.needsLogin': 'Sign In Required',
    'overlay.needsLoginSub': 'Please complete sign-in in the login window',
    'overlay.signingIn': 'Signing In',
    'overlay.signingInSub': 'Loading data…',
    // Magic link bar
    'magiclink.placeholder': 'Paste Magic Link or callback URL…',
    'magiclink.go': 'Go',
    // Auth window title
    'auth.windowTitle': 'AgentBoard — Sign In',
    'team.members': 'members',
    'team.active': 'active',
    // Settings window
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.langZh': '中文',
    'settings.langEn': 'English',
  },
};

// ── Persistence ───────────────────────────────────────────────────────────────

const localeStore = new Store<{ locale: Locale }>({
  name: 'locale',
  defaults: { locale: 'zh' },
});

let currentLocale: Locale = localeStore.get('locale');
const changeListeners: Array<(locale: Locale) => void> = [];

// ── Public API ────────────────────────────────────────────────────────────────

export function t(key: string): string {
  return resources[currentLocale][key]
    ?? resources['en'][key]
    ?? key;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (locale === currentLocale) return;
  currentLocale = locale;
  localeStore.set('locale', locale);
  changeListeners.forEach((cb) => cb(locale));
}

export function onLocaleChange(cb: (locale: Locale) => void): void {
  changeListeners.push(cb);
}
