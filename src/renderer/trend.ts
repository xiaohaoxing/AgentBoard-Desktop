declare const trendApi: {
  getUsageHistory: (range: string, offset?: number) => Promise<{ label: string; tokens: number }[]>;
  clearUsageHistory: () => Promise<void>;
  confirmClear: () => Promise<boolean>;
  t: (key: string) => string;
  onLocaleChange: (cb: (locale: string) => void) => void;
};

interface UsagePoint { label: string; tokens: number; }
type ChartType = 'line' | 'bar';
type RangeType = 'day' | 'week' | 'month';

// ── TrendChart ────────────────────────────────────────────────────────────────

class TrendChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: UsagePoint[] = [];
  private chartType: ChartType = 'line';
  private range: RangeType = 'week';

  private readonly ML = 58;  // marginLeft
  private readonly MR = 16;  // marginRight
  private readonly MT = 16;  // marginTop
  private readonly MB = 44;  // marginBottom

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.scale(dpr, dpr);
    this.redraw();
  }

  render(data: UsagePoint[], type: ChartType, range: RangeType = 'week'): void {
    this.data = data;
    this.chartType = type;
    this.range = range;
    this.redraw();
  }

  redraw(): void {
    if (this.chartType === 'line') this.renderLine(this.data);
    else this.renderBar(this.data);
  }

  private logicalSize(): { w: number; h: number } {
    const dpr = window.devicePixelRatio || 1;
    return { w: this.canvas.width / dpr, h: this.canvas.height / dpr };
  }

  private colors() {
    const s = getComputedStyle(document.documentElement);
    return {
      accent: s.getPropertyValue('--accent').trim() || '#007AFF',
      accentDim: s.getPropertyValue('--accent-dim').trim() || 'rgba(0,122,255,0.12)',
      textSecondary: s.getPropertyValue('--text-secondary').trim() || '#6C6C70',
      textTertiary: s.getPropertyValue('--text-tertiary').trim() || '#AEAEB2',
      border: s.getPropertyValue('--border').trim() || 'rgba(0,0,0,0.08)',
    };
  }

  private yAxis(maxVal: number): { max: number; ticks: number[] } {
    if (maxVal === 0) return { max: 1_000, ticks: [0, 250, 500, 750, 1_000] };
    const mag = Math.pow(10, Math.floor(Math.log10(maxVal * 1.2)));
    const norm = (maxVal * 1.2) / mag;
    const nice = norm <= 1.5 ? 1.5 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5
      : norm <= 3 ? 3 : norm <= 4 ? 4 : norm <= 5 ? 5 : norm <= 7.5 ? 7.5 : 10;
    const max = nice * mag;
    const step = max / 4;
    return { max, ticks: [0, step, step * 2, step * 3, max] };
  }

  private fmtY(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return String(Math.round(n));
  }

  private drawAxes(w: number, h: number, yMax: number, yTicks: number[]): void {
    const { ML, MR, MT, MB } = this;
    const plotW = w - ML - MR;
    const plotH = h - MT - MB;
    const c = this.ctx;
    const col = this.colors();

    c.clearRect(0, 0, w, h);

    // Grid lines + Y labels
    c.font = '11px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    yTicks.forEach((tick) => {
      const y = MT + plotH - (tick / yMax) * plotH;
      c.strokeStyle = col.border;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(ML, y);
      c.lineTo(ML + plotW, y);
      c.stroke();
      c.fillStyle = col.textTertiary;
      c.fillText(this.fmtY(tick), ML - 6, y);
    });
  }

  private xLabels(data: UsagePoint[], w: number, h: number, barWidth?: number): void {
    const { ML, MR, MT, MB } = this;
    const plotW = w - ML - MR;
    const plotH = h - MT - MB;
    const n = data.length;
    const c = this.ctx;
    const col = this.colors();

    c.font = '10px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    c.textBaseline = 'top';
    c.fillStyle = col.textTertiary;

    if (this.range === 'day') {
      [0, 6, 12, 18, 24].forEach((hour) => {
        const x = ML + (hour / 24) * plotW;
        c.textAlign = hour === 0 ? 'left' : hour === 24 ? 'right' : 'center';
        c.fillText(`${String(hour).padStart(2, '0')}:00`, x, MT + plotH + 8);
      });
      return;
    }

    c.textAlign = 'center';
    const maxLabels = Math.floor(plotW / 48);
    const step = Math.max(1, Math.ceil(n / maxLabels));

    data.forEach((pt, i) => {
      if (i % step !== 0 && i !== n - 1) return;
      let x: number;
      if (barWidth !== undefined) {
        x = ML + (i + 0.5) * barWidth;
      } else {
        x = ML + (i / (n - 1)) * plotW;
      }
      // Only show short label (no weekday suffix for week view)
      const lbl = pt.label.split(' ')[0];
      c.fillText(lbl, x, MT + plotH + 8);
    });
  }

  renderLine(data: UsagePoint[]): void {
    if (!data.length) return;
    const { w, h } = this.logicalSize();
    const { ML, MR, MT, MB } = this;
    const plotW = w - ML - MR;
    const plotH = h - MT - MB;
    const maxVal = Math.max(...data.map((d) => d.tokens));
    const { max: yMax, ticks } = this.yAxis(maxVal);
    const col = this.colors();
    const c = this.ctx;
    const n = data.length;

    this.drawAxes(w, h, yMax, ticks);

    const px = (i: number) => this.range === 'day'
      ? ML + (i / n) * plotW
      : ML + (i / (n - 1)) * plotW;
    const py = (v: number) => MT + plotH - (v / yMax) * plotH;

    // Fill gradient under line
    const grad = c.createLinearGradient(0, MT, 0, MT + plotH);
    grad.addColorStop(0, col.accentDim);
    grad.addColorStop(1, 'rgba(0,122,255,0)');
    c.beginPath();
    c.moveTo(px(0), py(data[0].tokens));
    data.forEach((pt, i) => { if (i > 0) c.lineTo(px(i), py(pt.tokens)); });
    c.lineTo(px(n - 1), MT + plotH);
    c.lineTo(px(0), MT + plotH);
    c.closePath();
    c.fillStyle = grad;
    c.fill();

    // Line
    c.beginPath();
    c.strokeStyle = col.accent;
    c.lineWidth = 2;
    c.lineJoin = 'round';
    c.moveTo(px(0), py(data[0].tokens));
    data.forEach((pt, i) => { if (i > 0) c.lineTo(px(i), py(pt.tokens)); });
    c.stroke();

    // Data points
    data.forEach((pt, i) => {
      c.beginPath();
      c.arc(px(i), py(pt.tokens), 3, 0, Math.PI * 2);
      c.fillStyle = col.accent;
      c.fill();
    });

    this.xLabels(data, w, h);
  }

  renderBar(data: UsagePoint[]): void {
    if (!data.length) return;
    const { w, h } = this.logicalSize();
    const { ML, MR, MT, MB } = this;
    const plotW = w - ML - MR;
    const plotH = h - MT - MB;
    const maxVal = Math.max(...data.map((d) => d.tokens));
    const { max: yMax, ticks } = this.yAxis(maxVal);
    const col = this.colors();
    const c = this.ctx;
    const n = data.length;

    this.drawAxes(w, h, yMax, ticks);

    const bw = (plotW / n) * 0.7;
    const gap = (plotW / n) * 0.3;

    data.forEach((pt, i) => {
      const bh = (pt.tokens / yMax) * plotH;
      const x = ML + i * (bw + gap) + gap / 2;
      const y = MT + plotH - bh;
      c.fillStyle = col.accent;
      c.beginPath();
      const r = Math.min(3, bw / 2, bh);
      if (bh > 0) {
        c.roundRect(x, y, bw, bh, [r, r, 0, 0]);
        c.fill();
      }
    });

    this.xLabels(data, w, h, bw + gap);
  }

  hitTest(mx: number, my: number): UsagePoint | null {
    if (!this.data.length) return null;
    const { w, h } = this.logicalSize();
    const { ML, MR, MT, MB } = this;
    const plotW = w - ML - MR;
    const plotH = h - MT - MB;
    const maxVal = Math.max(...this.data.map((d) => d.tokens));
    const { max: yMax } = this.yAxis(maxVal);
    const n = this.data.length;

    if (this.chartType === 'line') {
      const px = (i: number) => this.range === 'day'
        ? ML + (i / n) * plotW
        : ML + (i / (n - 1)) * plotW;
      const py = (v: number) => MT + plotH - (v / yMax) * plotH;
      let closest: UsagePoint | null = null;
      let minDist = 16;
      this.data.forEach((pt, i) => {
        const dx = mx - px(i);
        const dy = my - py(pt.tokens);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) { minDist = d; closest = pt; }
      });
      return closest;
    } else {
      const bw = (plotW / n) * 0.7;
      const gap = (plotW / n) * 0.3;
      for (let i = 0; i < n; i++) {
        const x = ML + i * (bw + gap) + gap / 2;
        if (mx >= x && mx <= x + bw && my >= MT && my <= MT + plotH) return this.data[i];
      }
      return null;
    }
  }
}

// ── Page logic ────────────────────────────────────────────────────────────────

function trendFmt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(Math.round(n));
}

let currentData: UsagePoint[] = [];
let currentRange: RangeType = 'week';
let currentType: ChartType = 'line';
let currentOffset: number = 0;
let chart: TrendChart;

function trendPeriodLabel(range: RangeType, offset: number): string {
  const H_MS = 3_600_000;
  const D_MS = 86_400_000;
  const now = Date.now();
  const fmtMD = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  if (range === 'day') {
    const d = new Date(now + offset * 24 * H_MS);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  if (range === 'week') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const toMonday = dow === 0 ? -6 : 1 - dow;
    const weekStart = today.getTime() + (toMonday + offset * 7) * D_MS;
    const weekEnd = weekStart + 6 * D_MS;
    return `${fmtMD(weekStart)} – ${fmtMD(weekEnd)}`;
  }

  // month
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + offset;
  while (month < 0) { month += 12; year -= 1; }
  while (month >= 12) { month -= 12; year += 1; }
  return `${year}/${String(month + 1).padStart(2, '0')}`;
}

function updateNavUI(range: RangeType, offset: number): void {
  const labelEl = document.getElementById('period-label')!;
  const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
  labelEl.textContent = trendPeriodLabel(range, offset);
  btnNext.disabled = offset >= 0;
}

function updateSummary(data: UsagePoint[], range: RangeType): void {
  const total = data.reduce((s, p) => s + p.tokens, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  const totalEl = document.getElementById('summary-total')!;
  const avgEl = document.getElementById('summary-avg')!;
  totalEl.textContent = trendFmt(total);
  const avgLabel = range === 'day' ? trendApi.t('trend.avgHour') : trendApi.t('trend.avgDay');
  avgEl.textContent = `${avgLabel} ${trendFmt(avg)}`;
}

function applyTrendLocale(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = trendApi.t(el.getAttribute('data-i18n')!);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    el.title = trendApi.t(el.getAttribute('data-i18n-title')!);
  });
}

async function loadData(range: RangeType, offset: number = 0): Promise<void> {
  const data = await trendApi.getUsageHistory(range, offset);
  currentData = data;
  updateSummary(data, range);
  updateNavUI(range, offset);
  chart.render(data, currentType, range);
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('chart') as HTMLCanvasElement;
  const container = document.getElementById('chart-container')!;
  const tooltip = document.getElementById('tooltip')!;
  chart = new TrendChart(canvas);

  // ResizeObserver for adaptive reflow
  const ro = new ResizeObserver(() => chart.resize());
  ro.observe(container);

  // Range buttons
  document.querySelectorAll<HTMLButtonElement>('[data-range]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-range]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range as RangeType;
      currentOffset = 0;
      loadData(currentRange, currentOffset);
    });
  });

  // Navigation buttons
  document.getElementById('btn-prev')?.addEventListener('click', () => {
    currentOffset -= 1;
    loadData(currentRange, currentOffset);
  });
  document.getElementById('btn-next')?.addEventListener('click', () => {
    if (currentOffset >= 0) return;
    currentOffset += 1;
    loadData(currentRange, currentOffset);
  });

  // Chart type buttons
  document.querySelectorAll<HTMLButtonElement>('[data-chart-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-chart-type]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.chartType as ChartType;
      chart.render(currentData, currentType, currentRange);
    });
  });

  // Tooltip
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = chart.hitTest(mx, my);
    if (hit) {
      tooltip.textContent = `${hit.label}  ${trendFmt(hit.tokens)} tokens`;
      const ttW = 160;
      const left = Math.min(e.clientX + 12, window.innerWidth - ttW - 8);
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${e.clientY - 32}px`;
      tooltip.style.display = 'block';
    } else {
      tooltip.style.display = 'none';
    }
  });
  canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

  // Dark/light mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    chart.redraw();
  });

  // Clear history button
  document.getElementById('btn-clear')?.addEventListener('click', async () => {
    const confirmed = await trendApi.confirmClear();
    if (!confirmed) return;
    await trendApi.clearUsageHistory();
    currentOffset = 0;
    loadData(currentRange, currentOffset);
  });

  applyTrendLocale();
  trendApi.onLocaleChange(() => {
    applyTrendLocale();
    updateSummary(currentData, currentRange);
  });

  // Load default (week)
  loadData('week', 0);
});
