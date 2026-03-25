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
const overviewChartState = document.getElementById('overview-chart-state');
const overviewChart = document.getElementById('overview-chart');
const overviewGainState = document.getElementById('overview-gain-state');
const overviewGainChart = document.getElementById('overview-gain-chart');
const detailBackdrop = document.getElementById('detail-backdrop');
const detailPanel = document.getElementById('detail-panel');
const detailCloseButton = document.getElementById('detail-close');
const detailCharts = document.getElementById('detail-charts');
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
mobileList?.addEventListener('keydown', handleMobileCardKeyDown);
detailBackdrop.addEventListener('click', closeDetailPanel);
detailCloseButton.addEventListener('click', closeDetailPanel);
detailCharts?.addEventListener('click', handleDetailChartPointClick);
detailCharts?.addEventListener('keydown', handleDetailChartPointKeyDown);
overviewGainChart?.addEventListener('click', handleDetailChartPointClick);
overviewGainChart?.addEventListener('keydown', handleDetailChartPointKeyDown);
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
  setOverviewChartState('Lade Status-Verteilung ...', true);
  setOverviewGainState('Lade 3v3-Gain ...', true);
  overviewChart.innerHTML = '';
  overviewGainChart.innerHTML = '';

  try {
    const rows = await fetchDashboardRows(config);
    allRows = rows;
    historyCache.clear();

    renderOverviewMeta(rows);
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
    setOverviewChartState(`Status-Verteilung konnte nicht geladen werden: ${message}`, true);
    setOverviewGainState(`3v3-Gain konnte nicht geladen werden: ${message}`, true);
    overviewChart.innerHTML = '';
    overviewGainChart.innerHTML = '';
  } finally {
    toggleRefresh(false);
  }
}

function applyTheme(themeName) {
  const normalizedTheme = ['club', 'arena', 'brawl'].includes(themeName) ? themeName : 'club';
  document.documentElement.dataset.theme = normalizedTheme;

  try {
    localStorage.setItem('club-view-theme', normalizedTheme);
  } catch {}

  syncThemeControls();
}

function syncThemeControls() {
  const activeTheme = ['club', 'arena', 'brawl'].includes(document.documentElement.dataset.theme)
    ? document.documentElement.dataset.theme
    : 'club';

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
      'last_progress_at',
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

function renderOverviewMeta(rows) {
  const latestSnapshotAt = rows
    .map((row) => row.current_snapshot_at)
    .filter(Boolean)
    .sort()
    .at(-1);

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
  renderOverviewStatusChart(allRows);
  renderOverviewGainChart(allRows);

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
        : '';

      return `
        <tr class="row-link" tabindex="0" data-player-id="${escapeHtml(row.player_id)}">
          <td class="name-cell">
            <span class="player-name">${escapeHtml(row.player_name ?? '-')}</span>
            <span class="player-tag">${escapeHtml(row.player_tag ?? '')}</span>
          </td>
          <td class="status-cell"><div class="chip-list">${statusChips.map(renderChipMarkup).join('')}</div></td>
          <td class="numeric">${formatLastProgressLabel(row.last_progress_date, row.last_progress_at)}</td>
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
    : '';

  return `
    <article class="mobile-card" tabindex="0" role="button" data-player-id="${escapeHtml(row.player_id)}">
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
          <strong class="mobile-stat-value">${formatLastProgressLabel(row.last_progress_date, row.last_progress_at)}</strong>
        </article>
        <article class="mobile-stat">
          <span class="mobile-stat-label">3v3-Gain (7 Tage)</span>
          <strong class="mobile-stat-value">${renderDeltaMarkup(row.wins_display)}</strong>
        </article>
      </div>
      <div class="chip-list mobile-card-reasons">${renderedReasons}</div>
    </article>
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
  const cardElement = event.target.closest('[data-player-id]');

  if (!cardElement) {
    return;
  }

  const row = allRows.find((entry) => entry.player_id === cardElement.dataset.playerId);
  if (row) {
    void openDetailPanel(row);
  }
}

function handleMobileCardKeyDown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  const cardElement = event.target.closest('[data-player-id]');

  if (!cardElement) {
    return;
  }

  event.preventDefault();
  const row = allRows.find((entry) => entry.player_id === cardElement.dataset.playerId);
  if (row) {
    void openDetailPanel(row);
  }
}








function handleDetailChartPointClick(event) {
  const pointElement = event.target.closest('[data-chart-point]');

  if (!pointElement) {
    const chartCard = event.target.closest('.detail-chart-card');
    if (chartCard) {
      clearDetailChartSelection(chartCard);
    }
    return;
  }

  updateDetailChartSelection(pointElement);
}

function handleDetailChartPointKeyDown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  const pointElement = event.target.closest('[data-chart-point]');

  if (!pointElement) {
    return;
  }

  event.preventDefault();
  updateDetailChartSelection(pointElement);
}

function updateDetailChartSelection(pointElement) {
  const chartCard = pointElement.closest('.detail-chart-card');
  const tooltipElement = chartCard?.querySelector('.detail-chart-tooltip');

  if (!chartCard || !tooltipElement) {
    return;
  }

  chartCard.querySelectorAll('[data-chart-point]').forEach((element) => {
    element.setAttribute('aria-pressed', String(element === pointElement));
  });

  const title = pointElement.dataset.pointTitle ?? '';
  const delta = pointElement.dataset.pointDelta ?? '';
  const value = pointElement.dataset.pointValue ?? '';

  tooltipElement.innerHTML = `
    <div class="detail-chart-tooltip-title">${escapeHtml(title)}</div>
    ${delta ? `<div class="detail-chart-tooltip-line">${escapeHtml(delta)}</div>` : ''}
    ${value ? `<div class="detail-chart-tooltip-line">${escapeHtml(value)}</div>` : ''}
  `;
  tooltipElement.hidden = false;
  tooltipElement.style.left = pointElement.dataset.pointLeft ?? '50%';
  tooltipElement.style.top = pointElement.dataset.pointTop ?? '50%';
}

function clearDetailChartSelection(chartCard) {
  chartCard.querySelectorAll('[data-chart-point]').forEach((element) => {
    element.setAttribute('aria-pressed', 'false');
  });

  chartCard.querySelectorAll('.detail-chart-tooltip').forEach((element) => {
    element.hidden = true;
    element.innerHTML = '';
  });
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
    { label: 'Letzter 3v3 Sieg', value: formatLastProgressLabel(row.last_progress_date, row.last_progress_at) },
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
    : '';
}

function renderDetailHistory(detailRow, historyRows) {
  const charts = document.getElementById('detail-charts');
  const preparedRows = prepareDetailHistoryRows(detailRow, historyRows);
  const visibleRows = preparedRows.slice(0, selectedDetailHistoryDays);
  const previousRow = preparedRows[selectedDetailHistoryDays] ?? null;

  if (!Array.isArray(visibleRows) || visibleRows.length === 0) {
    charts.innerHTML = renderDetailChartPlaceholder('Noch keine Tageshistorie für Verlaufscharts vorhanden.');
    setDetailHistoryState('Noch keine Tageshistorie vorhanden.', true);
    return;
  }

  setDetailHistoryState('', false);
  renderDetailCharts(visibleRows, previousRow);
}

function renderOverviewStatusChart(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    overviewChart.innerHTML = '';
    setOverviewChartState('Noch keine Mitglieder fuer den Ueberblick vorhanden.', true);
    return;
  }

  const counts = {
    aktiv: 0,
    fraglich: 0,
    kritisch: 0,
    geschuetzt: 0,
    unbekannt: 0,
  };

  rows.forEach((row) => {
    const status = getEffectiveStatusKey(row);
    if (status in counts) {
      counts[status] += 1;
    } else {
      counts.unbekannt += 1;
    }
  });

  const chartStatuses = ['aktiv', 'fraglich', 'kritisch', 'geschuetzt'];
  const chartTotal = chartStatuses.reduce((sum, status) => sum + counts[status], 0);

  if (chartTotal === 0) {
    overviewChart.innerHTML = '';
    setOverviewChartState('Noch keine auswertbaren Statusdaten vorhanden.', true);
    return;
  }

  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  let consumedLength = 0;
  const segments = chartStatuses
    .filter((status) => counts[status] > 0)
    .map((status) => {
      const count = counts[status];
      const length = Number(((count / chartTotal) * circumference).toFixed(3));
      const segment = {
        status,
        count,
        color: getOverviewStatusColor(status),
        dasharray: `${length} ${Math.max(0, circumference - length)}`,
        dashoffset: Number((-consumedLength).toFixed(3)),
      };
      consumedLength += length;
      return segment;
    });

  overviewChart.innerHTML = `
    <article class="detail-chart-card overview-chart-card">
      <div class="detail-chart-header">
        <div>
          <h3 class="detail-chart-title">Status-Verteilung</h3>
          <p class="detail-chart-subtitle">Einfacher Überblick über Gut, Grenzwertig, Schlecht und Geschützt.</p>
        </div>
      </div>
      <div class="overview-status-layout">
        <svg class="overview-chart-svg" viewBox="0 0 220 220" role="img" aria-label="Status-Verteilung im Club">
          <circle class="overview-donut-track" cx="110" cy="110" r="${radius}"></circle>
          ${segments
            .map(
              (segment) => `
                <circle
                  class="overview-donut-segment"
                  cx="110"
                  cy="110"
                  r="${radius}"
                  style="stroke: ${escapeHtml(segment.color)}"
                  stroke-dasharray="${segment.dasharray}"
                  stroke-dashoffset="${segment.dashoffset}"
                >
                  <title>${escapeHtml(`${getStatusMeta(segment.status).label}: ${formatNumber(segment.count)} Mitglieder`)}</title>
                </circle>
              `,
            )
            .join('')}
          <text class="overview-donut-center-value" x="110" y="104" text-anchor="middle">${escapeHtml(formatNumber(chartTotal))}</text>
          <text class="overview-donut-center-label" x="110" y="126" text-anchor="middle">Mitglieder</text>
        </svg>
        <div class="overview-chart-meta">
          ${counts.unbekannt > 0 ? `<span>Kein Stand: ${escapeHtml(formatNumber(counts.unbekannt))}</span>` : ''}
        </div>
        <div class="overview-chart-legend">
          ${chartStatuses
            .filter((status) => counts[status] > 0)
            .map((status) => {
              const meta = getStatusMeta(status);
              const count = counts[status];

              return `
                <span class="overview-chart-legend-item">
                  <span class="overview-chart-legend-swatch" style="background: ${escapeHtml(getOverviewStatusColor(status))}"></span>
                  <span>${escapeHtml(meta.label)}</span>
                  <strong class="overview-chart-legend-value">${escapeHtml(formatNumber(count))}</strong>
                </span>
              `;
            })
            .join('')}
        </div>
      </div>
    </article>
  `;

  setOverviewChartState('', false);
}

function renderOverviewGainChart(rows) {
  const sourceRows = (Array.isArray(rows) ? rows : [])
    .filter((row) => row.current_snapshot_date && numberOrNull(row.wins_display) !== null)
    .sort((left, right) => {
      const gainComparison = numberOrNull(right.wins_display) - numberOrNull(left.wins_display);

      if (gainComparison !== 0) {
        return gainComparison;
      }

      return `${left.player_name ?? ''} ${left.player_tag ?? ''}`.trim().localeCompare(
        `${right.player_name ?? ''} ${right.player_tag ?? ''}`.trim(),
        'de',
        {
          numeric: true,
          sensitivity: 'base',
        },
      );
    });

  if (sourceRows.length === 0) {
    overviewGainChart.innerHTML = '';
    setOverviewGainState('Noch keine auswertbaren 3v3-Gain-Daten vorhanden.', true);
    return;
  }

  const width = 420;
  const height = 220;
  const padding = {
    top: 14,
    right: 14,
    bottom: 28,
    left: 42,
  };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const gains = sourceRows.map((row) => numberOrNull(row.wins_display));
  const domain = buildChartDomain(gains, {
    includeZero: true,
    minValue: 0,
  });
  const pointSpacing = sourceRows.length === 1 ? 0 : plotWidth / (sourceRows.length - 1);
  const points = sourceRows.map((row, index) => {
    const gain = numberOrNull(row.wins_display);
    const x = sourceRows.length === 1
      ? padding.left + plotWidth / 2
      : padding.left + pointSpacing * index;
    const y = scaleChartY(gain, domain, padding.top, plotHeight);

    return {
      row,
      gain,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };
  });
  const thresholdLines = [42, 84]
    .filter((value) => value >= domain.min && value <= domain.max)
    .map((value) => ({
      value,
      tone: value === 84 ? 'safe' : 'warn',
      y: Number(scaleChartY(value, domain, padding.top, plotHeight).toFixed(2)),
    }));

  overviewGainChart.innerHTML = `
    <article class="detail-chart-card overview-gain-card">
      <div class="detail-chart-header">
        <div>
          <h3 class="detail-chart-title">3v3-Gain (7 Tage)</h3>
          <p class="detail-chart-subtitle">Ein Punkt pro Mitglied, von links nach rechts absteigend sortiert.</p>
        </div>
      </div>
      <div class="detail-chart-stage">
        <svg class="detail-chart-svg overview-gain-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="3v3-Gain aller Mitglieder, absteigend sortiert">
          ${renderChartGrid({
            plotStartX: padding.left,
            plotEndX: padding.left + plotWidth,
            plotHeight,
            domain,
            ticks: buildChartTicks(domain, formatNumber),
          })}
          ${thresholdLines
            .map(
              (line) => `
                <g class="overview-gain-threshold-group">
                  <line class="overview-gain-threshold overview-gain-threshold-${escapeHtml(line.tone)}" x1="${padding.left}" y1="${line.y}" x2="${padding.left + plotWidth}" y2="${line.y}"></line>
                  <text class="overview-gain-threshold-label overview-gain-threshold-label-${escapeHtml(line.tone)}" x="${padding.left + plotWidth}" y="${line.y - 6}" text-anchor="end">${escapeHtml(formatNumber(line.value))}</text>
                </g>
              `,
            )
            .join('')}
          ${points
            .map((point) => `
              <g
                class="detail-chart-point-group"
                tabindex="0"
                role="button"
                data-chart-point="true"
                data-point-title="${escapeHtml(point.row.player_name ?? point.row.player_tag ?? 'Mitglied')}"
                data-point-delta="${escapeHtml(formatDelta(point.gain))}"
                data-point-value="${escapeHtml(`Status: ${getStatusMeta(getEffectiveStatusKey(point.row)).label}`)}"
                data-point-left="${(((point.x) / width) * 100).toFixed(3)}%"
                data-point-top="${(((point.y) / height) * 100).toFixed(3)}%"
                aria-label="${escapeHtml(`${point.row.player_name ?? point.row.player_tag ?? 'Mitglied'}: ${formatDelta(point.gain)} in 7 Tagen, Status ${getStatusMeta(getEffectiveStatusKey(point.row)).label}`)}"
                aria-pressed="false"
              >
                <circle class="detail-chart-point-hit" cx="${point.x}" cy="${point.y}" r="12"></circle>
                <circle class="detail-chart-point-halo" cx="${point.x}" cy="${point.y}" r="8"></circle>
                <circle
                  class="detail-chart-point overview-gain-point"
                  cx="${point.x}"
                  cy="${point.y}"
                  r="4.5"
                  style="fill: ${escapeHtml(getOverviewStatusColor(getEffectiveStatusKey(point.row)))}"
                ></circle>
              </g>
            `)
            .join('')}
        </svg>
        <div class="detail-chart-tooltip" aria-live="polite" hidden></div>
      </div>
      <div class="detail-chart-footer overview-gain-footer" aria-hidden="true">
        <span>Höchster Gain</span>
        <span>${escapeHtml(`${formatNumber(sourceRows.length)} Mitglieder`)}</span>
        <span>Niedrigster Gain</span>
      </div>
    </article>
  `;

  setOverviewGainState('', false);
}


function getOverviewStatusColor(status) {
  switch (status) {
    case 'kritisch':
      return 'var(--danger)';
    case 'fraglich':
      return 'var(--warn)';
    case 'geschuetzt':
      return 'var(--protected)';
    case 'aktiv':
      return 'var(--safe)';
    default:
      return 'var(--neutral)';
  }
}









function renderDetailCharts(historyRows, previousRow = null) {
  const container = document.getElementById('detail-charts');

  if (!Array.isArray(historyRows) || historyRows.length === 0) {
    container.innerHTML = renderDetailChartPlaceholder('Noch keine Tagesstände für Verlaufscharts vorhanden.');
    return;
  }

  const rowsAscending = [...historyRows].sort(
    (left, right) => new Date(left.snapshot_date).getTime() - new Date(right.snapshot_date).getTime(),
  );
  const winsSeries = buildHistorySeries(rowsAscending, 'team_wins', previousRow?.team_wins);
  const trophiesSeries = buildHistorySeries(rowsAscending, 'trophies', previousRow?.trophies);

  container.innerHTML = [
    renderDetailChartCard({
      title: '3v3 Wins',
      subtitle: 'Gesamtstand je Tag',
      tone: 'brand',
      series: winsSeries,
      tickFormatter: formatNumber,
      maxValue: winsSeries.at(-1)?.value ?? null,
      xWindowDays: selectedDetailHistoryDays,
    }),
    renderDetailChartCard({
      title: 'Trophäen',
      subtitle: 'Gesamtstand je Tag',
      tone: 'warn',
      series: trophiesSeries,
      tickFormatter: formatNumber,
      maxValue: Math.max(...trophiesSeries.map((point) => point.value)),
      xWindowDays: selectedDetailHistoryDays,
    }),
  ].join('');
}

function renderDetailChartCard({ title, subtitle, tone, series, tickFormatter, maxValue, xWindowDays }) {
  if (!Array.isArray(series) || series.length === 0) {
    return renderDetailChartPlaceholder(`Noch keine Daten für ${title}.`);
  }

  const minValue = Math.min(...series.map((point) => point.value));
  const chart = buildLineChartModel(series, {
    includeZero: false,
    minValue,
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
      </div>
      <div class="detail-chart-stage">
      <svg class="detail-chart-svg" viewBox="0 0 ${chart.width} ${chart.height}" role="img" aria-label="${escapeHtml(title)}">
        ${renderChartGrid(chart)}
        <path class="detail-chart-line detail-chart-line-${escapeHtml(tone)}" d="${escapeHtml(chart.path)}"></path>
        ${chart.points
          .map((point, index) => {
            const seriesPoint = series[index];
            const pointData = buildDetailChartPointData(seriesPoint);
            const pointLeft = `${((point.x / chart.width) * 100).toFixed(3)}%`;
            const pointTop = `${((point.y / chart.height) * 100).toFixed(3)}%`;

            return `
              <g
                class="detail-chart-point-group"
                tabindex="0"
                role="button"
                data-chart-point="true"
                data-point-title="${escapeHtml(pointData.title)}"
                data-point-delta="${escapeHtml(pointData.delta)}"
                data-point-value="${escapeHtml(pointData.value)}"
                data-point-left="${pointLeft}"
                data-point-top="${pointTop}"
                aria-label="${escapeHtml(pointData.ariaLabel)}"
                aria-pressed="false"
              >
                <circle class="detail-chart-point-hit" cx="${point.x}" cy="${point.y}" r="12"></circle>
                <circle class="detail-chart-point-halo" cx="${point.x}" cy="${point.y}" r="8"></circle>
                <circle class="detail-chart-point detail-chart-point-${escapeHtml(tone)}" cx="${point.x}" cy="${point.y}" r="4"></circle>
              </g>
            `;
          })
          .join('')}
      </svg>
      <div class="detail-chart-tooltip" aria-live="polite" hidden></div>
      </div>
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

function buildDetailChartPointData(point) {
  if (!point) {
    return {
      title: '',
      delta: '',
      value: '',
      ariaLabel: '',
    };
  }

  const title = point.label ?? formatChartDateLabel(point.date);
  const value = `Stand: ${formatNumber(point.value)}`;
  const delta = point.delta === null ? 'Startwert' : `${formatDelta(point.delta)} zum Vortag`;

  return {
    title,
    delta,
    value,
    ariaLabel: `${title}: ${delta}. ${value}`,
  };
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

function buildHistorySeries(rowsAscending, key, previousBaselineValue = null) {
  let previousValue = numberOrNull(previousBaselineValue);

  return rowsAscending
    .map((row) => {
      const value = numberOrNull(row[key]);

      if (value === null) {
        return null;
      }

      const pointTime = row.snapshot_date;
      const delta = previousValue === null ? null : value - previousValue;
      previousValue = value;

      return {
        date: pointTime,
        value,
        delta,
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
    minValue: options.minValue,
    maxValue: options.maxValue,
  });
  const xEndDate = parseChartAxisDate(series.at(-1)?.date ?? series[0]?.date);
  const xStartDate = addDaysUtc(xEndDate, -(xWindowDays - 1));
  const xRangeMs = Math.max(1, xEndDate.getTime() - xStartDate.getTime());
  const points = series.map((point) => {
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
  const fixedMin = Number.isFinite(options.minValue) ? Number(options.minValue) : null;
  const fixedMax = Number.isFinite(options.maxValue) ? Number(options.maxValue) : null;
  let rawMin = Math.min(...values);
  let rawMax = Math.max(...values);

  if (includeZero) {
    rawMin = Math.min(rawMin, 0);
    rawMax = Math.max(rawMax, 0);
  }

  if (fixedMin !== null) {
    rawMin = fixedMin;
  }

  if (fixedMax !== null) {
    rawMax = fixedMax;
  }

  if (rawMin === rawMax) {
    const padding = Math.max(1, Math.ceil(Math.abs(rawMin || 1) * 0.25));
    return {
      min: fixedMin !== null ? rawMin : rawMin - padding,
      max: rawMax + padding,
    };
  }

  const padding = Math.max(1, Math.ceil((rawMax - rawMin) * 0.1));

  if (fixedMax !== null) {
    return {
      min: fixedMin !== null ? rawMin : rawMin - padding,
      max: rawMax,
    };
  }

  return {
    min: fixedMin !== null ? rawMin : rawMin - padding,
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

function setOverviewChartState(message, visible) {
  overviewChartState.textContent = message;
  overviewChartState.classList.toggle('is-visible', visible);
}

function setOverviewGainState(message, visible) {
  overviewGainState.textContent = message;
  overviewGainState.classList.toggle('is-visible', visible);
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
    const isAscending = sortState.direction === 'asc';
    const label = isAscending ? '↑' : '↓';
    const directionText = isAscending ? 'aufsteigend' : 'absteigend';
    mobileSortDirection.textContent = label;
    mobileSortDirection.setAttribute('aria-label', `${sortState.key} ${directionText} sortieren`);
    mobileSortDirection.setAttribute('title', isAscending ? 'Aufsteigend' : 'Absteigend');
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
      return parseSortDateValue(row.last_progress_at ?? row.last_progress_date);
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
  return getComputedStatusKey(row);
}

function getDisplayStatusChips(row) {
  const effectiveStatus = getComputedStatusKey(row);

  if (isRealNewcomer(row)) {
    const chips = [statusMetaToChip(getStatusMeta('neu'))];

    if (effectiveStatus && effectiveStatus !== 'unbekannt') {
      chips.push(statusMetaToChip(getStatusMeta(effectiveStatus)));
    }

    return chips;
  }

  return [statusMetaToChip(getStatusMeta(effectiveStatus))];
}

function getComputedStatusKey(row) {
  if (row.protection_active === true) {
    return 'geschuetzt';
  }

  if (!row.current_snapshot_date) {
    return 'unbekannt';
  }

  const winsGrowth = numberOrNull(row.wins_display);
  const daysWithoutProgress = numberOrNull(row.days_no_progress);

  if (daysWithoutProgress !== null && daysWithoutProgress >= 3) {
    return 'kritisch';
  }

  if (winsGrowth !== null && winsGrowth < 42) {
    return 'kritisch';
  }

  if (daysWithoutProgress !== null && daysWithoutProgress >= 2) {
    return 'fraglich';
  }

  if (winsGrowth !== null && winsGrowth < 84) {
    return 'fraglich';
  }

  return 'aktiv';
}

function statusMetaToChip(meta) {
  return {
    text: meta.label,
    tone: meta.className === 'chip-brand' ? 'protected' : meta.tone,
  };
}

function getStatusMeta(status) {
  switch (status) {
    case 'neu':
      return { label: 'Neu', className: 'chip-neutral', tone: 'neutral' };
    case 'kritisch':
      return { label: 'Schlecht', className: 'chip-danger', tone: 'danger' };
    case 'fraglich':
      return { label: 'Grenzwertig', className: 'chip-warn', tone: 'warn' };
    case 'geschuetzt':
      return { label: 'Geschützt', className: 'chip-brand', tone: 'brand' };
    case 'aktiv':
      return { label: 'Gut', className: 'chip-safe', tone: 'safe' };
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

function formatLastProgressLabel(dateValue, timestampValue) {
  const recentLabel = formatRecentProgressLabel(timestampValue);

  if (recentLabel) {
    return recentLabel;
  }

  return formatRelativeDayLabel(dateValue);
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

function formatRecentProgressLabel(value) {
  if (!value) {
    return null;
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  const time = date.getTime();

  if (!Number.isFinite(time)) {
    return null;
  }

  const diffMs = Math.max(0, Date.now() - time);

  if (diffMs >= 86_400_000) {
    return null;
  }

  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return 'gerade eben';
  }

  if (diffMinutes < 60) {
    return `vor ${formatCountLabel(diffMinutes, 'Minute', 'Minuten')}`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `vor ${formatCountLabel(diffHours, 'Stunde', 'Stunden')}`;
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
  }).format(new Date(value)).slice(0, -1);
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

function formatCountLabel(value, singular, plural) {
  const numeric = Number(value);
  return `${formatNumber(numeric)} ${numeric === 1 ? singular : plural}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
