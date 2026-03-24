const config = readConfig();
const dashboardBody = document.getElementById('dashboard-body');
const tableState = document.getElementById('table-state');
const refreshButton = document.getElementById('refresh-button');
const dataState = document.getElementById('data-state');
const themeButtons = [...document.querySelectorAll('.theme-option[data-theme-value]')];
const statusFilter = document.getElementById('status-filter');
const reasonFilter = document.getElementById('reason-filter');
const searchInput = document.getElementById('search-input');
const mobileSortKey = document.getElementById('mobile-sort-key');
const mobileSortDirection = document.getElementById('mobile-sort-direction');
const mobileList = document.getElementById('mobile-list');
const sortButtons = [...document.querySelectorAll('.sort-button[data-sort-key]')];
const detailBackdrop = document.getElementById('detail-backdrop');
const detailPanel = document.getElementById('detail-panel');
const detailCloseButton = document.getElementById('detail-close');
const detailRangeButtons = [...document.querySelectorAll('[data-history-days]')];
const MAX_DETAIL_HISTORY_DAYS = 30;

let allRows = [];
let selectedPlayerId = null;
let detailRequestToken = 0;
let selectedDetailHistoryDays = 7;
let currentDetailRow = null;
let currentDetailHistoryRows = [];
const historyCache = new Map();
let sortState = {
  key: 'wins_display',
  direction: 'asc',
};

refreshButton.addEventListener('click', () => {
  void loadDashboard();
});

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyTheme(button.dataset.themeValue);
  });
});

statusFilter.addEventListener('change', renderRows);
reasonFilter?.addEventListener('change', renderRows);
searchInput.addEventListener('input', renderRows);
mobileSortKey?.addEventListener('change', () => {
  sortState = {
    ...sortState,
    key: mobileSortKey.value,
  };
  renderRows();
});
mobileSortDirection?.addEventListener('click', () => {
  toggleSortDirection();
});
sortButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextKey = button.dataset.sortKey;

    if (!nextKey) {
      return;
    }

    if (sortState.key === nextKey) {
      toggleSortDirection();
      return;
    }

    sortState = {
      key: nextKey,
      direction: nextKey === 'status' || nextKey === 'reason' ? 'asc' : 'desc',
    };
    renderRows();
  });
});
dashboardBody.addEventListener('click', handleRowClick);
dashboardBody.addEventListener('keydown', handleRowKeyDown);
mobileList?.addEventListener('click', handleMobileCardClick);
detailBackdrop.addEventListener('click', closeDetailPanel);
detailCloseButton.addEventListener('click', closeDetailPanel);
detailRangeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextDays = Number(button.dataset.historyDays);

    if (!Number.isFinite(nextDays) || nextDays === selectedDetailHistoryDays) {
      return;
    }

    selectedDetailHistoryDays = nextDays;
    syncDetailHistoryRangeButtons();

    if (currentDetailRow) {
      renderDetailHistory(currentDetailRow, currentDetailHistoryRows);
    }
  });
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDetailPanel();
  }
});

syncSortControls();
syncDetailHistoryRangeButtons();
syncThemeControls();

if (!config) {
  refreshButton.disabled = true;
  dataState.textContent = 'Stand: -';
  setTableState(
    'Konfiguration fehlt. Lege frontend/config.js anhand von frontend/config.example.js an.',
    true,
  );
} else {
  void loadDashboard();
}

async function loadDashboard() {
  toggleRefresh(true);
  setTableState('Lade Daten ...', true);

  try {
    const rows = await fetchDashboardRows(config);
    allRows = rows;
    historyCache.clear();
    renderSummary(rows);
    renderRows();

    if (selectedPlayerId) {
      const selectedRow = allRows.find((row) => row.player_id === selectedPlayerId);
      if (selectedRow) {
        void openDetailPanel(selectedRow, { keepOpen: true });
      } else {
        closeDetailPanel();
      }
    }

  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    setTableState(`Fehler beim Laden: ${message}`, true);
  } finally {
    toggleRefresh(false);
  }
}

function applyTheme(themeName) {
  const normalizedTheme = themeName === 'arena' ? 'arena' : 'club';
  document.documentElement.dataset.theme = normalizedTheme;

  try {
    localStorage.setItem('club-view-theme', normalizedTheme);
  } catch {}

  syncThemeControls();
}

function syncThemeControls() {
  const activeTheme = document.documentElement.dataset.theme === 'arena' ? 'arena' : 'club';

  themeButtons.forEach((button) => {
    const isActive = button.dataset.themeValue === activeTheme;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

async function fetchDashboardRows(currentConfig) {
  const url = new URL(`${stripTrailingSlash(currentConfig.supabaseUrl)}/rest/v1/club_dashboard`);
  url.searchParams.set(
    'select',
    [
      'player_id',
      'club_tag',
      'player_name',
      'player_tag',
      'role',
      'joined_at',
      'days_in_club',
      'trophies_total',
      'team_wins_total',
      'wins_display',
      'trophies_display',
      'delta_window_label',
      'wins_7d',
      'trophies_7d',
      'days_no_progress',
      'meets_min_wins',
      'min_wins',
      'protection_active',
      'protected_until',
      'status',
      'current_snapshot_date',
      'current_snapshot_at',
      'last_progress_date',
      'tracking_start_date',
      'tracked_days',
      'wins_since_tracking_start',
      'trophies_since_tracking_start',
    ].join(','),
  );
  url.searchParams.set('club_tag', `eq.${normalizeClubTag(currentConfig.clubTag)}`);
  url.searchParams.set('order', 'wins_display.asc.nullslast,days_no_progress.desc.nullslast,player_name.asc');

  const response = await fetch(url, {
    headers: {
      apikey: currentConfig.supabaseAnonKey,
      Authorization: `Bearer ${currentConfig.supabaseAnonKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase antwortet mit ${response.status}`);
  }

  return await response.json();
}

async function fetchPlayerHistory(currentConfig, clubTag, playerId) {
  const cacheKey = `${clubTag}:${playerId}`;

  if (historyCache.has(cacheKey)) {
    return historyCache.get(cacheKey);
  }

  const url = new URL(`${stripTrailingSlash(currentConfig.supabaseUrl)}/rest/v1/player_daily_snapshots`);
  url.searchParams.set('select', 'snapshot_date,snapshot_at,trophies,team_wins');
  url.searchParams.set('club_tag', `eq.${normalizeClubTag(clubTag)}`);
  url.searchParams.set('player_id', `eq.${playerId}`);
  url.searchParams.set('order', 'snapshot_date.desc');
  url.searchParams.set('limit', String(MAX_DETAIL_HISTORY_DAYS));

  const response = await fetch(url, {
    headers: {
      apikey: currentConfig.supabaseAnonKey,
      Authorization: `Bearer ${currentConfig.supabaseAnonKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase Verlauf antwortet mit ${response.status}`);
  }

  const rows = await response.json();
  historyCache.set(cacheKey, rows);
  return rows;
}

function renderSummary(rows) {
  const criticalCount = rows.filter((row) => getEffectiveStatusKey(row) === 'kritisch').length;
  const watchCount = rows.filter((row) => getEffectiveStatusKey(row) === 'fraglich').length;
  const latestSnapshotAt = rows
    .map((row) => row.current_snapshot_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  document.getElementById('metric-members').textContent = String(rows.length);
  document.getElementById('metric-watch').textContent = String(watchCount);
  document.getElementById('metric-critical').textContent = String(criticalCount);
  document.getElementById('metric-snapshot').textContent = latestSnapshotAt
    ? formatDateTime(new Date(latestSnapshotAt))
    : '-';
  dataState.textContent = latestSnapshotAt
    ? `Stand: ${formatRelativeTime(latestSnapshotAt)}`
    : 'Stand: kein Datenstand';
}

function renderRows() {
  const filteredRows = allRows.filter((row) => matchesStatus(row) && matchesReason(row) && matchesSearch(row));
  const sortedRows = sortRows(filteredRows, sortState.key, sortState.direction);
  syncSortControls();

  if (sortedRows.length === 0) {
    dashboardBody.innerHTML = '';
    if (mobileList) {
      mobileList.innerHTML = '';
    }
    setTableState('Keine passenden Einträge gefunden.', true);
    return;
  }

  setTableState('', false);

  dashboardBody.innerHTML = sortedRows
    .map((row) => {
      const statusChips = getDisplayStatusChips(row);
      const reasons = buildReasonChips(row);
      const renderedReasons = reasons.length > 0
        ? reasons.map(renderChipMarkup).join('')
        : renderChipMarkup({ text: 'keine Auffälligkeit', tone: 'safe' });

      return `
        <tr class="row-link" tabindex="0" data-player-id="${escapeHtml(row.player_id)}">
          <td class="name-cell">
            <span class="player-name">${escapeHtml(row.player_name ?? '-')}</span>
            <span class="player-tag">${escapeHtml(row.player_tag ?? '')}</span>
          </td>
          <td class="status-cell"><div class="chip-list">${statusChips.map(renderChipMarkup).join('')}</div></td>
          <td class="numeric">${formatRelativeDayLabel(row.last_progress_date)}</td>
          <td class="numeric">${renderDeltaMarkup(row.wins_display)}</td>
          <td class="numeric">${formatNumber(row.team_wins_total)}</td>
          <td class="numeric">${formatNumber(row.trophies_total)}</td>
          <td class="numeric">${renderDeltaMarkup(row.trophies_display)}</td>
          <td class="numeric">${renderTrackingSinceMarkup(row.tracking_start_date, row.tracked_days)}</td>
          <td class="reason"><div class="chip-list">${renderedReasons}</div></td>
        </tr>
      `;
    })
    .join('');

  if (mobileList) {
    mobileList.innerHTML = sortedRows.map(renderMobileCardMarkup).join('');
  }
}

function renderMobileCardMarkup(row) {
  const statusChips = getDisplayStatusChips(row);
  const reasons = buildReasonChips(row);

  const renderedReasons = reasons.length > 0
    ? reasons.map(renderChipMarkup).join('')
    : renderChipMarkup({ text: 'keine Auffälligkeit', tone: 'safe' });

  return `
    <button class="mobile-card" type="button" data-player-id="${escapeHtml(row.player_id)}">
      <div class="mobile-card-top">
        <div class="mobile-card-name">
          <span class="mobile-card-title">${escapeHtml(row.player_name ?? '-')}</span>
          <span class="mobile-card-tag">${escapeHtml(row.player_tag ?? '')}</span>
        </div>
        <div class="chip-list mobile-card-status">${statusChips.map(renderChipMarkup).join('')}</div>
      </div>
      <div class="mobile-card-grid">
        <article class="mobile-stat">
          <span class="mobile-stat-label">Letzter 3v3 Sieg</span>
          <strong class="mobile-stat-value">${formatRelativeDayLabel(row.last_progress_date)}</strong>
        </article>
        <article class="mobile-stat">
          <span class="mobile-stat-label">3v3-Gain (7 Tage)</span>
          <strong class="mobile-stat-value">${renderDeltaMarkup(row.wins_display)}</strong>
        </article>
      </div>
      <div class="chip-list mobile-card-reasons">${renderedReasons}</div>
    </button>
  `;
}

function handleRowClick(event) {
  const rowElement = event.target.closest('tr[data-player-id]');

  if (!rowElement) {
    return;
  }

  const row = allRows.find((entry) => entry.player_id === rowElement.dataset.playerId);
  if (row) {
    void openDetailPanel(row);
  }
}

function handleMobileCardClick(event) {
  const cardElement = event.target.closest('button[data-player-id]');

  if (!cardElement) {
    return;
  }

  const row = allRows.find((entry) => entry.player_id === cardElement.dataset.playerId);
  if (row) {
    void openDetailPanel(row);
  }
}

function handleRowKeyDown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  const rowElement = event.target.closest('tr[data-player-id]');
  if (!rowElement) {
    return;
  }

  event.preventDefault();
  const row = allRows.find((entry) => entry.player_id === rowElement.dataset.playerId);
  if (row) {
    void openDetailPanel(row);
  }
}

async function openDetailPanel(row, options = {}) {
  selectedPlayerId = row.player_id;
  currentDetailRow = row;
  const requestToken = ++detailRequestToken;

  renderDetailHeader(row);
  renderDetailMetrics(row);
  renderDetailReasons(row);
  document.getElementById('detail-charts').innerHTML = renderDetailChartPlaceholder('Lade Verlaufscharts ...');
  setDetailHistoryState('Lade Verlauf ...', true);
  openDetailChrome();

  try {
    const history = await fetchPlayerHistory(config, row.club_tag, row.player_id);

    if (requestToken !== detailRequestToken) {
      return;
    }

    currentDetailHistoryRows = history;
    renderDetailHistory(row, history);
  } catch (error) {
    console.error(error);
    if (requestToken !== detailRequestToken) {
      return;
    }

    currentDetailHistoryRows = [];
    setDetailHistoryState('Verlauf konnte nicht geladen werden.', true);
    document.getElementById('detail-charts').innerHTML = renderDetailChartPlaceholder('Verlaufscharts konnten nicht geladen werden.');
  }

  if (!options.keepOpen) {
    document.body.classList.add('detail-open');
  }
}

function openDetailChrome() {
  detailBackdrop.hidden = false;
  detailPanel.hidden = false;
  detailPanel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('detail-open');
}

function closeDetailPanel() {
  selectedPlayerId = null;
  currentDetailRow = null;
  currentDetailHistoryRows = [];
  detailBackdrop.hidden = true;
  detailPanel.hidden = true;
  detailPanel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('detail-open');
}

function renderDetailHeader(row) {
  const chips = [...getDisplayStatusChips(row), { text: formatRole(row.role), tone: 'neutral' }];

  document.getElementById('detail-name').textContent = row.player_name ?? '-';
  document.getElementById('detail-tag').textContent = row.player_tag ?? '-';
  document.getElementById('detail-status-row').innerHTML = chips.map(renderChipMarkup).join('');
}

function renderDetailMetrics(row) {
  const metrics = [
    { label: 'Letzter 3v3 Sieg', value: formatRelativeDayLabel(row.last_progress_date) },
    {
      label: '3v3-Gain (7 Tage)',
      value: formatDelta(row.wins_7d ?? row.wins_since_tracking_start),
    },
    { label: '3v3 Siege', value: formatNumber(row.team_wins_total) },
    { label: 'Trophäen', value: formatNumber(row.trophies_total) },
    {
      label: 'Trophy-Gain (7 Tage)',
      value: formatDelta(row.trophies_7d ?? row.trophies_since_tracking_start),
    },
    {
      label: 'Tracking seit',
      value: formatTrackedDaysLabel(row.tracked_days)
    },
  ];

  // ${index % 2 !== 0 && index < metrics.length - 1 ? `<div class="detail-metric-divider"></div><div class="detail-metric-divider"></div>` : ''}
  document.getElementById('detail-metrics').innerHTML = metrics
    .map((metric, index) => {
      return `
        <article class="detail-metric-card">
          <span class="detail-metric-label">${escapeHtml(metric.label)}</span>
          <strong class="detail-metric-value">${escapeHtml(metric.value)}</strong>
          ${metric.meta ? `<span class="detail-metric-meta">${escapeHtml(metric.meta)}</span>` : ''}
        </article>
      `;
    })
    .join('');
}

function renderDetailReasons(row) {
  const reasons = buildReasonChips(row);
  document.getElementById('detail-reasons').innerHTML = reasons.length > 0
    ? reasons.map(renderChipMarkup).join('')
    : renderChipMarkup({ text: 'keine Auffälligkeit', tone: 'safe' });
}

function renderDetailHistory(detailRow, historyRows) {
  const charts = document.getElementById('detail-charts');
  const preparedRows = prepareDetailHistoryRows(detailRow, historyRows)
    .slice(0, selectedDetailHistoryDays);

  if (!Array.isArray(preparedRows) || preparedRows.length === 0) {
    charts.innerHTML = renderDetailChartPlaceholder('Noch keine Tageshistorie für Verlaufscharts vorhanden.');
    setDetailHistoryState('Noch keine Tageshistorie vorhanden.', true);
    return;
  }

  setDetailHistoryState('', false);
  renderDetailCharts(preparedRows);
}

function renderDetailCharts(historyRows) {
  const container = document.getElementById('detail-charts');

  if (!Array.isArray(historyRows) || historyRows.length === 0) {
    container.innerHTML = renderDetailChartPlaceholder('Noch keine Tagesstände für Verlaufscharts vorhanden.');
    return;
  }

  const rowsAscending = [...historyRows].sort(
    (left, right) => new Date(left.snapshot_date).getTime() - new Date(right.snapshot_date).getTime(),
  );
  const winsSeries = buildHistorySeries(rowsAscending, 'team_wins');
  const trophiesSeries = buildHistorySeries(rowsAscending, 'trophies');

  container.innerHTML = [
    renderDetailChartCard({
      title: '3v3 Wins',
      subtitle: 'Gesamtstand je Tag',
      legendLabel: '3v3 Wins',
      tone: 'brand',
      series: winsSeries,
      tickFormatter: formatNumber,
      maxValue: winsSeries.at(-1)?.value ?? null,
      xWindowDays: selectedDetailHistoryDays,
    }),
    renderDetailChartCard({
      title: 'Trophäen',
      subtitle: 'Gesamtstand je Tag',
      legendLabel: 'Trophäen',
      tone: 'warn',
      series: trophiesSeries,
      tickFormatter: formatNumber,
      maxValue: Math.max(...trophiesSeries.map((point) => point.value)),
      xWindowDays: selectedDetailHistoryDays,
    }),
  ].join('');
}

function renderDetailChartCard({ title, subtitle, legendLabel, tone, series, tickFormatter, maxValue, xWindowDays }) {
  if (!Array.isArray(series) || series.length === 0) {
    return renderDetailChartPlaceholder(`Noch keine Daten für ${title}.`);
  }

  const chart = buildLineChartModel(series, {
    includeZero: false,
    tickFormatter,
    maxValue,
    xWindowDays,
  });

  return `
    <article class="detail-chart-card">
      <div class="detail-chart-header">
        <div>
          <h4 class="detail-chart-title">${escapeHtml(title)}</h4>
          <p class="detail-chart-subtitle">${escapeHtml(subtitle)}</p>
        </div>
        <div class="detail-chart-legend" aria-label="Legende">
          <span class="detail-chart-legend-item">
            <span class="detail-chart-legend-swatch detail-chart-legend-swatch-${escapeHtml(tone)}"></span>
            <span>${escapeHtml(legendLabel)}</span>
          </span>
        </div>
      </div>
      <svg class="detail-chart-svg" viewBox="0 0 ${chart.width} ${chart.height}" role="img" aria-label="${escapeHtml(title)}">
        ${renderChartGrid(chart)}
        <path class="detail-chart-line detail-chart-line-${escapeHtml(tone)}" d="${escapeHtml(chart.path)}"></path>
        ${chart.points
          .map((point) => {
            return `<circle class="detail-chart-point detail-chart-point-${escapeHtml(tone)}" cx="${point.x}" cy="${point.y}" r="3"></circle>`;
          })
          .join('')}
      </svg>
      <div class="detail-chart-footer" aria-hidden="true">
        <span>${escapeHtml(chart.firstLabel)}</span>
        <span>${escapeHtml(chart.middleLabel)}</span>
        <span>${escapeHtml(chart.lastLabel)}</span>
      </div>
    </article>
  `;
}

function renderDetailChartPlaceholder(message) {
  return `<div class="detail-chart-placeholder">${escapeHtml(message)}</div>`;
}

function prepareDetailHistoryRows(detailRow, historyRows) {
  if (!Array.isArray(historyRows)) {
    return [];
  }

  const rows = historyRows.map((row) => ({ ...row }));

  if (detailRow?.delta_window_label !== 'seit_start' || !detailRow?.tracking_start_date) {
    return rows;
  }

  const startTrophies = deriveStartValue(detailRow.trophies_total, detailRow.trophies_since_tracking_start);
  const startWins = deriveStartValue(detailRow.team_wins_total, detailRow.wins_since_tracking_start);

  if (startTrophies === null && startWins === null) {
    return rows;
  }

  const trackingStartDate = detailRow.tracking_start_date;
  const existingIndex = rows.findIndex((row) => row.snapshot_date === trackingStartDate);

  const trackingStartRow = {
    ...(existingIndex >= 0 ? rows[existingIndex] : {}),
    snapshot_date: trackingStartDate,
    snapshot_at: existingIndex >= 0 ? rows[existingIndex].snapshot_at : trackingStartDate,
    trophies: startTrophies ?? rows[existingIndex]?.trophies ?? null,
    team_wins: startWins ?? rows[existingIndex]?.team_wins ?? null,
    is_tracking_start: true,
  };

  if (existingIndex >= 0) {
    rows[existingIndex] = trackingStartRow;
  } else {
    rows.push(trackingStartRow);
  }

  return rows.sort((left, right) => new Date(right.snapshot_date).getTime() - new Date(left.snapshot_date).getTime());
}

function deriveStartValue(currentValue, deltaValue) {
  const current = numberOrNull(currentValue);
  const delta = numberOrNull(deltaValue);

  if (current === null || delta === null) {
    return null;
  }

  return current - delta;
}

function buildHistorySeries(rowsAscending, key) {
  return rowsAscending
    .map((row) => {
      const value = numberOrNull(row[key]);

      if (value === null) {
        return null;
      }

      const pointTime = row.snapshot_date;

      return {
        date: pointTime,
        value,
        label: row.is_tracking_start
          ? `Start ${formatChartDateLabel(pointTime)}`
          : formatChartDateLabel(pointTime),
      };
    })
    .filter(Boolean);
}

function buildLineChartModel(series, options = {}) {
  const width = 320;
  const height = 180;
  const xWindowDays = Math.max(1, Number(options.xWindowDays) || 7);
  const padding = {
    top: 14,
    right: 12,
    bottom: 24,
    left: 42,
  };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = series.map((point) => point.value);
  const domain = buildChartDomain(values, {
    includeZero: options.includeZero === true,
    maxValue: options.maxValue,
  });
  const xStartDate = parseChartAxisDate(series[0]?.date);
  const xEndDate = addDaysUtc(xStartDate, xWindowDays - 1);
  const xRangeMs = Math.max(1, xEndDate.getTime() - xStartDate.getTime());
  const points = series.map((point, index) => {
    const pointDate = parseChartAxisDate(point.date);
    const xOffsetRatio = Math.min(
      1,
      Math.max(0, (pointDate.getTime() - xStartDate.getTime()) / xRangeMs),
    );

    return {
      x: Number((padding.left + plotWidth * xOffsetRatio).toFixed(2)),
      y: Number(scaleChartY(point.value, domain, padding.top, plotHeight).toFixed(2)),
    };
  });

  return {
    width,
    height,
    plotStartX: padding.left,
    plotEndX: padding.left + plotWidth,
    plotHeight,
    domain,
    ticks: buildChartTicks(domain, options.tickFormatter ?? formatNumber),
    path: buildLinePath(points),
    points,
    firstLabel: formatChartDateLabel(xStartDate),
    middleLabel: formatChartDateLabel(addDaysUtc(xStartDate, Math.floor((xWindowDays - 1) / 2))),
    lastLabel: formatChartDateLabel(xEndDate),
  };
}

function buildChartDomain(values, options = {}) {
  const includeZero = options.includeZero === true;
  const fixedMax = Number.isFinite(options.maxValue) ? Number(options.maxValue) : null;
  let rawMin = Math.min(...values);
  let rawMax = Math.max(...values);

  if (includeZero) {
    rawMin = Math.min(rawMin, 0);
    rawMax = Math.max(rawMax, 0);
  }

  if (fixedMax !== null) {
    rawMax = fixedMax;
  }

  if (rawMin === rawMax) {
    const padding = Math.max(1, Math.ceil(Math.abs(rawMin || 1) * 0.25));
    return {
      min: rawMin - padding,
      max: rawMax,
    };
  }

  const padding = Math.max(1, Math.ceil((rawMax - rawMin) * 0.1));

  if (fixedMax !== null) {
    return {
      min: rawMin - padding,
      max: rawMax,
    };
  }

  return {
    min: rawMin - padding,
    max: rawMax + padding,
  };
}

function buildChartTicks(domain, formatter) {
  const midpoint = Math.round(domain.min + (domain.max - domain.min) / 2);
  const tickValues = [domain.max, midpoint, domain.min];

  return [...new Set(tickValues)].map((value) => ({
    value,
    label: formatter(value),
  }));
}

function scaleChartY(value, domain, top, plotHeight) {
  return top + ((domain.max - value) / (domain.max - domain.min)) * plotHeight;
}

function buildLinePath(points) {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

function parseChartAxisDate(value) {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  const parsed = new Date(value);
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function addDaysUtc(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function renderChartGrid(chart) {
  return chart.ticks
    .map((tick) => {
      const y = Number(scaleChartY(tick.value, chart.domain, 14, chart.plotHeight).toFixed(2));

      return `
        <g class="detail-chart-grid-group">
          <line class="detail-chart-grid-line" x1="${chart.plotStartX}" y1="${y}" x2="${chart.plotEndX}" y2="${y}"></line>
          <text class="detail-chart-axis-label" x="${chart.plotStartX - 8}" y="${y + 4}" text-anchor="end">${escapeHtml(tick.label)}</text>
        </g>
      `;
    })
    .join('');
}

function setDetailHistoryState(message, visible) {
  const element = document.getElementById('detail-history-state');
  element.textContent = message;
  element.classList.toggle('is-visible', visible);
}

function matchesStatus(row) {
  const selectedStatus = statusFilter.value;
  return selectedStatus === 'all' || getEffectiveStatusKey(row) === selectedStatus;
}

function syncDetailHistoryRangeButtons() {
  detailRangeButtons.forEach((button) => {
    const days = Number(button.dataset.historyDays);
    const isActive = days === selectedDetailHistoryDays;

    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function matchesSearch(row) {
  const term = searchInput.value.trim().toLowerCase();

  if (!term) {
    return true;
  }

  return [row.player_name, row.player_tag]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term));
}

function matchesReason(row) {
  const selectedReason = reasonFilter?.value ?? 'all';

  if (selectedReason === 'all') {
    return true;
  }

  return getReasonTokens(row).includes(selectedReason);
}

function syncSortControls() {
  if (mobileSortKey) {
    mobileSortKey.value = sortState.key;
  }

  if (mobileSortDirection) {
    const label = sortState.direction === 'asc' ? 'Aufsteigend' : 'Absteigend';
    mobileSortDirection.textContent = label;
    mobileSortDirection.setAttribute('aria-label', `${sortState.key} ${label.toLowerCase()} sortieren`);
  }

  sortButtons.forEach((button) => {
    const isActive = button.dataset.sortKey === sortState.key;
    button.classList.toggle('is-active', isActive);

    const ariaSort = !isActive
      ? 'none'
      : sortState.direction === 'asc'
        ? 'ascending'
        : 'descending';

    button.closest('th')?.setAttribute('aria-sort', ariaSort);
  });
}

function toggleSortDirection() {
  sortState = {
    ...sortState,
    direction: sortState.direction === 'asc' ? 'desc' : 'asc',
  };
  renderRows();
}

function sortRows(rows, key, direction) {
  const decorated = rows.map((row, index) => ({ row, index }));

  decorated.sort((left, right) => {
    const comparison = compareRowValues(left.row, right.row, key);

    if (comparison !== 0) {
      return direction === 'asc' ? comparison : -comparison;
    }

    return `${left.row.player_name ?? ''} ${left.row.player_tag ?? ''}`.trim().localeCompare(
      `${right.row.player_name ?? ''} ${right.row.player_tag ?? ''}`.trim(),
      'de',
      {
        numeric: true,
        sensitivity: 'base',
      },
    );
  });

  return decorated.map((entry) => entry.row);
}

function compareRowValues(leftRow, rightRow, key) {
  const leftValue = getSortValue(leftRow, key);
  const rightValue = getSortValue(rightRow, key);

  if (leftValue === null && rightValue === null) {
    return 0;
  }

  if (leftValue === null) {
    return 1;
  }

  if (rightValue === null) {
    return -1;
  }

  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return leftValue - rightValue;
  }

  return String(leftValue).localeCompare(String(rightValue), 'de', {
    numeric: true,
    sensitivity: 'base',
  });
}

function getSortValue(row, key) {
  switch (key) {
    case 'name':
      return `${row.player_name ?? ''} ${row.player_tag ?? ''}`.trim();
    case 'status':
      return getStatusSortRank(getEffectiveStatusKey(row));
    case 'last_progress_date':
      return parseSortDateValue(row.last_progress_date);
    case 'wins_display':
      return numberOrNull(row.wins_display);
    case 'team_wins_total':
      return numberOrNull(row.team_wins_total);
    case 'trophies_total':
      return numberOrNull(row.trophies_total);
    case 'trophies_display':
      return numberOrNull(row.trophies_display);
    case 'tracking_start_date':
      return parseSortDateValue(row.tracking_start_date);
    case 'reason':
      return buildReasonChips(row).map((chip) => chip.text).join(' | ');
    default:
      return null;
  }
}

function getStatusSortRank(status) {
  switch (status) {
    case 'kritisch':
      return 0;
    case 'fraglich':
      return 1;
    case 'aktiv':
      return 2;
    case 'geschuetzt':
      return 3;
    default:
      return 4;
  }
}

function parseSortDateValue(value) {
  if (!value) {
    return null;
  }

  return new Date(value).getTime();
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function setTableState(message, visible) {
  tableState.textContent = message;
  tableState.classList.toggle('is-visible', visible);
}

function toggleRefresh(isLoading) {
  refreshButton.disabled = isLoading;
}

function readConfig() {
  const rawConfig = window.CLUB_VIEW_CONFIG;

  if (!rawConfig) {
    return null;
  }

  const supabaseUrl = rawConfig.supabaseUrl?.trim();
  const supabaseAnonKey = rawConfig.supabaseAnonKey?.trim();
  const clubTag = rawConfig.clubTag?.trim();

  if (!supabaseUrl || !supabaseAnonKey || !clubTag) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    clubTag,
  };
}

function normalizeClubTag(input) {
  const trimmed = String(input).trim().replace(/^#/, '');
  return `#${trimmed.toUpperCase()}`;
}

function stripTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('de-DE').format(value);
}

function formatDelta(value) {
  if (value === null || value === undefined) {
    return '-';
  }

  const numeric = Number(value);

  if (numeric > 0) {
    return `+${formatNumber(numeric)}`;
  }

  return formatNumber(numeric);
}

function renderDeltaMarkup(value) {
  const formatted = formatDelta(value);

  if (formatted === '-') {
    return '-';
  }

  const numeric = Number(value);
  const deltaClass = numeric > 0 ? 'is-positive' : numeric < 0 ? 'is-negative' : 'is-neutral';

  return `
    <span class="delta-stack">
      <span class="delta-value ${deltaClass}">${escapeHtml(formatted)}</span>
    </span>
  `;
}

function renderTrackingSinceMarkup(dateValue, trackedDays) {
  const formattedDate = formatDateLabel(dateValue);
  const trackedLabel = formatTrackedDaysLabel(trackedDays);

  if (!trackedLabel) {
    return escapeHtml(formattedDate);
  }

  return `
    <span class="table-stack">
      <span>${escapeHtml(formattedDate)}</span>
      <span class="table-meta">${escapeHtml(trackedLabel)}</span>
    </span>
  `;
}

function getReasonTokens(row) {
  const tokens = [];
  const winsGrowth = numberOrNull(row.wins_display);

  if (isLeadershipRole(row.role)) {
    tokens.push('leadership');
  } else if (row.protection_active === true) {
    tokens.push('protected');
  }

  if (!row.current_snapshot_date) {
    tokens.push('no_snapshot');
  }

  if (typeof row.days_no_progress === 'number' && row.days_no_progress >= 2) {
    tokens.push('no_progress');
  }

  if (winsGrowth === 0) {
    tokens.push('no_gain');
  } else if (typeof winsGrowth === 'number' && winsGrowth < 20) {
    tokens.push('lt20');
  } else if (typeof winsGrowth === 'number' && winsGrowth < 42) {
    tokens.push('lt42');
  } else if (typeof winsGrowth === 'number' && winsGrowth < 84) {
    tokens.push('below_goal');
  }

  if (row.meets_min_wins === false) {
    tokens.push('min_3v3');
  }

  return tokens;
}

function buildReasonChips(row) {
  const reasons = [];

  if (isLeadershipRole(row.role)) {
    reasons.push({ text: formatRole(row.role), tone: 'brand' });
  } else if (row.protection_active === true) {
    if (row.protected_until) {
      reasons.push({ text: `geschützt bis ${formatDateLabel(row.protected_until)}`, tone: 'brand' });
    } else {
      reasons.push({ text: 'geschützt', tone: 'brand' });
    }
  }

  if (!row.current_snapshot_date) {
    reasons.push({ text: 'kein Stand', tone: 'neutral' });
  }

  if (typeof row.days_no_progress === 'number' && row.days_no_progress >= 2) {
    reasons.push({
      text: `${formatNumber(row.days_no_progress)} Tage ohne Progress`,
      tone: row.days_no_progress >= 3 ? 'danger' : 'warn',
    });
  }

  const winsGrowth = numberOrNull(row.wins_display);

  if (winsGrowth === 0) {
    reasons.push({ text: 'kein 3v3-Zuwachs', tone: 'danger' });
  } else if (typeof winsGrowth === 'number' && winsGrowth < 20) {
    reasons.push({ text: '< 20 3v3-Gain', tone: 'danger' });
  } else if (typeof winsGrowth === 'number' && winsGrowth < 42) {
    reasons.push({ text: '< 42 3v3-Gain', tone: 'danger' });
  } else if (typeof winsGrowth === 'number' && winsGrowth < 84) {
    reasons.push({ text: '3v3-Gain < Wochenziel (84)', tone: 'warn' });
  }

  if (row.meets_min_wins === false) {
    reasons.push({
      text: 'unter Mindest-3v3 (8000)',
      tone: 'neutral',
    });
  }

  return reasons;
}

function renderChipMarkup(chip) {
  return `<span class="chip chip-${escapeHtml(chip.tone)}">${escapeHtml(chip.text)}</span>`;
}

function getEffectiveStatusKey(row) {
  if (isRealNewcomer(row)) {
    return row.protection_active === true ? 'geschuetzt' : 'aktiv';
  }

  return row.status;
}

function getDisplayStatusChips(row) {
  if (isRealNewcomer(row)) {
    const chips = [statusMetaToChip(getStatusMeta('neu'))];

    if (row.protection_active === true) {
      chips.push(statusMetaToChip(getStatusMeta('geschuetzt')));
    }

    return chips;
  }

  return [statusMetaToChip(getStatusMeta(row.status))];
}

function statusMetaToChip(meta) {
  return {
    text: meta.label,
    tone: meta.tone,
  };
}

function getStatusMeta(status) {
  switch (status) {
    case 'neu':
      return { label: 'Neu', className: 'chip-neutral', tone: 'neutral' };
    case 'kritisch':
      return { label: 'Kritisch', className: 'chip-danger', tone: 'danger' };
    case 'fraglich':
      return { label: 'Beobachten', className: 'chip-warn', tone: 'warn' };
    case 'geschuetzt':
      return { label: 'Geschützt', className: 'chip-brand', tone: 'brand' };
    case 'aktiv':
      return { label: 'Aktiv', className: 'chip-safe', tone: 'safe' };
    case 'unbekannt':
    default:
      return { label: '?', className: 'chip-neutral', tone: 'neutral' };
  }
}

function formatRole(role) {
  switch (String(role ?? '').toLowerCase()) {
    case 'president':
      return 'President';
    case 'vicepresident':
      return 'Vice President';
    case 'senior':
      return 'Senior';
    case 'member':
      return 'Member';
    default:
      return role ?? '-';
  }
}

function isLeadershipRole(role) {
  const normalized = String(role ?? '').toLowerCase();
  return normalized === 'president' || normalized === 'vicepresident' || normalized === 'senior';
}

function isRealNewcomer(row) {
  return typeof row.days_in_club === 'number' && row.days_in_club < 7;
}

function formatWindowLabel(label) {
  return label === 'seit_start' ? 'seit Start' : '7 Tage';
}

function formatRelativeDayLabel(value) {
  if (!value) {
    return '-';
  }

  const targetDate = parseChartAxisDate(value);
  const today = parseChartAxisDate(new Date());
  const diffDays = Math.round((today.getTime() - targetDate.getTime()) / 86_400_000);

  if (diffDays <= 0) {
    return 'heute';
  }

  if (diffDays === 1) {
    return 'gestern';
  }

  return `vor ${formatNumber(diffDays)} Tagen`;
}

function formatTrackedDaysLabel(value) {
  const numeric = numberOrNull(value);

  if (numeric === null) {
    return null;
  }

  if (numeric === 1) {
    return '1 Tag';
  }

  return `${formatNumber(numeric)} Tage`;
}

function formatDateLabel(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function formatChartDateLabel(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function formatRelativeTime(value) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) {
    return 'gerade eben';
  }

  if (diffMinutes < 60) {
    return `vor ${diffMinutes} Min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `vor ${diffHours} Std`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `vor ${diffDays} Tagen`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
