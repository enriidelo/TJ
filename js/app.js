/* ============================================
   Trading Journal Pro - Frontend App
   ============================================ */

const API_BASE = '';

const app = {
  config: null,
  charts: {},
  currentPage: 'dashboard',
  currentTab: 'strategies',
  trades: [],
  metrics: null,

  // ============================================
  // INIT
  // ============================================
  async init() {
    await this.loadConfig();
    this.applyTheme();
    this.setupNavigation();
    this.setupTabs();
    this.setupForm();
    this.setupThemeListeners();

    const today = new Date().toISOString().split('T')[0];
    document.querySelector('input[name="date"]').value = today;
    document.querySelector('input[name="time"]').value = new Date().toTimeString().slice(0, 5);
    document.getElementById('sidebar-from').value = this.getDateDaysAgo(30);
    document.getElementById('sidebar-to').value = today;

    const yearSelect = document.getElementById('month-year');
    for (let y = 2024; y <= 2028; y++) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if (y === new Date().getFullYear()) opt.selected = true;
      yearSelect.appendChild(opt);
    }
    document.getElementById('month-month').value = new Date().getMonth() + 1;

    await this.loadDashboard();
    this.setupSidebarFilters();
  },

  getDateDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  },

  // ============================================
  // CONFIG & THEME
  // ============================================
  async loadConfig() {
    try {
      const res = await fetch(`${API_BASE}/api/config`);
      this.config = await res.json();
      this.populateSelects();
    } catch (e) {
      console.error('Config load error:', e);
    }
  },

  populateSelects() {
    if (!this.config) return;
    const assets = this.config.custom_fields?.assets || [];
    const strategies = this.config.custom_fields?.strategies || [];
    const timeframes = this.config.custom_fields?.timeframes || [];

    this.fillSelect('form-asset', assets);
    this.fillSelect('form-strategy', strategies);
    this.fillSelect('form-timeframe', timeframes);
    this.fillSelect('sidebar-asset', ['Tutti', ...assets], true);
    this.fillSelect('sidebar-strategy', ['Tutte', ...strategies], true);
    this.fillSelect('hist-asset', ['Tutti', ...assets], true);
    this.fillSelect('hist-strategy', ['Tutte', ...strategies], true);

    document.getElementById('list-assets').value = assets.join('\n');
    document.getElementById('list-strategies').value = strategies.join('\n');
  },

  fillSelect(id, items, withEmpty = false) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '';
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item === 'Tutti' || item === 'Tutte' ? '' : item;
      opt.textContent = item;
      sel.appendChild(opt);
    });
  },

  applyTheme() {
    if (!this.config?.theme) return;
    const t = this.config.theme;
    const root = document.documentElement;
    root.style.setProperty('--primary', t.primary_color || '#8ab4f8');
    root.style.setProperty('--success', t.success_color || '#81c995');
    root.style.setProperty('--danger', t.danger_color || '#f28b82');
    root.style.setProperty('--warning', t.warning_color || '#fdd663');
    root.style.setProperty('--bg', t.bg_color || '#0e1117');
    root.style.setProperty('--card-bg', t.card_bg || '#1a1b1e');
    root.style.setProperty('--text', t.text_color || '#e8eaed');
    root.style.setProperty('--text-secondary', t.muted_color || '#9aa0a6');
    root.style.setProperty('--radius', (t.border_radius || 12) + 'px');

    document.getElementById('theme-primary').value = t.primary_color;
    document.getElementById('theme-success').value = t.success_color;
    document.getElementById('theme-danger').value = t.danger_color;
    document.getElementById('theme-warning').value = t.warning_color;
    document.getElementById('theme-bg').value = t.bg_color;
    document.getElementById('theme-card').value = t.card_bg;
    document.getElementById('theme-text').value = t.text_color;
    document.getElementById('theme-muted').value = t.muted_color;
    document.getElementById('theme-radius').value = t.border_radius || 12;
    document.getElementById('radius-value').textContent = (t.border_radius || 12) + 'px';
    document.getElementById('theme-compact').checked = t.compact_mode || false;
  },

  setupThemeListeners() {
    document.getElementById('theme-radius').addEventListener('input', (e) => {
      document.getElementById('radius-value').textContent = e.target.value + 'px';
    });
    document.getElementById('new-field-type').addEventListener('change', (e) => {
      document.getElementById('new-field-options-group').style.display = 
        e.target.value === 'select' ? 'block' : 'none';
    });
  },

  async saveTheme() {
    const theme = {
      primary_color: document.getElementById('theme-primary').value,
      success_color: document.getElementById('theme-success').value,
      danger_color: document.getElementById('theme-danger').value,
      warning_color: document.getElementById('theme-warning').value,
      bg_color: document.getElementById('theme-bg').value,
      card_bg: document.getElementById('theme-card').value,
      text_color: document.getElementById('theme-text').value,
      muted_color: document.getElementById('theme-muted').value,
      border_radius: parseInt(document.getElementById('theme-radius').value),
      compact_mode: document.getElementById('theme-compact').checked,
      font_family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    };

    this.config.theme = theme;
    await fetch(`${API_BASE}/api/config`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(this.config)
    });
    this.applyTheme();
    this.showToast('Tema salvato! Ricarica per applicare.', 'success');
  },

  async resetTheme() {
    if (!confirm('Ripristinare il tema di default?')) return;
    await fetch(`${API_BASE}/api/config`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        app_name: "Trading Journal Pro",
        version: "1.2.0",
        theme: {
          primary_color: "#8ab4f8", success_color: "#81c995",
          danger_color: "#f28b82", warning_color: "#fdd663",
          bg_color: "#0e1117", card_bg: "#1a1b1e",
          text_color: "#e8eaed", muted_color: "#9aa0a6",
          border_radius: 12, compact_mode: false,
          font_family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        },
        custom_fields: this.config.custom_fields,
        dashboard: this.config.dashboard,
        data_mode: "local"
      })
    });
    await this.loadConfig();
    this.applyTheme();
    this.showToast('Tema ripristinato!', 'success');
  },

  // ============================================
  // NAVIGATION
  // ============================================
  setupNavigation() {
    const navItems = document.querySelectorAll('[data-page]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });
  },

  navigateTo(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${page}`).classList.remove('hidden');
    document.querySelectorAll('[data-page]').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    window.scrollTo(0, 0);

    if (page === 'dashboard') this.loadDashboard();
    if (page === 'history') this.loadHistory();
    if (page === 'analysis') this.loadAnalysis();
    if (page === 'settings') this.loadSettings();
    if (page === 'new-trade') this.renderCustomFields();
  },

  setupTabs() {
    document.querySelectorAll('.tabs').forEach(tabContainer => {
      tabContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
          const tab = e.target.dataset.tab;
          const parent = tabContainer.closest('section');
          tabContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
          e.target.classList.add('active');
          parent.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
          const contentEl = parent.querySelector(`#tab-${tab}`);
          if (contentEl) contentEl.classList.remove('hidden');
          this.currentTab = tab;
          if (this.currentPage === 'analysis') {
            if (tab === 'strategies') this.renderStrategyChart();
            if (tab === 'hourly') this.renderAnalysisHourlyChart();
            if (tab === 'distribution') this.renderDistributionChart();
          }
        }
      });
    });
  },

  // ============================================
  // SIDEBAR FILTERS
  // ============================================
  setupSidebarFilters() {
    ['sidebar-asset', 'sidebar-strategy', 'sidebar-from', 'sidebar-to'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => this.loadDashboard());
    });
  },

  getFilterParams() {
    const params = new URLSearchParams();
    const asset = document.getElementById('sidebar-asset')?.value;
    const strategy = document.getElementById('sidebar-strategy')?.value;
    const from = document.getElementById('sidebar-from')?.value;
    const to = document.getElementById('sidebar-to')?.value;
    if (asset) params.append('asset', asset);
    if (strategy) params.append('strategy', strategy);
    if (from) params.append('date_from', from);
    if (to) params.append('date_to', to);
    return params.toString();
  },

  // ============================================
  // DASHBOARD
  // ============================================
  async loadDashboard() {
    try {
      const filterQs = this.getFilterParams();
      const [metricsRes, tradesRes, equityRes, strategyRes, hourlyRes] = await Promise.all([
        fetch(`${API_BASE}/api/metrics`),
        fetch(`${API_BASE}/api/trades?limit=5&${filterQs}`),
        fetch(`${API_BASE}/api/equity`),
        fetch(`${API_BASE}/api/strategies`),
        fetch(`${API_BASE}/api/hourly`)
      ]);

      this.metrics = await metricsRes.json();
      this.trades = await tradesRes.json();
      const equity = await equityRes.json();
      const strategies = await strategyRes.json();
      const hourly = await hourlyRes.json();

      if (this.metrics.total_trades === 0) {
        document.getElementById('dashboard-empty').classList.remove('hidden');
        document.getElementById('dashboard-content').classList.add('hidden');
        return;
      }

      document.getElementById('dashboard-empty').classList.add('hidden');
      document.getElementById('dashboard-content').classList.remove('hidden');

      this.renderMetrics(this.metrics);
      this.renderEquityChart(equity);
      this.renderHourlyChartBar(hourly);
      this.renderInsights(this.metrics, this.trades, strategies, hourly);
      this.renderRecentTrades(this.trades);
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  },

  renderMetrics(m) {
    const items = [
      { label: 'Win Rate', value: m.win_rate + '%', type: m.win_rate >= 50 ? 'positive' : 'negative' },
      { label: 'Profit Factor', value: m.profit_factor, type: m.profit_factor >= 1.5 ? 'positive' : 'neutral' },
      { label: 'P&L Totale', value: '€' + m.total_pnl.toLocaleString(), type: m.total_pnl >= 0 ? 'positive' : 'negative' },
      { label: 'Expectancy', value: '€' + m.expectancy, type: m.expectancy >= 0 ? 'positive' : 'negative' },
      { label: 'Max DD', value: '€' + m.max_drawdown.toLocaleString(), type: 'negative' },
      { label: 'Trade', value: m.total_trades, type: 'neutral' }
    ];

    document.getElementById('metrics-grid').innerHTML = items.map(item => `
      <div class="metric-card">
        <div class="metric-value ${item.type}">${item.value}</div>
        <div class="metric-label">${item.label}</div>
      </div>
    `).join('');
  },

  renderInsights(metrics, trades, strategies, hourly) {
    const insights = this.generateInsights(metrics, trades, strategies, hourly);
    const container = document.getElementById('insights-list');
    if (!insights.length) {
      container.innerHTML = '<p class="text-muted" style="font-size:13px;">Inserisci piu trade per generare insight.</p>';
      return;
    }
    container.innerHTML = insights.slice(0, 5).map(i => `
      <div class="insight-box insight-${i.type}">
        <div class="insight-title">${i.icon} ${i.title}</div>
        <div class="insight-text">${i.message}</div>
      </div>
    `).join('');
  },

  generateInsights(metrics, trades, strategies, hourly) {
    const insights = [];
    if (!trades.length) return insights;

    const winRate = metrics.win_rate;
    if (winRate >= 60) insights.push({type:'success', icon:'🏆', title:'Win Rate Eccellente', message:`Il tuo win rate del ${winRate}% e superiore alla media.`});
    else if (winRate < 40) insights.push({type:'warning', icon:'⚠️', title:'Win Rate Basso', message:`Win rate del ${winRate}%. Affina i criteri di entrata.`});

    const pf = metrics.profit_factor;
    if (pf >= 2) insights.push({type:'success', icon:'📊', title:'Profit Factor Ottimale', message:`PF di ${pf}: guadagni molto piu di quanto perdi.`});
    else if (pf < 1) insights.push({type:'danger', icon:'🛑', title:'Profit Factor Negativo', message:`PF di ${pf}: stai perdendo piu di quanto guadagni.`});

    const exp = metrics.expectancy;
    if (exp > 0) insights.push({type:'success', icon:'📈', title:'Expectancy Positiva', message:`Ogni trade ti aspetta +€${exp} in media.`});
    else insights.push({type:'danger', icon:'📉', title:'Expectancy Negativa', message:`Expectancy di €${exp}: sistema perdente nel lungo termine.`});

    if (strategies.length) {
      const best = strategies.reduce((a,b) => a.total_pnl > b.total_pnl ? a : b);
      const worst = strategies.reduce((a,b) => a.total_pnl < b.total_pnl ? a : b);
      if (best.total_pnl > 0) insights.push({type:'success', icon:'⭐', title:`Vincente: ${best.strategy}`, message:`+€${best.total_pnl} con WR ${best.win_rate}%.`});
      if (worst.total_pnl < 0) insights.push({type:'danger', icon:'❌', title:`Perdente: ${worst.strategy}`, message:`Persi €${Math.abs(worst.total_pnl)}. Valuta di eliminarla.`});
    }

    if (hourly.length) {
      const bestH = hourly.reduce((a,b) => a.total_pnl > b.total_pnl ? a : b);
      const worstH = hourly.reduce((a,b) => a.total_pnl < b.total_pnl ? a : b);
      if (bestH.total_pnl > 0) insights.push({type:'info', icon:'🕐', title:`Miglior Fascia: ${bestH.hour}`, message:`Hai guadagnato +€${bestH.total_pnl}.`});
      if (worstH.total_pnl < 0) insights.push({type:'warning', icon:'🕐', title:`Peggior Fascia: ${worstH.hour}`, message:`Persi €${Math.abs(worstH.total_pnl)}. Evita questa fascia.`});
    }

    const consec = metrics.consecutive_losses;
    if (consec >= 4) insights.push({type:'danger', icon:'🔺', title:'Serie Perdente Lunga', message:`Hai avuto ${consec} perdite di fila. Non aumentare il size.`});

    return insights;
  },

  renderRecentTrades(trades) {
    const container = document.getElementById('recent-trades');
    if (!trades.length) {
      container.innerHTML = '<p class="text-muted">Nessun trade recente.</p>';
      return;
    }
    container.innerHTML = trades.map(t => {
      const pnl = t.pnl || 0;
      const isPos = pnl > 0;
      return `
        <div class="trade-card-item">
          <div class="trade-card-header">
            <span class="trade-card-asset">${t.asset} • ${t.direction}</span>
            <span class="trade-card-pnl ${isPos ? 'positive' : 'negative'}">${isPos ? '+' : ''}€${pnl}</span>
          </div>
          <div class="trade-card-meta">
            <span>${t.date}</span>
            <span>${t.strategy}</span>
            <span>R${t.r_multiple || '-'}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  // ============================================
  // CHARTS
  // ============================================
  renderEquityChart(data) {
    const ctx = document.getElementById('equity-chart');
    if (!ctx) return;
    if (this.charts.equity) this.charts.equity.destroy();

    const labels = data.map(d => d.date.slice(5));
    const values = data.map(d => d.equity);

    this.charts.equity = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Equity',
          data: values,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--success').trim(),
          backgroundColor: 'rgba(129, 201, 149, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1b1e',
            titleColor: '#e8eaed',
            bodyColor: '#e8eaed',
            borderColor: '#3c4043',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(60, 64, 67, 0.3)' },
            ticks: { color: '#9aa0a6', font: { size: 10 }, maxTicksLimit: 8 }
          },
          y: {
            grid: { color: 'rgba(60, 64, 67, 0.3)' },
            ticks: { color: '#9aa0a6', font: { size: 10 } }
          }
        }
      }
    });
  },

  renderHourlyChartBar(data) {
    const ctx = document.getElementById('hourly-chart');
    if (!ctx || !data.length) return;
    if (this.charts.hourly) this.charts.hourly.destroy();

    const labels = data.map(d => d.hour);
    const values = data.map(d => d.total_pnl);
    const colors = values.map(v => v >= 0 ? 'rgba(129, 201, 149, 0.8)' : 'rgba(242, 139, 130, 0.8)');

    this.charts.hourly = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'P&L', data: values, backgroundColor: colors, borderRadius: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9aa0a6', font: { size: 10 } } },
          y: { grid: { color: 'rgba(60, 64, 67, 0.3)' }, ticks: { color: '#9aa0a6', font: { size: 10 } } }
        }
      }
    });
  },

  // ============================================
  // NEW TRADE
  // ============================================
  setupForm() {
    const form = document.getElementById('trade-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {};

      formData.forEach((value, key) => {
        if (value !== '' && value !== '0') {
          if (['entry_price', 'exit_price', 'stop_loss', 'take_profit', 'lot_size', 'commission'].includes(key)) {
            data[key] = parseFloat(value);
          } else {
            data[key] = value;
          }
        }
      });

      const customFields = this.config?.custom_fields?.trade || [];
      customFields.forEach(field => {
        if (field.enabled) {
          const el = form.querySelector(`[name="${field.id}"]`);
          if (el) data[field.id] = el.value;
        }
      });

      try {
        const res = await fetch(`${API_BASE}/api/trades`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          this.showToast('Trade salvato!', 'success');
          form.reset();
          document.querySelector('input[name="date"]').value = new Date().toISOString().split('T')[0];
          document.querySelector('input[name="time"]').value = new Date().toTimeString().slice(0, 5);
        }
      } catch (err) {
        this.showToast('Errore nel salvataggio', 'error');
      }
    });
  },

  renderCustomFields() {
    const container = document.getElementById('custom-fields-container');
    if (!container || !this.config?.custom_fields?.trade) return;

    const enabledFields = this.config.custom_fields.trade.filter(f => f.enabled);
    if (!enabledFields.length) { container.innerHTML = ''; return; }

    let html = '<h3 class="subsection-title mt-2">Campi Personalizzati</h3><div class="form-grid cols-2">';
    enabledFields.forEach(field => {
      html += '<div class="form-group">';
      html += `<label>${field.label}</label>`;
      if (field.type === 'slider') {
        html += `<input type="range" name="${field.id}" min="${field.min || 1}" max="${field.max || 10}" value="${field.default || 5}" oninput="this.nextElementSibling.textContent=this.value">`;
        html += `<span class="range-value">${field.default || 5}</span>`;
      } else if (field.type === 'select') {
        html += `<select name="${field.id}">`;
        (field.options || []).forEach(opt => {
          html += `<option value="${opt}" ${opt === field.default ? 'selected' : ''}>${opt}</option>`;
        });
        html += '</select>';
      } else if (field.type === 'number') {
        html += `<input type="number" name="${field.id}" min="${field.min || 0}" max="${field.max || 100}" value="${field.default || 0}">`;
      } else {
        html += `<input type="text" name="${field.id}" placeholder="${field.label}">`;
      }
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  },

  // ============================================
  // HISTORY
  // ============================================
  async loadHistory() {
    try {
      const params = new URLSearchParams();
      const asset = document.getElementById('hist-asset')?.value;
      const strategy = document.getElementById('hist-strategy')?.value;
      const from = document.getElementById('hist-from')?.value;
      const to = document.getElementById('hist-to')?.value;
      if (asset) params.append('asset', asset);
      if (strategy) params.append('strategy', strategy);
      if (from) params.append('date_from', from);
      if (to) params.append('date_to', to);

      const res = await fetch(`${API_BASE}/api/trades?${params}`);
      const trades = await res.json();
      this.renderHistoryTable(trades);
      this.renderHistoryCards(trades);
    } catch (e) {
      console.error(e);
    }
  },

  renderHistoryTable(trades) {
    const tbody = document.getElementById('history-tbody');
    const container = document.getElementById('history-table-container');
    if (!trades.length) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');
    tbody.innerHTML = trades.map(t => {
      const pnl = t.pnl || 0;
      const pnlClass = pnl > 0 ? 'text-success' : (pnl < 0 ? 'text-danger' : '');
      const pnlSign = pnl > 0 ? '+' : '';
      return `
        <tr>
          <td>${t.date}</td>
          <td>${t.asset}</td>
          <td><span class="badge badge-${t.direction.toLowerCase()}">${t.direction}</span></td>
          <td>${t.strategy}</td>
          <td class="${pnlClass}" style="font-weight:600">${pnlSign}€${pnl.toFixed(2)}</td>
          <td>${t.r_multiple || '-'}</td>
          <td><span class="badge badge-${(t.result || 'open').toLowerCase()}">${t.result || 'Open'}</span></td>
          <td><button class="btn btn-danger btn-sm" onclick="app.deleteTrade(${t.id})">🗑️</button></td>
        </tr>
      `;
    }).join('');
  },

  renderHistoryCards(trades) {
    const container = document.getElementById('history-cards');
    if (!trades.length) { container.innerHTML = '<p class="text-muted">Nessun trade trovato.</p>'; return; }
    container.innerHTML = trades.map(t => {
      const pnl = t.pnl || 0;
      const isPos = pnl > 0;
      return `
        <div class="trade-card-item">
          <div class="trade-card-header">
            <span class="trade-card-asset">${t.asset} • <span class="badge badge-${t.direction.toLowerCase()}">${t.direction}</span></span>
            <span class="trade-card-pnl ${isPos ? 'positive' : 'negative'}">${isPos ? '+' : ''}€${pnl.toFixed(2)}</span>
          </div>
          <div class="trade-card-meta">
            <span>${t.date} ${t.time}</span>
            <span>${t.strategy}</span>
            <span>R${t.r_multiple || '-'}</span>
            <span class="badge badge-${(t.result || 'open').toLowerCase()}">${t.result || 'Open'}</span>
          </div>
          <div style="margin-top:8px">
            <button class="btn btn-danger btn-sm" onclick="app.deleteTrade(${t.id})">🗑️ Elimina</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async deleteTrade(id) {
    if (!confirm('Eliminare questo trade?')) return;
    try {
      await fetch(`${API_BASE}/api/trades/${id}`, { method: 'DELETE' });
      this.showToast('Trade eliminato', 'success');
      this.loadHistory();
      this.loadDashboard();
    } catch (e) {
      this.showToast('Errore eliminazione', 'error');
    }
  },

  // ============================================
  // ANALYSIS
  // ============================================
  async loadAnalysis() {
    if (this.currentTab === 'strategies') this.renderStrategyChart();
    if (this.currentTab === 'hourly') this.renderAnalysisHourlyChart();
    if (this.currentTab === 'distribution') this.renderDistributionChart();
  },

  async renderStrategyChart() {
    try {
      const res = await fetch(`${API_BASE}/api/strategies`);
      const data = await res.json();
      const ctx = document.getElementById('strategy-chart');
      if (!ctx) return;
      if (this.charts.strategy) this.charts.strategy.destroy();

      const labels = data.map(d => d.strategy);
      const pnls = data.map(d => d.total_pnl);
      const colors = pnls.map(v => v >= 0 ? 'rgba(129, 201, 149, 0.8)' : 'rgba(242, 139, 130, 0.8)');

      this.charts.strategy = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'P&L (€)', data: pnls, backgroundColor: colors, borderRadius: 6 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#9aa0a6', font: { size: 11 } } },
            y: { grid: { color: 'rgba(60, 64, 67, 0.3)' }, ticks: { color: '#9aa0a6', font: { size: 10 } } }
          }
        }
      });

      document.getElementById('strategy-table').innerHTML = `
        <div class="table-container mt-2">
          <table>
            <thead><tr><th>Strategia</th><th>Trade</th><th>WR%</th><th>P&L</th><th>R</th></tr></thead>
            <tbody>
              ${data.map(d => `
                <tr>
                  <td>${d.strategy}</td>
                  <td>${d.total_trades}</td>
                  <td>${d.win_rate}%</td>
                  <td class="${d.total_pnl >= 0 ? 'text-success' : 'text-danger'}" style="font-weight:600">${d.total_pnl >= 0 ? '+' : ''}€${d.total_pnl}</td>
                  <td>${d.avg_r}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) { console.error(e); }
  },

  async renderAnalysisHourlyChart() {
    try {
      const res = await fetch(`${API_BASE}/api/hourly`);
      const data = await res.json();
      const ctx = document.getElementById('analysis-hourly-chart');
      if (!ctx) return;
      if (this.charts.analysisHourly) this.charts.analysisHourly.destroy();

      const labels = data.map(d => d.hour);
      const values = data.map(d => d.total_pnl);
      const colors = values.map(v => v >= 0 ? 'rgba(129, 201, 149, 0.8)' : 'rgba(242, 139, 130, 0.8)');

      this.charts.analysisHourly = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'P&L', data: values, backgroundColor: colors, borderRadius: 4 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#9aa0a6', font: { size: 10 } } },
            y: { grid: { color: 'rgba(60, 64, 67, 0.3)' }, ticks: { color: '#9aa0a6', font: { size: 10 } } }
          }
        }
      });

      document.getElementById('hourly-table').innerHTML = `
        <div class="table-container mt-2">
          <table>
            <thead><tr><th>Ora</th><th>Trade</th><th>P&L Totale</th><th>P&L Medio</th></tr></thead>
            <tbody>
              ${data.map(d => `
                <tr>
                  <td>${d.hour}</td>
                  <td>${d.trades}</td>
                  <td class="${d.total_pnl >= 0 ? 'text-success' : 'text-danger'}" style="font-weight:600">${d.total_pnl >= 0 ? '+' : ''}€${d.total_pnl}</td>
                  <td>€${d.avg_pnl}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) { console.error(e); }
  },

  async renderDistributionChart() {
    try {
      const res = await fetch(`${API_BASE}/api/trades`);
      const trades = await res.json();
      const pnls = trades.filter(t => t.status === 'Closed').map(t => t.pnl || 0);
      const ctx = document.getElementById('distribution-chart');
      if (!ctx || !pnls.length) return;
      if (this.charts.distribution) this.charts.distribution.destroy();

      const min = Math.min(...pnls);
      const max = Math.max(...pnls);
      const bins = 15;
      const step = (max - min) / bins || 1;
      const counts = new Array(bins).fill(0);
      const labels = [];
      for (let i = 0; i < bins; i++) {
        const binMin = min + i * step;
        labels.push(`€${binMin.toFixed(0)}`);
        counts[i] = pnls.filter(p => p >= binMin && p < binMin + step).length;
      }

      this.charts.distribution = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Frequenza', data: counts, backgroundColor: 'rgba(138, 180, 248, 0.7)', borderRadius: 4 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#9aa0a6', font: { size: 9 }, maxRotation: 45 } },
            y: { grid: { color: 'rgba(60, 64, 67, 0.3)' }, ticks: { color: '#9aa0a6', font: { size: 10 } } }
          }
        }
      });

      const avg = pnls.reduce((a,b) => a+b, 0) / pnls.length;
      const sorted = [...pnls].sort((a,b) => a-b);
      const median = sorted[Math.floor(sorted.length/2)];

      document.getElementById('dist-stats').innerHTML = `
        <div class="metric-card"><div class="metric-value neutral">€${avg.toFixed(2)}</div><div class="metric-label">Media P&L</div></div>
        <div class="metric-card"><div class="metric-value neutral">€${median.toFixed(2)}</div><div class="metric-label">Mediana P&L</div></div>
      `;
    } catch (e) { console.error(e); }
  },

  async loadMonthlyReport() {
    const year = document.getElementById('month-year').value;
    const month = document.getElementById('month-month').value;
    try {
      const res = await fetch(`${API_BASE}/api/trades`);
      const trades = await res.json();
      const monthTrades = trades.filter(t => t.date.startsWith(`${year}-${month.padStart(2,'0')}`));
      const closed = monthTrades.filter(t => t.status === 'Closed');

      if (!closed.length) {
        document.getElementById('monthly-report').innerHTML = '<p class="text-muted">Nessun trade per questo mese.</p>';
        return;
      }

      const wins = closed.filter(t => t.result === 'Win');
      const totalPnl = closed.reduce((a,t) => a + (t.pnl || 0), 0);
      const best = closed.reduce((a,t) => (t.pnl || 0) > (a.pnl || 0) ? t : a);
      const worst = closed.reduce((a,t) => (t.pnl || 0) < (a.pnl || 0) ? t : a);

      document.getElementById('monthly-report').innerHTML = `
        <div class="metrics-grid" style="margin-bottom:16px">
          <div class="metric-card"><div class="metric-value neutral">${closed.length}</div><div class="metric-label">Trade</div></div>
          <div class="metric-card"><div class="metric-value ${wins.length/closed.length >= 0.5 ? 'positive' : 'negative'}">${(wins.length/closed.length*100).toFixed(1)}%</div><div class="metric-label">Win Rate</div></div>
          <div class="metric-card"><div class="metric-value ${totalPnl >= 0 ? 'positive' : 'negative'}">€${totalPnl.toFixed(2)}</div><div class="metric-label">P&L</div></div>
          <div class="metric-card"><div class="metric-value neutral">€${(totalPnl/closed.length).toFixed(2)}</div><div class="metric-label">Media/Trade</div></div>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:140px;background:rgba(129,201,149,0.08);border:1px solid rgba(129,201,149,0.2);border-radius:10px;padding:14px">
            <div style="font-size:11px;color:#9aa0a6;text-transform:uppercase">🏆 Miglior Trade</div>
            <div style="font-size:16px;font-weight:700;color:#81c995;margin-top:4px">${best.asset}</div>
            <div style="font-size:13px;color:#81c995">+€${(best.pnl || 0).toFixed(2)}</div>
          </div>
          <div style="flex:1;min-width:140px;background:rgba(242,139,130,0.08);border:1px solid rgba(242,139,130,0.2);border-radius:10px;padding:14px">
            <div style="font-size:11px;color:#9aa0a6;text-transform:uppercase">💀 Peggior Trade</div>
            <div style="font-size:16px;font-weight:700;color:#f28b82;margin-top:4px">${worst.asset}</div>
            <div style="font-size:13px;color:#f28b82">€${(worst.pnl || 0).toFixed(2)}</div>
          </div>
        </div>
      `;
    } catch (e) { console.error(e); }
  },

  // ============================================
  // SETTINGS
  // ============================================
  loadSettings() {
    this.renderFieldsList();
  },

  renderFieldsList() {
    const container = document.getElementById('fields-list');
    if (!this.config?.custom_fields?.trade) return;
    container.innerHTML = this.config.custom_fields.trade.map(field => `
      <div class="toggle-row">
        <div>
          <div style="font-weight:600;font-size:14px">${field.label}</div>
          <div style="font-size:12px;color:#9aa0a6">${field.id} • ${field.type}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <label class="toggle-switch">
            <input type="checkbox" ${field.enabled ? 'checked' : ''} onchange="app.toggleField('${field.id}', this.checked)">
            <span class="toggle-slider"></span>
          </label>
          <button class="btn btn-danger btn-sm" onclick="app.removeField('${field.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  async toggleField(fieldId, enabled) {
    await fetch(`${API_BASE}/api/config/fields/${fieldId}/toggle`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({enabled})
    });
    await this.loadConfig();
    this.showToast(enabled ? 'Campo attivato' : 'Campo disattivato', 'success');
  },

  async removeField(fieldId) {
    if (!confirm('Eliminare questo campo?')) return;
    await fetch(`${API_BASE}/api/config/fields/${fieldId}`, { method: 'DELETE' });
    await this.loadConfig();
    this.renderFieldsList();
    this.showToast('Campo eliminato', 'success');
  },

  async addCustomField() {
    const id = document.getElementById('new-field-id').value.trim();
    const label = document.getElementById('new-field-label').value.trim();
    const type = document.getElementById('new-field-type').value;
    const optionsStr = document.getElementById('new-field-options').value.trim();

    if (!id || !label) { this.showToast('Compila ID ed etichetta', 'error'); return; }

    const fieldDef = {id, label, type, enabled: true};
    if (type === 'select' && optionsStr) fieldDef.options = optionsStr.split(',').map(s => s.trim());
    if (type === 'slider') { fieldDef.min = 1; fieldDef.max = 10; fieldDef.default = 5; }

    const res = await fetch(`${API_BASE}/api/config/fields`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(fieldDef)
    });
    const result = await res.json();

    if (result.success) {
      await this.loadConfig();
      this.renderFieldsList();
      document.getElementById('new-field-id').value = '';
      document.getElementById('new-field-label').value = '';
      this.showToast('Campo aggiunto!', 'success');
    } else {
      this.showToast('ID gia esistente', 'error');
    }
  },

  async saveList(type) {
    const textarea = document.getElementById(`list-${type}`);
    const items = textarea.value.split('\n').map(s => s.trim()).filter(s => s);
    this.config.custom_fields[type] = items;
    await fetch(`${API_BASE}/api/config`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(this.config)
    });
    await this.loadConfig();
    this.populateSelects();
    this.showToast(`${type} aggiornati!`, 'success');
  },

  async confirmDeleteAll() {
    this.showModal('Elimina tutti i trade', 'Sei sicuro di voler eliminare TUTTI i trade? Questa azione non puo essere annullata.', async () => {
      const trades = await fetch(`${API_BASE}/api/trades`).then(r => r.json());
      for (const t of trades) {
        await fetch(`${API_BASE}/api/trades/${t.id}`, {method: 'DELETE'});
      }
      this.closeModal();
      this.showToast('Database svuotato', 'success');
      this.loadDashboard();
    });
  },

  // ============================================
  // UTILITIES
  // ============================================
  async exportCSV() {
    window.open(`${API_BASE}/api/export`, '_blank');
  },

  async loadDemo() {
    try {
      const res = await fetch(`${API_BASE}/api/demo`, {method: 'POST'});
      const result = await res.json();
      this.showToast(`${result.count} trade demo caricati!`, 'success');
      this.loadDashboard();
    } catch (e) {
      this.showToast('Errore caricamento demo', 'error');
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  showModal(title, text, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    document.getElementById('modal').classList.add('active');
    document.getElementById('modal-confirm').onclick = () => { if (onConfirm) onConfirm(); };
  },

  closeModal() {
    document.getElementById('modal').classList.remove('active');
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());

  // ============================================
  // SETTINGS
  // ============================================
  loadSettings() {
    this.renderFieldsList();
    const config = db.getConfig();
    document.getElementById('list-assets').value = config.custom_fields.assets.join('\n');
    document.getElementById('list-strategies').value = config.custom_fields.strategies.join('\n');
  },

  renderFieldsList() {
    const container = document.getElementById('fields-list');
    if (!this.config || !this.config.custom_fields || !this.config.custom_fields.trade) return;
    container.innerHTML = this.config.custom_fields.trade.map(field => `
      <div class="toggle-row">
        <div>
          <div style="font-weight:600;font-size:14px">${field.label}</div>
          <div style="font-size:12px;color:#9aa0a6">${field.id} • ${field.type}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <label class="toggle-switch">
            <input type="checkbox" ${field.enabled ? 'checked' : ''} onchange="app.toggleField('${field.id}', this.checked)">
            <span class="toggle-slider"></span>
          </label>
          <button class="btn btn-danger btn-sm" onclick="app.removeField('${field.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  async toggleField(fieldId, enabled) {
    for (const field of this.config.custom_fields.trade) {
      if (field.id === fieldId) {
        field.enabled = enabled;
        break;
      }
    }
    db.saveConfig(this.config);
    this.showToast(enabled ? 'Campo attivato' : 'Campo disattivato', 'success');
  },

  async removeField(fieldId) {
    if (!confirm('Eliminare questo campo?')) return;
    this.config.custom_fields.trade = this.config.custom_fields.trade.filter(f => f.id !== fieldId);
    db.saveConfig(this.config);
    this.renderFieldsList();
    this.showToast('Campo eliminato', 'success');
  },

  async addCustomField() {
    const id = document.getElementById('new-field-id').value.trim();
    const label = document.getElementById('new-field-label').value.trim();
    const type = document.getElementById('new-field-type').value;
    const optionsStr = document.getElementById('new-field-options').value.trim();

    if (!id || !label) { this.showToast('Compila ID ed etichetta', 'error'); return; }
    if (this.config.custom_fields.trade.some(f => f.id === id)) {
      this.showToast('ID già esistente', 'error'); return;
    }

    const fieldDef = {id, label, type, enabled: true};
    if (type === 'select' && optionsStr) fieldDef.options = optionsStr.split(',').map(s => s.trim());
    if (type === 'slider') { fieldDef.min = 1; fieldDef.max = 10; fieldDef.default = 5; }

    this.config.custom_fields.trade.push(fieldDef);
    db.saveConfig(this.config);
    this.renderFieldsList();
    document.getElementById('new-field-id').value = '';
    document.getElementById('new-field-label').value = '';
    this.showToast('Campo aggiunto!', 'success');
  },

  async saveList(type) {
    const textarea = document.getElementById('list-' + type);
    const items = textarea.value.split('\n').map(s => s.trim()).filter(s => s);
    this.config.custom_fields[type] = items;
    db.saveConfig(this.config);
    this.populateSelects();
    this.showToast(type + ' aggiornati!', 'success');
  },

  quickAddToList(type) {
    const input = document.getElementById('quick-add-' + type);
    const value = input.value.trim();
    if (!value) return;
    if (!this.config.custom_fields[type].includes(value)) {
      this.config.custom_fields[type].push(value);
      db.saveConfig(this.config);
      this.populateSelects();
      document.getElementById('list-' + type).value = this.config.custom_fields[type].join('\n');
      input.value = '';
      this.showToast(value + ' aggiunto!', 'success');
    } else {
      this.showToast('Elemento già presente', 'warning');
    }
  },

  async confirmDeleteAll() {
    this.showModal('Elimina tutti i trade', 'Sei sicuro di voler eliminare TUTTI i trade? Questa azione non può essere annullata.', async () => {
      db.deleteAllTrades();
      this.closeModal();
      this.showToast('Database svuotato', 'success');
      this.loadDashboard();
    });
  },

  // ============================================
  // UTILITIES
  // ============================================
  exportCSV() {
    const csv = db.exportCSV();
    if (!csv) {
      this.showToast('Nessun dato da esportare', 'error');
      return;
    }
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trades_export_' + new Date().toISOString().slice(0,10) + '_' + String(new Date().getHours()).padStart(2,'0') + String(new Date().getMinutes()).padStart(2,'0') + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('CSV esportato!', 'success');
  },

  async loadDemo() {
    try {
      const count = db.loadDemo();
      this.showToast(count + ' trade demo caricati!', 'success');
      this.loadDashboard();
    } catch (e) {
      this.showToast('Errore caricamento demo', 'error');
    }
  },

  showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  showModal(title, text, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    document.getElementById('modal').classList.add('active');
    document.getElementById('modal-confirm').onclick = () => { if (onConfirm) onConfirm(); };
  },

  closeModal() {
    document.getElementById('modal').classList.remove('active');
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
