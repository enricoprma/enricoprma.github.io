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
const overviewClubGainState = document.getElementById('overview-club-gain-state');
const overviewClubGainChart = document.getElementById('overview-club-gain-chart');
const detailBackdrop = document.getElementById('detail-backdrop');
const detailPanel = document.getElementById('detail-panel');
const detailCloseButton = document.getElementById('detail-close');
const detailCharts = document.getElementById('detail-charts');
const detailBattlesState = document.getElementById('detail-battles-state');
const detailBattles = document.getElementById('detail-battles');
const detailRangeButtons = [...document.querySelectorAll('[data-history-days]')];
const MAX_DETAIL_HISTORY_DAYS = 30;
const MAX_OVERVIEW_CLUB_GAIN_DAYS = 30;
const CHART_POINT_RADIUS = 4.5;
const CHART_INLINE_LABEL_OFFSET = 6;
const BRAWL_HOCKEY_MAPS = new Set([
  'Below Zero',
  'Bouncy Bowl',
  'Cool Box',
  'H is for Holiday',
  'Hyperspace',
  'Slippery Slap',
  'Starr Garden',
  'Super Center',
  'Cabin Fever',
  'Tip Toe',
  'Air Sports Arena',
  'Puck Man',
  'Puck Palace',
  'Slapshot Stadium',
  'Cold Snap',
  'Frostbite Rink',
  'Massive Meltdown',
  'Snowcone Square',
]);
const BRAWL_ARENA_MAPS = new Set([
  'Arena of Glory',
  'Kaiju Lake',
  'Knockout Grounds',
  'Mirage Arena',
  'The Smackdome',
]);
const DATE_FORMATTERS = {
  dateLabel: new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
  }),
  chartLabel: new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
  }),
  dateTime: new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }),
};

let allRows = [];
let selectedPlayerId = null;
let detailRequestToken = 0;
let primaryHistoryWindowDays = 7;
let selectedDetailHistoryDays = primaryHistoryWindowDays;
let selectedOverviewClubGainDays = primaryHistoryWindowDays;
let currentDetailRow = null;
let currentDetailHistoryRows = [];
let currentDetailBattleRows = [];
let currentOverviewClubHistoryRows = [];
const historyCache = new Map();
const battleHistoryCache = new Map();
let sortState = {
  key: 'wins_display',
  direction: 'desc',
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
overviewClubGainChart?.addEventListener('click', handleOverviewClubGainClick);
overviewClubGainChart?.addEventListener('keydown', handleDetailChartPointKeyDown);
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
  setOverviewClubGainState('Lade Club-Gain ...', true);
  overviewChart.innerHTML = '';
  overviewGainChart.innerHTML = '';
  overviewClubGainChart.innerHTML = '';

  try {
    const rows = await fetchDashboardRows(config);
    allRows = rows;
    historyCache.clear();
    battleHistoryCache.clear();
    currentOverviewClubHistoryRows = [];
    const nextPrimaryHistoryWindowDays = getPrimaryHistoryWindowDays(rows);
    const followsPrimaryHistoryWindow = selectedDetailHistoryDays === primaryHistoryWindowDays;
    const followsOverviewPrimaryWindow = selectedOverviewClubGainDays === primaryHistoryWindowDays;
    primaryHistoryWindowDays = nextPrimaryHistoryWindowDays;
    if (followsPrimaryHistoryWindow) {
      selectedDetailHistoryDays = primaryHistoryWindowDays;
    }
    if (followsOverviewPrimaryWindow || !getOverviewClubGainWindowOptions(rows).includes(selectedOverviewClubGainDays)) {
      selectedOverviewClubGainDays = primaryHistoryWindowDays;
    }
    syncGrowthWindowLabels(rows);
    syncReasonFilterLabels(rows);

    renderOverviewMeta(rows);
    renderRows();
    try {
      currentOverviewClubHistoryRows = await fetchClubHistory(
        config,
        config.clubTag,
        getOverviewClubGainLookbackDays(rows),
      );
      renderOverviewClubGainChart(rows, currentOverviewClubHistoryRows);
    } catch (historyError) {
      console.error(historyError);
      currentOverviewClubHistoryRows = [];
      const historyMessage = historyError instanceof Error ? historyError.message : String(historyError);
      setOverviewClubGainState(`Club-Gain konnte nicht geladen werden: ${historyMessage}`, true);
      overviewClubGainChart.innerHTML = '';
    }

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
    setOverviewClubGainState(`Club-Gain konnte nicht geladen werden: ${message}`, true);
    overviewChart.innerHTML = '';
    overviewGainChart.innerHTML = '';
    overviewClubGainChart.innerHTML = '';
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
      'growth_window_days',
      'progress_days_elapsed',
      'min_wins',
      'warning_no_progress_days',
      'critical_wins_growth_threshold',
      'target_wins_growth_threshold',
      'status',
      'status_rank',
      'status_badges',
      'reason_keys',
      'reason_badges',
      'reason',
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
  url.searchParams.set('order', 'wins_display.asc.nullslast,progress_days_elapsed.desc.nullslast,player_name.asc');

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

async function fetchPlayerBattles(currentConfig, clubTag, playerId) {
  const cacheKey = `${clubTag}:${playerId}`;

  if (battleHistoryCache.has(cacheKey)) {
    return battleHistoryCache.get(cacheKey);
  }

  const rows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const url = new URL(`${stripTrailingSlash(currentConfig.supabaseUrl)}/rest/v1/player_battle_history`);
    url.searchParams.set('select', 'battle_time,mode,mode_name,mode_image_url,map,map_image_url,result,is_victory,is_3v3,placement,brawler_id,brawler_name,event_id');
    url.searchParams.set('club_tag', `eq.${normalizeClubTag(clubTag)}`);
    url.searchParams.set('player_id', `eq.${playerId}`);
    url.searchParams.set('order', 'battle_time.desc');
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url, {
      headers: {
        apikey: currentConfig.supabaseAnonKey,
        Authorization: `Bearer ${currentConfig.supabaseAnonKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase Battle-Verlauf antwortet mit ${response.status}`);
    }

    const pageRows = await response.json();
    rows.push(...pageRows);

    if (pageRows.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  battleHistoryCache.set(cacheKey, rows);
  return rows;
}

async function fetchClubHistory(currentConfig, clubTag, lookbackDays) {
  const url = new URL(`${stripTrailingSlash(currentConfig.supabaseUrl)}/rest/v1/player_daily_snapshots`);
  const startDate = formatIsoDate(addDaysUtc(parseChartAxisDate(new Date()), -(lookbackDays + 1)));
  url.searchParams.set('select', 'player_id,snapshot_date,team_wins');
  url.searchParams.set('club_tag', `eq.${normalizeClubTag(clubTag)}`);
  url.searchParams.set('snapshot_date', `gte.${startDate}`);
  url.searchParams.set('order', 'snapshot_date.asc');
  url.searchParams.set('limit', '10000');

  const response = await fetch(url, {
    headers: {
      apikey: currentConfig.supabaseAnonKey,
      Authorization: `Bearer ${currentConfig.supabaseAnonKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase Club-Verlauf antwortet mit ${response.status}`);
  }

  return await response.json();
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

function getDashboardThresholds(rows = allRows) {
  const source = (Array.isArray(rows) ? rows : []).find((row) => row && typeof row === 'object') ?? null;

  return {
    growthWindowDays: numberOrNull(source?.growth_window_days),
    criticalWinsGrowth: numberOrNull(source?.critical_wins_growth_threshold),
    targetWinsGrowth: numberOrNull(source?.target_wins_growth_threshold),
    minWins: numberOrNull(source?.min_wins),
    warningNoProgressDays: numberOrNull(source?.warning_no_progress_days),
  };
}

function getPrimaryHistoryWindowDays(rows = allRows) {
  return getDashboardThresholds(rows).growthWindowDays ?? 7;
}

function getGrowthWindowDaysForRow(row) {
  return numberOrNull(row?.growth_window_days) ?? primaryHistoryWindowDays;
}

function getGrowthWindowLabel(days) {
  return `${formatNumber(days)} Tage`;
}

function getOverviewClubGainWindowOptions(rows = allRows) {
  return [7, MAX_OVERVIEW_CLUB_GAIN_DAYS];
}

function getOverviewClubGainLookbackDays(rows = allRows) {
  return Math.max(...getOverviewClubGainWindowOptions(rows), MAX_OVERVIEW_CLUB_GAIN_DAYS) + MAX_OVERVIEW_CLUB_GAIN_DAYS;
}

function syncGrowthWindowLabels(rows = allRows) {
  const growthWindowDays = getPrimaryHistoryWindowDays(rows);
  const winsGainLabel = `3v3-Gain (${getGrowthWindowLabel(growthWindowDays)})`;
  const trophiesGainLabel = `Trophy-Gain (${getGrowthWindowLabel(growthWindowDays)})`;

  const winsSortOption = mobileSortKey?.querySelector('option[value="wins_display"]');
  const trophiesSortOption = mobileSortKey?.querySelector('option[value="trophies_display"]');
  const winsSortHeaderLabel = document.querySelector('.sort-button[data-sort-key="wins_display"] .sort-label');
  const trophiesSortHeaderLabel = document.querySelector('.sort-button[data-sort-key="trophies_display"] .sort-label');
  const primaryRangeButton = detailRangeButtons[0];

  if (winsSortOption) {
    winsSortOption.textContent = winsGainLabel;
  }

  if (trophiesSortOption) {
    trophiesSortOption.textContent = trophiesGainLabel;
  }

  if (winsSortHeaderLabel) {
    winsSortHeaderLabel.textContent = winsGainLabel;
  }

  if (trophiesSortHeaderLabel) {
    trophiesSortHeaderLabel.textContent = trophiesGainLabel;
  }

  if (primaryRangeButton) {
    primaryRangeButton.dataset.historyDays = String(growthWindowDays);
    primaryRangeButton.textContent = getGrowthWindowLabel(growthWindowDays);
  }

  syncDetailHistoryRangeButtons();
}

function syncReasonFilterLabels(rows = allRows) {
  if (!reasonFilter) {
    return;
  }

  const thresholds = getDashboardThresholds(rows);
  const labelByValue = {
    no_snapshot: 'Kein Stand',
    no_progress: thresholds.warningNoProgressDays !== null
      ? `Kein Progress (ab ${formatNumber(thresholds.warningNoProgressDays)} Tagen)`
      : 'Kein Progress',
    no_gain: 'Kein 3v3-Zuwachs',
    critical_gain: thresholds.criticalWinsGrowth !== null
      ? `Unter Mindestziel (${formatNumber(thresholds.criticalWinsGrowth)})`
      : 'Unter Mindestziel',
    below_goal: thresholds.targetWinsGrowth !== null
      ? `Unter Zielwert (${formatNumber(thresholds.targetWinsGrowth)})`
      : 'Unter Zielwert',
    min_3v3: thresholds.minWins !== null
      ? `Unter Mindest-3v3 (${formatNumber(thresholds.minWins)})`
      : 'Unter Mindest-3v3',
    leadership: 'Leadership',
    protected: 'Geschützt',
  };

  [...reasonFilter.options].forEach((option) => {
    if (option.value in labelByValue) {
      option.textContent = labelByValue[option.value];
    }
  });
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
      const reasonChips = buildReasonChips(row);
      const renderedReasons = reasonChips.length > 0
        ? reasonChips.map(renderChipMarkup).join('')
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
  const reasonChips = buildReasonChips(row);
  const growthWindowLabel = getGrowthWindowLabel(getGrowthWindowDaysForRow(row));

  const renderedReasons = reasonChips.length > 0
    ? reasonChips.map(renderChipMarkup).join('')
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
          <span class="mobile-stat-label">3v3-Gain (${escapeHtml(growthWindowLabel)})</span>
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

function handleOverviewClubGainClick(event) {
  const rangeButton = event.target.closest('[data-overview-gain-days]');

  if (rangeButton) {
    const nextDays = Number(rangeButton.dataset.overviewGainDays);

    if (Number.isFinite(nextDays) && nextDays !== selectedOverviewClubGainDays) {
      selectedOverviewClubGainDays = nextDays;
      renderOverviewClubGainChart(allRows, currentOverviewClubHistoryRows);
    }
    return;
  }

  handleDetailChartPointClick(event);
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

function getChartPointSelectionData(pointElement) {
  return {
    title: pointElement.dataset.pointTitle ?? '',
    delta: pointElement.dataset.pointDelta ?? '',
    value: pointElement.dataset.pointValue ?? '',
    left: pointElement.dataset.pointLeft ?? '50%',
    top: pointElement.dataset.pointTop ?? '50%',
  };
}

function buildChartTooltipMarkup({ title = '', delta = '', value = '' }) {
  return `
    <div class="detail-chart-tooltip-title">${escapeHtml(title)}</div>
    ${delta ? `<div class="detail-chart-tooltip-line">${escapeHtml(delta)}</div>` : ''}
    ${value ? `<div class="detail-chart-tooltip-line">${escapeHtml(value)}</div>` : ''}
  `;
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

  const pointData = getChartPointSelectionData(pointElement);

  tooltipElement.innerHTML = buildChartTooltipMarkup(pointData);
  tooltipElement.hidden = false;
  tooltipElement.style.left = pointData.left;
  tooltipElement.style.top = pointData.top;
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
  renderDetailMetrics(row, null);
  renderDetailReasons(row);
  detailBattles.innerHTML = '';
  setDetailBattlesState('Lade Runden ...', true);
  document.getElementById('detail-charts').innerHTML = renderDetailChartPlaceholder('Lade Verlaufscharts ...');
  setDetailHistoryState('Lade Verlauf ...', true);
  openDetailChrome();

  const [historyResult, battlesResult] = await Promise.allSettled([
    fetchPlayerHistory(config, row.club_tag, row.player_id),
    fetchPlayerBattles(config, row.club_tag, row.player_id),
  ]);

  if (requestToken !== detailRequestToken) {
    return;
  }

  if (historyResult.status === 'fulfilled') {
    currentDetailHistoryRows = historyResult.value;
    renderDetailHistory(row, historyResult.value);
  } else {
    console.error(historyResult.reason);
    currentDetailHistoryRows = [];
    setDetailHistoryState('Verlauf konnte nicht geladen werden.', true);
    document.getElementById('detail-charts').innerHTML = renderDetailChartPlaceholder('Verlaufscharts konnten nicht geladen werden.');
  }

  if (battlesResult.status === 'fulfilled') {
    currentDetailBattleRows = battlesResult.value;
    renderDetailMetrics(row, computeThreeVsThreeWinrate(battlesResult.value));
    renderDetailBattles(battlesResult.value);
  } else {
    console.error(battlesResult.reason);
    currentDetailBattleRows = [];
    setDetailBattlesState('Runden konnten nicht geladen werden.', true);
    detailBattles.innerHTML = '';
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
  currentDetailBattleRows = [];
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

function renderDetailMetrics(row, battleStats) {
  const growthWindowLabel = getGrowthWindowLabel(getGrowthWindowDaysForRow(row));
  const metrics = [
    { label: 'Letzter 3v3 Sieg', value: formatLastProgressLabel(row.last_progress_date, row.last_progress_at) },
    {
      label: `3v3-Gain (${growthWindowLabel})`,
      value: formatDelta(row.wins_display),
    },
    {
      label: '3v3 Siege',
      value: formatNumber(row.team_wins_total),
      meta: battleStats ? `Winrate ${battleStats.percentage}% (${formatNumber(battleStats.wins)}/${formatNumber(battleStats.total)})` : null,
    },
    { label: 'Trophäen', value: formatNumber(row.trophies_total) },
    {
      label: `Trophy-Gain (${growthWindowLabel})`,
      value: formatDelta(row.trophies_display),
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

function renderDetailBattles(rows) {
  const recentRows = rows.slice(0, 10);

  if (recentRows.length === 0) {
    detailBattles.innerHTML = '<div class="detail-battles-empty">Noch keine aufgezeichneten Runden.</div>';
    setDetailBattlesState('', false);
    return;
  }

  setDetailBattlesState('', false);
  detailBattles.innerHTML = recentRows
    .map((row) => {
      const outcome = getBattleOutcomeMeta(row);

      return `
        <article class="detail-battle-card detail-battle-card-${escapeHtml(outcome.tone)}">
          <div class="detail-battle-row">
            <div class="detail-battle-avatar">
              ${renderBattleBrawlerMedia(row)}
            </div>
            <div class="detail-battle-copy">
              <span class="chip chip-${escapeHtml(outcome.tone)} detail-battle-outcome">${escapeHtml(outcome.label)}</span>
              <div class="detail-battle-meta-row">
                <span class="detail-battle-inline-media">
                  ${renderBattleModeMedia(row)}
                </span>
                <strong class="detail-battle-mode">${escapeHtml(formatBattleModeLabel(row))}</strong>
              </div>
              <div class="detail-battle-meta-row">
                <span class="detail-battle-inline-media">
                  ${renderBattleMapMedia(row)}
                </span>
                <span class="detail-battle-map">${escapeHtml(formatBattleLabel(row.map))}</span>
              </div>
            </div>
            <span class="detail-battle-time">${escapeHtml(formatRelativeTime(row.battle_time))}</span>
          </div>
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

function computeThreeVsThreeWinrate(rows) {
  const ratedRows = rows.filter((row) => row.is_3v3 === true && typeof row.is_victory === 'boolean');

  if (ratedRows.length === 0) {
    return null;
  }

  const wins = ratedRows.filter((row) => row.is_victory === true).length;

  return {
    wins,
    total: ratedRows.length,
    percentage: Math.round((wins / ratedRows.length) * 100),
  };
}

function getBattleOutcomeMeta(row) {
  if (Number.isInteger(row.placement)) {
    return {
      label: `#${formatNumber(row.placement)}`,
      tone: row.placement < 5 ? 'safe' : 'danger',
    };
  }

  if (row.is_victory === true) {
    return { label: 'Win', tone: 'safe' };
  }

  if (row.is_victory === false) {
    return { label: 'Lose', tone: 'danger' };
  }

  if (typeof row.result === 'string' && row.result.length > 0) {
    return {
      label: capitalizeFirstLetter(row.result),
      tone: 'neutral',
    };
  }

  return { label: 'Unklar', tone: 'neutral' };
}

function formatBattleLabel(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '-';
  }

  const spaced = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();

  return spaced.replace(/\b\p{L}/gu, (match) => match.toUpperCase());
}

function formatBattleModeLabel(row) {
  const metadataModeName = readTrimmedString(row?.mode_name);
  if (metadataModeName) {
    return metadataModeName;
  }

  const normalizedMode = typeof row?.mode === 'string' ? row.mode.trim().toLowerCase() : '';
  const normalizedMap = typeof row?.map === 'string' ? row.map.trim() : '';

  if (normalizedMode && normalizedMode !== 'unknown') {
    return formatBattleLabel(row.mode);
  }

  if (normalizedMap && BRAWL_HOCKEY_MAPS.has(normalizedMap)) {
    return 'Brawl Hockey';
  }

  if (normalizedMap && BRAWL_ARENA_MAPS.has(normalizedMap)) {
    return 'Brawl Arena';
  }

  return formatBattleLabel(row.mode);
}

function getBrawlerImageUrl(brawlerId) {
  return Number.isInteger(brawlerId)
    ? `https://cdn.brawlify.com/brawlers/borderless/${brawlerId}.png`
    : null;
}

function renderBattleBrawlerMedia(row) {
  const imageUrl = getBrawlerImageUrl(numberOrNull(row?.brawler_id));
  const label = formatBattleLabel(row?.brawler_name);

  if (!imageUrl) {
    return `<div class="detail-battle-media-fallback">${escapeHtml(label.slice(0, 2))}</div>`;
  }

  return `<img class="detail-battle-avatar-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(label)}" loading="lazy" referrerpolicy="no-referrer">`;
}

function renderBattleModeMedia(row) {
  const modeLabel = formatBattleModeLabel(row);
  const imageUrl = getGameModeImageUrl(row);
  const fallbackLabel = modeLabel.slice(0, 2);

  return imageUrl
    ? `<img class="detail-battle-inline-image detail-battle-mode-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(modeLabel)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">`
      + `<span class="detail-battle-inline-fallback" hidden>${escapeHtml(fallbackLabel)}</span>`
    : `<span class="detail-battle-inline-fallback">${escapeHtml(fallbackLabel)}</span>`;
}

function renderBattleMapMedia(row) {
  const mapLabel = formatBattleLabel(row?.map);
  const imageUrl = getMapImageUrl(row);
  const fallbackLabel = mapLabel.slice(0, 2);

  return imageUrl
    ? `<img class="detail-battle-inline-image detail-battle-map-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(mapLabel)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">`
      + `<span class="detail-battle-inline-fallback" hidden>${escapeHtml(fallbackLabel)}</span>`
    : `<span class="detail-battle-inline-fallback">${escapeHtml(fallbackLabel)}</span>`;
}

function getGameModeImageUrl(row) {
  return readTrimmedString(row?.mode_image_url);
}

function getMapImageUrl(row) {
  const viewUrl = readTrimmedString(row?.map_image_url);

  if (viewUrl) {
    return viewUrl;
  }

  const eventId = numberOrNull(row?.event_id);
  return Number.isInteger(eventId)
    ? `https://cdn.brawlify.com/maps/regular/${eventId}.png`
    : null;
}

function readTrimmedString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function renderDetailHistory(detailRow, historyRows) {
  const charts = document.getElementById('detail-charts');
  const preparedRows = prepareDetailHistoryRows(detailRow, historyRows);
  const rowsDescending = [...preparedRows].sort((left, right) => getHistoryPointTime(right) - getHistoryPointTime(left));
  const latestVisibleDate = rowsDescending[0] ? parseChartAxisDate(rowsDescending[0].snapshot_date) : null;
  const windowStartDate = latestVisibleDate ? addDaysUtc(latestVisibleDate, -(selectedDetailHistoryDays - 1)) : null;
  const visibleRows = windowStartDate
    ? rowsDescending.filter((row) => parseChartAxisDate(row.snapshot_date).getTime() >= windowStartDate.getTime())
    : [];
  const previousRow = windowStartDate
    ? rowsDescending.find((row) => parseChartAxisDate(row.snapshot_date).getTime() < windowStartDate.getTime()) ?? null
    : null;

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
    neu: 0,
    aktiv: 0,
    fraglich: 0,
    kritisch: 0,
    geschuetzt: 0,
    unbekannt: 0,
  };

  rows.forEach((row) => {
    const status = getDiagramStatusKey(row);
    if (status in counts) {
      counts[status] += 1;
    } else {
      counts.unbekannt += 1;
    }
  });

  const chartStatuses = ['neu', 'aktiv', 'fraglich', 'kritisch', 'geschuetzt'];
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
          <p class="detail-chart-subtitle">Einfacher Überblick über Neu, Gut, Grenzwertig, Schlecht und Geschützt.</p>
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

  const growthWindowLabel = getGrowthWindowLabel(getPrimaryHistoryWindowDays(sourceRows));
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
    const diagramStatus = getDiagramStatusKey(row);
    const x = sourceRows.length === 1
      ? padding.left + plotWidth / 2
      : padding.left + pointSpacing * index;
    const y = scaleChartY(gain, domain, padding.top, plotHeight);

    return {
      row,
      diagramStatus,
      gain,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };
  });
  const thresholds = getDashboardThresholds(sourceRows);
  const thresholdLines = [
    {
      value: thresholds.criticalWinsGrowth,
      tone: 'warn',
    },
    {
      value: thresholds.targetWinsGrowth,
      tone: 'safe',
    },
  ]
    .filter((line) => Number.isFinite(line.value) && line.value >= domain.min && line.value <= domain.max)
    .map((line) => ({
      ...line,
      y: Number(scaleChartY(line.value, domain, padding.top, plotHeight).toFixed(2)),
    }));
  const averageGain = gains.reduce((sum, value) => sum + value, 0) / gains.length;

  overviewGainChart.innerHTML = `
    <article class="detail-chart-card overview-gain-card">
      <div class="detail-chart-header">
        <div>
          <h3 class="detail-chart-title">3v3-Gain (${escapeHtml(growthWindowLabel)})</h3>
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
                  <text class="overview-gain-threshold-label overview-gain-threshold-label-${escapeHtml(line.tone)}" x="${padding.left + plotWidth}" y="${line.y - CHART_INLINE_LABEL_OFFSET}" text-anchor="end">${escapeHtml(formatNumber(line.value))}</text>
                </g>
              `,
            )
            .join('')}
          ${points
            .map((point) => renderInteractiveChartPointMarkup({
              x: point.x,
              y: point.y,
              chartWidth: width,
              chartHeight: height,
              title: point.row.player_name ?? point.row.player_tag ?? 'Mitglied',
              delta: formatDelta(point.gain),
              value: `Status: ${getStatusMeta(point.diagramStatus).label}`,
              ariaLabel: `${point.row.player_name ?? point.row.player_tag ?? 'Mitglied'}: ${formatDelta(point.gain)} in ${growthWindowLabel}, Status ${getStatusMeta(point.diagramStatus).label}`,
              pointMarkup: buildChartPointShapeMarkup({
                shape: 'circle',
                x: point.x,
                y: point.y,
                radius: CHART_POINT_RADIUS,
                className: 'detail-chart-point overview-gain-point',
                fillStyle: `fill: ${getOverviewStatusColor(point.diagramStatus)}`,
              }),
            }))
            .join('')}
        </svg>
        <div class="detail-chart-tooltip" aria-live="polite" hidden></div>
      </div>
      <div class="detail-chart-footer overview-gain-footer" aria-hidden="true">
        <span>Höchster Gain</span>
        <span>${escapeHtml(`Ø ${formatNumber(Math.round(averageGain))} · ${formatNumber(sourceRows.length)} Mitglieder`)}</span>
        <span>Niedrigster Gain</span>
      </div>
    </article>
  `;

  setOverviewGainState('', false);
}

function renderOverviewClubGainChart(rows, historyRows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    overviewClubGainChart.innerHTML = '';
    setOverviewClubGainState('Noch keine Mitglieder für den Club-Verlauf vorhanden.', true);
    return;
  }

  const windowOptions = getOverviewClubGainWindowOptions(rows);
  if (!windowOptions.includes(selectedOverviewClubGainDays)) {
    selectedOverviewClubGainDays = windowOptions[0];
  }

  const series = buildOverviewClubGainSeries(historyRows, selectedOverviewClubGainDays);

  if (series.length === 0) {
    overviewClubGainChart.innerHTML = '';
    setOverviewClubGainState('Noch keine Tageshistorie für den Club-Verlauf vorhanden.', true);
    return;
  }

  const chart = buildLineChartModel(series, {
    includeZero: true,
    minValue: 0,
    maxValue: Math.max(...series.map((point) => point.value)),
    tickFormatter: formatNumber,
    xWindowDays: selectedOverviewClubGainDays,
    width: 420,
    height: 220,
    padding: {
      top: 14,
      right: 14,
      bottom: 28,
      left: 42,
    },
  });
  const averageValue = series.reduce((sum, point) => sum + point.value, 0) / series.length;
  const averageY = Number(scaleChartY(averageValue, chart.domain, 14, chart.plotHeight).toFixed(2));
  const rangeButtonsMarkup = windowOptions
    .map((days) => {
      const isActive = days === selectedOverviewClubGainDays;
      return `
        <button
          class="ghost-button detail-range-button ${isActive ? 'is-active' : ''}"
          type="button"
          data-overview-gain-days="${days}"
          aria-pressed="${String(isActive)}"
        >
          ${escapeHtml(getGrowthWindowLabel(days))}
        </button>
      `;
    })
    .join('');

  overviewClubGainChart.innerHTML = `
    <article class="detail-chart-card overview-club-gain-card">
      <div class="detail-chart-header">
        <div>
          <h3 class="detail-chart-title">Club-3v3-Gain pro Tag</h3>
          <p class="detail-chart-subtitle">Die Summe der 3v3-Gains aller Mitglieder pro Tag.</p>
        </div>
        <div class="detail-history-range overview-club-gain-range">
          ${rangeButtonsMarkup}
        </div>
      </div>
      <div class="detail-chart-stage">
        <svg class="detail-chart-svg overview-club-gain-svg" viewBox="0 0 ${chart.width} ${chart.height}" role="img" aria-label="3v3-Wins aller Mitglieder pro Tag">
          ${renderChartGrid(chart)}
          <g class="overview-club-gain-average-group">
            <line
              class="overview-club-gain-average-line"
              x1="${chart.plotStartX}"
              y1="${averageY}"
              x2="${chart.plotEndX}"
              y2="${averageY}"
            ></line>
            <text
              class="overview-club-gain-average-label"
              x="${chart.plotEndX}"
              y="${averageY - CHART_INLINE_LABEL_OFFSET}"
              text-anchor="end"
            >${escapeHtml(`Ø ${formatNumber(Math.round(averageValue))}`)}</text>
          </g>
          <path class="detail-chart-line detail-chart-line-brand" d="${escapeHtml(chart.path)}"></path>
          ${chart.points
            .map((point, index) => {
              const seriesPoint = series[index];
              const pointData = buildOverviewClubGainPointData(seriesPoint);
              return renderInteractiveChartPointMarkup({
                x: point.x,
                y: point.y,
                chartWidth: chart.width,
                chartHeight: chart.height,
                title: pointData.title,
                delta: pointData.delta,
                value: pointData.value,
                ariaLabel: pointData.ariaLabel,
                pointMarkup: buildChartPointShapeMarkup({
                  shape: 'circle',
                  x: point.x,
                  y: point.y,
                  radius: CHART_POINT_RADIUS,
                  className: 'detail-chart-point overview-club-gain-point',
                }),
              });
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

  setOverviewClubGainState('', false);
}

function buildOverviewClubGainSeries(historyRows, windowDays) {
  if (!Array.isArray(historyRows) || historyRows.length === 0) {
    return [];
  }

  const normalizedRows = historyRows
    .map((row) => {
      const playerId = row?.player_id;
      const value = numberOrNull(row?.team_wins);
      const date = row?.snapshot_date ? parseChartAxisDate(row.snapshot_date) : null;

      if (!playerId || value === null || !date) {
        return null;
      }

      return {
        playerId,
        date,
        dateKey: formatIsoDate(date),
        dateMs: date.getTime(),
        value,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const playerComparison = String(left.playerId).localeCompare(String(right.playerId), 'de', {
        numeric: true,
        sensitivity: 'base',
      });

      if (playerComparison !== 0) {
        return playerComparison;
      }

      return left.dateMs - right.dateMs;
    });

  if (normalizedRows.length === 0) {
    return [];
  }

  const latestDate = new Date(Math.max(...normalizedRows.map((row) => row.dateMs)));
  const startDate = addDaysUtc(latestDate, -(Math.max(1, windowDays) - 1));
  const visibleDates = [];

  for (let cursor = new Date(startDate.getTime()); cursor.getTime() <= latestDate.getTime(); cursor = addDaysUtc(cursor, 1)) {
    visibleDates.push(new Date(cursor.getTime()));
  }

  const totals = new Array(visibleDates.length).fill(0);
  const snapshotsByPlayer = new Map();
  const firstVisibleDateMs = visibleDates[0]?.getTime() ?? null;

  normalizedRows.forEach((row) => {
    const existingRows = snapshotsByPlayer.get(row.playerId) ?? [];
    existingRows.push(row);
    snapshotsByPlayer.set(row.playerId, existingRows);
  });

  snapshotsByPlayer.forEach((playerRows) => {
    let snapshotIndex = 0;
    let lastValue = null;
    let previousDayValue = null;

    if (firstVisibleDateMs !== null) {
      while (snapshotIndex < playerRows.length && playerRows[snapshotIndex].dateMs < firstVisibleDateMs) {
        lastValue = playerRows[snapshotIndex].value;
        snapshotIndex += 1;
      }
      previousDayValue = lastValue;
    }

    visibleDates.forEach((date, index) => {
      const dateMs = date.getTime();

      while (snapshotIndex < playerRows.length && playerRows[snapshotIndex].dateMs <= dateMs) {
        lastValue = playerRows[snapshotIndex].value;
        snapshotIndex += 1;
      }

      if (lastValue !== null && previousDayValue !== null) {
        totals[index] += Math.max(0, lastValue - previousDayValue);
      }

      previousDayValue = lastValue;
    });
  });

  return visibleDates.map((date, index) => ({
    date: formatIsoDate(date),
    xValue: formatIsoDate(date),
    value: totals[index],
    label: formatDateLabel(date),
  }));
}

function buildOverviewClubGainPointData(point) {
  if (!point) {
    return {
      title: '',
      delta: '',
      value: '',
      ariaLabel: '',
    };
  }

  const title = point.label ?? formatDateLabel(point.date);
  const delta = formatDelta(point.value);
  const value = '';

  return {
    title,
    delta,
    value,
    ariaLabel: `${title}: ${formatDelta(point.value)}`,
  };
}


function getOverviewStatusColor(status) {
  switch (status) {
    case 'neu':
      return 'var(--neutral)';
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

function renderInteractiveChartPointMarkup({
  x,
  y,
  chartWidth,
  chartHeight,
  title,
  delta,
  value,
  ariaLabel,
  pointMarkup,
}) {
  return `
    <g
      class="detail-chart-point-group"
      tabindex="0"
      role="button"
      data-chart-point="true"
      data-point-title="${escapeHtml(title)}"
      data-point-delta="${escapeHtml(delta ?? '')}"
      data-point-value="${escapeHtml(value ?? '')}"
      data-point-left="${((x / chartWidth) * 100).toFixed(3)}%"
      data-point-top="${((y / chartHeight) * 100).toFixed(3)}%"
      aria-label="${escapeHtml(ariaLabel)}"
      aria-pressed="false"
    >
      <circle class="detail-chart-point-hit" cx="${x}" cy="${y}" r="12"></circle>
      <circle class="detail-chart-point-halo" cx="${x}" cy="${y}" r="8"></circle>
      ${pointMarkup}
    </g>
  `;
}

function buildChartPointShapeMarkup({ shape = 'circle', x, y, radius, className, fillStyle = '' }) {
  const styleAttribute = fillStyle ? ` style="${escapeHtml(fillStyle)}"` : '';

  if (shape === 'diamond') {
    return `<polygon class="${escapeHtml(className)}" points="${buildDiamondPointList(x, y, radius)}"${styleAttribute}></polygon>`;
  }

  return `<circle class="${escapeHtml(className)}" cx="${x}" cy="${y}" r="${radius}"${styleAttribute}></circle>`;
}

function buildDiamondPointList(x, y, radius) {
  return [
    `${x},${Number(y - radius).toFixed(2)}`,
    `${Number(x + radius).toFixed(2)},${y}`,
    `${x},${Number(y + radius).toFixed(2)}`,
    `${Number(x - radius).toFixed(2)},${y}`,
  ].join(' ');
}









function renderDetailCharts(historyRows, previousRow = null) {
  const container = document.getElementById('detail-charts');

  if (!Array.isArray(historyRows) || historyRows.length === 0) {
    container.innerHTML = renderDetailChartPlaceholder('Noch keine Tagesstände für Verlaufscharts vorhanden.');
    return;
  }

  const rowsAscending = [...historyRows].sort(
    (left, right) => getHistoryPointTime(left) - getHistoryPointTime(right),
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
            return renderInteractiveChartPointMarkup({
              x: point.x,
              y: point.y,
              chartWidth: chart.width,
              chartHeight: chart.height,
              title: pointData.title,
              delta: pointData.delta,
              value: pointData.value,
              ariaLabel: pointData.ariaLabel,
              pointMarkup: buildChartPointShapeMarkup({
                shape: seriesPoint.isTrackingStart ? 'diamond' : 'circle',
                x: point.x,
                y: point.y,
                radius: CHART_POINT_RADIUS,
                className: `detail-chart-point ${seriesPoint.isTrackingStart ? 'detail-chart-point-start ' : ''}detail-chart-point-${escapeHtml(tone)}`,
              }),
            });
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
  const delta = point.delta === null
    ? 'Tracking-Start'
    : formatDelta(point.delta);

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

  const rows = historyRows.map((row) => ({
    ...row,
    chart_x_at: row.snapshot_at ?? row.snapshot_date,
  }));

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
    chart_x_at: `${trackingStartDate}T00:00:00.000Z`,
    trophies: startTrophies ?? rows[existingIndex]?.trophies ?? null,
    team_wins: startWins ?? rows[existingIndex]?.team_wins ?? null,
    is_tracking_start: true,
  };

  if (existingIndex >= 0) {
    const existingRow = rows[existingIndex];
    const startDiffersFromCurrent =
      (startWins !== null && numberOrNull(existingRow.team_wins) !== startWins)
      || (startTrophies !== null && numberOrNull(existingRow.trophies) !== startTrophies);

    if (startDiffersFromCurrent) {
      rows.push(trackingStartRow);
    } else {
      rows[existingIndex] = trackingStartRow;
    }
  } else {
    rows.push(trackingStartRow);
  }

  return rows.sort((left, right) => getHistoryPointTime(right) - getHistoryPointTime(left));
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
  const collapsedSeries = [];

  rowsAscending.forEach((row) => {
    const value = numberOrNull(row[key]);

    if (value === null) {
      return;
    }

    const nextPoint = {
      date: row.snapshot_date,
      xValue: row.snapshot_date,
      value,
      isTrackingStart: row.is_tracking_start === true,
      label: row.is_tracking_start
        ? `Start ${formatChartDateLabel(row.snapshot_date)}`
        : formatChartDateLabel(row.snapshot_date),
    };

    const previousPoint = collapsedSeries.at(-1);
    const isDuplicateSameDayValue = previousPoint
      && previousPoint.date === nextPoint.date
      && previousPoint.value === nextPoint.value;

    if (isDuplicateSameDayValue) {
      collapsedSeries[collapsedSeries.length - 1] = {
        ...previousPoint,
        isTrackingStart: previousPoint.isTrackingStart || nextPoint.isTrackingStart,
        label: previousPoint.isTrackingStart || nextPoint.isTrackingStart
          ? `Start ${formatChartDateLabel(previousPoint.date)}`
          : previousPoint.label,
      };
      return;
    }

    collapsedSeries.push(nextPoint);
  });

  let previousValue = numberOrNull(previousBaselineValue);

  return collapsedSeries.map((point) => {
    const delta = previousValue === null ? null : point.value - previousValue;
    previousValue = point.value;

    return {
      ...point,
      delta,
    };
  });
}

function buildLineChartModel(series, options = {}) {
  const width = Number.isFinite(options.width) ? Number(options.width) : 320;
  const height = Number.isFinite(options.height) ? Number(options.height) : 180;
  const xWindowDays = Math.max(1, Number(options.xWindowDays) || 7);
  const padding = {
    top: Number.isFinite(options.padding?.top) ? Number(options.padding.top) : 14,
    right: Number.isFinite(options.padding?.right) ? Number(options.padding.right) : 12,
    bottom: Number.isFinite(options.padding?.bottom) ? Number(options.padding.bottom) : 24,
    left: Number.isFinite(options.padding?.left) ? Number(options.padding.left) : 42,
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
  const xStartMs = xStartDate.getTime();
  const xEndMs = xEndDate.getTime();
  const xRangeMs = Math.max(1, xEndMs - xStartMs);
  const points = series.map((point) => {
    const pointDate = parseChartAxisDate(point.xValue ?? point.date);
    const xOffsetRatio = Math.min(
      1,
      Math.max(0, (pointDate.getTime() - xStartMs) / xRangeMs),
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

function parseChartPointTime(value) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  return new Date(value);
}

function getHistoryPointTime(row) {
  return parseChartPointTime(row?.chart_x_at ?? row?.snapshot_at ?? row?.snapshot_date).getTime();
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

function setOverviewClubGainState(message, visible) {
  overviewClubGainState.textContent = message;
  overviewClubGainState.classList.toggle('is-visible', visible);
}

function setDetailHistoryState(message, visible) {
  const element = document.getElementById('detail-history-state');
  element.textContent = message;
  element.classList.toggle('is-visible', visible);
}

function setDetailBattlesState(message, visible) {
  detailBattlesState.textContent = message;
  detailBattlesState.classList.toggle('is-visible', visible);
}

function capitalizeFirstLetter(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return '';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}


function matchesStatus(row) {
  const selectedStatus = statusFilter.value;

  if (selectedStatus === 'all') {
    return true;
  }

  if (selectedStatus === 'neu') {
    return hasNewStatusBadge(row);
  }

  return getEffectiveStatusKey(row) === selectedStatus;
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
      return numberOrNull(row.status_rank) ?? getStatusSortRank(getEffectiveStatusKey(row));
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
      return String(row.reason ?? '');
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
  return normalizeStringArray(row?.reason_keys);
}

function buildReasonChips(row) {
  return normalizeBadgeArray(row?.reason_badges);
}

function renderChipMarkup(chip) {
  return `<span class="chip chip-${escapeHtml(chip.tone)}">${escapeHtml(chip.text)}</span>`;
}

function getEffectiveStatusKey(row) {
  return typeof row?.status === 'string' ? row.status : 'unbekannt';
}

function hasNewStatusBadge(row) {
  return getDisplayStatusChips(row).some((chip) => {
    const normalizedKey = String(chip?.key ?? '').toLowerCase();
    const normalizedText = String(chip?.text ?? '').toLowerCase();
    return normalizedKey === 'neu' || normalizedText.startsWith('neu');
  });
}

function getDiagramStatusKey(row) {
  return hasNewStatusBadge(row) ? 'neu' : getEffectiveStatusKey(row);
}

function getDisplayStatusChips(row) {
  return normalizeBadgeArray(row?.status_badges);
}

function normalizeJsonValue(value) {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeStringArray(value) {
  const normalized = normalizeJsonValue(value);

  if (!Array.isArray(normalized)) {
    return [];
  }

  return normalized.filter((entry) => typeof entry === 'string');
}

function normalizeBadgeArray(value) {
  const normalized = normalizeJsonValue(value);

  if (!Array.isArray(normalized)) {
    return [];
  }

  return normalized.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const label = typeof entry.label === 'string' ? entry.label : null;
    const tone = typeof entry.tone === 'string' ? entry.tone : 'neutral';
    const key = typeof entry.key === 'string' ? entry.key : null;

    if (!label) {
      return [];
    }

    return [{
      key,
      text: key === 'leadership' ? formatRole(label) : label,
      tone,
    }];
  });
}

function getStatusMeta(status) {
  switch (status) {
    case 'neu':
      return { label: 'Neu', tone: 'neutral' };
    case 'kritisch':
      return { label: 'Schlecht', tone: 'danger' };
    case 'fraglich':
      return { label: 'Grenzwertig', tone: 'warn' };
    case 'geschuetzt':
      return { label: 'Geschützt', tone: 'protected' };
    case 'aktiv':
      return { label: 'Gut', tone: 'safe' };
    case 'unbekannt':
    default:
      return { label: '?', tone: 'neutral' };
  }
}

function formatRole(role) {
  const normalized = String(role ?? '')
    .replace(/[\s_-]+/g, '')
    .toLowerCase();

  switch (normalized) {
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

function formatLastProgressLabel(dateValue, timestampValue) {
  const elapsed = getElapsedTimeInfo(timestampValue);

  if (elapsed) {
    const diffMinutes = elapsed.diffMinutesFloor;

    if (diffMinutes < 1) {
      return 'gerade eben';
    }

    if (diffMinutes < 60) {
      return `vor ${formatCountLabel(diffMinutes, 'Minute', 'Minuten')}`;
    }

    if (elapsed.diffMs < 86_400_000) {
      const diffHours = elapsed.diffHoursFloor;
      return `vor ${formatCountLabel(diffHours, 'Stunde', 'Stunden')}`;
    }

    const diffDays = elapsed.diffDaysFloor;
    return diffDays === 1 ? 'gestern' : `vor ${formatNumber(diffDays)} Tagen`;
  }

  if (!dateValue) {
    return '-';
  }

  const targetDate = parseChartAxisDate(dateValue);
  const today = parseChartAxisDate(new Date());
  const diffDays = Math.max(0, Math.round((today.getTime() - targetDate.getTime()) / 86_400_000));

  if (diffDays === 0) {
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

function toDateOrNull(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatWithDateFormatter(formatter, value, fallback = '-') {
  const date = toDateOrNull(value);
  return date ? formatter.format(date) : fallback;
}

function getElapsedTimeInfo(value) {
  const date = toDateOrNull(value);

  if (!date) {
    return null;
  }

  const diffMs = Math.max(0, Date.now() - date.getTime());

  return {
    date,
    diffMs,
    diffMinutesFloor: Math.floor(diffMs / 60_000),
    diffMinutesRound: Math.round(diffMs / 60_000),
    diffHoursFloor: Math.floor(diffMs / 3_600_000),
    diffHoursRound: Math.round(diffMs / 3_600_000),
    diffDaysFloor: Math.floor(diffMs / 86_400_000),
    diffDaysRound: Math.round(diffMs / 86_400_000),
  };
}

function formatDateLabel(value) {
  return formatWithDateFormatter(DATE_FORMATTERS.dateLabel, value);
}

function formatChartDateLabel(value) {
  const formatted = formatWithDateFormatter(DATE_FORMATTERS.chartLabel, value);
  return formatted === '-' ? formatted : formatted.slice(0, -1);
}

function formatIsoDate(value) {
  return parseChartAxisDate(value).toISOString().slice(0, 10);
}

function formatRelativeTime(value) {
  const elapsed = getElapsedTimeInfo(value);

  if (!elapsed) {
    return '-';
  }

  const diffMinutes = elapsed.diffMinutesRound;

  if (diffMinutes < 1) {
    return 'gerade eben';
  }

  if (diffMinutes < 60) {
    return `vor ${diffMinutes} Min`;
  }

  const diffHours = elapsed.diffHoursRound;
  if (diffHours < 24) {
    return `vor ${diffHours} Std`;
  }

  const diffDays = elapsed.diffDaysRound;
  return `vor ${diffDays} Tagen`;
}

function formatDateTime(value) {
  return formatWithDateFormatter(DATE_FORMATTERS.dateTime, value);
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
