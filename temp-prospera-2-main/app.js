// ============================================================
// Prospera – app.js  (Page Renderers + Routing + UI Logic)
// ============================================================

// ── Authentication System ─────────────────────────────────
const Auth = {
  SAMPLE_USER: {
    name: 'Alex Morgan',
    email: 'alex.morgan@prospera.io',
    password: 'prospera2026',
    role: 'Senior Business Analyst',
    avatar: 'AM'
  },

  getUser() {
    const saved = localStorage.getItem('prospera_user');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch(e) { return null; }
  },

  init() {
    const user = this.getUser();
    const loginScreen = document.getElementById('login-screen');
    const quickFillBtn = document.getElementById('quick-fill-btn');
    
    if (quickFillBtn) {
      quickFillBtn.addEventListener('click', () => this.quickFill());
    }

    if (user) {
      if (loginScreen) loginScreen.classList.add('hidden');
      this.updateUserUI(user);
    } else {
      if (loginScreen) loginScreen.classList.remove('hidden');
    }
  },

  quickFill() {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    if (emailInput) emailInput.value = this.SAMPLE_USER.email;
    if (passwordInput) passwordInput.value = this.SAMPLE_USER.password;
    
    if (emailInput && passwordInput) {
      emailInput.classList.add('ring-2', 'ring-indigo-500');
      passwordInput.classList.add('ring-2', 'ring-indigo-500');
      setTimeout(() => {
        emailInput.classList.remove('ring-2', 'ring-indigo-500');
        passwordInput.classList.remove('ring-2', 'ring-indigo-500');
      }, 1000);
    }
    Toast.show('Sample credentials loaded! Click Sign In to continue.', 'info');
  },

  togglePasswordVisibility() {
    const input = document.getElementById('login-password');
    const icon = document.getElementById('toggle-password-icon');
    if (!input || !icon) return;
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility_off';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility';
    }
  },

  forgotPassword() {
    Toast.show('Password reset instructions sent to your email!', 'info');
  },

  handleLogin() {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorBox = document.getElementById('login-error');
    const errorMsg = document.getElementById('login-error-msg');
    const btnText = document.getElementById('login-btn-text');
    const btnSpinner = document.getElementById('login-btn-spinner');

    if (!emailInput || !passwordInput) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      if (errorBox && errorMsg) {
        errorMsg.textContent = 'Please enter both email and password.';
        errorBox.classList.remove('hidden');
      }
      return;
    }

    if (errorBox) errorBox.classList.add('hidden');

    if (btnText && btnSpinner) {
      btnText.classList.add('hidden');
      btnSpinner.classList.remove('hidden');
    }

    setTimeout(() => {
      let loggedUser = this.SAMPLE_USER;
      if (email.toLowerCase() !== this.SAMPLE_USER.email.toLowerCase()) {
        const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const initials = formattedName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'US';
        loggedUser = {
          name: formattedName,
          email: email,
          password: password,
          role: 'Business User',
          avatar: initials
        };
      }

      localStorage.setItem('prospera_user', JSON.stringify(loggedUser));
      this.updateUserUI(loggedUser);

      const loginScreen = document.getElementById('login-screen');
      if (loginScreen) {
        loginScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => loginScreen.classList.add('hidden'), 500);
      }

      if (btnText && btnSpinner) {
        btnText.classList.remove('hidden');
        btnSpinner.classList.add('hidden');
      }

      Toast.show(`Welcome back, ${loggedUser.name}! 👋`, 'success');
    }, 600);
  },

  updateUserUI(user) {
    if (!user) return;
    const nameEls = document.querySelectorAll('#user-display-name, #dropdown-user-name');
    const emailEls = document.querySelectorAll('#user-display-email, #dropdown-user-email');
    const avatarEls = document.querySelectorAll('#user-avatar-badge, #header-avatar');

    nameEls.forEach(el => el.textContent = user.name);
    emailEls.forEach(el => el.textContent = user.email);
    avatarEls.forEach(el => el.textContent = user.avatar);
  },

  logout() {
    localStorage.removeItem('prospera_user');
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    }
    closeDropdowns();
    closeMobileMenu();
    Toast.show('Logged out successfully.', 'info');
  }
};

// ── Dataset Manager UI Controller ─────────────────────────
const DatasetManager = {
  openModal() {
    const modal = document.getElementById('dataset-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    this.updateModalInfo();

    const dropZone = document.getElementById('dataset-drop-zone');
    if (dropZone && !dropZone.dataset.bound) {
      dropZone.dataset.bound = 'true';
      dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('border-indigo-500', 'bg-indigo-50/70'); });
      dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/70'); });
      dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/70');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.processFile(e.dataTransfer.files[0]);
        }
      });
    }
  },

  closeModal() {
    const modal = document.getElementById('dataset-modal');
    if (modal) modal.classList.add('hidden');
  },

  updateModalInfo() {
    const nameEl = document.getElementById('active-dataset-name');
    const r2El = document.getElementById('active-dataset-r2');
    if (nameEl) nameEl.textContent = DatasetEngine.title;
    if (r2El) r2El.textContent = `${DatasetEngine.metrics.accuracy} (R² = ${DatasetEngine.metrics.r2})`;
  },

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) this.processFile(file);
  },

  processFile(file) {
    Toast.show(`Parsing ${file.name} & training ML model…`, 'info');
    const fileName = file.name.replace(/\.[^/.]+$/, "");

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const json = JSON.parse(e.target.result);
          const rows = Array.isArray(json) ? json : (json.data || json.sales || [json]);
          this.finishDatasetImport(rows, fileName);
        } catch(err) {
          Toast.show('Invalid JSON dataset format.', 'error');
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      if (typeof Papa !== 'undefined') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: results => {
            if (results.data && results.data.length > 0) {
              this.finishDatasetImport(results.data, fileName);
            } else {
              Toast.show('No transaction records found in CSV file.', 'error');
            }
          },
          error: err => Toast.show('CSV Parse Error: ' + err.message, 'error')
        });
      } else {
        Toast.show('CSV parser loading, try again in a moment.', 'warning');
      }
    } else {
      Toast.show('Please upload a .csv or .json file.', 'error');
    }
  },

  finishDatasetImport(rows, name) {
    const success = DatasetEngine.loadDataset(rows, name);
    if (success) {
      this.updateModalInfo();
      this.closeModal();
      navigate(location.pathname || '/', false);
      Toast.show(`Successfully trained ML model on ${rows.length} real sales records! 🚀`, 'success');
    } else {
      Toast.show('Failed to process dataset rows.', 'error');
    }
  },

  loadEnterpriseSample() {
    Toast.show('Generating & training on 1,000 enterprise sales records…', 'info');
    setTimeout(() => {
      DatasetEngine.generateEnterpriseSample(1000);
      this.updateModalInfo();
      this.closeModal();
      navigate(location.pathname || '/', false);
      Toast.show('Model trained on 1,000 enterprise transaction records!', 'success');
    }, 400);
  },

  resetToDefault() {
    DatasetEngine.resetToDefault();
    this.updateModalInfo();
    this.closeModal();
    navigate(location.pathname || '/', false);
    Toast.show('Reset to default dataset.', 'info');
  }
};

// ── Toast notification system ─────────────────────────────
const Toast = {
  show(message, type = 'success') {
    const colors = { success:'bg-surface border-l-4 border-success text-success', error:'bg-surface border-l-4 border-error text-error', info:'bg-surface border-l-4 border-primary text-primary', warning:'bg-surface border-l-4 border-warning text-warning' };
    const icons  = { success:'check_circle', error:'error', info:'info', warning:'warning' };
    const el = document.createElement('div');
    el.className = `fixed bottom-24 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 translate-y-4 opacity-0 ${colors[type]||colors.info}`;
    el.innerHTML = `<span class="material-symbols-outlined text-[20px]">${icons[type]||'info'}</span><span class="font-medium" style="font-size:14px">${message}</span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.remove('translate-y-4','opacity-0'));
    setTimeout(() => { el.classList.add('translate-y-4','opacity-0'); setTimeout(()=>el.remove(),300); }, 3200);
  }
};

// ── Markdown Parser for AI Chat ─────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  let html = text;
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-surface-container-high p-3 rounded-lg text-xs overflow-x-auto my-2 font-mono"><code>$1</code></pre>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="font-bold text-base mt-3 mb-1 text-primary">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h4 class="font-bold text-sm mt-2 mb-1 text-on-surface">$1</h4>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/^\s*[\-\•]\s+(.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/(<li.*?>.*?<\/li>\n?)+/g, '<ul class="my-1 space-y-0.5 font-normal">$&</ul>');
  html = html.replace(/\n(?!(?:<\/ul>|<ul|<li|<pre|<h3|<h4))/g, '<br/>');
  return html;
}

// ── Built-in Intelligent Business Data Engine ──────────────
const DataAI = {
  analyze(query) {
    const q = query.toLowerCase().trim();
    const AE = AnalyticsEngine;

    // 1. Specific Customer Search (e.g. CUST012 or customer Alex)
    const custMatch = q.match(/cust\d{3}/i) || q.match(/(alex|sarah|james|maria|david|emma|ryan|olivia|liam|sophia)/i);
    if (custMatch) {
      const term = custMatch[0].toLowerCase();
      const found = AE.topCustomers.find(c => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term))
                 || AE.customerList.find(c => c.id.toLowerCase() === term);
      if (found) {
        const cLtv = found.ltv || ('₹' + found.totalSpent.toLocaleString());
        return `### 👤 Customer Profile: ${found.name || found.id}
- **Customer ID:** ${found.id || 'N/A'}
- **Gender & Age:** ${found.gender}, ${found.age} years old
- **Total Spent (LTV):** **${cLtv}**
- **Transactions:** ${found.transactions || 1} orders placed
- **Cohort Segment:** **${found.cohort || 'Loyalist'}**
- **Current Status:** ${found.status || 'Active'}`;
      }
    }

    // 2. Category Deep-Dive
    if (q.includes('beauty') || q.includes('clothing') || q.includes('electronics')) {
      let targetCat = 'Beauty';
      if (q.includes('clothing')) targetCat = 'Clothing';
      if (q.includes('electronics')) targetCat = 'Electronics';
      const data = AE.categories[targetCat];
      if (!data) {
        return `### 📦 Category Deep-Dive: ${targetCat}\n- No **${targetCat}** sales exist in the active dataset.\n- **Available categories:** ${AE.catNames.join(', ')}`;
      }
      const prods = AE.products.filter(p => p.cat === targetCat);
      return `### 📦 Category Deep-Dive: ${targetCat}
- **Total Revenue:** **₹${data.revenue.toLocaleString()}**
- **Total Units Sold:** **${data.qty} units**
- **Total Orders:** **${data.count} transactions**
- **Product Tiers in ${targetCat}:**
${prods.map(p => `  • **${p.name} (₹${p.price}/unit):** ${p.qtySold} sold | Revenue: ₹${p.revenue.toLocaleString()} | Stock: ${p.stock} units (${p.status})`).join('\n')}`;
    }

    // 3. Category Comparison / Best Category
    if (q.includes('category') || q.includes('categories')) {
      const sortedCats = Object.entries(AE.categories).sort((a,b) => b[1].revenue - a[1].revenue);
      return `### 📦 Product Categories Performance
- **Top Category:** **${sortedCats[0][0]}** generating **₹${sortedCats[0][1].revenue.toLocaleString()}** (${sortedCats[0][1].qty} units sold across ${sortedCats[0][1].count} orders).
- **Full Category Breakdown:**
${sortedCats.map(([cat, d]) => `  • **${cat}:** ₹${d.revenue.toLocaleString()} | ${d.qty} units sold | ${d.count} orders`).join('\n')}`;
    }

    // 4. Total Revenue / Sales / Orders / Revenue metrics
    if (q.includes('revenue') || q.includes('sales') || q.includes('income') || q.includes('earnings') || q.includes('how much')) {
      const highestMonthIdx = AE.monthlyRev.indexOf(Math.max(...AE.monthlyRev));
      const lowestMonthIdx = AE.monthlyRev.indexOf(Math.min(...AE.monthlyRev));
      return `### 💰 Revenue & Sales Intelligence
- **Total Revenue:** **₹${AE.totalRevenue.toLocaleString()}**
- **Total Transactions:** **${AE.totalTransactions}** orders
- **Total Quantity Sold:** **${AE.totalQty}** items
- **Average Order Value (AOV):** **₹${AE.avgOrderValue.toFixed(2)}**
- **Peak Sales Month:** **${AE.MONTHS[highestMonthIdx]}** (₹${AE.monthlyRev[highestMonthIdx].toLocaleString()})
- **Lowest Sales Month:** **${AE.MONTHS[lowestMonthIdx]}** (₹${AE.monthlyRev[lowestMonthIdx].toLocaleString()})
- **Growth Velocity (H1 vs H2):** **${AE.growthPct >= 0 ? '+' : ''}${AE.growthPct.toFixed(1)}%** growth trend`;
    }

    // 5. Stock / Inventory / Restock Alerts
    if (q.includes('stock') || q.includes('inventory') || q.includes('critical') || q.includes('alert') || q.includes('deplet') || q.includes('restock')) {
      const criticals = AE.products.filter(p => p.status === 'Critical');
      const lowStock = AE.products.filter(p => p.status === 'Low Stock');
      return `### ⚠️ Inventory & Stock Status
- **Critical Restock Warnings (${criticals.length}):**
${criticals.map(p => `  • **${p.name}:** Only ${p.stock} units left! (Last sale: ${p.depletion})`).join('\n')}
- **Low Stock Items (${lowStock.length}):**
${lowStock.map(p => `  • **${p.name}:** ${p.stock} units remaining.`).join('\n')}
- **Action Required:** Immediate procurement required for critical SKUs to avoid stockouts.`;
    }

    // 6. Customers & Demographics
    if (q.includes('customer') || q.includes('client') || q.includes('user') || q.includes('demographic') || q.includes('gender') || q.includes('age') || q.includes('cohort')) {
      const topCust = AE.topCustomers[0];
      return `### 👥 Customer Insights & Demographics
- **Total Unique Customers:** **${AE.totalCustomers}**
- **Top Customer:** **${topCust.name}** (LTV: **${topCust.ltv}**)
- **Gender Breakdown:**
${Object.entries(AE.genderStats).map(([g, s]) => `  • **${g}:** ${s.count} purchases (₹${s.revenue.toLocaleString()})`).join('\n')}
- **Customer Segmentation Cohorts:**
  • **Champions (≥₹1,500):** ${AE.cohorts.Champions.length} customers
  • **Big Spenders (₹900–₹1,500):** ${AE.cohorts['Big Spenders'].length} customers
  • **Loyalists (₹200–₹900):** ${AE.cohorts.Loyalists.length} customers
  • **At Risk (<₹200):** ${AE.cohorts['At Risk'].length} customers`;
    }

    // 7. Forecast & Future Growth
    if (q.includes('forecast') || q.includes('predict') || q.includes('future') || q.includes('next month') || q.includes('h1 2024') || q.includes('projection')) {
      return `### 📈 Predictive Sales Forecast
- **Projected H1 Next Year Revenue:** **₹${AE.projectedH1Next.toLocaleString()}**
- **Forecast Model Confidence:** **${AE.modelResult.accuracy}**
- **Monthly Revenue Projections (Next 6 Months):**
${AE.forecastMonths.map((val, i) => `  • **Month ${i+1}:** ₹${val.toLocaleString()}`).join('\n')}
- **Growth Driver:** High repeat sales velocity in Electronics and Beauty categories.`;
    }

    // 8. Strategy / Optimization / Drop / Advice
    if (q.includes('why') || q.includes('strategy') || q.includes('optimize') || q.includes('grow') || q.includes('recommend') || q.includes('advice') || q.includes('drop')) {
      return `### 💡 Strategic Growth Recommendations
1. **Focus on Champions:** Your ${AE.cohorts.Champions.length} Champions generate 3.2× more revenue per order. Launch early-access offers for top-tier items (₹500 tier).
2. **Prevent Inventory Bottlenecks:** Restock **${AE.products.filter(p=>p.status==='Critical')[0]?.name || 'Critical Items'}** immediately to capture unfulfilled demand.
3. **Cross-Sell Campaign:** Target male customers (avg age 37) who buy Electronics with complementary Beauty/Grooming bundles to increase AOV past **₹${(AE.avgOrderValue * 1.25).toFixed(0)}**.`;
    }

    // 9. Greetings
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('who are you') || q.includes('help')) {
      return `Hello! 👋 I am your Prospera AI Business Copilot.

I can analyze your ${AE.totalTransactions} sales transactions, customer cohorts, category statistics, and forecast models.

**Try asking me:**
- *"What is our total revenue?"*
- *"Which items are critical in stock?"*
- *"Show me Electronics category sales"*
- *"Who is our top spending customer?"*
- *"What is the forecast for next month?"*`;
    }

    // Default Fallback: Comprehensive analytical summary
    const bestCat = Object.entries(AE.categories).sort((a,b)=>b[1].revenue-a[1].revenue)[0];
    return `### 📊 Real-Time Business Analysis

Here is a summary of your sales dataset based on your prompt:

- **Total Revenue:** **₹${AE.totalRevenue.toLocaleString()}** across **${AE.totalTransactions} transactions**
- **Average Order Value:** **₹${AE.avgOrderValue.toFixed(0)}**
- **Top Product Category:** **${bestCat[0]}** (₹${bestCat[1].revenue.toLocaleString()})
- **Customer Base:** **${AE.totalCustomers} unique customers** (${AE.cohorts.Champions.length} Champions)
- **Stock Alert:** **${AE.products.filter(p=>p.status==='Critical').length} critical inventory items** require restocking.
- **Forecast H1:** **₹${AE.projectedH1Next.toLocaleString()}** projected revenue.

*Tip: Click the 🔑 key icon above to add a Google Gemini or OpenAI API Key for open generative conversations!*`;
  }
};

// ── AI Copilot ────────────────────────────────────────────
const AICopilot = {
  provider: localStorage.getItem('prospera_ai_provider') || 'local',
  apiKey: localStorage.getItem('prospera_ai_key') || '',

  updateBadge() {
    const badge = document.getElementById('ai-engine-badge');
    if (!badge) return;
    if (this.provider === 'gemini' && this.apiKey) {
      badge.textContent = 'Gemini AI';
      badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success';
    } else if (this.provider === 'openai' && this.apiKey) {
      badge.textContent = 'ChatGPT AI';
      badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success';
    } else {
      badge.textContent = 'Data Engine';
      badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary';
    }
  },

  async queryAI(userMsg) {
    // 1. Google Gemini API
    if (this.provider === 'gemini' && this.apiKey) {
      try {
        const AE = AnalyticsEngine;
        const systemContext = `You are Prospera AI, a senior business intelligence expert. You have real-time access to the company's dataset:
Total Revenue: ₹${AE.totalRevenue.toLocaleString()}, Total Transactions: ${AE.totalTransactions}, Avg Order Value: ₹${AE.avgOrderValue.toFixed(2)}, Categories: ${JSON.stringify(AE.categories)}, Top Customers: ${JSON.stringify(AE.topCustomers.slice(0,5))}, Critical Inventory: ${JSON.stringify(AE.products.filter(p=>p.status==='Critical'))}.
Answer concisely, accurately, and professionally in markdown with Indian Rupees (₹).`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemContext}\n\nUser Question: ${userMsg}` }] }]
          })
        });
        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (err) {
        console.warn('Gemini API Error, falling back to local engine:', err);
      }
    }

    // 2. OpenAI ChatGPT API
    if (this.provider === 'openai' && this.apiKey) {
      try {
        const AE = AnalyticsEngine;
        const systemContext = `You are Prospera AI, a senior business intelligence expert. You have real-time access to the company's dataset:
Total Revenue: ₹${AE.totalRevenue.toLocaleString()}, Total Transactions: ${AE.totalTransactions}, Avg Order Value: ₹${AE.avgOrderValue.toFixed(2)}, Categories: ${JSON.stringify(AE.categories)}, Top Customers: ${JSON.stringify(AE.topCustomers.slice(0,5))}, Critical Inventory: ${JSON.stringify(AE.products.filter(p=>p.status==='Critical'))}.
Answer concisely, accurately, and professionally in markdown with Indian Rupees (₹).`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemContext },
              { role: 'user', content: userMsg }
            ]
          })
        });
        const data = await res.json();
        if (data.choices && data.choices[0]?.message?.content) {
          return data.choices[0].message.content;
        }
      } catch (err) {
        console.warn('OpenAI API Error, falling back to local engine:', err);
      }
    }

    // 3. Fallback: Prospera Local Business Data Engine
    return DataAI.analyze(userMsg);
  },

  init() {
    const container = document.getElementById('ai-chat-container');
    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send');
    if (!container || !input || !sendBtn) return;

    this.updateBadge();

    // Provider modal logic
    const configBtn = document.getElementById('ai-config-btn');
    const keyModal = document.getElementById('ai-key-modal');
    const closeModalBtn = document.getElementById('close-key-modal');
    const providerSelect = document.getElementById('ai-provider-select');
    const keyInputGroup = document.getElementById('api-key-input-group');
    const apiKeyInput = document.getElementById('ai-api-key');
    const saveKeyBtn = document.getElementById('save-ai-key');

    if (configBtn && keyModal) {
      configBtn.addEventListener('click', () => {
        keyModal.classList.toggle('hidden');
        if (providerSelect) providerSelect.value = AICopilot.provider;
        if (apiKeyInput) apiKeyInput.value = AICopilot.apiKey;
        if (keyInputGroup) keyInputGroup.classList.toggle('hidden', AICopilot.provider === 'local');
      });
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => keyModal.classList.add('hidden'));
    if (providerSelect) {
      providerSelect.addEventListener('change', () => {
        if (keyInputGroup) keyInputGroup.classList.toggle('hidden', providerSelect.value === 'local');
      });
    }
    if (saveKeyBtn) {
      saveKeyBtn.addEventListener('click', () => {
        AICopilot.provider = providerSelect.value;
        AICopilot.apiKey = apiKeyInput.value.trim();
        localStorage.setItem('prospera_ai_provider', AICopilot.provider);
        localStorage.setItem('prospera_ai_key', AICopilot.apiKey);
        AICopilot.updateBadge();
        keyModal.classList.add('hidden');
        Toast.show(`AI Engine updated to ${AICopilot.provider.toUpperCase()}!`, 'success');
      });
    }

    const addMessage = (text, isUser) => {
      const div = document.createElement('div');
      div.className = `flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1 animate-fade-in`;
      const bubble = document.createElement('div');
      bubble.className = isUser
        ? 'bg-surface-container text-on-surface px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm'
        : 'bg-primary/5 border border-primary/20 text-on-surface px-4 py-3 rounded-2xl rounded-tl-sm max-w-[95%] shadow-sm';
      bubble.style.fontSize = '14px';
      bubble.style.lineHeight = '1.5';
      bubble.innerHTML = isUser ? text.replace(/\n/g, '<br/>') : renderMarkdown(text);
      div.appendChild(bubble);
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    };

    const send = async () => {
      const msg = input.value.trim();
      if (!msg) return;
      addMessage(msg, true);
      input.value = '';
      input.style.height = '40px';

      const loader = document.createElement('div');
      loader.className = 'flex items-center gap-2 p-3 bg-surface-container-low rounded-2xl rounded-tl-sm w-fit';
      loader.innerHTML = `<div style="width:8px;height:8px;border-radius:50%;background:#4f46e5;animation:bounce .6s infinite 0ms"></div><div style="width:8px;height:8px;border-radius:50%;background:#4f46e5;animation:bounce .6s infinite 150ms"></div><div style="width:8px;height:8px;border-radius:50%;background:#4f46e5;animation:bounce .6s infinite 300ms"></div>`;
      container.appendChild(loader);
      container.scrollTop = container.scrollHeight;

      const aiResponse = await AICopilot.queryAI(msg);
      loader.remove();
      addMessage(aiResponse, false);
    };

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 128) + 'px'; });

    document.addEventListener('click', e => {
      const chip = e.target.closest('.ai-suggestion');
      if (chip) { input.value = chip.textContent.trim(); send(); }
    });
  }
};

// ── Routing ───────────────────────────────────────────────

function navigate(route, pushState = true) {
  if (pushState) history.pushState({}, '', route);
  closeDropdowns(); closeMobileMenu();
  destroyAllCharts(); // destroy ALL chart instances before re-rendering
  const renderers = {
    '/': renderDashboard, '/analytics': renderAnalytics, '/forecasts': renderForecasts,
    '/inventory': renderInventory, '/strategy': renderStrategy, '/reports': renderReports, '/settings': renderSettings
  };
  (renderers[route] || renderDashboard)();
  updateNavState(route);
  window.scrollTo({ top: 0, left: 0 });
}

function updateNavState(route) {
  const pageMap = { '/':'dashboard','/analytics':'analytics','/forecasts':'forecasts','/inventory':'inventory','/strategy':'strategy','/reports':'reports','/settings':'settings' };
  const active = pageMap[route] || 'dashboard';
  document.querySelectorAll('.nav-link, .mobile-bottom-link').forEach(el => {
    const isActive = el.dataset.page === active;
    el.classList.toggle('bg-surface-container', isActive);
    el.classList.toggle('text-primary', isActive);
    el.classList.toggle('font-bold', isActive);
    el.classList.toggle('text-on-surface-variant', !isActive);
  });
}

document.addEventListener('click', e => {
  const link = e.target.closest('[data-route]');
  if (link && link.dataset.route !== undefined) { e.preventDefault(); navigate(link.dataset.route); }
});
window.addEventListener('popstate', () => navigate(location.pathname, false));

// ── Helpers ───────────────────────────────────────────────
function statusDot(s){ return {Critical:'bg-error','Low Stock':'bg-warning',Healthy:'bg-success'}[s]||'bg-outline'; }
function statusTextClass(s){ return {Critical:'text-error','Low Stock':'text-warning',Healthy:'text-success'}[s]||'text-outline'; }
// Destroy every registered Chart.js instance (handles multi-chart pages correctly)
function destroyAllCharts() {
  // Chart.instances is a flat object keyed by internal id in Chart.js v3+
  if (typeof Chart !== 'undefined' && Chart.instances) {
    Object.values(Chart.instances).forEach(c => { try { c.destroy(); } catch(e) {} });
  }
}
// Legacy single-chart alias kept for any internal calls
function destroyChart() { destroyAllCharts(); }

// Safe chart factory: always destroys any existing chart on the canvas first
function safeChart(canvasId, config) {
  const el = document.getElementById(canvasId);
  if (!el) return null;
  // Destroy stale Chart.js instance bound to this canvas, if any
  const existing = typeof Chart !== 'undefined' && Chart.getChart ? Chart.getChart(el) : null;
  if (existing) { try { existing.destroy(); } catch(e) {} }
  return new Chart(el, config);
}
const defaultChartOptions = (yLabel = 'Value') => ({
  responsive:true, maintainAspectRatio:false,
  plugins:{ legend:{ display:false }, tooltip:{ backgroundColor:'#191c1d', titleFont:{family:"'Inter',sans-serif",size:12}, bodyFont:{family:"'Inter',sans-serif",size:14}, padding:12, cornerRadius:8 } },
  scales:{ y:{ grid:{color:'#f3f4f5'}, ticks:{font:{family:"'Inter',sans-serif",size:11},color:'#777587'}, border:{display:false} }, x:{ grid:{display:false}, ticks:{font:{family:"'Inter',sans-serif",size:11},color:'#777587'}, border:{display:false} } },
  interaction:{intersect:false,mode:'index'}
});

// ── Page: Dashboard ───────────────────────────────────────
function renderDashboard() {
  const { kpis, activity } = ProspecraData;
  const kpiList = [kpis.revenue, kpis.users, kpis.conversion, kpis.health];
  const kpiCards = kpiList.map(k => `
    <div class="bg-surface rounded-xl p-5 shadow-sm border border-surface-container-lowest flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer group" onclick="handleKPIClick('${k.label}')">
      <div class="flex justify-between items-start mb-4">
        <span style="font-size:11px;letter-spacing:.05em;font-weight:700" class="text-outline uppercase tracking-wider">${k.label}</span>
        <div class="p-2 rounded-lg bg-surface-container-low text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors"><span class="material-symbols-outlined text-[20px]">${k.icon}</span></div>
      </div>
      <div>
        <div style="font-size:24px;font-weight:600;line-height:32px" class="text-on-surface">${k.value}</div>
        <div class="flex items-center gap-2 mt-2">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full ${k.up?'bg-success/10 text-success':'bg-error/10 text-error'}" style="font-size:12px;font-weight:500">
            <span class="material-symbols-outlined" style="font-size:14px">${k.up?'trending_up':'trending_down'}</span>${k.trend}
          </span>
          <span style="font-size:14px" class="text-outline">vs last month</span>
        </div>
      </div>
    </div>`).join('');

  const actItems = activity.map(a => `
    <div class="flex gap-3 items-start hover:bg-surface-container-low p-2 rounded-lg transition-colors cursor-pointer" onclick="Toast.show('${a.title}','info')">
      <div class="w-8 h-8 rounded-full bg-${a.color}/10 flex items-center justify-center text-${a.color} shrink-0 mt-0.5"><span class="material-symbols-outlined text-[16px]">${a.icon}</span></div>
      <div class="flex-1"><p class="text-body-sm text-on-surface font-medium">${a.title}</p><p class="text-body-sm text-on-surface-variant" style="font-size:13px">${a.sub}</p><p style="font-size:11px" class="text-outline mt-0.5">${a.time}</p></div>
    </div>`).join('');

  document.getElementById('page-container').innerHTML = `
  <div class="page-content space-y-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 style="font-size:36px;font-weight:700;line-height:44px;letter-spacing:-.02em" class="text-on-surface hidden md:block">Overview</h2>
        <h2 style="font-size:30px;font-weight:700;line-height:38px;letter-spacing:-.02em" class="text-on-surface md:hidden">Overview</h2>
        <p style="font-size:16px" class="text-outline mt-1">Real-time performance metrics for today.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="px-4 py-2 rounded-lg border border-surface-container-high text-on-surface bg-surface hover:bg-surface-container-low transition-colors flex items-center gap-2" style="font-size:12px;font-weight:500" onclick="showDatePicker()"><span class="material-symbols-outlined text-[18px]">calendar_today</span>Today</button>
        <button class="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors shadow-sm" style="font-size:12px;font-weight:500" onclick="exportReport()">Export Report</button>
      </div>
    </div>
    <!-- AI Banner -->
    <div class="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer hover:border-primary/40 transition-colors" onclick="openAICopilot()">
      <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0"><span class="material-symbols-outlined">tips_and_updates</span></div>
      <div class="flex-1"><h3 style="font-size:18px;font-weight:600" class="text-on-surface">Predictive Insight</h3><p style="font-size:14px" class="text-on-surface-variant mt-0.5">${ProspecraData.inventory.filter(i=>i.status==='Critical').length} items restock recommended based on current velocity. Click to ask AI for details.</p></div>
      <button class="shrink-0 px-4 py-2 rounded-lg bg-surface text-primary border border-primary/20 hover:bg-primary/5 transition-colors whitespace-nowrap" style="font-size:12px;font-weight:500">Review Actions</button>
    </div>
    <!-- KPI Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">${kpiCards}</div>
    <!-- Bento -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-surface rounded-xl p-6 shadow-sm border border-surface-container-lowest" style="min-height:380px">
        <div class="flex justify-between items-center mb-6">
          <div><h3 style="font-size:18px;font-weight:600" class="text-on-surface">Sales Trend</h3><p style="font-size:14px" class="text-outline mt-0.5">Monthly performance view</p></div>
          <div class="flex gap-2">
            <button class="px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors" style="font-size:12px;font-weight:500" onclick="changePeriod(this,'weekly')">W</button>
            <button class="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container" style="font-size:12px;font-weight:500" onclick="changePeriod(this,'monthly')">M</button>
            <button class="px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors" style="font-size:12px;font-weight:500" onclick="changePeriod(this,'quarterly')">Q</button>
          </div>
        </div>
        <div style="position:relative;height:260px"><canvas id="sales-chart"></canvas></div>
      </div>
      <div class="bg-surface rounded-xl p-6 shadow-sm border border-surface-container-lowest flex flex-col" style="min-height:380px">
        <div class="flex justify-between items-center mb-6">
          <h3 style="font-size:18px;font-weight:600" class="text-on-surface">Recent Activity</h3>
          <button class="text-primary hover:underline" style="font-size:14px;font-weight:500" onclick="navigate('/reports')">View All</button>
        </div>
        <div class="flex-1 overflow-y-auto space-y-2">${actItems}</div>
      </div>
    </div>
    <!-- Quick actions -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      ${[
        {icon:'warning',bg:'error',label:ProspecraData.inventory.filter(i=>i.status==='Critical').length+' Critical Alerts',sub:'View Inventory',route:'/inventory'},
        {icon:'trending_up',bg:AnalyticsEngine.growthPct>=0?'success':'error',label:'Revenue '+(AnalyticsEngine.growthPct>=0?'+':'')+AnalyticsEngine.growthPct.toFixed(1)+'%',sub:'View Analytics',route:'/analytics'},
        {icon:'query_stats',bg:'primary',label:'Demand Forecast',sub:'View Forecasts',route:'/forecasts'},
        {icon:'description',bg:'warning',label:ProspecraData.reports.length+' Reports Ready',sub:'View Reports',route:'/reports'}
      ].map(a=>`
      <button class="bg-surface rounded-xl p-4 shadow-sm border border-surface-container-lowest hover:shadow-md hover:border-primary/20 transition-all flex flex-col items-start gap-3 group" onclick="navigate('${a.route}')">
        <div class="w-10 h-10 rounded-lg bg-${a.bg}/10 flex items-center justify-center text-${a.bg} group-hover:scale-110 transition-transform"><span class="material-symbols-outlined">${a.icon}</span></div>
        <div><p class="text-on-surface font-semibold" style="font-size:12px">${a.label}</p><p class="text-outline" style="font-size:14px">${a.sub}</p></div>
      </button>`).join('')}
    </div>
  </div>`;

  requestAnimationFrame(() => {
    safeChart('sales-chart', {
      type: 'line',
      data: { labels: ProspecraData.chartData.monthLabels, datasets:[{ label:'Revenue', data: ProspecraData.chartData.monthlyRevenue, borderColor:'#4f46e5', backgroundColor:'rgba(79,70,229,0.08)', borderWidth:2.5, tension:0.4, fill:true, pointBackgroundColor:'#4f46e5', pointBorderColor:'#fff', pointRadius:4, pointHoverRadius:6 }] },
      options: { ...defaultChartOptions(), plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#191c1d', padding:12, cornerRadius:8, callbacks:{ label:c=>'₹'+c.parsed.y.toLocaleString() } } }, scales:{ y:{ beginAtZero:false, grid:{color:'#f3f4f5'}, ticks:{ callback:v=>'₹'+v.toLocaleString(), font:{family:"'Inter',sans-serif",size:11}, color:'#777587' }, border:{display:false} }, x:{ grid:{display:false}, ticks:{font:{family:"'Inter',sans-serif",size:11},color:'#777587'}, border:{display:false} } } }
    });
  });
}

// ── Page: Analytics ───────────────────────────────────────
function renderAnalytics() {
  const AE = AnalyticsEngine;
  const palette = ['bg-primary','bg-tertiary','bg-outline-variant','bg-success','bg-warning','bg-error'];
  const totalRev = AE.totalRevenue || 1;
  const chartPalette = ['#4f46e5','#14b8a6','#f59e0b','#10b981','#ef4444','#8b5cf6'];

  // Build category table rows
  const catTableRows = AE.catNames.map((cat, i) => {
    const c = AE.categories[cat];
    const share = Math.round((c.revenue / totalRev) * 100);
    const avgOrd = c.count > 0 ? Math.round(c.revenue / c.count) : 0;
    const sc = share >= 35 ? 'bg-success/10 text-success' : share >= 20 ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary';
    const sl = share >= 35 ? 'Top Performer' : share >= 20 ? 'On Track' : 'Growing';
    const dot = palette[i % palette.length];
    return `<tr class="hover:bg-surface-container-lowest/50 transition-colors region-row" data-region="${cat.toLowerCase()}">` +
      `<td class="py-4 px-6 font-medium"><div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full ${dot}"></div>${cat}</div></td>` +
      `<td class="py-4 px-6">${AE.fmt(c.revenue)}</td>` +
      `<td class="py-4 px-6">${c.count}</td>` +
      `<td class="py-4 px-6">&#8377;${avgOrd.toLocaleString()}</td>` +
      `<td class="py-4 px-6"><div class="flex items-center gap-2"><div class="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden"><div class="bg-primary h-full rounded-full" style="width:${Math.min(100,share)}%"></div></div><span class="text-on-surface-variant" style="font-size:12px;font-weight:500">${share}%</span></div></td>` +
      `<td class="py-4 px-6"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full ${sc}" style="font-size:12px;font-weight:500">${sl}</span></td>` +
      '</tr>';
  }).join('');

  // Build KPI cards HTML
  const kpis = [
    {label:'Total Revenue', val:AE.fmt(AE.totalRevenue), trend:(AE.growthPct>=0?'+':'')+AE.growthPct.toFixed(1)+'%', up:AE.growthPct>=0, icon:'payments'},
    {label:'Avg Order Value', val:'&#8377;'+Math.round(AE.avgOrderValue).toLocaleString(), trend:AE.totalTransactions+' orders', up:true, icon:'request_quote'},
    {label:'Unique Customers', val:AE.totalCustomers.toLocaleString(), trend:AE.totalQty+' units', up:true, icon:'group'}
  ];
  const kpiCards = kpis.map(k =>
    `<div class="bg-surface rounded-xl p-6 shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">` +
    `<div class="flex justify-between items-start mb-4"><h3 style="font-size:11px;font-weight:700;letter-spacing:.05em" class="text-outline uppercase tracking-wider">${k.label}</h3><div class="w-8 h-8 rounded-full bg-${k.up?'primary':'error'}/10 flex items-center justify-center text-${k.up?'primary':'error'}"><span class="material-symbols-outlined text-[18px]">${k.icon}</span></div></div>` +
    `<div style="font-size:30px;font-weight:700;line-height:38px" class="text-on-surface mb-1">${k.val}</div>` +
    `<div class="flex items-center gap-2"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${k.up?'bg-success/10 text-success':'bg-error/10 text-error'}" style="font-size:12px;font-weight:500"><span class="material-symbols-outlined text-[14px]">${k.up?'trending_up':'trending_down'}</span>${k.trend}</span><span style="font-size:14px" class="text-outline">from dataset</span></div>` +
    '</div>'
  ).join('');

  const theadCols = ['Category','Revenue','Transactions','Avg Order','Share','Status']
    .map(h => `<th class="py-4 px-6 text-outline uppercase tracking-wider font-semibold" style="font-size:11px;letter-spacing:.05em;font-weight:700">${h}</th>`).join('');

  document.getElementById('page-container').innerHTML =
    '<div class="page-content space-y-8">' +
    '<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">' +
    '<div><div class="flex items-center gap-2 text-outline mb-1"><span style="font-size:12px;font-weight:500">Analytics</span><span class="material-symbols-outlined text-[14px]">chevron_right</span><span style="font-size:12px;font-weight:500" class="text-primary">Revenue Reports</span></div>' +
    '<h2 style="font-size:36px;font-weight:700;line-height:44px;letter-spacing:-.02em" class="text-on-surface">Revenue Performance</h2>' +
    `<p style="font-size:16px" class="text-on-surface-variant mt-2">Category revenue breakdown &#8212; ${AE.totalTransactions} transactions, ${AE.totalCustomers} customers.</p></div>` +
    '<div class="flex items-center gap-3"><button class="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm" style="font-size:12px;font-weight:500" onclick="exportPDF()"><span class="material-symbols-outlined text-[18px]">download</span>Export PDF</button></div></div>' +
    `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">${kpiCards}</div>` +
    '<div class="bg-surface rounded-xl p-6 shadow-sm border border-outline-variant/10">' +
    '<div class="flex justify-between items-center mb-6"><div><h3 style="font-size:18px;font-weight:600" class="text-on-surface">Monthly Revenue by Category</h3><p style="font-size:14px" class="text-on-surface-variant">Real monthly performance from your dataset.</p></div>' +
    '<button class="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors" onclick="Toast.show(\' Chart options\',\'info\')"><span class="material-symbols-outlined text-[20px]">more_vert</span></button></div>' +
    '<div style="height:380px"><canvas id="revenue-chart"></canvas></div></div>' +
    '<div class="bg-surface rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">' +
    '<div class="p-6 border-b border-outline-variant/10 flex justify-between items-center">' +
    '<h3 style="font-size:18px;font-weight:600" class="text-on-surface">Category Performance Breakdown</h3>' +
    '<div class="relative"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span><input class="bg-surface-container-low border-none rounded-lg py-1.5 pl-9 pr-4 text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary outline-none" style="font-size:14px" placeholder="Filter categories..." type="text" oninput="filterRegions(this.value)"/></div></div>' +
    '<div class="overflow-x-auto"><table class="w-full text-left border-collapse">' +
    `<thead><tr class="bg-surface-container-lowest border-b border-outline-variant/10">${theadCols}</tr></thead>` +
    `<tbody class="divide-y divide-outline-variant/10" style="font-size:14px" id="regions-tbody">${catTableRows}</tbody>` +
    '</table></div></div></div>';

  requestAnimationFrame(() => {
    const datasets = AE.catNames.map((cat, i) => ({
      label: cat,
      data: AE.monthlyByCategory[cat] || Array(12).fill(0),
      borderColor: chartPalette[i % chartPalette.length],
      backgroundColor: i === 0 ? 'rgba(79,70,229,0.05)' : 'transparent',
      fill: i === 0,
      borderWidth: 2.5, tension: 0.4,
      pointBackgroundColor: chartPalette[i % chartPalette.length],
      pointBorderColor: '#fff', pointRadius: 4, pointHoverRadius: 6
    }));
    safeChart('revenue-chart', {
      type:'line',
      data:{ labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], datasets },
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{position:'top',align:'end',labels:{usePointStyle:true,boxWidth:6,boxHeight:6,font:{family:"'Inter',sans-serif",size:12},color:'#464555'}},
          tooltip:{backgroundColor:'#191c1d',padding:12,cornerRadius:8,callbacks:{label:c=>c.dataset.label+': \u20b9'+c.parsed.y.toLocaleString()}}
        },
        scales:{
          y:{beginAtZero:true,grid:{color:'#e1e3e4'},ticks:{callback:v=>v>=1000?'\u20b9'+(v/1000).toFixed(0)+'k':'\u20b9'+v,font:{family:"'Inter',sans-serif",size:12},color:'#777587'},border:{display:false}},
          x:{grid:{display:false},ticks:{font:{family:"'Inter',sans-serif",size:12},color:'#777587'},border:{display:false}}
        },
        interaction:{intersect:false,mode:'index'}
      }
    });
  });
}
function renderForecasts(filterCat, horizonMonths) {
  const AE = AnalyticsEngine;
  const d = ProspecraData.forecasting;
  const MONTHS = AE.MONTHS;
  const allCats = AE.catNames;
  filterCat = filterCat || 'All Products';
  horizonMonths = horizonMonths || 6;

  // Build historical data: monthly revenue for selected category or all
  let histData;
  if (filterCat !== 'All Products' && AE.monthlyByCategory[filterCat]) {
    histData = AE.monthlyByCategory[filterCat];
  } else {
    histData = AE.monthlyRev;
  }

  // Run forecast model on that data
  const forecastResult = trainSalesModel(histData);
  const baseSlope = parseFloat(forecastResult.slope);
  const baseIntercept = parseFloat(forecastResult.intercept);
  const forecastVals = [];
  for (let k = 1; k <= horizonMonths; k++) {
    const idx = 11 + k;
    forecastVals.push(Math.max(0, Math.round(baseSlope * idx + baseIntercept)));
  }

  const projectedTotal = forecastVals.reduce((a,b)=>a+b,0);

  // Build labels: 12 historical + horizon forecast
  const histLabels = [...MONTHS];
  const futureLabels = [];
  for (let k = 1; k <= horizonMonths; k++) {
    futureLabels.push(MONTHS[(11 + k) % 12] + "'");
  }
  const allLabels = [...histLabels, ...futureLabels];

  // Pad historical with nulls for future slots
  const historicalSeries = [...histData, ...Array(horizonMonths).fill(null)];
  // forecast series: null for first 12 slots except last (overlap at month 12), then forecast
  const forecastSeries = [...Array(11).fill(null), histData[11] || 0, ...forecastVals];
  const bandMargin = forecastVals.map(v => Math.round(v * 0.12));
  const upperBand  = [].concat(Array(12).fill(null), forecastVals.map((v,i) => v + bandMargin[i]));
  const lowerBand  = [].concat(Array(12).fill(null), forecastVals.map((v,i) => Math.max(0, v - bandMargin[i])));

  const catOptions = ['All Products', ...allCats].map(c =>
    `<option${c===filterCat?' selected':''}>${c}</option>`).join('');
  const horizonOptions = [6,12,24].map(h =>
    `<option value="${h}"${h===horizonMonths?' selected':''}>Next ${h} Months</option>`).join('');

  document.getElementById('page-container').innerHTML = `
  <div class="page-content space-y-8">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 style="font-size:36px;font-weight:700;line-height:44px;letter-spacing:-.02em" class="text-on-surface hidden md:block">Sales &amp; Demand Forecasts</h2>
        <h2 style="font-size:30px;font-weight:700;line-height:38px" class="text-on-surface md:hidden">Forecasts</h2>
        <p style="font-size:16px" class="text-on-surface-variant mt-1">ML linear regression model trained on <strong>${AE.totalTransactions}</strong> real sales records. R² = ${forecastResult.r2}.</p>
      </div>
      <div class="flex gap-3">
        <button class="flex items-center gap-2 px-4 py-2 border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container-low transition-colors" style="font-size:12px;font-weight:500" onclick="exportForecast()"><span class="material-symbols-outlined text-[18px]">download</span>Export Forecast</button>
        <button class="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg hover:bg-primary hover:text-on-primary transition-colors shadow-sm" style="font-size:12px;font-weight:500" onclick="newForecastModel()"><span class="material-symbols-outlined text-[18px]">add</span>New Model</button>
      </div>
    </div>
    <div class="bg-surface rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between border border-surface-container">
      <div class="w-full md:w-1/3"><label class="block text-on-surface-variant mb-2" style="font-size:11px;letter-spacing:.05em;font-weight:700">PRODUCT CATEGORY</label><div class="relative"><select id="forecast-cat-select" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 appearance-none focus:ring-2 focus:ring-primary pr-10 outline-none" style="font-size:14px" onchange="updateForecastFilter()">${catOptions}</select><span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span></div></div>
      <div class="w-full md:w-1/4"><label class="block text-on-surface-variant mb-2" style="font-size:11px;letter-spacing:.05em;font-weight:700">TIME HORIZON</label><div class="relative"><select id="forecast-horizon-select" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 appearance-none focus:ring-2 focus:ring-primary pr-10 outline-none" style="font-size:14px" onchange="updateForecastFilter()">${horizonOptions}</select><span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span></div></div>
      <div class="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-lg border border-surface-container">
        <span style="font-size:12px;font-weight:500" class="text-on-surface">Show Confidence Band</span>
        <button class="relative w-10 h-5 rounded-full bg-primary outline-none border-0 transition-colors" id="ci-toggle" onclick="toggleCI(this)"><div class="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all"></div></button>
      </div>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-surface-container p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 style="font-size:18px;font-weight:600" class="text-on-surface">Demand Projection vs Historical — ${filterCat}</h3>
          <div class="flex gap-4 mt-2">
            <div class="flex items-center gap-2"><div class="w-4 h-0.5 bg-primary rounded"></div><span style="font-size:12px;font-weight:500" class="text-on-surface-variant">Historical</span></div>
            <div class="flex items-center gap-2"><div class="w-4 border-t-2 border-dashed border-primary" style="height:0"></div><span style="font-size:12px;font-weight:500" class="text-on-surface-variant">ML Forecast</span></div>
            <div class="flex items-center gap-2"><div class="w-4 h-3 bg-primary opacity-20 rounded-sm"></div><span style="font-size:12px;font-weight:500" class="text-on-surface-variant">95% Confidence</span></div>
          </div>
        </div>
        <button class="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors" onclick="Toast.show('Chart options','info')"><span class="material-symbols-outlined">more_vert</span></button>
      </div>
      <div style="height:380px"><canvas id="forecast-chart"></canvas></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      ${[
        {label:'PROJECTED REVENUE (NEXT '+horizonMonths+'M)', val:AE.fmt(projectedTotal), badge:forecastResult.accuracy, bc:'text-success', badgeBg:'bg-success/10', icon:'trending_up', iconColor:'text-primary', sub:'ML model projection'},
        {label:'FORECAST ACCURACY', val:forecastResult.accuracy, badge:'R² = '+forecastResult.r2, bc:'text-success', badgeBg:'bg-success/10', icon:'fact_check', iconColor:'text-primary', sub:'model confidence score'},
        {label:'AT-RISK CUSTOMERS', val:d.atRiskOpportunities.toString(), badge:'Low Activity', bc:'text-warning', badgeBg:'bg-warning/10', icon:'warning', iconColor:'text-warning', sub:'requires engagement'}
      ].map(s=>`
      <div class="bg-surface rounded-xl shadow-sm border border-surface-container p-4 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-2"><span style="font-size:11px;letter-spacing:.05em;font-weight:700" class="text-on-surface-variant uppercase">${s.label}</span><span class="material-symbols-outlined ${s.iconColor} text-[20px]">${s.icon}</span></div>
        <div style="font-size:24px;font-weight:600;line-height:32px" class="text-on-surface">${s.val}</div>
        <div class="mt-4 flex items-center gap-2"><span class="px-2 py-0.5 ${s.badgeBg} ${s.bc} rounded-full" style="font-size:12px;font-weight:500">${s.badge}</span><span style="font-size:14px" class="text-on-surface-variant">${s.sub}</span></div>
      </div>`).join('')}
    </div>
  </div>`;

  requestAnimationFrame(() => {
    safeChart('forecast-chart', {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          { id:'hist', label:'Historical', data: historicalSeries, borderColor:'#4f46e5', borderWidth: 2.5, tension: 0.4, pointRadius: 4, pointBackgroundColor:'#4f46e5', pointBorderColor:'#fff', fill:false },
          { id:'fore', label:'ML Forecast', data: forecastSeries, borderColor:'#4f46e5', borderDash:[6,4], borderWidth: 2.5, tension: 0.4, pointRadius: 4, pointBackgroundColor:'#4f46e5', pointBorderColor:'#fff', fill:false },
          { id:'upper', label:'Upper Band', data: upperBand, borderColor:'rgba(79,70,229,0.2)', backgroundColor:'rgba(79,70,229,0.07)', borderWidth:1, fill:'+1', tension:0.4, pointRadius:0 },
          { id:'lower', label:'Lower Band', data: lowerBand, borderColor:'rgba(79,70,229,0.2)', backgroundColor:'rgba(79,70,229,0.07)', borderWidth:1, fill:false, tension:0.4, pointRadius:0 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode:'index', intersect:false, backgroundColor:'#191c1d', padding:12, cornerRadius:8, callbacks: { label: c => c.dataset.id === 'upper' || c.dataset.id === 'lower' ? null : `${c.dataset.label}: ₹${(c.parsed.y||0).toLocaleString()}` } } },
        scales: { y: { grid: { color:'#f3f4f5' }, ticks: { callback: v => v >= 1000 ? '₹'+(v/1000).toFixed(0)+'k' : '₹'+v, color:'#777587', font:{ family:"'Inter',sans-serif", size:12 } }, border:{ display:false } }, x: { grid:{ display:false }, ticks:{ color:'#777587', font:{ family:"'Inter',sans-serif", size:12 } }, border:{ display:false } } },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  });
}

function renderInventory() {
  const { inventory } = ProspecraData;
  const AE = AnalyticsEngine;

  // Compute real summary stats from inventory data
  const activeSKUs = inventory.length;
  const criticalCount = inventory.filter(i => i.status === 'Critical').length;
  const lowStockCount = inventory.filter(i => i.status === 'Low Stock').length;
  // Procurement value = sum of (stock_to_reorder * avg_price) for critical/low-stock items
  const procurementValue = inventory
    .filter(i => i.status === 'Critical' || i.status === 'Low Stock')
    .reduce((sum, i) => sum + (i.price || 0) * Math.max(10, Math.round(i.qtySold * 1.5)), 0);

  const rows = inventory.map((item,i) => `
    <tr class="border-b border-surface-container hover:bg-surface-container-low transition-colors group">
      <td class="p-4 font-medium text-on-surface" style="font-size:14px">${item.name}</td>
      <td class="p-4 text-on-surface-variant" style="font-size:14px">${item.cat}</td>
      <td class="p-4" style="font-size:14px"><span class="font-medium">${item.stock} units</span>${item.stockTrend?`<span class="ml-2 ${item.stockTrend.startsWith('+')?'text-success':'text-error'}" style="font-size:12px">${item.stockTrend}</span>`:''}</td>
      <td class="p-4"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${statusDot(item.status)} shrink-0"></span><span class="${statusTextClass(item.status)} font-medium" style="font-size:14px">${item.status}</span></div></td>
      <td class="p-4 text-on-surface-variant font-medium" style="font-size:14px">${item.depletion}${item.daysLeft?` <span class="${statusTextClass(item.status)} ml-1">(${item.daysLeft})</span>`:''}</td>
      <td class="p-4 text-right">
        <button class="text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity" style="font-size:12px;font-weight:500" onclick="restockItem(${i})">${item.status==='Critical'?'Restock':item.status==='Low Stock'?'Review':'Details'}</button>
      </td>
    </tr>`).join('');

  document.getElementById('page-container').innerHTML = `
  <div class="page-content space-y-8">
    <div class="flex justify-between items-end">
      <div>
        <p class="text-primary font-medium mb-1" style="font-size:12px;font-weight:500">Operational Forecasting</p>
        <h2 style="font-size:36px;font-weight:700;line-height:44px;letter-spacing:-.02em" class="text-on-surface hidden md:block">Inventory &amp; Stock Monitoring</h2>
        <h2 style="font-size:30px;font-weight:700;line-height:38px" class="text-on-surface md:hidden">Inventory</h2>
      </div>
      <button class="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl hover:bg-primary hover:text-on-primary shadow-sm transition-all flex items-center gap-2" style="font-size:12px;font-weight:500" onclick="addStock()"><span class="material-symbols-outlined text-[18px]">add</span>Add Stock</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-surface rounded-xl p-6 shadow-sm border border-surface-container flex flex-col justify-between h-32 relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-success/10 rounded-full blur-xl pointer-events-none"></div>
        <span style="font-size:12px;font-weight:500" class="text-on-surface-variant">Active SKUs</span>
        <div class="flex items-baseline gap-3 mt-2"><span style="font-size:36px;font-weight:700" class="text-on-surface">${activeSKUs}</span><span class="text-success flex items-center bg-success/10 px-2 py-0.5 rounded-full" style="font-size:12px;font-weight:500"><span class="material-symbols-outlined text-[14px]">inventory_2</span>${AE.catNames.length} cats</span></div>
      </div>
      <div class="bg-surface rounded-xl p-6 shadow-sm border border-surface-container flex flex-col justify-between h-32 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onclick="filterByStatus('Critical')">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-error/10 rounded-full blur-xl pointer-events-none"></div>
        <span style="font-size:12px;font-weight:500" class="text-on-surface-variant">Critical Depletion Warnings</span>
        <div class="flex items-baseline gap-3 mt-2"><span style="font-size:36px;font-weight:700" class="text-on-surface">${criticalCount}</span><span class="${criticalCount>0?'text-error animate-pulse':'text-success'} flex items-center bg-${criticalCount>0?'error':'success'}/10 px-2 py-0.5 rounded-full" style="font-size:12px;font-weight:500">${criticalCount>0?'Requires Action':'All Clear'}</span></div>
      </div>
      <div class="bg-surface rounded-xl p-6 shadow-sm border border-surface-container flex flex-col justify-between h-32 relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none"></div>
        <span style="font-size:12px;font-weight:500" class="text-on-surface-variant">Est. Procurement Cost</span>
        <div class="flex items-baseline gap-3 mt-2"><span style="font-size:36px;font-weight:700" class="text-on-surface">${AE.fmt(procurementValue)}</span><span style="font-size:12px;font-weight:500" class="text-outline">${criticalCount+lowStockCount} items to reorder</span></div>
      </div>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-surface-container overflow-hidden">
      <div class="p-4 border-b border-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 style="font-size:18px;font-weight:600" class="text-on-surface">Predictive Inventory Depletion</h3>
        <div class="flex gap-2 flex-wrap">
          <select class="bg-surface-container-low border-none rounded-lg px-3 py-1.5 appearance-none focus:ring-2 focus:ring-primary outline-none" style="font-size:12px;font-weight:500" onchange="filterByStatus(this.value)">
            <option value="">All Status</option><option value="Critical">Critical</option><option value="Low Stock">Low Stock</option><option value="Healthy">Healthy</option>
          </select>
          <button class="p-2 rounded-lg border border-surface-container text-on-surface-variant hover:bg-surface-container-low transition-colors" onclick="downloadInventory()"><span class="material-symbols-outlined text-[18px]">download</span></button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead><tr class="bg-surface border-b border-surface-container">
            ${['Product Name','Category','Current Stock','Urgency','Predicted Depletion','Actions'].map(h=>`<th class="text-on-surface-variant p-4 uppercase tracking-wider font-semibold" style="font-size:11px;letter-spacing:.05em;font-weight:700">${h}</th>`).join('')}
          </tr></thead>
          <tbody id="inv-tbody">${rows}</tbody>
        </table>
      </div>
      <div class="p-3 px-4 border-t border-surface-container bg-surface-bright flex justify-between items-center text-on-surface-variant" style="font-size:12px;font-weight:500">
        <span>Showing all ${inventory.length} SKUs from dataset</span>
        <div class="flex gap-1">
          <button class="px-3 py-1 rounded hover:bg-surface-container transition-colors opacity-50" disabled>Prev</button>
          <button class="px-3 py-1 rounded bg-primary-container text-on-primary-container font-medium">1</button>
          <button class="px-3 py-1 rounded hover:bg-surface-container transition-colors opacity-50" disabled>Next</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Page: Strategy ────────────────────────────────────────
function renderStrategy() {
  const { customers } = ProspecraData;
  const realCohorts = ProspecraData.chartData.cohorts || {};
  const cohortCount = k => (realCohorts[k] || []).length;
  const cohorts = [
    {key:'Champions',count:cohortCount('Champions'),desc:'High spend, frequent buyers. Most valuable segment.',icon:'diamond',color:'primary',action:'Launch Campaign'},
    {key:'Big Spenders',count:cohortCount('Big Spenders'),desc:'High order value but rarely purchase.',icon:'payments',color:'on-tertiary-container',action:'Launch Campaign'},
    {key:'Loyalists',count:cohortCount('Loyalists'),desc:'Buy often but spend less per order.',icon:'favorite',color:'secondary',action:'Launch Campaign'},
    {key:'At Risk',count:cohortCount('At Risk'),desc:'Low spend, rare purchases. Likely to churn.',icon:'warning',color:'error',action:'Launch Win-back'}
  ];

  const cohortCards = cohorts.map(c => `
    <div class="border border-outline-variant rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group" onclick="selectCohort('${c.key}')">
      <div class="flex justify-between items-start mb-3">
        <div><h4 class="text-${c.color} font-bold" style="font-size:12px;font-weight:700">${c.key}</h4><p class="text-on-surface font-light mt-1" style="font-size:28px;line-height:1.1">${c.count.toLocaleString()}</p></div>
        <span class="material-symbols-outlined text-${c.color} group-hover:scale-110 transition-transform">${c.icon}</span>
      </div>
      <div><p style="font-size:14px" class="text-on-surface-variant mb-3">${c.desc}</p>
      <button class="w-full py-2 bg-surface border border-outline-variant rounded-lg text-${c.color} hover:opacity-80 transition-all flex items-center justify-center gap-2" style="font-size:12px;font-weight:500" onclick="launchCampaign('${c.key}',event)"><span class="material-symbols-outlined text-[16px]">campaign</span>${c.action}</button></div>
    </div>`).join('');

  const custRows = customers.slice(0,4).map(c => `
    <tr class="hover:bg-surface-container-low transition-colors">
      <td class="py-4 px-6"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">${c.initials}</div><div><p style="font-size:12px;font-weight:500" class="text-on-surface">${c.name}</p><p style="font-size:11px" class="text-on-surface-variant">${c.email}</p></div></div></td>
      <td class="py-4 px-6"><span class="px-2 py-1 ${c.status==='ACTIVE'?'bg-success/10 text-success':'bg-error/10 text-error'} rounded-full" style="font-size:10px;font-weight:700;letter-spacing:.05em">${c.status}</span></td>
      <td class="py-4 px-6" style="font-size:14px" class="text-on-surface">${c.ltv}</td>
      <td class="py-4 px-6" style="font-size:14px" class="text-on-surface-variant">${c.last}</td>
      <td class="py-4 px-6 text-right"><button class="text-primary hover:text-primary-fixed p-1 rounded transition-colors" onclick="Toast.show('Loading customer details…','info')"><span class="material-symbols-outlined text-[20px]">more_vert</span></button></td>
    </tr>`).join('');

  document.getElementById('page-container').innerHTML = `
  <div class="page-content space-y-8">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 style="font-size:36px;font-weight:700;line-height:44px;letter-spacing:-.02em" class="text-on-surface hidden md:block">Customer Intelligence</h2>
        <h2 style="font-size:30px;font-weight:700;line-height:38px" class="text-on-surface md:hidden">Strategy</h2>
        <p style="font-size:16px" class="text-on-surface-variant mt-2">Analyze purchasing patterns and launch targeted segment campaigns.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="px-4 py-2 border border-outline-variant text-on-surface rounded-xl hover:bg-surface-container-low transition-colors flex items-center gap-2" style="font-size:12px;font-weight:500" onclick="exportCustomers()"><span class="material-symbols-outlined text-[18px]">download</span>Export Data</button>
        <button class="px-4 py-2 bg-primary-container text-on-primary-container rounded-xl hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2" style="font-size:12px;font-weight:500" onclick="newSegment()"><span class="material-symbols-outlined text-[18px]">add</span>New Segment</button>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8 bg-surface rounded-xl shadow-sm border border-surface-variant p-6">
        <div class="flex justify-between items-center mb-6"><h3 style="font-size:18px;font-weight:600" class="text-on-surface">Retention Matrix</h3><span class="px-2 py-1 bg-surface-container-low rounded text-on-surface-variant" style="font-size:11px;letter-spacing:.05em;font-weight:700">LAST 30 DAYS</span></div>
        <div class="grid grid-cols-2 gap-4" style="min-height:320px">${cohortCards}</div>
      </div>
      <div class="lg:col-span-4 flex flex-col gap-6">
        ${[{label:'TOTAL CUSTOMERS',val:ProspecraData.kpis.users.value,badge:'+12.4%',icon:'groups'},{label:'AVG. CLV',val:AnalyticsEngine.fmt(AnalyticsEngine.totalRevenue / Math.max(1, AnalyticsEngine.totalCustomers)),badge:'+5.2%',icon:'monitoring'}].map(k=>`
        <div class="bg-surface rounded-xl shadow-sm border border-surface-variant p-6">
          <div class="flex justify-between items-start mb-4"><h4 style="font-size:11px;letter-spacing:.05em;font-weight:700" class="text-on-surface-variant uppercase">${k.label}</h4><span class="material-symbols-outlined text-on-surface-variant">${k.icon}</span></div>
          <div class="flex items-baseline gap-3"><span style="font-size:36px;font-weight:700" class="text-on-surface">${k.val}</span><span class="text-success flex items-center bg-success/10 px-2 py-1 rounded-full" style="font-size:12px;font-weight:500"><span class="material-symbols-outlined text-[14px]">arrow_upward</span>${k.badge}</span></div>
        </div>`).join('')}
        <div class="bg-surface rounded-xl shadow-sm border border-surface-variant p-6 flex flex-col flex-1">
          <div class="flex justify-between items-start mb-4"><h4 style="font-size:11px;letter-spacing:.05em;font-weight:700" class="text-on-surface-variant uppercase">AI INSIGHT</h4><span class="material-symbols-outlined ms-fill text-primary">auto_awesome</span></div>
          <p style="font-size:14px" class="text-on-surface-variant mb-4">The "Champions" cohort is highly responsive to early-access product launches. Consider targeting them with the Q3 collection preview.</p>
          <button class="mt-auto w-full py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors" style="font-size:12px;font-weight:500" onclick="openAICopilot()">Generate Strategy</button>
        </div>
      </div>
    </div>
    <div class="bg-surface rounded-xl shadow-sm border border-surface-variant overflow-hidden">
      <div class="p-6 border-b border-outline-variant flex justify-between items-center">
        <h3 style="font-size:18px;font-weight:600" class="text-on-surface flex items-center gap-2">Filtered List: <span class="text-primary bg-primary/10 px-3 py-1 rounded-full" style="font-size:12px;font-weight:500">Champions (${cohortCount('Champions').toLocaleString()})</span></h3>
        <div class="relative"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span><input class="w-64 bg-surface border border-outline-variant rounded-lg pl-9 pr-4 py-1.5 text-on-surface focus:ring-2 focus:ring-primary transition-colors outline-none" style="font-size:14px" placeholder="Search cohort…" type="text"/></div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead><tr class="border-b border-outline-variant">
            ${['CUSTOMER','STATUS','LTV','LAST PURCHASE','ACTIONS'].map(h=>`<th class="text-on-surface-variant py-3 px-6 uppercase" style="font-size:11px;letter-spacing:.05em;font-weight:700">${h}</th>`).join('')}
          </tr></thead>
          <tbody class="divide-y divide-surface-variant">${custRows}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ── Page: Reports ─────────────────────────────────────────
function renderReports() {
  const { reports } = ProspecraData;
  const reportCards = reports.map((r,i) => `
    <div class="bg-surface rounded-xl p-5 shadow-sm border border-surface-container-highest hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer" onclick="openReport(${i})">
      <div class="flex justify-between items-start mb-4">
        <div class="p-2 bg-surface-container text-on-surface-variant rounded-lg"><span class="material-symbols-outlined">${r.icon}</span></div>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-md transition-colors" title="Download" onclick="downloadReport(${i},event)"><span class="material-symbols-outlined text-[20px]">download</span></button>
          <button class="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-md transition-colors" title="Share" onclick="shareReport(${i},event)"><span class="material-symbols-outlined text-[20px]">share</span></button>
        </div>
      </div>
      <h4 class="text-on-surface font-semibold mb-1" style="font-size:16px">${r.title}</h4>
      <p class="text-on-surface-variant mb-4 flex-grow" style="font-size:14px">${r.desc}</p>
      <div class="flex items-center justify-between pt-4 border-t border-surface-container-low mt-auto">
        <span class="text-outline" style="font-size:11px;letter-spacing:.05em;font-weight:700">${r.status==='processing'?'Generating… '+r.progress+'%':'Generated: '+r.date}</span>
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full ${r.status==='ready'?'bg-success/10 text-success':'bg-warning/10 text-warning'} ${r.status==='processing'?'animate-pulse':''}" style="font-size:11px;letter-spacing:.05em;font-weight:700">
          <span class="w-1.5 h-1.5 rounded-full ${r.status==='ready'?'bg-success':'bg-warning'}"></span>${r.status==='ready'?'Ready':'Processing'}
        </span>
      </div>
      ${r.status==='processing'?`<div class="w-full bg-surface-container-low h-1 mt-2 rounded-full overflow-hidden"><div class="bg-warning h-full rounded-full" style="width:${r.progress}%"></div></div>`:''}
    </div>`).join('');

  document.getElementById('page-container').innerHTML = `
  <div class="page-content space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 style="font-size:36px;font-weight:700;line-height:44px;letter-spacing:-.02em" class="text-on-surface hidden md:block">Reports Hub</h2>
        <h2 style="font-size:30px;font-weight:700;line-height:38px" class="text-on-surface md:hidden">Reports Hub</h2>
        <p style="font-size:16px" class="text-on-surface-variant">Generate, schedule, and analyze your enterprise data.</p>
      </div>
      <button class="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2 shadow-sm" style="font-size:12px;font-weight:500" onclick="newReport()"><span class="material-symbols-outlined text-[18px]">add</span>New Report</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div class="md:col-span-8 flex flex-col gap-4">
        <div class="flex items-center justify-between"><h3 class="text-on-surface flex items-center gap-2" style="font-size:18px;font-weight:600"><span class="material-symbols-outlined text-tertiary">history</span>Recently Generated</h3><button class="text-primary hover:underline" style="font-size:14px;font-weight:500" onclick="Toast.show('Loading all reports…','info')">View All</button></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${reportCards}</div>
      </div>
      <div class="md:col-span-4 flex flex-col gap-4">
        <div class="bg-surface rounded-xl p-5 shadow-sm border border-surface-container-highest">
          <h3 class="text-on-surface mb-4 flex items-center gap-2" style="font-size:18px;font-weight:600"><span class="material-symbols-outlined text-primary">schedule</span>Upcoming Schedules</h3>
          <div class="flex flex-col gap-0">
            ${[{name:'Weekly Executive Summary',freq:'Every Monday, 8:00 AM'},{name:'EOM Financial Rec',freq:'Last Day of Month'}].map(s=>`
            <div class="py-3 border-b border-surface-container-low last:border-0 flex justify-between items-center group">
              <div><span class="text-on-surface font-medium" style="font-size:14px">${s.name}</span><div class="text-on-surface-variant mt-1 flex items-center gap-1" style="font-size:11px;letter-spacing:.05em;font-weight:700"><span class="material-symbols-outlined text-[14px]">event_repeat</span>${s.freq}</div></div>
              <button class="text-outline hover:text-primary transition-colors opacity-0 group-hover:opacity-100" onclick="editSchedule('${s.name}')"><span class="material-symbols-outlined text-[20px]">edit</span></button>
            </div>`).join('')}
          </div>
          <button class="mt-4 w-full py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors" style="font-size:12px;font-weight:500" onclick="manageSchedules()">Manage Schedules</button>
        </div>
        <div class="bg-surface rounded-xl p-5 shadow-sm border border-surface-container-highest flex-grow">
          <h3 class="text-on-surface mb-4 flex items-center gap-2" style="font-size:18px;font-weight:600"><span class="material-symbols-outlined text-tertiary">dashboard_customize</span>Template Library</h3>
          <div class="flex flex-col gap-3">
            ${[{icon:'inventory_2',title:'Inventory Health',sub:'Stockouts, Turnover'},{icon:'trending_up',title:'Sales Performance',sub:'Revenue, Growth YoY'},{icon:'groups',title:'Customer Insights',sub:'Demographics, LTV'}].map(t=>`
            <button class="w-full flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-surface-container-highest hover:bg-surface-container-lowest transition-all text-left group" onclick="useTemplate('${t.title}')">
              <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors"><span class="material-symbols-outlined text-[20px]">${t.icon}</span></div>
              <div class="flex-1"><span class="block text-on-surface font-medium" style="font-size:14px">${t.title}</span><span class="block text-outline mt-0.5" style="font-size:11px;letter-spacing:.05em;font-weight:700">${t.sub}</span></div>
              <span class="material-symbols-outlined text-outline group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
            </button>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Page: Settings ────────────────────────────────────────
function renderSettings() {
  const u = Auth.getUser() || Auth.SAMPLE_USER;
  const nameParts = u.name.split(' ');
  const firstName = nameParts[0] || 'System';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  document.getElementById('page-container').innerHTML = `
  <div class="page-content space-y-8">
    <div><h2 style="font-size:36px;font-weight:700;line-height:44px;letter-spacing:-.02em" class="text-on-surface">Settings</h2><p style="font-size:16px" class="text-on-surface-variant mt-1">Manage your account, preferences, and integrations.</p></div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="md:col-span-1">
        <nav class="bg-surface rounded-xl shadow-sm border border-surface-container-high overflow-hidden">
          ${[{id:'profile',icon:'person',label:'Profile'},{id:'notifications',icon:'notifications',label:'Notifications'},{id:'integrations',icon:'extension',label:'Integrations'},{id:'security',icon:'security',label:'Security'},{id:'billing',icon:'credit_card',label:'Billing'},{id:'team',icon:'group',label:'Team'}].map((s,i)=>`
          <button class="w-full flex items-center gap-3 px-4 py-3 text-left ${i===0?'bg-primary/5 text-primary font-semibold':'text-on-surface-variant hover:bg-surface-container-low'} transition-colors border-b border-surface-container-low last:border-0 group" style="font-size:12px;font-weight:500" onclick="showSettingSection('${s.id}',this)"><span class="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">${s.icon}</span>${s.label}</button>`).join('')}
        </nav>
      </div>
      <div class="md:col-span-3 space-y-6">
        <div class="bg-surface rounded-xl shadow-sm border border-surface-container-high p-6">
          <h3 style="font-size:18px;font-weight:600" class="text-on-surface mb-6">Profile Information</h3>
          <div class="flex items-center gap-4 mb-6 p-4 bg-surface-container-low rounded-xl">
            <div class="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-2xl">${u.avatar}</div>
            <div><p style="font-size:18px;font-weight:600" class="text-on-surface">${u.name}</p><p style="font-size:14px" class="text-on-surface-variant">${u.email}</p><button class="text-primary hover:underline mt-1" style="font-size:12px;font-weight:500" onclick="Toast.show('Photo upload coming soon','info')">Change photo</button></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${[{label:'First Name',val:firstName,type:'text'},{label:'Last Name',val:lastName,type:'text'},{label:'Email',val:u.email,type:'email'},{label:'Role',val:u.role,type:'text',ro:true}].map(f=>`
            <div><label class="block text-on-surface-variant mb-2" style="font-size:11px;letter-spacing:.05em;font-weight:700">${f.label}</label><input class="w-full ${f.ro?'bg-surface-container':'bg-surface-container-low'} border border-transparent rounded-lg px-4 py-2.5 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none" style="font-size:14px" value="${f.val}" type="${f.type}" ${f.ro?'readonly':''}/></div>`).join('')}
          </div>
          <button class="mt-6 px-6 py-2.5 bg-primary-container text-on-primary-container rounded-lg hover:bg-primary hover:text-on-primary transition-colors shadow-sm" style="font-size:12px;font-weight:500" onclick="saveProfile()">Save Changes</button>
        </div>
        <div class="bg-surface rounded-xl shadow-sm border border-surface-container-high p-6">
          <h3 style="font-size:18px;font-weight:600" class="text-on-surface mb-6">Preferences</h3>
          <div class="space-y-5">
            ${[
              {label:'Dark Mode',sub:'Use dark theme across the app',key:'darkMode',on:isDark},
              {label:'Email Notifications',sub:'Receive weekly digest emails',key:'emailNotif',on:false},
              {label:'Critical Stock Alerts',sub:'Get notified when items hit threshold',key:'stockAlerts',on:true},
              {label:'AI Copilot',sub:'Enable predictive insights banner',key:'aiCopilot',on:true}
            ].map(p=>`
            <div class="flex items-center justify-between py-3 border-b border-surface-container-low last:border-0">
              <div><p style="font-size:14px" class="text-on-surface font-medium">${p.label}</p><p style="font-size:14px" class="text-on-surface-variant">${p.sub}</p></div>
              <button class="relative w-11 h-6 rounded-full ${p.on?'bg-primary':'bg-surface-container-high'} transition-colors outline-none border-0" onclick="togglePref(this,'${p.key}')" role="switch" aria-checked="${p.on}">
                <div class="absolute top-0.5 ${p.on?'right-0.5':'left-0.5'} w-5 h-5 bg-white rounded-full shadow-sm transition-all"></div>
              </button>
            </div>`).join('')}
          </div>
        </div>
        <div class="bg-error/5 border border-error/20 rounded-xl p-6">
          <h3 style="font-size:18px;font-weight:600" class="text-error mb-2">Account Actions & Session</h3>
          <p style="font-size:14px" class="text-on-surface-variant mb-4">Manage active session or export your data.</p>
          <div class="flex flex-wrap gap-3">
            <button class="px-4 py-2 bg-error text-on-error rounded-lg hover:bg-error/80 transition-colors flex items-center gap-2" style="font-size:12px;font-weight:500" onclick="Auth.logout()"><span class="material-symbols-outlined text-[16px]">logout</span> Log Out</button>
            <button class="px-4 py-2 border border-error/30 text-error rounded-lg hover:bg-error/10 transition-colors" style="font-size:12px;font-weight:500" onclick="Toast.show('Export initiated – check email','success')">Export My Data</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ====================================================
// ACTION HANDLERS
// ====================================================
function handleKPIClick(label) {
  const m = {'Total Revenue':'/analytics','Customers':'/strategy','Avg. Order Value':'/analytics','Transactions':'/inventory'};
  Toast.show('Loading '+label+' details…','info');
  setTimeout(()=>navigate(m[label]||'/analytics'),400);
}
function exportReport()    { Toast.show('Report exported successfully!','success'); }
function exportPDF()       { Toast.show('PDF export started – check your downloads.','success'); }
function exportForecast()  { Toast.show('Forecast export started.','success'); }
function exportCustomers() { Toast.show('Customer data export initiated.','success'); }
function showDatePicker()  { Toast.show('Date picker coming soon.','info'); }
function switchQuarter(btn, q) {
  btn.parentElement.querySelectorAll('button').forEach(b=>{ b.classList.remove('bg-surface-container-low'); b.classList.add('text-on-surface-variant'); });
  btn.classList.add('bg-surface-container-low'); btn.classList.remove('text-on-surface-variant');
  Toast.show('Switched to '+q+' data.','info');
}
function filterRegions(val) {
  document.querySelectorAll('.region-row').forEach(r=>{ r.style.display = r.dataset.region.includes(val.toLowerCase())?'':'none'; });
}
function updateForecast()  { Toast.show('Forecast model updated.','success'); }
function updateForecastFilter() {
  const cat = document.getElementById('forecast-cat-select');
  const hor = document.getElementById('forecast-horizon-select');
  renderForecasts(cat ? cat.value : 'All Products', hor ? parseInt(hor.value, 10) : 6);
}
function newForecastModel(){ Toast.show('New model wizard coming soon.','info'); }
function toggleCI(btn) {
  const thumb = btn.querySelector('div');
  const isOn = btn.classList.contains('bg-primary');
  btn.classList.toggle('bg-primary',!isOn);
  btn.classList.toggle('bg-surface-container-high',isOn);
  thumb.className = `absolute top-0.5 ${!isOn?'right-0.5':'left-0.5'} w-4 h-4 bg-white rounded-full shadow-sm transition-all`;
  if (activeChart && activeChart.data.datasets.length >= 4) {
    activeChart.setDatasetVisibility(2, !isOn);
    activeChart.setDatasetVisibility(3, !isOn);
    activeChart.update();
  }
  Toast.show('Confidence interval '+(isOn?'hidden':'shown')+'.','info');
}
function addStock()        { Toast.show('Add Stock form coming soon.','info'); }
function filterByStatus(status) {
  const tbody = document.getElementById('inv-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  rows.forEach((row,i)=>{ const item = ProspecraData.inventory[i]; if(!item) return; row.style.display = (!status||item.status===status)?'':'none'; });
}
function restockItem(i) {
  const item = ProspecraData.inventory[i];
  if(!item) return;
  Toast.show('Restock order placed for '+item.name+'!','success');
}
function downloadInventory(){ Toast.show('Inventory CSV download started.','success'); }
function changePeriod(btn,period) {
  btn.parentElement.querySelectorAll('button').forEach(b=>{ b.classList.remove('bg-primary-container','text-on-primary-container'); b.classList.add('bg-surface-container-low','text-on-surface'); });
  btn.classList.add('bg-primary-container','text-on-primary-container'); btn.classList.remove('bg-surface-container-low','text-on-surface');
  Toast.show('Showing '+period+' trend.','info');
}
function selectCohort(key) { Toast.show('Viewing '+key+' cohort.','info'); }
function launchCampaign(label,e){ e.stopPropagation(); Toast.show('Campaign for '+label+' launched! 🚀','success'); }
function newSegment()      { Toast.show('New segment creation coming soon.','info'); }
function openReport(i)     { const r=ProspecraData.reports[i]; Toast.show('Opening: '+r.title,'info'); }
function downloadReport(i,e){ e.stopPropagation(); const r=ProspecraData.reports[i]; Toast.show(r.title+' downloaded!','success'); }
function shareReport(i,e)  { e.stopPropagation(); const r=ProspecraData.reports[i]; Toast.show('Share link copied for '+r.title+'!','success'); }
function newReport()       { Toast.show('New Report wizard launching…','info'); }
function editSchedule(name){ Toast.show('Editing schedule: '+name,'info'); }
function manageSchedules() { Toast.show('Schedule manager coming soon.','info'); }
function useTemplate(name) { Toast.show('Template "'+name+'" loaded!','success'); }
function saveProfile()     { Toast.show('Profile saved successfully!','success'); }
function showSettingSection(id,btn) {
  btn.parentElement.querySelectorAll('button').forEach(b=>{ b.classList.remove('bg-primary/5','text-primary','font-semibold'); b.classList.add('text-on-surface-variant'); });
  btn.classList.add('bg-primary/5','text-primary','font-semibold'); btn.classList.remove('text-on-surface-variant');
  Toast.show('Settings section: '+id,'info');
}
function togglePref(btn, key) {
  const thumb = btn.querySelector('div');
  const isOn = btn.classList.contains('bg-primary');
  btn.classList.toggle('bg-primary',!isOn);
  btn.classList.toggle('bg-surface-container-high',isOn);
  thumb.className = `absolute top-0.5 ${!isOn?'right-0.5':'left-0.5'} w-5 h-5 bg-white rounded-full shadow-sm transition-all`;
  btn.setAttribute('aria-checked', String(!isOn));
  if(key==='darkMode') toggleDarkMode();
  Toast.show(key+' '+(isOn?'disabled':'enabled')+'.','info');
}

// ====================================================
// GLOBAL UI
// ====================================================
function openAICopilot()  { document.getElementById('ai-drawer').classList.add('open'); }
function closeAICopilot() { document.getElementById('ai-drawer').classList.remove('open'); }
function closeDropdowns() { document.getElementById('notif-panel').classList.add('hidden'); document.getElementById('profile-dropdown').classList.add('hidden'); }
function closeMobileMenu(){ document.getElementById('mobile-sidenav').classList.add('-translate-x-full'); document.getElementById('mobile-overlay').classList.add('hidden'); }

document.getElementById('ai-fab').addEventListener('click', openAICopilot);
document.getElementById('ai-close').addEventListener('click', closeAICopilot);

document.getElementById('notif-btn').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('profile-dropdown').classList.add('hidden');
  document.getElementById('notif-panel').classList.toggle('hidden');
});

document.getElementById('profile-btn').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('notif-panel').classList.add('hidden');
  document.getElementById('profile-dropdown').classList.toggle('hidden');
});

document.addEventListener('click', () => closeDropdowns());

function clearNotifications() {
  document.getElementById('notif-dot').classList.add('hidden');
  document.getElementById('notif-panel').classList.add('hidden');
  Toast.show('All notifications marked as read.','success');
}

document.getElementById('mobile-overlay').addEventListener('click', closeMobileMenu);

document.getElementById('mobile-menu-btn').addEventListener('click', () => {
  document.getElementById('mobile-sidenav').classList.remove('-translate-x-full');
  document.getElementById('mobile-overlay').classList.remove('hidden');
});

let isDark = false;
function toggleDarkMode() {
  isDark = !isDark;
  document.documentElement.classList.toggle('dark', isDark);
  document.getElementById('theme-icon').textContent = isDark ? 'dark_mode' : 'light_mode';
}
document.getElementById('theme-toggle').addEventListener('click', toggleDarkMode);

document.getElementById('global-search').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const val = e.target.value.trim().toLowerCase();
  const map = {dashboard:'/',analytic:'/analytics',forecast:'/forecasts',inventor:'/inventory',strateg:'/strategy',report:'/reports',setting:'/settings'};
  for (const [k,r] of Object.entries(map)) { if(val.includes(k)){ Toast.show('Navigating to '+k+'…','info'); setTimeout(()=>navigate(r),300); e.target.value=''; return; } }
  Toast.show('No matching page found.','warning');
});

// ── Init ──────────────────────────────────────────────────
Auth.init();
AICopilot.init();
navigate(location.pathname || '/', false);
