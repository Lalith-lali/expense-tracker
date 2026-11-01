/* ============================================================
   ExpenseIQ – Professional Expense Tracker
   ============================================================ */

/* ============================================================
   CONSTANTS & CATEGORY CONFIG
   ============================================================ */

const STORAGE_KEY    = "expenseiq_expenses_v2";
const BUDGET_KEY     = "expenseiq_budgets_v2";
const THEME_KEY      = "expenseiq_theme";

const CATEGORIES = {
    Food:          { emoji: "🍔", color: "#f97316", bg: "rgba(249,115,22,0.15)" },
    Transport:     { emoji: "🚗", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    Shopping:      { emoji: "🛍️", color: "#ec4899", bg: "rgba(236,72,153,0.15)" },
    Entertainment: { emoji: "🎬", color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
    Health:        { emoji: "💊", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
    Utilities:     { emoji: "💡", color: "#eab308", bg: "rgba(234,179,8,0.15)"  },
    Education:     { emoji: "📚", color: "#06b6d4", bg: "rgba(6,182,212,0.15)" },
    Travel:        { emoji: "✈️", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
    Rent:          { emoji: "🏠", color: "#f43f5e", bg: "rgba(244,63,94,0.15)"  },
    Other:         { emoji: "📦", color: "#64748b", bg: "rgba(100,116,139,0.15)"},
};

const PAGE_SIZE = 10;
let currentPage = 1;
let filteredExpenses = [];
let trendChartInst = null;
let donutChartInst = null;
let barChartInst   = null;
let pieChartInst   = null;
let ringChartInst  = null;

/* ============================================================
   THEME
   ============================================================ */

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    updateThemeIcon();
    // re-render charts after theme change
    setTimeout(() => {
        renderDashboardCharts();
        renderAnalytics();
        renderBudgetRing();
    }, 100);
}

function updateThemeIcon() {
    const isDark = document.body.classList.contains("dark");
    const moonPath = `<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"/>`;
    const sunSvg   = `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`;

    const icon  = document.getElementById("themeIcon");
    const iconM = document.getElementById("themeIconMobile");
    const label = document.getElementById("themeLabel");

    if (icon)  icon.innerHTML  = isDark ? moonPath : sunSvg;
    if (iconM) iconM.innerHTML = isDark ? moonPath : sunSvg;
    if (label) label.textContent = isDark ? "Light Mode" : "Dark Mode";
}

/* ============================================================
   STORAGE
   ============================================================ */

function getExpenses() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const demo = generateDemoData();
            saveExpenses(demo);
            return demo;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
}

function saveExpenses(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getBudgets() {
    try {
        const raw = localStorage.getItem(BUDGET_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
}
function saveBudgets(obj) {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(obj));
}

/* ============================================================
   DEMO DATA
   ============================================================ */

function generateDemoData() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const pm = String(now.getMonth()).padStart(2, "0") || "12";

    return [
        { id: Date.now() - 9, name: "Swiggy Order",       category: "Food",          amount: 340,   date: `${y}-${m}-28`, note: "Dinner" },
        { id: Date.now() - 8, name: "Uber Ride",           category: "Transport",     amount: 180,   date: `${y}-${m}-27`, note: "" },
        { id: Date.now() - 7, name: "Netflix",             category: "Entertainment", amount: 649,   date: `${y}-${m}-25`, note: "Monthly sub" },
        { id: Date.now() - 6, name: "Electricity Bill",    category: "Utilities",     amount: 1200,  date: `${y}-${m}-22`, note: "" },
        { id: Date.now() - 5, name: "Amazon Shopping",     category: "Shopping",      amount: 2499,  date: `${y}-${m}-20`, note: "Headphones" },
        { id: Date.now() - 4, name: "Doctor Visit",        category: "Health",        amount: 500,   date: `${y}-${m}-18`, note: "" },
        { id: Date.now() - 3, name: "Rent",                category: "Rent",          amount: 12000, date: `${y}-${m}-01`, note: "Monthly" },
        { id: Date.now() - 2, name: "Zomato",              category: "Food",          amount: 420,   date: `${y}-${pm}-28`, note: "Lunch" },
        { id: Date.now() - 1, name: "Bus Pass",            category: "Transport",     amount: 300,   date: `${y}-${pm}-20`, note: "" },
        { id: Date.now() - 0, name: "Udemy Course",        category: "Education",     amount: 499,   date: `${y}-${pm}-15`, note: "React course" },
    ];
}

/* ============================================================
   DATE HELPERS
   ============================================================ */

function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDisplayDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${d} ${months[parseInt(m,10)-1]} ${y}`;
}

function monthLabel(iso) {
    if (!iso) return "";
    const [y, m] = iso.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(m,10)-1]} ${y}`;
}

function isoToMonthKey(iso) {
    return iso ? iso.slice(0,7) : "";
}

function escHtml(s) {
    return String(s ?? "")
        .replace(/&/g,"&amp;").replace(/</g,"&lt;")
        .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ============================================================
   GREETING
   ============================================================ */

function updateGreeting() {
    const h = new Date().getHours();
    const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const el = document.getElementById("dashGreeting");
    if (el) el.textContent = `${greet}! Here's your spending overview.`;
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function switchTab(tabId, linkEl) {
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    const panel = document.getElementById("tab-" + tabId);
    if (panel) panel.classList.add("active");
    if (linkEl) linkEl.classList.add("active");
    closeMobileSidebar();

    if (tabId === "dashboard") { renderDashboard(); }
    if (tabId === "expenses")  { applyFilters(); }
    if (tabId === "budget")    { renderBudget(); }
    if (tabId === "analytics") { renderAnalytics(); }
}

function toggleSidebar() {
    const sb  = document.getElementById("sidebar");
    const ovl = document.getElementById("sidebarOverlay");
    sb.classList.toggle("open");
    ovl.classList.toggle("open");
}
function closeMobileSidebar() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebarOverlay")?.classList.remove("open");
}

/* ============================================================
   TOAST
   ============================================================ */

let toastTimer = null;
function showToast(msg, type = "info") {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove("show"); }, 3000);
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function renderDashboard() {
    const expenses = getExpenses();
    const now      = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const monthlyExpenses = expenses.filter(e => isoToMonthKey(e.date) === monthKey);

    const total      = expenses.reduce((s,e) => s + +e.amount, 0);
    const monthTotal = monthlyExpenses.reduce((s,e) => s + +e.amount, 0);

    // daily average over last 30 days
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
    const last30 = expenses.filter(e => e.date && new Date(e.date) >= cutoff);
    const avgDaily = last30.length ? (last30.reduce((s,e) => s + +e.amount,0) / 30) : 0;

    setText("kpiTotal",  fmtINR(total));
    setText("kpiMonth",  fmtINR(monthTotal));
    setText("kpiAvg",    fmtINR(avgDaily));
    setText("kpiCount",  expenses.length);

    renderDashboardCharts();

    // Recent 5
    const recent = [...expenses].sort((a,b) => b.id - a.id).slice(0, 5);
    const list = document.getElementById("recentList");
    if (list) {
        if (!recent.length) {
            list.innerHTML = `<div class="empty-state" style="padding:24px 0"><p>No expenses yet</p></div>`;
        } else {
            list.innerHTML = recent.map(e => expenseItemHTML(e)).join("");
        }
    }
}

/* ============================================================
   CHARTS
   ============================================================ */

function getChartColors() {
    const isDark = document.body.classList.contains("dark");
    return {
        grid:   isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
        text:   isDark ? "#8b949e" : "#6b7280",
        border: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    };
}

function renderDashboardCharts() {
    renderTrendChart();
    renderDonutChart();
}

function renderTrendChart() {
    const period = parseInt(document.getElementById("trendPeriod")?.value || "30", 10);
    const expenses = getExpenses();
    const now = new Date();
    const labels = [];
    const data   = [];

    for (let i = period - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const label = period <= 7 ? iso.slice(5) : (i === 0 ? "Today" : iso.slice(5));
        labels.push(label);
        const sum = expenses.filter(e => e.date === iso).reduce((s,e) => s + +e.amount, 0);
        data.push(sum);
    }

    const ctx = document.getElementById("trendChart");
    if (!ctx) return;
    const { grid, text } = getChartColors();

    if (trendChartInst) trendChartInst.destroy();
    trendChartInst = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Spending",
                data,
                fill: true,
                backgroundColor: "rgba(99,102,241,0.12)",
                borderColor: "#6366f1",
                borderWidth: 2.5,
                pointBackgroundColor: "#818cf8",
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: grid }, ticks: { color: text, maxTicksLimit: 8, maxRotation: 0, font: { size: 11 } } },
                y: { grid: { color: grid }, ticks: { color: text, callback: v => "₹"+v, font: { size: 11 } } },
            },
        }
    });
}

function renderDonutChart() {
    const expenses = getExpenses();
    const catMap = {};
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + +e.amount; });
    const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0,6);
    const labels = sorted.map(([k]) => k);
    const values = sorted.map(([,v]) => v);
    const colors = labels.map(l => CATEGORIES[l]?.color || "#64748b");

    const ctx = document.getElementById("donutChart");
    if (!ctx) return;
    const { text } = getChartColors();

    if (donutChartInst) donutChartInst.destroy();
    donutChartInst = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: "transparent", hoverOffset: 8 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: { position: "bottom", labels: { color: text, font: { size: 11 }, padding: 10, boxWidth: 12 } },
                tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmtINR(ctx.parsed)}` } },
            },
        }
    });
}

/* ============================================================
   EXPENSE LIST & FILTERS
   ============================================================ */

function populateMonthFilter() {
    const expenses = getExpenses();
    const months   = [...new Set(expenses.map(e => isoToMonthKey(e.date)))].sort().reverse();

    ["filterMonth", "analyticsMonth"].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const keep = Array.from(sel.options).filter(o => o.value === "").map(o => o.outerHTML).join("");
        sel.innerHTML = keep + months.map(m => `<option value="${m}">${monthLabel(m+"-01")}</option>`).join("");
    });
}

function applyFilters() {
    currentPage = 1;
    const search  = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const catF    = document.getElementById("filterCategory")?.value || "";
    const monthF  = document.getElementById("filterMonth")?.value || "";
    const sort    = document.getElementById("sortOrder")?.value || "newest";

    let list = getExpenses();

    if (search) list = list.filter(e => e.name.toLowerCase().includes(search) || (e.note||"").toLowerCase().includes(search));
    if (catF)   list = list.filter(e => e.category === catF);
    if (monthF) list = list.filter(e => isoToMonthKey(e.date) === monthF);

    list.sort((a,b) => {
        if (sort === "newest")  return b.id - a.id;
        if (sort === "oldest")  return a.id - b.id;
        if (sort === "highest") return +b.amount - +a.amount;
        if (sort === "lowest")  return +a.amount - +b.amount;
        return 0;
    });

    filteredExpenses = list;
    renderExpensePage();
    renderPagination();
}

function renderExpensePage() {
    const list = document.getElementById("expenseList");
    const empty = document.getElementById("emptyState");
    if (!list) return;

    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = filteredExpenses.slice(start, start + PAGE_SIZE);

    if (!filteredExpenses.length) {
        list.innerHTML = "";
        if (empty) empty.style.display = "block";
    } else {
        if (empty) empty.style.display = "none";
        list.innerHTML = page.map(e => expenseItemHTML(e)).join("");
    }
}

function expenseItemHTML(e) {
    const cat  = CATEGORIES[e.category] || CATEGORIES.Other;
    const note = e.note ? `<span class="expense-note">· ${escHtml(e.note)}</span>` : "";
    return `
        <div class="expense-item" data-id="${e.id}">
            <div class="expense-cat-icon" style="background:${cat.bg};color:${cat.color};">${cat.emoji}</div>
            <div class="expense-main">
                <div class="expense-name">${escHtml(e.name)}</div>
                <div class="expense-meta">
                    <span class="expense-date">${formatDisplayDate(e.date)}</span>
                    <span class="cat-badge" style="background:${cat.bg};color:${cat.color};">${e.category||"Other"}</span>
                    ${note}
                </div>
            </div>
            <div class="expense-right">
                <span class="expense-amount">${fmtINR(e.amount)}</span>
                <div class="expense-actions">
                    <button class="btn-icon edit" title="Edit" onclick="editExpense(${e.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
                    </button>
                    <button class="btn-icon danger" title="Delete" onclick="deleteExpense(${e.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14H5V6"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>
                    </button>
                </div>
            </div>
        </div>`;
}

function renderPagination() {
    const total = Math.ceil(filteredExpenses.length / PAGE_SIZE);
    const pg = document.getElementById("pagination");
    if (!pg) return;
    if (total <= 1) { pg.innerHTML = ""; return; }

    let html = "";
    if (currentPage > 1) html += `<button class="page-btn" onclick="goPage(${currentPage-1})">←</button>`;
    for (let i = 1; i <= total; i++) {
        html += `<button class="page-btn ${i===currentPage?"active":""}" onclick="goPage(${i})">${i}</button>`;
    }
    if (currentPage < total) html += `<button class="page-btn" onclick="goPage(${currentPage+1})">→</button>`;
    pg.innerHTML = html;
}

function goPage(n) {
    currentPage = n;
    renderExpensePage();
    renderPagination();
    document.getElementById("expenseList")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ============================================================
   FORM — ADD / EDIT
   ============================================================ */

function handleFormSubmit(e) {
    e.preventDefault();

    const name     = document.getElementById("expenseName").value.trim();
    const amountRaw = document.getElementById("expenseAmount").value;
    const cat      = document.getElementById("expenseCategory").value;
    const date     = document.getElementById("expenseDate").value;
    const note     = document.getElementById("expenseNote").value.trim();
    const editId   = document.getElementById("editExpenseId").value;

    if (!name || !amountRaw || !cat || !date) { showToast("Please fill all required fields.", "error"); return; }

    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount <= 0) { showToast("Enter a valid positive amount.", "error"); return; }

    let expenses = getExpenses();

    if (editId) {
        const idx = expenses.findIndex(x => x.id === +editId);
        if (idx !== -1) {
            expenses[idx] = { ...expenses[idx], name, amount, category: cat, date, note };
            showToast("Expense updated!", "success");
        }
        cancelEdit();
    } else {
        expenses.unshift({ id: Date.now(), name, amount, category: cat, date, note });
        showToast("Expense added!", "success");
    }

    saveExpenses(expenses);
    populateMonthFilter();
    applyFilters();
    renderDashboard();

    // Reset form
    document.getElementById("expenseName").value  = "";
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseCategory").value = "";
    document.getElementById("expenseNote").value   = "";
    document.getElementById("expenseDate").value   = todayISO();
    document.getElementById("expenseName").focus();
}

function editExpense(id) {
    const expenses = getExpenses();
    const e = expenses.find(x => x.id === id);
    if (!e) return;

    document.getElementById("editExpenseId").value   = e.id;
    document.getElementById("expenseName").value     = e.name;
    document.getElementById("expenseAmount").value   = e.amount;
    document.getElementById("expenseCategory").value = e.category;
    document.getElementById("expenseDate").value     = e.date;
    document.getElementById("expenseNote").value     = e.note || "";

    const submitBtn = document.getElementById("submitBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    if (submitBtn) { submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="m5 12 5 5L20 7"/></svg> Update Expense`; }
    if (cancelBtn) cancelBtn.style.display = "inline-flex";

    const title = document.getElementById("formTitle");
    if (title) title.textContent = "Edit Expense";

    // Switch to expenses tab
    switchTab("expenses", document.querySelector("[data-tab=expenses]"));
    setTimeout(() => {
        document.getElementById("formCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("expenseName")?.focus();
    }, 200);
}

function cancelEdit() {
    document.getElementById("editExpenseId").value = "";
    document.getElementById("expenseName").value   = "";
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseCategory").value = "";
    document.getElementById("expenseNote").value   = "";
    document.getElementById("expenseDate").value   = todayISO();

    const submitBtn = document.getElementById("submitBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    if (submitBtn) { submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M12 5v14"/><path d="M5 12h14"/></svg> Add Expense`; }
    if (cancelBtn) cancelBtn.style.display = "none";

    const title = document.getElementById("formTitle");
    if (title) title.textContent = "Add New Expense";
}

function deleteExpense(id) {
    if (!confirm("Delete this expense? This cannot be undone.")) return;

    const editId = document.getElementById("editExpenseId")?.value;
    if (+editId === id) cancelEdit();

    let expenses = getExpenses().filter(x => x.id !== id);
    saveExpenses(expenses);
    populateMonthFilter();
    applyFilters();
    renderDashboard();
    showToast("Expense deleted.", "info");
}

/* ============================================================
   EXPORT CSV
   ============================================================ */

function exportCSV() {
    const expenses = filteredExpenses.length ? filteredExpenses : getExpenses();
    if (!expenses.length) { showToast("No expenses to export.", "error"); return; }

    const header = ["Name", "Category", "Amount", "Date", "Note"];
    const rows   = expenses.map(e => [
        `"${(e.name||"").replace(/"/g,'""')}"`,
        e.category || "",
        e.amount,
        e.date || "",
        `"${(e.note||"").replace(/"/g,'""')}"`
    ].join(","));

    const csv  = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `expenses_${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported!", "success");
}

/* ============================================================
   BUDGET
   ============================================================ */

function renderBudget() {
    const budgets  = getBudgets();
    const expenses = getExpenses();
    const now      = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const monthly  = expenses.filter(e => isoToMonthKey(e.date) === monthKey);

    const totalBudget = Object.values(budgets).reduce((s,v) => s + +v, 0);
    const totalSpent  = monthly.reduce((s,e) => s + +e.amount, 0);

    setText("budgetOvTotal", fmtINR(totalBudget) || "Not set");
    setText("budgetOvSpent", `${fmtINR(totalSpent)} spent this month`);

    renderBudgetRing(totalSpent, totalBudget);

    const list = document.getElementById("budgetList");
    if (!list) return;

    const cats = Object.keys(budgets);
    if (!cats.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div><p>No budgets set</p><span>Click "Set Budget" to add category limits</span></div>`;
        return;
    }

    list.innerHTML = cats.map(cat => {
        const cfg = CATEGORIES[cat] || CATEGORIES.Other;
        const limit  = +budgets[cat];
        const spent  = monthly.filter(e => e.category === cat).reduce((s,e) => s + +e.amount, 0);
        const pct    = limit ? Math.min(100, (spent / limit) * 100) : 0;
        const cls    = pct >= 100 ? "over" : pct >= 80 ? "warn" : "";
        const fill   = cls === "over" ? "#ef4444" : cls === "warn" ? "#f59e0b" : cfg.color;
        return `
            <div class="budget-row">
                <div class="budget-row-head">
                    <div class="budget-cat">
                        <span style="font-size:1.3rem">${cfg.emoji}</span>
                        <span>${cat}</span>
                    </div>
                    <div class="budget-amounts">
                        <strong>${fmtINR(spent)}</strong> / ${fmtINR(limit)}
                        ${pct >= 100 ? '<span style="color:#ef4444;font-weight:700;margin-left:6px">Over!</span>' : pct >= 80 ? '<span style="color:#f59e0b;font-weight:700;margin-left:6px">Near limit</span>' : ""}
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${cls}" style="width:${pct}%;background:${fill}"></div>
                </div>
            </div>`;
    }).join("");
}

function renderBudgetRing(spent, total) {
    const ctx = document.getElementById("budgetRing");
    if (!ctx) return;
    const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
    setText("budgetRingPct", Math.round(pct) + "%");

    const color = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#10b981";

    if (ringChartInst) ringChartInst.destroy();
    ringChartInst = new Chart(ctx, {
        type: "doughnut",
        data: {
            datasets: [{
                data: [pct, 100 - pct],
                backgroundColor: [color, "rgba(255,255,255,0.15)"],
                borderWidth: 0,
                hoverOffset: 0,
            }]
        },
        options: {
            responsive: false,
            cutout: "72%",
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            animation: { animateRotate: true, duration: 700 },
        }
    });
}

function openBudgetModal() {
    document.getElementById("budgetModal").classList.add("open");
    document.getElementById("budgetAmount").focus();
}
function closeBudgetModal(e) {
    if (e.target === document.getElementById("budgetModal")) closeBudgetModalForce();
}
function closeBudgetModalForce() {
    document.getElementById("budgetModal").classList.remove("open");
    document.getElementById("budgetAmount").value = "";
}
function saveBudget() {
    const cat    = document.getElementById("budgetCategory").value;
    const amount = parseFloat(document.getElementById("budgetAmount").value);
    if (!cat || isNaN(amount) || amount <= 0) { showToast("Enter a valid budget amount.", "error"); return; }
    const budgets = getBudgets();
    budgets[cat] = amount;
    saveBudgets(budgets);
    closeBudgetModalForce();
    renderBudget();
    showToast(`Budget set for ${cat}!`, "success");
}

/* ============================================================
   ANALYTICS
   ============================================================ */

function renderAnalytics() {
    const selMonthEl = document.getElementById("analyticsMonth");
    const selMonth   = selMonthEl?.value || "";
    const expenses   = getExpenses();

    // Monthly comparison bar chart (last 6 months)
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        months.push({ key, label: monthLabel(key+"-01") });
    }

    const barValues = months.map(m =>
        expenses.filter(e => isoToMonthKey(e.date) === m.key).reduce((s,e) => s + +e.amount, 0)
    );

    const ctxBar = document.getElementById("barChart");
    const { grid, text } = getChartColors();
    if (ctxBar) {
        if (barChartInst) barChartInst.destroy();
        barChartInst = new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: months.map(m => m.label),
                datasets: [{
                    label: "Spending",
                    data: barValues,
                    backgroundColor: months.map((m,i) =>
                        i === months.length-1 ? "#6366f1" : "rgba(99,102,241,0.45)"
                    ),
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: grid }, ticks: { color: text, font: { size: 11 } } },
                    y: { grid: { color: grid }, ticks: { color: text, callback: v => "₹"+v, font: { size: 11 } } },
                }
            }
        });
    }

    // Category pie for selected month
    const filtered = selMonth
        ? expenses.filter(e => isoToMonthKey(e.date) === selMonth)
        : expenses;

    const catMap = {};
    filtered.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + +e.amount; });
    const catSorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]);

    const ctxPie = document.getElementById("pieChart");
    if (ctxPie) {
        if (pieChartInst) pieChartInst.destroy();
        pieChartInst = new Chart(ctxPie, {
            type: "pie",
            data: {
                labels: catSorted.map(([k]) => k),
                datasets: [{
                    data: catSorted.map(([,v]) => v),
                    backgroundColor: catSorted.map(([k]) => CATEGORIES[k]?.color || "#64748b"),
                    borderWidth: 2,
                    borderColor: "transparent",
                    hoverOffset: 8,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom", labels: { color: text, font: { size: 11 }, padding: 8, boxWidth: 12 } },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmtINR(ctx.parsed)}` } },
                }
            }
        });
    }

    // Top categories
    const topEl = document.getElementById("topCategoryList");
    if (topEl) {
        const grandTotal = catSorted.reduce((s,[,v]) => s + v, 0);
        topEl.innerHTML = catSorted.slice(0, 6).map(([cat, amt]) => {
            const cfg = CATEGORIES[cat] || CATEGORIES.Other;
            const pct = grandTotal ? (amt / grandTotal * 100) : 0;
            return `
                <div class="top-cat-row">
                    <span class="top-cat-emoji">${cfg.emoji}</span>
                    <span class="top-cat-name">${cat}</span>
                    <div class="top-cat-bar-wrap">
                        <div class="top-cat-bar" style="width:${pct}%;background:${cfg.color}"></div>
                    </div>
                    <span class="top-cat-amount">${fmtINR(amt)}</span>
                </div>`;
        }).join("") || `<p style="color:var(--text-3);text-align:center;padding:20px">No data for this period</p>`;
    }
}

/* ============================================================
   UTILITY
   ============================================================ */

function fmtINR(n) {
    const num = +n || 0;
    return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ============================================================
   INIT
   ============================================================ */

window.addEventListener("DOMContentLoaded", () => {
    // Theme
    const theme = localStorage.getItem(THEME_KEY);
    if (theme === "light") {
        document.body.classList.remove("dark");
    } else {
        document.body.classList.add("dark");
    }
    updateThemeIcon();

    // Default date
    const dateInput = document.getElementById("expenseDate");
    if (dateInput) dateInput.value = todayISO();

    // Form
    document.getElementById("expenseForm")?.addEventListener("submit", handleFormSubmit);

    // Sidebar overlay (mobile)
    const ovl = document.createElement("div");
    ovl.className = "sidebar-overlay";
    ovl.id = "sidebarOverlay";
    ovl.onclick = closeMobileSidebar;
    document.body.appendChild(ovl);

    // Greet
    updateGreeting();

    // Populate month filters
    populateMonthFilter();

    // Render all
    renderDashboard();
    applyFilters();
    renderBudget();
    renderAnalytics();
});
