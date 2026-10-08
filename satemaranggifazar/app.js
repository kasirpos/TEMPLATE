/* =========================================================
   POS KASIR - APP LOGIC (FINAL v7)
   Login STRICT: wajib cloud, tidak ada fallback lokal
   ========================================================= */

/* ==========================================
   0. API CLIENT
   ========================================== */
const CFG = window.APP_CONFIG || {};
const API_URL   = CFG.API_BASE || '';
const STORE_NAME = CFG.STORE_NAME || 'Sate Maranggi Fazar';

const __taxPercent = (CFG.TAX_PERCENT !== undefined && CFG.TAX_PERCENT !== null && !isNaN(CFG.TAX_PERCENT)) 
    ? Number(CFG.TAX_PERCENT) 
    : 10;
const TAX_RATE_CONST = __taxPercent / 100;

const api = {
    async call(action, payload = {}) {
        if (!API_URL || API_URL.includes('GANTI_INI')) {
            console.warn('⚠️ API_URL belum dikonfigurasi di config.js');
            return null;
        }
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action, ...payload })
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            return json.data;
        } catch (err) {
            console.error('❌ API Error [' + action + ']:', err);
            return null;
        }
    },

    /* Strict login — return detail status */
    loginUserStrict(username, pin) {
        return new Promise(async (resolve) => {
            if (!API_URL || API_URL.includes('GANTI_INI')) {
                resolve({ status: 'config_error' });
                return;
            }
            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
    action: 'loginUser',
    data: { username, pin }
})
                });
                const json = await res.json();

                if (json.success) {
                    if (json.data && json.data.ok && json.data.user) {
                        resolve({ status: 'ok', user: json.data.user });
                    } else {
                        resolve({ status: 'denied', error: (json.data && json.data.error) || 'Login gagal' });
                    }
                } else {
                    // json.success === false → token expired / tenant nonaktif / dll
                    resolve({ status: 'denied', error: json.error });
                }
            } catch (err) {
                resolve({ status: 'offline', error: err.toString() });
            }
        });
    },

    getAll()             { return this.call('getAll'); },
    saveProduct(p)       { return this.call('saveProduct', { data: p }); },
    deleteProduct(id)    { return this.call('deleteProduct', { id }); },
    saveTransaction(t)   { return this.call('saveTransaction', { data: t }); },
    voidTransaction(id)  { return this.call('voidTransaction', { id }); },
    hideTransaction(id)  { return this.call('hideTransaction', { id }); },
    deleteTransaction(id){ return this.call('deleteTransaction', { id }); },
    saveCoupon(c)        { return this.call('saveCoupon', { data: c }); },
    deleteCoupon(code)   { return this.call('deleteCoupon', { code }); },
    saveCashFlow(c)      { return this.call('saveCashFlow', { data: c }); },
    bulkSave(data)       { return this.call('bulkSave', { data }); },
    updateUserPin(username, oldPin, newPin) {
        return this.call('updateUserPin', { data: { username, oldPin, newPin } });
    }
};

let __syncTimer = null;
let __cloudOnline = false;
let __refreshLock = false;

function updateCloudStatus(online) {
    __cloudOnline = online;
    const el = document.getElementById('cloud-status');
    const txt = document.getElementById('cloud-status-text');
    if (!el || !txt) return;
    el.classList.add('show');
    el.classList.toggle('online', online);
    el.classList.toggle('offline', !online);
    txt.textContent = online ? 'Cloud OK' : 'Offline';
    setTimeout(() => el.classList.remove('show'), 3000);
}

function syncToCloud() {
    clearTimeout(__syncTimer);
    __syncTimer = setTimeout(async () => {
        const res = await api.bulkSave({ products, coupons, bills: savedBills });
        if (res) {
            updateCloudStatus(true);
            console.log('☁️ Sync to cloud OK');
        } else {
            updateCloudStatus(false);
        }
    }, 500);
}

async function loadFromCloud() {
    const cloud = await api.getAll();
    if (!cloud) { updateCloudStatus(false); return false; }
    if (cloud.products && cloud.products.length) {
        products = cloud.products;
        localStorage.setItem('luxe_pos_products', JSON.stringify(products));
    }
    if (cloud.transactions && cloud.transactions.length) {
        transactionHistory = cloud.transactions;
        localStorage.setItem('luxe_pos_history', JSON.stringify(transactionHistory));
    }
    if (cloud.coupons && cloud.coupons.length) {
        coupons = cloud.coupons;
        localStorage.setItem('luxe_pos_coupons', JSON.stringify(coupons));
    }
    if (cloud.bills && cloud.bills.length) {
        savedBills = cloud.bills;
        localStorage.setItem('luxe_pos_saved_bills', JSON.stringify(savedBills));
    }
    updateCloudStatus(true);
    console.log('☁️ Load from cloud OK');
    return true;
}

/* =========================================
   AUTO SYNC
   ========================================= */
function hashData(obj) {
    try { return JSON.stringify(obj); } catch(e) { return ''; }
}

async function silentRefresh() {
    if (currentUserRole === 'guest' || !currentUsername) return;
    const activeTag = document.activeElement?.tagName;
    if (activeTag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn && syncBtn.classList.contains('syncing')) return;
    if (__refreshLock) return;
    __refreshLock = true;
    try {
        const fresh = await api.getAll();
        if (!fresh) { updateCloudStatus(false); return; }
        let hasChange = false;
        if (fresh.products && hashData(fresh.products) !== hashData(products)) {
            products = fresh.products;
            localStorage.setItem('luxe_pos_products', JSON.stringify(products));
            hasChange = true;
        }
        if (fresh.transactions && hashData(fresh.transactions) !== hashData(transactionHistory)) {
            transactionHistory = fresh.transactions;
            localStorage.setItem('luxe_pos_history', JSON.stringify(transactionHistory));
            hasChange = true;
        }
        if (fresh.coupons && hashData(fresh.coupons) !== hashData(coupons)) {
            coupons = fresh.coupons;
            localStorage.setItem('luxe_pos_coupons', JSON.stringify(coupons));
            hasChange = true;
        }
        if (fresh.bills && hashData(fresh.bills) !== hashData(savedBills)) {
            savedBills = fresh.bills;
            localStorage.setItem('luxe_pos_saved_bills', JSON.stringify(savedBills));
            hasChange = true;
        }
        if (hasChange) {
            console.log('🔄 Data berubah dari cloud');
            renderProducts(products, 'menu-items');
            renderPopularItems();
            renderHistory();
            renderSavedBills();
            updateDashboardMetrics();
            if (typeof renderCouponManagement === 'function' && currentUserRole === 'admin') renderCouponManagement();
            if (document.getElementById('laporan')?.classList.contains('active')) renderLaporanData();
        }
        updateCloudStatus(true);
    } catch (err) {
        console.error('❌ Silent refresh error:', err);
    } finally {
        __refreshLock = false;
    }
}

async function manualSync() {
    const btn = document.getElementById('sync-btn');
    if (!btn || btn.classList.contains('syncing')) return;
    btn.classList.remove('success', 'error');
    btn.classList.add('syncing');
    try {
        const fresh = await api.getAll();
        if (!fresh) {
            updateCloudStatus(false);
            btn.classList.add('error');
            setTimeout(() => btn.classList.remove('error'), 2000);
            return;
        }
        if (fresh.products) {
            products = fresh.products;
            localStorage.setItem('luxe_pos_products', JSON.stringify(products));
        }
        if (fresh.transactions) {
            transactionHistory = fresh.transactions;
            localStorage.setItem('luxe_pos_history', JSON.stringify(transactionHistory));
        }
        if (fresh.coupons) {
            coupons = fresh.coupons;
            localStorage.setItem('luxe_pos_coupons', JSON.stringify(coupons));
        }
        if (fresh.bills) {
            savedBills = fresh.bills;
            localStorage.setItem('luxe_pos_saved_bills', JSON.stringify(savedBills));
        }
        renderProducts(products, 'menu-items');
        renderPopularItems();
        renderHistory();
        renderSavedBills();
        updateDashboardMetrics();
        if (typeof renderCouponManagement === 'function' && currentUserRole === 'admin') renderCouponManagement();
        if (document.getElementById('laporan')?.classList.contains('active')) renderLaporanData();
        updateCloudStatus(true);
        btn.classList.add('success');
        setTimeout(() => btn.classList.remove('success'), 1200);
        console.log('✅ Manual sync OK');
    } catch (err) {
        console.error('❌ Manual sync error:', err);
        btn.classList.add('error');
        setTimeout(() => btn.classList.remove('error'), 2000);
    } finally {
        setTimeout(() => btn.classList.remove('syncing'), 400);
    }
}

function setupAutoSync() {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) silentRefresh();
    });
    window.addEventListener('focus', () => silentRefresh());
    window.addEventListener('online', () => silentRefresh());
    setInterval(silentRefresh, 120000);
    console.log('✅ Auto sync aktif');
}

function applyBranding() {
    document.title = 'POS Kasir App : ' + STORE_NAME;
    const loginTitle = document.getElementById('login-store-name');
    if (loginTitle) loginTitle.textContent = STORE_NAME;
    const loginSlogan = document.getElementById('login-store-slogan');
    if (loginSlogan && CFG.STORE_SLOGAN) loginSlogan.textContent = CFG.STORE_SLOGAN;
    const headerTitle = document.getElementById('current-user');
    if (headerTitle && headerTitle.textContent.includes('Kala Space')) {
        headerTitle.textContent = STORE_NAME;
    }
    const receiptStore = document.getElementById('receipt-store-name');
    if (receiptStore) receiptStore.textContent = STORE_NAME;
    const receiptFooter = document.getElementById('receipt-footer-text');
    if (receiptFooter) receiptFooter.textContent = 'Sampai jumpa kembali di ' + STORE_NAME;
    const kitchenStore = document.getElementById('kitchen-store-name');
    if (kitchenStore) kitchenStore.textContent = STORE_NAME.toUpperCase() + ' - KITCHEN';
    const badge = document.getElementById('version-badge');
    if (badge && CFG.VERSION) badge.textContent = CFG.VERSION;
    const taxPercent = (CFG.TAX_PERCENT !== undefined && CFG.TAX_PERCENT !== null) ? CFG.TAX_PERCENT : 10;
    const taxLabelEl = document.getElementById('tax-label');
    if (taxLabelEl) taxLabelEl.textContent = 'Pajak (' + taxPercent + '%)';
    const modalTaxLabelEl = document.getElementById('modal-tax-label');
    if (modalTaxLabelEl) modalTaxLabelEl.textContent = 'Pajak (' + taxPercent + '%)';
    const srStoreNameEl = document.getElementById('sr-store-name');
    if (srStoreNameEl) srStoreNameEl.textContent = STORE_NAME.toUpperCase();
    const waEl = document.getElementById('contact-wa');
    if (waEl && CFG.SUPPORT_WA) {
        waEl.innerHTML = '<i class="ri-whatsapp-line" style="color: var(--success);"></i> +' + CFG.SUPPORT_WA;
    }
    const igEl = document.getElementById('contact-ig');
    if (igEl && CFG.SUPPORT_IG) {
        igEl.innerHTML = '<i class="ri-instagram-line" style="color: var(--accent);"></i> ' + CFG.SUPPORT_IG;
    }
}

/* ==========================================
   1. UTILS
   ========================================== */
function getLocalDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function getCurrentYearMonth() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return year + '-' + month;
}

function normalizeTrxDate(val) {
    if (!val) return '';
    if (typeof val === 'string') return val.substring(0, 10);
    return '';
}

function updateGreeting() {
    const currentHour = new Date().getHours();
    let greeting = "Selamat Pagi";
    if (currentHour >= 12 && currentHour < 15) greeting = "Selamat Siang";
    else if (currentHour >= 15 && currentHour < 18) greeting = "Selamat Sore";
    else if (currentHour >= 18) greeting = "Selamat Malam";
    const shiftElement = document.getElementById('current-cashier-shift');
    if (shiftElement) shiftElement.innerText = greeting;
}

/* ==========================================
   2. MODAL CONTROLLERS
   ========================================== */
function openModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) { modal.style.display = 'flex'; modal.classList.add('active'); }
}
function closeModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
}
function openKitchenModal() {
    const modal = document.getElementById('kitchen-modal');
    if (modal) { modal.style.display = 'flex'; modal.classList.add('active'); }
}
function closeKitchenModal() {
    const modal = document.getElementById('kitchen-modal');
    if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
}
function openShiftReceiptModal() {
    const modal = document.getElementById('shift-receipt-modal');
    if (modal) { modal.style.display = 'flex'; modal.classList.add('active'); }
}
function closeShiftReceiptModal() {
    const modal = document.getElementById('shift-receipt-modal');
    if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
}

/* ==========================================
   3. STATE
   ========================================== */
const defaultProducts = [
    { id: 1, name: "espresso single", category: "Drink", price: 18000, hpp: 5000, discountType: "percent", discountValue: 0, icon: "ri-cup-line", image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=300&q=80" },
    { id: 2, name: "iced caramel latte", category: "Drink", price: 28000, hpp: 10000, discountType: "percent", discountValue: 0, icon: "ri-cup-line", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80" },
    { id: 3, name: "nasi goreng special", category: "Food", price: 35000, hpp: 15000, discountType: "percent", discountValue: 0, icon: "ri-restaurant-line", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80" },
    { id: 4, name: "chicken steak", category: "Food", price: 45000, hpp: 22000, discountType: "percent", discountValue: 0, icon: "ri-restaurant-line", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300&q=80" },
    { id: 5, name: "french fries", category: "Snack", price: 20000, hpp: 8000, discountType: "percent", discountValue: 0, icon: "ri-goblet-line", image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&q=80" },
    { id: 7, name: "choco lava cake", category: "Dessert", price: 25000, hpp: 11000, discountType: "percent", discountValue: 0, icon: "ri-cake-3-line", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80" }
];

let products = JSON.parse(localStorage.getItem('luxe_pos_products')) || defaultProducts;
let transactionHistory = JSON.parse(localStorage.getItem('luxe_pos_history')) || [];
let savedBills = JSON.parse(localStorage.getItem('luxe_pos_saved_bills')) || [];
let currentPinCode = localStorage.getItem('luxe_pos_pin') || (CFG.DEFAULT_PIN || "1234");

// Kredensial per-user (username → {pin, role})
let userCredentials = JSON.parse(localStorage.getItem('luxe_pos_credentials')) || {};

const defaultCoupons = [{ code: "JumatBerkah", type: "percent", value: 10, limit: 100, used: 0, active: true }];
let coupons = JSON.parse(localStorage.getItem('luxe_pos_coupons')) || defaultCoupons;
let activeAppliedCoupon = null;

let currentUserRole = "kasir";
let currentUsername = "";
let cart = [];
let grandTotal = 0;
let couponDiscountAmount = 0;
let currentEditingBillId = null;
let salesChartInstance = null;
let productToDeleteId = null;
let currentSelectedMonth = getCurrentYearMonth();
let isHistorySelectionMode = false;

let modalAwal = parseFloat(localStorage.getItem('pos_modal_awal')) || 0;
let pettyCashList = JSON.parse(localStorage.getItem('pos_petty_cash')) || [];

const payAudio = new Audio('https://res.cloudinary.com/zjaiuouq/video/upload/v1788269773/money-sound-effect-128-ytshorts.savetube.me.mp3');
payAudio.preload = 'auto';

/* ==========================================
   4. STORAGE & THEME
   ========================================== */
function saveState() {
    localStorage.setItem('luxe_pos_products', JSON.stringify(products));
    localStorage.setItem('luxe_pos_history', JSON.stringify(transactionHistory));
    localStorage.setItem('luxe_pos_saved_bills', JSON.stringify(savedBills));
    localStorage.setItem('luxe_pos_pin', currentPinCode);
    localStorage.setItem('luxe_pos_coupons', JSON.stringify(coupons));
    syncToCloud();
}

const DEFAULT_ACCENT = '#00A6FF';

function hexToRgba(hex, alpha = 0.15) {
    if (!hex) return 'rgba(0, 166, 255, ' + alpha + ')';
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return isNaN(num) || c.length !== 6 
        ? 'rgba(0, 166, 255, ' + alpha + ')' 
        : 'rgba(' + ((num >> 16) & 255) + ', ' + ((num >> 8) & 255) + ', ' + (num & 255) + ', ' + alpha + ')';
}

function highlightActivePreset(colorHex) {
    const presets = document.querySelectorAll('.accent-preset-btn');
    presets.forEach(btn => {
        const btnColor = btn.getAttribute('data-color');
        if (btnColor && btnColor.toLowerCase() === colorHex.toLowerCase()) {
            btn.style.outline = '2px solid var(--accent)';
            btn.style.outlineOffset = '2px';
            btn.style.transform = 'scale(1.1)';
        } else {
            btn.style.outline = 'none';
            btn.style.transform = 'scale(1)';
        }
    });
}

function syncUIElements(colorHex) {
    const previewBox = document.getElementById('accent-preview-box');
    const hexLabel = document.getElementById('accent-hex-label');
    const hexInput = document.getElementById('accent-hex-input');
    const formattedHex = colorHex.toUpperCase();
    if (previewBox) previewBox.style.backgroundColor = colorHex;
    if (hexLabel) hexLabel.textContent = formattedHex;
    if (hexInput && document.activeElement !== hexInput) hexInput.value = formattedHex;
}

function updateAppAccent(colorHex) {
    if (!colorHex || !colorHex.startsWith('#')) return;
    const cleanHex = colorHex.toLowerCase().trim();
    if (cleanHex === '#ffffff' || cleanHex === '#fff') {
        const currentSaved = localStorage.getItem('--accent') || DEFAULT_ACCENT;
        syncUIElements(currentSaved);
        return;
    }
    const accentLight = hexToRgba(colorHex, 0.15);
    document.documentElement.style.setProperty('--accent', colorHex);
    document.documentElement.style.setProperty('--accent-light', accentLight);
    const appWrapper = document.getElementById('app-wrapper');
    if (appWrapper) {
        appWrapper.style.setProperty('--accent', colorHex);
        appWrapper.style.setProperty('--accent-light', accentLight);
    }
    localStorage.setItem('--accent', colorHex);
    localStorage.setItem('--accent-light', accentLight);
    syncUIElements(colorHex);
    highlightActivePreset(colorHex);
}

function handleHexInput(val) {
    let cleanHex = val.trim();
    if (!cleanHex.startsWith('#')) cleanHex = '#' + cleanHex;
    if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(cleanHex)) updateAppAccent(cleanHex);
}

function initTheme() {
    const savedTheme = localStorage.getItem('luxe_pos_theme');
    const wrapper = document.getElementById('app-wrapper');
    const themeIcon = document.getElementById('theme-icon');
    if (savedTheme === 'dark' && wrapper) {
        wrapper.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.className = "ri-sun-line";
    }
    const savedAccent = localStorage.getItem('--accent') || DEFAULT_ACCENT;
    updateAppAccent(savedAccent);
}

function toggleTheme() {
    const wrapper = document.getElementById('app-wrapper');
    const themeIcon = document.getElementById('theme-icon');
    if (!wrapper) return;
    const currentTheme = wrapper.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        wrapper.removeAttribute('data-theme');
        if (themeIcon) themeIcon.className = "ri-moon-line";
        localStorage.setItem('luxe_pos_theme', 'light');
    } else {
        wrapper.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.className = "ri-sun-line";
        localStorage.setItem('luxe_pos_theme', 'dark');
    }
    const savedAccent = localStorage.getItem('--accent') || DEFAULT_ACCENT;
    updateAppAccent(savedAccent);
    if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
}

function resetLocalStorageData() {
    if (currentUserRole !== 'admin') { alert("Akses ditolak!"); return; }
    document.getElementById('reset-modal').style.display = 'flex';
}
function closeResetModal() { document.getElementById('reset-modal').style.display = 'none'; }
function confirmResetLocalStorageData() { closeResetModal(); localStorage.clear(); location.reload(); }

function exportLocalStorageJSON() {
    if (currentUserRole !== 'admin') { alert("Akses ditolak!"); return; }
    const allData = { products, history: transactionHistory, savedBills, coupons, pin: currentPinCode, theme: localStorage.getItem('luxe_pos_theme') || 'light' };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "pos_backup_" + getLocalDateString() + ".json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function triggerImportJSON() {
    if (currentUserRole !== 'admin') { alert("Akses ditolak!"); return; }
    const input = document.getElementById('json-import-input');
    if (input) input.click();
}

function importLocalStorageJSON(event) {
    if (currentUserRole !== 'admin') { alert("Akses ditolak!"); return; }
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.products) localStorage.setItem('luxe_pos_products', JSON.stringify(data.products));
            if (data.history) localStorage.setItem('luxe_pos_history', JSON.stringify(data.history));
            if (data.savedBills) localStorage.setItem('luxe_pos_saved_bills', JSON.stringify(data.savedBills));
            if (data.coupons) localStorage.setItem('luxe_pos_coupons', JSON.stringify(data.coupons));
            if (data.pin) localStorage.setItem('luxe_pos_pin', data.pin);
            alert("Data berhasil di-import!");
            location.reload();
        } catch (err) { alert("Format file JSON tidak valid!"); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

/* ==========================================
   5. AUTH — LOGIN STRICT (WAJIB CLOUD)
   ========================================== */
async function handleLogin() {
    const username = document.getElementById('kasir-name').value;
    const pin = document.getElementById('kasir-pin').value;

    if (!pin) { alert("PIN harus diisi!"); return; }

    // Tampilkan loading
    const loginBtn = document.querySelector('.btn-login');
    const originalText = loginBtn ? loginBtn.innerHTML : '';
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spinSync 0.8s linear infinite;"></i> MEMERIKSA...';
    }

    // WAJIB tanya cloud — tidak ada fallback
    const res = await api.loginUserStrict(username, pin);

    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
    }

    if (res.status === 'ok') {
        currentUserRole = res.user.role || 'kasir';
        currentUsername = res.user.username || username;

        userCredentials[username] = { pin: pin, role: currentUserRole };
        localStorage.setItem('luxe_pos_credentials', JSON.stringify(userCredentials));
        currentPinCode = pin;
        localStorage.setItem('luxe_pos_pin', pin);

        finishLogin();
        console.log('☁️ Login OK');
        return;
    }

    if (res.status === 'denied') {
        alert("Login ditolak:\n\n" + (res.error || 'PIN salah / user tidak valid'));
        document.getElementById('kasir-pin').value = '';
        return;
    }

    if (res.status === 'offline') {
        alert("Server tidak dapat dijangkau.\n\nCek koneksi internet atau hubungi admin.");
        return;
    }

    if (res.status === 'config_error') {
        alert("Konfigurasi API belum diatur.");
        return;
    }

    alert("Login gagal: unknown error");
}

function finishLogin() {
    document.getElementById('profile-name').innerText = currentUsername;
    applyRolePermissions();
    updateGreeting();

    const filterDateInput = document.getElementById('filter-date');
    if (filterDateInput && !filterDateInput.value) {
        filterDateInput.value = getLocalDateString();
    }

    updateDashboardMetrics();
    document.getElementById('login-view').style.display = 'none';
}

function handleLogout() { document.getElementById('logout-modal').style.display = 'flex'; }
function closeLogoutModal() { document.getElementById('logout-modal').style.display = 'none'; }
function confirmLogout() {
    closeLogoutModal();
    switchTab('home');
    document.getElementById('kasir-pin').value = CFG.DEFAULT_PIN || '1234';
    document.getElementById('login-view').style.display = 'flex';
    currentUsername = "";
    currentUserRole = 'kasir';
    // userCredentials tetap — login berikutnya tinggal masukkan PIN yang benar
}

function applyRolePermissions() {
    const btnAddMenu = document.getElementById('btn-add-menu-admin');
    const adminDropdown = document.getElementById('admin-actions-dropdown');
    const storageMenu = document.getElementById('menu-profile-storage');
    const adminStatsContainer = document.getElementById('admin-stats-container');
    const filterDateInput = document.getElementById('filter-date');
    const laporanShortcutContainer = document.getElementById('laporan-shortcut-container');
    const homeTitle = document.getElementById('home-section-title');
    const popularItems = document.getElementById('popular-items');
    const managementContainer = document.getElementById('admin-management-container');

    if (btnAddMenu) {
        btnAddMenu.classList.toggle('admin-visible', currentUserRole === 'admin');
    }

    if (currentUserRole === 'admin') {
        if (adminDropdown) adminDropdown.style.display = 'inline-block';
        if (storageMenu) storageMenu.style.display = 'block';
        if (adminStatsContainer) adminStatsContainer.style.display = 'block';
        if (filterDateInput) filterDateInput.style.display = 'inline-block';
        if (laporanShortcutContainer) laporanShortcutContainer.style.display = 'grid';
        if (homeTitle) homeTitle.textContent = 'Management Toko';
        if (popularItems) popularItems.style.display = 'none';
        if (managementContainer) managementContainer.style.display = 'grid';
    } else {
        if (adminDropdown) adminDropdown.style.display = 'none';
        if (storageMenu) storageMenu.style.display = 'none';
        if (adminStatsContainer) adminStatsContainer.style.display = 'none';
        if (filterDateInput) filterDateInput.style.display = 'none';
        if (laporanShortcutContainer) laporanShortcutContainer.style.display = 'none';
        if (homeTitle) homeTitle.textContent = 'Populer Hari Ini';
        if (popularItems) popularItems.style.display = 'grid';
        if (managementContainer) managementContainer.style.display = 'none';
    }
    renderProducts(products, 'menu-items');
    renderPopularItems();
}

function switchTab(tabId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const targetView = document.getElementById(tabId);
    if (targetView) targetView.classList.add('active');
    const tabs = ['home', 'menu', 'order', 'history', 'profile', 'laporan'];
    const activeNavIndex = tabs.indexOf(tabId);
    if (activeNavIndex !== -1) {
        const navItems = document.querySelectorAll('.nav-item');
        if (navItems[activeNavIndex]) navItems[activeNavIndex].classList.add('active');
    }
    if (tabId === 'home') { updateDashboardMetrics(); renderPopularItems(); }
    else if (tabId === 'saved-bills') renderSavedBills();
    else if (tabId === 'history') renderHistory();
    else if (tabId === 'laporan') renderLaporanData();
    else if (tabId === 'hpp-margin') { if (currentUserRole === 'admin') renderHPPManagement(); }
    else if (tabId === 'kupon-diskon') { if (currentUserRole === 'admin') renderCouponManagement(); }
    else if (tabId === 'diskon-produk') { if (currentUserRole === 'admin') renderProductDiscountManagement(); }
}

function toggleProfileAccordion(itemId) {
    const itemEl = document.getElementById(itemId);
    if (!itemEl) return;
    const isOpen = itemEl.classList.contains('open');
    document.querySelectorAll('.profile-menu-item').forEach(el => el.classList.remove('open'));
    if (!isOpen) itemEl.classList.add('open');
}

async function updatePassword() {
    const oldPinInput = document.getElementById('old-pin').value.trim();
    const newPinInput = document.getElementById('new-pin').value.trim();

    if (!newPinInput || newPinInput.length < 4) {
        alert("PIN baru minimal 4 karakter!");
        return;
    }

    if (!currentUsername) {
        alert("User tidak dikenal. Silakan login ulang.");
        return;
    }

    const res = await api.updateUserPin(currentUsername, oldPinInput, newPinInput);

    if (res && res.ok) {
        userCredentials[currentUsername] = { pin: newPinInput, role: currentUserRole };
        localStorage.setItem('luxe_pos_credentials', JSON.stringify(userCredentials));
        currentPinCode = newPinInput;
        localStorage.setItem('luxe_pos_pin', newPinInput);

        alert("PIN / Password berhasil diperbarui!");
        document.getElementById('old-pin').value = '';
        document.getElementById('new-pin').value = '';
        toggleProfileAccordion('menu-profile-password');
        return;
    }

    alert("Gagal update PIN: " + ((res && res.error) ? res.error : 'Cloud tidak tersedia'));
}

/* ==========================================
   6. PRODUCT MANAGEMENT
   ========================================== */
function calculateFinalPrice(p) {
    const originalPrice = p.price || 0;
    const discType = p.discountType || 'percent';
    const discVal = p.discountValue || 0;
    if (discVal <= 0) return originalPrice;
    if (discType === 'percent') {
        const cut = (originalPrice * discVal) / 100;
        return Math.max(0, originalPrice - cut);
    } else {
        return Math.max(0, originalPrice - discVal);
    }
}

function renderProducts(items, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    if (items.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 12px; margin: 20px 0;">Menu tidak ditemukan.</p>';
        return;
    }
    container.innerHTML = items.map(p => {
        const finalPrice = calculateFinalPrice(p);
        const hasDiscount = finalPrice < p.price;
        return `
        <div class="product-card">
            ${currentUserRole === 'admin' ? `
                <div class="admin-card-actions">
                    <button class="admin-card-btn admin-btn-edit" onclick="openEditMenuModal(${p.id})" title="edit menu"><i class="ri-edit-line"></i></button>
                    <button class="admin-card-btn admin-btn-delete" onclick="openDeleteMenuModal(${p.id})" title="hapus menu"><i class="ri-delete-bin-line"></i></button>
                </div>
            ` : ''}
            <div class="product-img">
                ${p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.onerror=null; this.parentNode.innerHTML='<i class=\\'${p.icon}\\'></i>';">` : `<i class="${p.icon}"></i>`}
            </div>
            <div class="product-title">${p.name}</div>
            <div class="product-footer">
                <div class="product-price">
                    ${hasDiscount ? `
                        <span style="text-decoration: line-through; font-size: 10px; color: var(--text-muted); display: block;">Rp ${p.price.toLocaleString('id-id')}</span>
                        <span style="color: var(--accent);">Rp ${finalPrice.toLocaleString('id-id')}</span>
                    ` : `<span>Rp ${p.price.toLocaleString('id-id')}</span>`}
                </div>
                <button class="add-btn" onclick="addToCart(${p.id}, event)"><i class="ri-add-line"></i></button>
            </div>
        </div>
        `;
    }).join('');
}

function renderPopularItems() {
    if (transactionHistory.length === 0) {
        renderProducts(products.slice(0, 4), 'popular-items');
        return;
    }
    const itemSales = {};
    transactionHistory.forEach(trx => {
        if (trx.isVoid) return;
        if (!Array.isArray(trx.items)) return;
        trx.items.forEach(item => { itemSales[item.id] = (itemSales[item.id] || 0) + item.qty; });
    });
    const sortedProducts = [...products].sort((a, b) => (itemSales[b.id] || 0) - (itemSales[a.id] || 0));
    renderProducts(sortedProducts.slice(0, 4), 'popular-items');
}

function filterCategory(cat, element) {
    document.querySelectorAll('.cat-chip').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    const filtered = cat === 'all' ? products : products.filter(p => p.category === cat);
    renderProducts(filtered, 'menu-items');
}

function handleSearch(query) {
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery !== '') {
        const activeTab = document.querySelector('.view.active').id;
        if (activeTab !== 'menu') switchTab('menu');
    }
    const filtered = products.filter(p => p.name.toLowerCase().includes(trimmedQuery));
    renderProducts(filtered, 'menu-items');
}

function openAddMenuModal() { document.getElementById('add-menu-modal').style.display = 'flex'; }
function closeAddMenuModal() {
    document.getElementById('add-menu-modal').style.display = 'none';
    document.getElementById('new-menu-name').value = '';
    document.getElementById('new-menu-price').value = '';
    document.getElementById('new-menu-image').value = '';
    document.getElementById('new-menu-hpp').value = '';
}

function addNewProduct() {
    if (currentUserRole !== 'admin') { alert('Hanya admin!'); return; }
    const name = document.getElementById('new-menu-name').value.trim();
    const category = document.getElementById('new-menu-category').value;
    const price = parseFloat(document.getElementById('new-menu-price').value);
    const imageUrl = document.getElementById('new-menu-image').value.trim();
    const hpp = parseFloat(document.getElementById('new-menu-hpp').value) || 0;
    if (!name || isNaN(price) || price <= 0) { alert('Isi nama dan harga dengan benar!'); return; }
    let icon = "ri-cup-line";
    if (category === "Food") icon = "ri-restaurant-line";
    if (category === "Snack") icon = "ri-goblet-line";
    if (category === "Dessert") icon = "ri-cake-3-line";
    const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = { id: newId, name, category, price, hpp, discountType: "percent", discountValue: 0, icon, image: imageUrl };
    products.push(newProduct);
    saveState();
    api.saveProduct(newProduct);
    closeAddMenuModal();
    renderProducts(products, 'menu-items');
    renderPopularItems();
}

function openEditMenuModal(productId) {
    if (currentUserRole !== 'admin') return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('edit-menu-id').value = product.id;
    document.getElementById('edit-menu-hpp').value = product.hpp || 0;
    document.getElementById('edit-menu-name').value = product.name;
    document.getElementById('edit-menu-category').value = product.category;
    document.getElementById('edit-menu-price').value = product.price;
    document.getElementById('edit-menu-image').value = product.image || '';
    document.getElementById('edit-menu-modal').style.display = 'flex';
}

function closeEditMenuModal() { document.getElementById('edit-menu-modal').style.display = 'none'; }

function saveEditProduct() {
    if (currentUserRole !== 'admin') { alert('Hanya admin!'); return; }
    const id = parseInt(document.getElementById('edit-menu-id').value);
    const name = document.getElementById('edit-menu-name').value.trim();
    const category = document.getElementById('edit-menu-category').value;
    const price = parseFloat(document.getElementById('edit-menu-price').value);
    const imageUrl = document.getElementById('edit-menu-image').value.trim();
    const hpp = parseFloat(document.getElementById('edit-menu-hpp').value) || 0;
    if (!name || isNaN(price) || price <= 0) { alert('Isi nama dan harga dengan benar!'); return; }
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex !== -1) {
        let icon = "ri-cup-line";
        if (category === "Food") icon = "ri-restaurant-line";
        if (category === "Snack") icon = "ri-goblet-line";
        if (category === "Dessert") icon = "ri-cake-3-line";
        products[productIndex] = { ...products[productIndex], name, category, price, hpp, icon, image: imageUrl };
        saveState();
        api.saveProduct(products[productIndex]);
        closeEditMenuModal();
        renderProducts(products, 'menu-items');
        renderPopularItems();
    }
}

function openDeleteMenuModal(productId) {
    if (currentUserRole !== 'admin') return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    productToDeleteId = productId;
    document.getElementById('delete-menu-text').innerText = 'Yakin hapus menu "' + product.name + '"?';
    document.getElementById('delete-menu-modal').style.display = 'flex';
}
function closeDeleteMenuModal() {
    productToDeleteId = null;
    document.getElementById('delete-menu-modal').style.display = 'none';
}
function confirmDeleteProduct() {
    if (currentUserRole !== 'admin') { alert('Hanya admin!'); return; }
    if (productToDeleteId !== null) {
        const deletedId = productToDeleteId;
        products = products.filter(p => p.id !== deletedId);
        saveState();
        api.deleteProduct(deletedId);
        closeDeleteMenuModal();
        renderProducts(products, 'menu-items');
        renderPopularItems();
    }
}

function renderHPPManagement() {
    const container = document.getElementById('hpp-product-list');
    if (!container) return;
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; font-size:11px; color:var(--text-muted);">Belum ada produk.</p>';
        return;
    }
    container.innerHTML = products.map(p => {
        const hppVal = p.hpp || 0;
        const priceVal = calculateFinalPrice(p);
        const profit = priceVal - hppVal;
        const marginPct = priceVal > 0 ? ((profit / priceVal) * 100).toFixed(1) : 0;
        return `
            <div style="background: var(--card-bg); padding: 10px; border-radius: 10px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 12px; color: var(--text-main); text-transform: capitalize;">${p.name}</strong>
                    <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: ${marginPct >= 50 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 166, 255,0.15)'}; color: ${marginPct >= 50 ? 'var(--success)' : 'var(--accent)'};">
                        Margin: ${marginPct}%
                    </span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div style="flex: 1;">
                        <span style="font-size: 9px; color: var(--text-muted); display: block;">Harga Jual</span>
                        <span style="font-size: 11px; font-weight: 700; color: var(--text-main);">Rp ${priceVal.toLocaleString('id-ID')}</span>
                    </div>
                    <div style="flex: 1;">
                        <span style="font-size: 9px; color: var(--text-muted); display: block;">HPP / Modal</span>
                        <input type="number" class="hpp-input-field" data-id="${p.id}" value="${hppVal}" style="width: 100%; padding: 4px 8px; font-size: 11px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-app); color: var(--text-main); font-weight: 600;">
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <span style="font-size: 9px; color: var(--text-muted); display: block;">Profit / Pcs</span>
                        <span style="font-size: 11px; font-weight: 700; color: var(--success);">Rp ${profit.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function saveHPPChanges() {
    if (currentUserRole !== 'admin') { alert('Hanya admin!'); return; }
    const inputs = document.querySelectorAll('.hpp-input-field');
    inputs.forEach(input => {
        const id = parseInt(input.getAttribute('data-id'));
        const newHpp = parseFloat(input.value) || 0;
        const prodIndex = products.findIndex(p => p.id === id);
        if (prodIndex !== -1) products[prodIndex].hpp = newHpp;
    });
    saveState();
    renderHPPManagement();
    alert("Data HPP berhasil diperbarui!");
}

/* ==========================================
   6B. KUPON & DISKON
   ========================================== */
function renderCouponManagement() {
    const container = document.getElementById('coupon-list');
    if (!container) return;
    if (coupons.length === 0) {
        container.innerHTML = '<p style="text-align:center; font-size:11px; color:var(--text-muted);">Belum ada kupon.</p>';
        return;
    }
    container.innerHTML = coupons.map((c, index) => `
        <div style="background: var(--card-bg); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="font-size: 12px; color: var(--accent); display: block;">${c.code}</strong>
                <span style="font-size: 10px; color: var(--text-muted);">
                    Diskon: ${c.type === 'percent' ? c.value + '%' : 'Rp ' + c.value.toLocaleString('id-ID')} | Limit: ${c.used}/${c.limit === 0 ? '∞' : c.limit}
                </span>
            </div>
            <button class="admin-card-btn admin-btn-delete" onclick="deleteCoupon(${index})" title="Hapus Kupon">
                <i class="ri-delete-bin-line"></i>
            </button>
        </div>
    `).join('');
}

function addOrUpdateCoupon() {
    if (currentUserRole !== 'admin') { alert('Hanya admin!'); return; }
    const codeInput = document.getElementById('new-coupon-code').value.trim();
    const typeInput = document.getElementById('new-coupon-type').value;
    const valInput = parseFloat(document.getElementById('new-coupon-val').value) || 0;
    const limitInput = parseInt(document.getElementById('new-coupon-limit').value) || 0;
    if (!codeInput || valInput <= 0) { alert('Isi kode kupon & nilai valid!'); return; }
    const existingIndex = coupons.findIndex(c => c.code.toLowerCase() === codeInput.toLowerCase());
    if (existingIndex !== -1) {
        coupons[existingIndex].type = typeInput;
        coupons[existingIndex].value = valInput;
        coupons[existingIndex].limit = limitInput;
    } else {
        coupons.push({ code: codeInput, type: typeInput, value: valInput, limit: limitInput, used: 0, active: true });
    }
    saveState();
    renderCouponManagement();
    document.getElementById('new-coupon-code').value = '';
    document.getElementById('new-coupon-val').value = '';
    document.getElementById('new-coupon-limit').value = '';
    alert("Kupon berhasil disimpan!");
}

function deleteCoupon(index) {
    if (currentUserRole !== 'admin') { alert('Hanya admin!'); return; }
    const deletedCode = coupons[index].code;
    coupons.splice(index, 1);
    saveState();
    api.deleteCoupon(deletedCode);
    renderCouponManagement();
}

function renderProductDiscountManagement() {
    const container = document.getElementById('product-discount-list');
    if (!container) return;
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; font-size:11px; color:var(--text-muted);">Belum ada produk.</p>';
        return;
    }
    container.innerHTML = products.map(p => `
        <div style="background: var(--card-bg); padding: 10px; border-radius: 10px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <strong style="font-size: 12px; color: var(--text-main); text-transform: capitalize; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</strong>
                <span style="font-size: 10px; font-weight: 600; color: var(--text-muted); flex-shrink: 0;">Harga Normal: Rp ${p.price.toLocaleString('id-ID')}</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; width: 100%; min-width: 0; box-sizing: border-box;">
                <select class="disc-type-input" data-id="${p.id}" style="padding: 4px; font-size: 11px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-app); color: var(--text-main); flex-shrink: 0; width: 100px;">
                    <option value="percent" ${p.discountType === 'percent' ? 'selected' : ''}>Persen (%)</option>
                    <option value="nominal" ${p.discountType === 'nominal' ? 'selected' : ''}>Nominal (Rp)</option>
                </select>
                <input type="number" class="disc-val-input" data-id="${p.id}" value="${p.discountValue || 0}" placeholder="Nilai Diskon" style="flex: 1; min-width: 0; width: 100%; box-sizing: border-box; padding: 4px 8px; font-size: 11px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-app); color: var(--text-main);">
            </div>
        </div>
    `).join('');
}

function saveProductDiscountChanges() {
    if (currentUserRole !== 'admin') { alert('Hanya admin!'); return; }
    document.querySelectorAll('.disc-type-input').forEach(input => {
        const id = parseInt(input.getAttribute('data-id'));
        const type = input.value;
        const prodIndex = products.findIndex(p => p.id === id);
        if (prodIndex !== -1) products[prodIndex].discountType = type;
    });
    document.querySelectorAll('.disc-val-input').forEach(input => {
        const id = parseInt(input.getAttribute('data-id'));
        const val = parseFloat(input.value) || 0;
        const prodIndex = products.findIndex(p => p.id === id);
        if (prodIndex !== -1) products[prodIndex].discountValue = val;
    });
    saveState();
    renderProducts(products, 'menu-items');
    renderPopularItems();
    renderProductDiscountManagement();
    alert("Setting Diskon Produk berhasil diperbarui!");
}

function applyCouponInOrder() {
    const codeInput = document.getElementById('coupon-code-input');
    if (!codeInput) return;
    const code = codeInput.value.trim();
    if (!code) { activeAppliedCoupon = null; updateCart(); return; }
    const foundCoupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase() && c.active);
    if (!foundCoupon) { alert("Kode Kupon tidak ditemukan!"); activeAppliedCoupon = null; updateCart(); return; }
    if (foundCoupon.limit > 0 && foundCoupon.used >= foundCoupon.limit) { alert("Batas kupon habis!"); activeAppliedCoupon = null; updateCart(); return; }
    activeAppliedCoupon = foundCoupon;
    alert('Kupon "' + foundCoupon.code + '" berhasil dipasang!');
    updateCart();
}

/* ==========================================
   7. CART
   ========================================== */
function animateFlyToCart(event) {
    if (!event) return;
    const btn = event.currentTarget || event.target;
    const btnRect = btn.getBoundingClientRect();
    const cartNav = document.getElementById('order-tab-target');
    if (!cartNav) return;
    const cartRect = cartNav.getBoundingClientRect();
    const flyer = document.createElement('div');
    flyer.className = 'flying-dot';
    flyer.innerHTML = '<i class="ri-add-line"></i>';
    const startX = btnRect.left + (btnRect.width / 2) - 11;
    const startY = btnRect.top + (btnRect.height / 2) - 11;
    flyer.style.left = startX + 'px';
    flyer.style.top = startY + 'px';
    document.body.appendChild(flyer);
    const targetX = cartRect.left + (cartRect.width / 2) - 11;
    const targetY = cartRect.top + (cartRect.height / 2) - 11;
    requestAnimationFrame(() => {
        flyer.style.left = targetX + 'px';
        flyer.style.top = targetY + 'px';
        flyer.style.transform = 'scale(0.3)';
        flyer.style.opacity = '0.7';
    });
    setTimeout(() => {
        flyer.remove();
        cartNav.classList.remove('cart-bounce');
        void cartNav.offsetWidth;
        cartNav.classList.add('cart-bounce');
    }, 200);
}

function addToCart(productId, event) {
    if (event) animateFlyToCart(event);
    const product = products.find(p => p.id === productId);
    const finalPrice = calculateFinalPrice(product);
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.qty++;
    else cart.push({ ...product, price: finalPrice, originalPrice: product.price, qty: 1 });
    updateCart();
}

function updateQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    }
    updateCart();
}

function clearCart() {
    if (cart.length === 0) return;
    document.getElementById('clear-bill-modal').style.display = 'flex';
}
function closeClearBillModal() { document.getElementById('clear-bill-modal').style.display = 'none'; }
function confirmClearCart() { closeClearBillModal(); clearCurrentCartState(); }

function clearCurrentCartState() {
    cart = [];
    activeAppliedCoupon = null;
    couponDiscountAmount = 0;
    currentEditingBillId = null;
    const activeBillInd = document.getElementById('active-bill-indicator');
    if (activeBillInd) activeBillInd.style.display = 'none';
    const custNameInput = document.getElementById('bill-customer-name');
    if (custNameInput) custNameInput.value = '';
    const cashInput = document.getElementById('cash-paid');
    if (cashInput) cashInput.value = '';
    const couponInput = document.getElementById('coupon-code-input');
    if (couponInput) couponInput.value = '';
    updateCart();
}

function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const navCartBadge = document.getElementById('nav-cart-count');
    if (navCartBadge) {
        navCartBadge.innerText = totalItems;
        navCartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    const btnSave = document.getElementById('btn-save-bill');
    if (btnSave) btnSave.disabled = cart.length === 0;
    const btnClear = document.getElementById('btn-clear-bill');
    if (btnClear) btnClear.disabled = cart.length === 0;
    const cartList = document.getElementById('cart-list');
    if (cartList) {
        if (cart.length === 0) {
            cartList.innerHTML = `
                <div class="empty-state-centered" style="min-height: 240px;">
                    <div class="empty-icon" style="width: 54px; height: 54px;">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </div>
                    <div class="empty-title">Belum ada pesanan</div>
                    <p class="empty-desc">Tambahkan menu dari tab Menu untuk memulai.</p>
                </div>
            `;
        } else {
            cartList.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div>
                        <strong style="font-size: 13px; color: var(--text-main);">${item.name}</strong>
                        <div style="font-size: 11px; color: var(--accent); font-weight: 700; margin-top: 2px;">Rp ${item.price.toLocaleString('id-id')}</div>
                    </div>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                        <span style="font-size: 12px; font-weight: 700; color: var(--text-main);">${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                    </div>
                </div>
            `).join('');
        }
    }
    const rawSubtotal = cart.reduce((sum, item) => {
        const original = item.originalPrice || item.price;
        return sum + (original * item.qty);
    }, 0);
    const productDiscount = cart.reduce((sum, item) => {
        const original = item.originalPrice || item.price;
        return sum + ((original - item.price) * item.qty);
    }, 0);
    const subtotalAfterProduct = rawSubtotal - productDiscount;
    couponDiscountAmount = 0;
    if (activeAppliedCoupon && subtotalAfterProduct > 0) {
        if (activeAppliedCoupon.type === 'percent') {
            couponDiscountAmount = (subtotalAfterProduct * activeAppliedCoupon.value) / 100;
        } else {
            couponDiscountAmount = activeAppliedCoupon.value;
        }
        if (couponDiscountAmount > subtotalAfterProduct) couponDiscountAmount = subtotalAfterProduct;
    }
    const totalAllDiscount = productDiscount + couponDiscountAmount;
    const netSubtotal = Math.max(0, rawSubtotal - totalAllDiscount);
    const tax = Math.round(netSubtotal * TAX_RATE_CONST);
    grandTotal = netSubtotal + tax;
    const subtotalElem = document.getElementById('subtotal-val');
    if (subtotalElem) subtotalElem.innerText = 'Rp ' + rawSubtotal.toLocaleString('id-id');
    const couponElem = document.getElementById('coupon-val');
    if (couponElem) couponElem.innerText = '- Rp ' + totalAllDiscount.toLocaleString('id-id');
    const taxElem = document.getElementById('tax-val');
    if (taxElem) taxElem.innerText = 'Rp ' + tax.toLocaleString('id-id');
    const totalElem = document.getElementById('total-val');
    if (totalElem) totalElem.innerText = 'Rp ' + grandTotal.toLocaleString('id-id');
    calculateChange();
}

function calculateChange() {
    const cashInput = document.getElementById('cash-paid');
    const changeRow = document.getElementById('change-row');
    const changeVal = document.getElementById('change-val');
    const payBtn = document.getElementById('btn-pay');
    if (!cashInput || !changeVal || !payBtn) return;
    const paidAmount = parseFloat(cashInput.value) || 0;
    if (cart.length === 0) {
        payBtn.disabled = true;
        changeVal.innerText = 'Rp 0';
        if (changeRow) changeRow.classList.remove('deficit');
        return;
    }
    if (grandTotal === 0) {
        changeVal.innerText = 'Rp 0';
        if (changeRow) changeRow.classList.remove('deficit');
        payBtn.disabled = false;
        return;
    }
    const change = paidAmount - grandTotal;
    if (paidAmount < grandTotal) {
        changeVal.innerText = 'Kurang Rp ' + Math.abs(change).toLocaleString('id-ID');
        if (changeRow) changeRow.classList.add('deficit');
        payBtn.disabled = true;
    } else {
        changeVal.innerText = 'Rp ' + change.toLocaleString('id-ID');
        if (changeRow) changeRow.classList.remove('deficit');
        payBtn.disabled = false;
    }
}

function setCash(amount) {
    const cashInput = document.getElementById('cash-paid');
    if (cashInput) cashInput.value = amount;
    calculateChange();
}
function setCashExact() {
    const cashInput = document.getElementById('cash-paid');
    if (cashInput) cashInput.value = Math.ceil(grandTotal);
    calculateChange();
}

/* ==========================================
   8. SAVED BILLS
   ========================================== */
function openSaveBillModal() {
    if (cart.length === 0) return;
    document.getElementById('save-bill-modal').style.display = 'flex';
}
function closeSaveBillModal() { document.getElementById('save-bill-modal').style.display = 'none'; }

function confirmSaveBill() {
    const nameInput = document.getElementById('bill-customer-name').value.trim();
    const billName = nameInput !== '' ? nameInput : 'Meja / Pelanggan ' + (savedBills.length + 1);
    if (currentEditingBillId) {
        const index = savedBills.findIndex(b => b.id === currentEditingBillId);
        if (index !== -1) {
            savedBills[index].items = [...cart];
            savedBills[index].total = grandTotal;
            savedBills[index].customer = billName;
            savedBills[index].appliedCoupon = activeAppliedCoupon;
        }
    } else {
        savedBills.push({
            id: 'Bill-' + Date.now().toString().slice(-4),
            customer: billName,
            items: [...cart],
            total: grandTotal,
            appliedCoupon: activeAppliedCoupon,
            time: new Date().toLocaleTimeString('id-id', { hour: '2-digit', minute: '2-digit' })
        });
    }
    saveState();
    api.bulkSave({ products, coupons, bills: savedBills });
    clearCurrentCartState();
    closeSaveBillModal();
    renderSavedBills();
    switchTab('saved-bills');
}

function renderSavedBills() {
    const countElem = document.getElementById('saved-bills-count');
    if (countElem) countElem.innerText = savedBills.length;
    const container = document.getElementById('saved-bills-list');
    if (!container) return;
    if (savedBills.length === 0) {
        container.innerHTML = `
            <div class="empty-state-centered">
                <div class="empty-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #00a6ff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2 3-2 3 2V4a2 2 0 0 0-2-2z"></path>
                        <line x1="8" y1="6" x2="16" y2="6"></line>
                        <line x1="8" y1="10" x2="16" y2="10"></line>
                        <line x1="8" y1="14" x2="12" y2="14"></line>
                    </svg>
                </div>
                <div class="empty-title">Belum Ada Bill</div>
                <p class="empty-desc">Tidak ada bill yang tersimpan saat ini.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = savedBills.map((b, index) => `
        <div class="cart-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
                <div>
                    <strong style="font-size: 14px; color: var(--text-main);">${b.customer}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">${b.id} • ${b.time}</div>
                </div>
                <span style="font-weight: 800; color: var(--accent);">Rp ${b.total.toLocaleString('id-id')}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); border-top: 1px dashed var(--border); padding-top: 6px; width: 100%;">
                ${b.items.map(i => i.name + ' (x' + i.qty + ')').join(', ')}
            </div>
            <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
                <button class="btn-secondary" style="flex: 1; padding: 6px; font-size: 11px;" onclick="loadBillToCart(${index})">
                    <i class="ri-edit-line"></i> Tambah menu / Edit
                </button>
                <button class="btn-primary" style="flex: 1; padding: 6px; font-size: 11px;" onclick="checkoutSavedBill(${index})">
                    <i class="ri-check-line"></i> Bayar
                </button>
            </div>
        </div>
    `).join('');
}

function loadBillToCart(index) {
    const selectedBill = savedBills[index];
    cart = [...selectedBill.items];
    currentEditingBillId = selectedBill.id;
    activeAppliedCoupon = selectedBill.appliedCoupon || null;
    const activeBillInd = document.getElementById('active-bill-indicator');
    if (activeBillInd) activeBillInd.style.display = 'flex';
    const activeBillName = document.getElementById('active-bill-name');
    if (activeBillName) activeBillName.innerText = selectedBill.customer;
    const custNameInput = document.getElementById('bill-customer-name');
    if (custNameInput) custNameInput.value = selectedBill.customer;
    const couponInput = document.getElementById('coupon-code-input');
    if (couponInput && activeAppliedCoupon) couponInput.value = activeAppliedCoupon.code;
    updateCart();
    switchTab('order');
}
function cancelActiveBill() { clearCurrentCartState(); }
function checkoutSavedBill(index) { loadBillToCart(index); }

/* ==========================================
   9. PAYMENT
   ========================================== */
function processPayment() {
    payAudio.play().catch(err => console.log('Audio error:', err));
    if (cart.length === 0) return;
    const paidAmount = parseFloat(document.getElementById('cash-paid').value) || 0;
    if (paidAmount < grandTotal) { alert("Nominal pembayaran belum mencukupi!"); return; }
    const cashierName = document.getElementById('profile-name').innerText;
    const rawSubtotal = cart.reduce((sum, item) => {
        const originalPrice = item.originalPrice || item.price;
        return sum + (originalPrice * item.qty);
    }, 0);
    const productDiscount = cart.reduce((sum, item) => {
        const originalPrice = item.originalPrice || item.price;
        return sum + ((originalPrice - item.price) * item.qty);
    }, 0);
    const totalDiscount = productDiscount + (couponDiscountAmount || 0);
    const subtotalAfterAllDiscount = Math.max(0, rawSubtotal - totalDiscount);
    const tax = Math.round(subtotalAfterAllDiscount * TAX_RATE_CONST);
    const change = paidAmount - grandTotal;
    const now = new Date();
    const dateStr = getLocalDateString();
    const timeStr = now.toLocaleTimeString('id-id', { hour: '2-digit', minute: '2-digit' });
    const timeFormatted = timeStr.replace(':', '.');
    if (activeAppliedCoupon) {
        const couponIdx = coupons.findIndex(c => c.code.toLowerCase() === activeAppliedCoupon.code.toLowerCase());
        if (couponIdx !== -1) coupons[couponIdx].used += 1;
    }
    const newTrx = {
        id: 'trx-' + Date.now().toString().slice(-6),
        date: dateStr,
        time: timeFormatted,
        cashier: cashierName,
        items: [...cart],
        subtotal: rawSubtotal,
        discountAmount: totalDiscount,
        couponDiscount: couponDiscountAmount,
        couponCode: activeAppliedCoupon ? activeAppliedCoupon.code : null,
        tax: tax,
        total: grandTotal,
        paid: paidAmount,
        change: change,
        isVoid: false,
        isHidden: false
    };
    transactionHistory.unshift(newTrx);
    if (currentEditingBillId) savedBills = savedBills.filter(b => b.id !== currentEditingBillId);
    saveState();
    api.saveTransaction(newTrx).then(res => {
        if (res) { updateCloudStatus(true); console.log('☁️ Trx tersimpan:', newTrx.id); }
        else updateCloudStatus(false);
    });
    api.bulkSave({ products, coupons, bills: savedBills });
    showReceiptModal(newTrx);
    clearCurrentCartState();
    renderSavedBills();
    updateDashboardMetrics();
}

function showReceiptModal(trx) {
    document.getElementById('modal-trx-id').innerText = trx.id || '-';
    document.getElementById('modal-cashier').innerText = trx.cashier || currentUserRole || '-';
    const cleanDate = normalizeTrxDate(trx.date);
    document.getElementById('modal-time').innerText = cleanDate ? cleanDate + ' ' + (trx.time || '') : new Date().toLocaleString('id-ID');
    const itemsListEl = document.getElementById('modal-items-list');
    if (itemsListEl) {
        itemsListEl.innerHTML = trx.items.map(item => {
            const itemPrice = item.price || 0;
            const itemTotal = itemPrice * item.qty;
            return `
                <div class="receipt-row" style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span>${item.name} x ${item.qty}</span>
                    <span>Rp ${itemTotal.toLocaleString('id-ID')}</span>
                </div>
            `;
        }).join('');
    }
    let rawSubtotal = trx.subtotal || 0;
    if (!rawSubtotal) {
        trx.items.forEach(item => {
            const originalPrice = item.originalPrice || item.price;
            rawSubtotal += originalPrice * item.qty;
        });
    }
    let totalDiscount = trx.discountAmount !== undefined ? trx.discountAmount : 0;
    const paidVal = trx.paid || 0;
    const grandTotalVal = trx.total || 0;
    const changeVal = trx.change !== undefined ? trx.change : (paidVal - grandTotalVal);
    document.getElementById('modal-subtotal').innerText = 'Rp ' + rawSubtotal.toLocaleString('id-ID');
    document.getElementById('modal-discount').innerText = '- Rp ' + totalDiscount.toLocaleString('id-ID');
    document.getElementById('modal-tax').innerText = 'Rp ' + (trx.tax || 0).toLocaleString('id-ID');
    document.getElementById('modal-total').innerText = 'Rp ' + grandTotalVal.toLocaleString('id-ID');
    document.getElementById('modal-paid').innerText = 'Rp ' + paidVal.toLocaleString('id-ID');
    document.getElementById('modal-change').innerText = 'Rp ' + Math.max(0, changeVal).toLocaleString('id-ID');
    openModal();
}

function printReceipt() { window.print(); }

/* ==========================================
   10. HISTORY
   ========================================== */
let historyActionMode = 'delete';

function toggleHistoryDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('history-dropdown-menu');
    if (menu) menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

function selectHistoryAction(mode) {
    historyActionMode = mode;
    toggleHistoryDropdown();
    isHistorySelectionMode = true;
    updateHistoryUIForSelection();
    renderHistory();
}

function toggleHistorySelectionMode(mode) {
    if (mode) historyActionMode = mode;
    isHistorySelectionMode = !isHistorySelectionMode;
    updateHistoryUIForSelection();
    renderHistory();
}

function updateHistoryUIForSelection() {
    const defaultActions = document.getElementById('history-default-actions');
    const selectionActions = document.getElementById('history-selection-actions');
    const selectAllCheckbox = document.getElementById('select-all-history');
    const confirmBtn = document.getElementById('history-selection-confirm');
    if (isHistorySelectionMode) {
        if (defaultActions) defaultActions.style.display = 'none';
        if (selectionActions) selectionActions.style.display = 'flex';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        if (confirmBtn) {
            if (historyActionMode === 'cancel') {
                confirmBtn.innerText = 'Konfirmasi Void';
                confirmBtn.style.background = '#f59e0b';
            } else {
                confirmBtn.innerText = 'Konfirmasi Hapus';
                confirmBtn.style.background = 'var(--danger)';
            }
        }
    } else {
        if (defaultActions) defaultActions.style.display = 'flex';
        if (selectionActions) selectionActions.style.display = 'none';
    }
}

function toggleSelectAllHistory(checkbox) {
    document.querySelectorAll('.history-checkbox-item').forEach(cb => {
        cb.checked = checkbox.checked;
        const card = cb.closest('.history-card');
        if (card) applyCardSelectionStyle(card, checkbox.checked);
    });
}

function applyCardSelectionStyle(card, isSelected) {
    if (isSelected) {
        card.style.background = 'var(--accent-light)';
        card.style.borderColor = 'var(--accent)';
    } else {
        card.style.background = 'var(--card-bg)';
        card.style.borderColor = 'var(--border)';
    }
}

function updateSelectAllState() {
    const allCb = document.querySelectorAll('.history-checkbox-item');
    const checkedCb = document.querySelectorAll('.history-checkbox-item:checked');
    const selectAll = document.getElementById('select-all-history');
    if (selectAll) {
        selectAll.checked = (allCb.length > 0 && allCb.length === checkedCb.length);
    }
}

function openDeleteHistoryModal() {
    if (currentUserRole !== 'admin') return;
    document.getElementById('delete-history-modal').style.display = 'flex';
}
function closeDeleteHistoryModal() { document.getElementById('delete-history-modal').style.display = 'none'; }

function openDeleteSelectedHistoryModal() {
    const checkboxes = document.querySelectorAll('.history-checkbox-item:checked');
    if (checkboxes.length === 0) { alert("Pilih minimal satu riwayat!"); return; }
    
    const titleEl = document.getElementById('history-modal-title');
    const descEl = document.getElementById('history-modal-desc');
    const iconEl = document.getElementById('history-modal-icon');
    const confirmBtn = document.getElementById('history-modal-confirm-btn');
    
    if (historyActionMode === 'cancel') {
        if (titleEl) titleEl.innerText = 'BATALKAN TRANSAKSI?';
        if (descEl) descEl.innerText = checkboxes.length + ' transaksi akan ditandai sebagai void.';
        if (iconEl) {
            iconEl.innerHTML = '<i class="ri-close-circle-line" style="font-size: 24px; color: #f59e0b;"></i>';
            iconEl.style.background = 'rgba(245, 158, 11, 0.15)';
        }
        if (confirmBtn) { confirmBtn.innerText = 'YA, BATALKAN'; confirmBtn.style.background = '#f59e0b'; }
    } else {
        if (titleEl) titleEl.innerText = 'HAPUS RIWAYAT?';
        if (descEl) descEl.innerText = checkboxes.length + ' transaksi akan dihapus dari daftar riwayat.';
        if (iconEl) {
            iconEl.innerHTML = '<i class="ri-delete-bin-line" style="font-size: 24px; color: var(--danger);"></i>';
            iconEl.style.background = 'var(--danger-light)';
        }
        if (confirmBtn) { confirmBtn.innerText = 'YA, HAPUS'; confirmBtn.style.background = 'var(--danger)'; }
    }
    document.getElementById('delete-history-modal').style.display = 'flex';
}

function confirmClearHistory() {
    const selectedCheckboxes = document.querySelectorAll('.history-checkbox-item:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    if (selectedIds.length === 0) { alert("Pilih transaksi!"); closeDeleteHistoryModal(); return; }
    if (historyActionMode === 'cancel') {
        transactionHistory = transactionHistory.map(trx => {
            if (selectedIds.includes(trx.id) && !trx.isVoid) {
                api.voidTransaction(trx.id);
                return { ...trx, isVoid: true };
            }
            return trx;
        });
        alert(selectedIds.length + ' transaksi di-VOID.');
    } else if (historyActionMode === 'delete') {
        selectedIds.forEach(id => { api.deleteTransaction(id); });
        transactionHistory = transactionHistory.filter(trx => !selectedIds.includes(trx.id));
        alert(selectedIds.length + ' transaksi berhasil dihapus dari riwayat.');
    }
    saveState();
    closeDeleteHistoryModal();
    isHistorySelectionMode = false;
    updateHistoryUIForSelection();
    renderHistory();
    updateDashboardMetrics();
    if (typeof renderProducts === 'function') renderProducts(products, 'menu-items');
    if (typeof renderPopularItems === 'function') renderPopularItems();
}

function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;
    const visibleHistory = transactionHistory.filter(trx => !trx.isHidden);
    if (visibleHistory.length === 0) {
        container.innerHTML = `
        <div class="empty-state-centered">
            <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                    <path d="M12 7v5l4 2"/>
                </svg>
            </div>
            <div class="empty-title">Belum ada riwayat transaksi</div>
            <p class="empty-desc">Transaksi akan muncul di sini setelah ada pembayaran.</p>
        </div>`;
        return;
    }
    container.innerHTML = visibleHistory.map(trx => {
        const cleanDate = normalizeTrxDate(trx.date);
        const displayDate = cleanDate && trx.time ? cleanDate + ' • ' + trx.time : cleanDate || trx.time || '';
        return `
        <div class="history-card" data-trx-id="${trx.id}" style="display: flex; align-items: center; gap: 12px; background: var(--card-bg); padding: 12px; border-radius: 14px; margin-bottom: 10px; border: 1px solid var(--border); cursor: pointer; transition: background-color 0.15s ease, border-color 0.15s ease; ${trx.isVoid ? 'opacity: 0.6;' : ''}">
            ${isHistorySelectionMode ? `
                <input type="checkbox" class="history-checkbox-item custom-theme-checkbox" value="${trx.id}" style="width: 18px; height: 18px; cursor: pointer; display: block !important; pointer-events: none; flex-shrink: 0;">
            ` : ''}
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <strong style="font-size: 13px; color: var(--text-main); font-weight: 800; text-transform:uppercase; ${trx.isVoid ? 'text-decoration: line-through;' : ''}">
                        ${trx.id} ${trx.isVoid ? '<span style="color:var(--danger); font-size:10px;">(VOID)</span>' : ''}
                    </strong>
                    <span style="font-size: 11px; color: var(--text-muted);">${displayDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 11px; color: var(--text-muted);">Kasir: <span style="font-size: 10px; background: var(--accent-light); color: var(--accent); padding: 2px 6px; border-radius: 6px; font-weight: 700;">${trx.cashier || '-'}</span></span>
                    <strong style="font-size: 13px; color: ${trx.isVoid ? 'var(--text-muted)' : 'var(--accent)'}; font-weight: 800; ${trx.isVoid ? 'text-decoration: line-through;' : ''}">Rp ${trx.total ? trx.total.toLocaleString('id-id') : '0'}</strong>
                </div>
            </div>
        </div>
        `;
    }).join('');

    container.querySelectorAll('.history-card').forEach(card => {
        card.addEventListener('click', () => {
            if (isHistorySelectionMode) {
                const checkbox = card.querySelector('.history-checkbox-item');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    applyCardSelectionStyle(card, checkbox.checked);
                    updateSelectAllState();
                }
                return;
            }
            const trxId = card.getAttribute('data-trx-id');
            const trx = transactionHistory.find(t => t.id === trxId);
            if (trx) showReceiptModal(trx);
        });
    });
}

function exportHistoryCSV() {
    if (transactionHistory.length === 0) { alert("Tidak ada data!"); return; }
    let csvContent = "data:text/csv;charset=utf-8,ID Transaksi,Tanggal,Waktu,Kasir,Total Subtotal,Diskon Kupon,Pajak,Total Pembayaran,Tunai,Kembalian,Status Void,Detail Items\n";
    transactionHistory.forEach(trx => {
        const itemsStr = trx.items.map(i => i.name + ' (' + i.qty + 'x)').join(' | ');
        const cleanDate = normalizeTrxDate(trx.date);
        const row = [
            trx.id, cleanDate, trx.time, '"' + trx.cashier + '"', trx.subtotal,
            trx.couponDiscount || 0, trx.tax, trx.total, trx.paid, trx.change,
            trx.isVoid ? 'YA' : 'TIDAK', '"' + itemsStr + '"'
        ].join(",");
        csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pos_history_" + getLocalDateString() + ".csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

/* ==========================================
   11. DASHBOARD
   ========================================== */
function openOmsetFilterModal() {
    if (currentUserRole !== 'admin') return;
    const totalAllTime = transactionHistory.filter(t => !t.isVoid).reduce((sum, t) => sum + t.total, 0);
    document.getElementById('modal-all-time-omset').innerText = 'Rp ' + totalAllTime.toLocaleString('id-id');
    document.getElementById('modal-month-picker').value = currentSelectedMonth;
    document.getElementById('omset-filter-modal').style.display = 'flex';
}
function closeOmsetFilterModal() { document.getElementById('omset-filter-modal').style.display = 'none'; }
function applyMonthlyFilter(yearMonth) { if (!yearMonth) return; currentSelectedMonth = yearMonth; updateDashboardMetrics(); }
function resetToCurrentMonth() {
    currentSelectedMonth = getCurrentYearMonth();
    const monthPicker = document.getElementById('modal-month-picker');
    if (monthPicker) monthPicker.value = currentSelectedMonth;
    updateDashboardMetrics();
}

function updateDashboardMetrics() {
    const parts = currentSelectedMonth.split('-');
    const filterYear = parts[0];
    const filterMonth = parts[1];
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const monthLabel = monthNames[parseInt(filterMonth, 10) - 1] + " " + filterYear;
    const monthlyTrx = transactionHistory.filter(t => {
        if (t.isVoid) return false;
        const cleanDate = normalizeTrxDate(t.date);
        return cleanDate && cleanDate.startsWith(currentSelectedMonth);
    });
    const totalOmsetMonth = monthlyTrx.reduce((sum, t) => sum + t.total, 0);
    const omsetElem = document.getElementById('dashboard-omset');
    if (omsetElem) omsetElem.innerText = 'Rp ' + totalOmsetMonth.toLocaleString('id-id');
    const titleElem = document.getElementById('dashboard-omset-title');
    if (titleElem) titleElem.innerText = 'Omset ' + monthLabel;
    const filterDateInput = document.getElementById('filter-date');
    let selectedDate = filterDateInput ? filterDateInput.value : getLocalDateString();
    if (!selectedDate) selectedDate = getLocalDateString();
    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) dateDisplay.innerText = 'Tanggal: ' + selectedDate;
    const dailyTrx = transactionHistory.filter(t => {
        if (t.isVoid) return false;
        const cleanDate = normalizeTrxDate(t.date);
        return cleanDate === selectedDate;
    });
    const dailyOmset = dailyTrx.reduce((sum, t) => sum + t.total, 0);
    const dailyTrxCount = dailyTrx.length;
    const homeDailyOmsetElem = document.getElementById('home-daily-omset');
    const homeDailyTrxCountElem = document.getElementById('home-daily-trx-count');
    if (homeDailyOmsetElem) homeDailyOmsetElem.innerText = 'Rp ' + dailyOmset.toLocaleString('id-id');
    if (homeDailyTrxCountElem) homeDailyTrxCountElem.innerText = dailyTrxCount;
    const hoursData = Array(24).fill(0);
    dailyTrx.forEach(t => {
        if (t.time) {
            const hourStr = String(t.time).split(/[.:]/)[0];
            const hour = parseInt(hourStr, 10);
            if (!isNaN(hour) && hour >= 0 && hour < 24) hoursData[hour] += t.total;
        }
    });
    renderChart(hoursData);
}

function renderChart(dataPoints) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    const labels = Array.from({ length: 24 }, (_, i) => (i < 10 ? '0' : '') + i + ':00');
    const isDark = document.getElementById('app-wrapper')?.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Penjualan (Rp)',
                data: dataPoints,
                borderColor: '#2ECC71',
                backgroundColor: 'rgba(46, 204, 113, 0.15)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointRadius: 2,
                pointHoverRadius: 5,
                pointBackgroundColor: '#2ECC71'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function(context) { return ' Rp ' + context.parsed.y.toLocaleString('id-id'); } } }
            },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } },
                y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 }, callback: function(value) {
                    if (value >= 1000000) return (value / 1000000) + 'jt';
                    if (value >= 1000) return (value / 1000) + 'rb';
                    return value;
                } } }
            }
        }
    });
}

/* ==========================================
   12. KITCHEN & LAPORAN
   ========================================== */
function billDapur() {
    if (!cart || cart.length === 0) { alert("Keranjang kosong!"); return; }
    const now = new Date();
    const timeStr = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('kitchen-modal-time').innerText = timeStr;
    const currentCashier = document.getElementById('kasir-name') ? document.getElementById('kasir-name').value : 'Kasir';
    document.getElementById('kitchen-cashier-name').innerText = currentCashier;
    const itemsList = document.getElementById('kitchen-items-list');
    itemsList.innerHTML = '';
    cart.forEach(item => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 700; font-size: 13px; border-bottom: 1px dotted #e2e8f0; padding-bottom: 4px;';
        row.innerHTML = '<span>' + item.name + '</span><span>x' + item.qty + '</span>';
        itemsList.appendChild(row);
    });
    updateKitchenPreview();
    openKitchenModal();
}

function toggleTableInput(val) {
    const tableBox = document.getElementById('table-number-box');
    const tableRow = document.getElementById('print-table-row');
    if (val === 'Takeaway') {
        if (tableBox) tableBox.style.display = 'none';
        if (tableRow) tableRow.style.display = 'none';
    } else {
        if (tableBox) tableBox.style.display = 'block';
        if (tableRow) tableRow.style.display = 'flex';
    }
    updateKitchenPreview();
}

function updateKitchenPreview() {
    const orderType = document.getElementById('kitchen-order-type')?.value || 'Dine In';
    const tableNo = document.getElementById('kitchen-table-no')?.value || '-';
    const notes = document.getElementById('kitchen-order-notes')?.value || '';
    if (document.getElementById('print-order-type')) document.getElementById('print-order-type').innerText = orderType;
    if (document.getElementById('print-table-no')) document.getElementById('print-table-no').innerText = tableNo;
    const notesRow = document.getElementById('print-notes-row');
    if (notes.trim() !== '') {
        if (document.getElementById('print-order-notes')) document.getElementById('print-order-notes').innerText = notes;
        if (notesRow) notesRow.style.display = 'block';
    } else {
        if (notesRow) notesRow.style.display = 'none';
    }
}

function triggerPrintKitchen() { window.print(); }

function renderLaporanData() {
    const period = document.getElementById('laporan-filter-period')?.value || 'month';
    const todayStr = getLocalDateString();
    const currentMonthStr = getCurrentYearMonth();
    const periodTextMap = { 'today': 'Hari Ini', 'month': 'Bulan Ini', 'all': 'Semua Waktu' };
    const labelPeriodElem = document.getElementById('lap-product-period-label');
    if (labelPeriodElem) labelPeriodElem.innerText = periodTextMap[period] || 'Bulan Ini';
    const validTrx = transactionHistory.filter(trx => {
        if (trx.isVoid) return false;
        const cleanDate = normalizeTrxDate(trx.date);
        if (!cleanDate) return false;
        if (period === 'today') return cleanDate === todayStr;
        if (period === 'month') return cleanDate.startsWith(currentMonthStr);
        return true;
    });
    let totalOmset = 0;
    let totalHPP = 0;
    const productSalesMap = {};
    validTrx.forEach(trx => {
        totalOmset += (trx.total || trx.grandTotal || 0);
        if (Array.isArray(trx.items)) {
            trx.items.forEach(item => {
                const qty = item.qty || 1;
                const masterProd = products.find(p => p.id === item.id);
                const itemHpp = item.hpp !== undefined ? item.hpp : (masterProd ? (masterProd.hpp || 0) : 0);
                totalHPP += (itemHpp * qty);
                if (!productSalesMap[item.id]) productSalesMap[item.id] = { name: item.name, qty: 0, revenue: 0 };
                productSalesMap[item.id].qty += qty;
                productSalesMap[item.id].revenue += ((item.price || 0) * qty);
            });
        }
    });
    const labaKotor = totalOmset - totalHPP;
    const marginPersen = totalOmset > 0 ? ((labaKotor / totalOmset) * 100).toFixed(1) : 0;
    if (document.getElementById('lap-total-omset')) document.getElementById('lap-total-omset').innerText = 'Rp ' + totalOmset.toLocaleString('id-ID');
    if (document.getElementById('lap-total-hpp')) document.getElementById('lap-total-hpp').innerText = 'Rp ' + totalHPP.toLocaleString('id-ID');
    if (document.getElementById('lap-laba-kotor')) document.getElementById('lap-laba-kotor').innerText = 'Rp ' + labaKotor.toLocaleString('id-ID');
    if (document.getElementById('lap-margin-persen')) document.getElementById('lap-margin-persen').innerText = marginPersen + '%';
    if (document.getElementById('lap-total-trx-info')) document.getElementById('lap-total-trx-info').innerText = validTrx.length + ' Transaksi Selesai';
    const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);
    const productsContainer = document.getElementById('lap-products-list');
    if (!productsContainer) return;
    if (sortedProducts.length === 0) {
        productsContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 16px 0;">
            Tidak ada data penjualan pada periode <b>${periodTextMap[period]}</b>.
        </div>`;
        return;
    }
    productsContainer.innerHTML = sortedProducts.map((p, index) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: var(--bg-app); border-radius: 10px; border: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); width: 20px; text-align: center;">${index + 1}.</span>
                <div>
                    <div style="font-size: 12px; font-weight: 700; color: var(--text-main); text-transform: capitalize;">${p.name}</div>
                    <div style="font-size: 10px; color: var(--text-muted);">${p.qty} Porsi / Item Terjual</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 11px; font-weight: 800; color: var(--accent);">Rp ${p.revenue.toLocaleString('id-ID')}</div>
            </div>
        </div>
    `).join('');
}

/* ==========================================
   13. KAS & PETTY CASH
   ========================================== */
function formatRupiah(num) { return 'Rp ' + Number(num).toLocaleString('id-ID'); }

function renderKasOverview() {
    const totalPetty = pettyCashList.reduce((sum, item) => sum + item.nominal, 0);
    if (document.getElementById('display-modal-awal')) document.getElementById('display-modal-awal').innerText = formatRupiah(modalAwal);
    if (document.getElementById('display-petty-cash')) document.getElementById('display-petty-cash').innerText = formatRupiah(totalPetty);
    if (document.getElementById('display-estimasi-kas')) document.getElementById('display-estimasi-kas').innerText = formatRupiah(modalAwal - totalPetty);
}

function simpanModalAwal() {
    const val = parseFloat(document.getElementById('input-modal-awal').value);
    if (isNaN(val) || val < 0) return alert('Nominal tidak valid!');
    modalAwal = val;
    localStorage.setItem('pos_modal_awal', modalAwal);
    document.getElementById('input-modal-awal').value = '';
    renderKasOverview();
    api.saveCashFlow({ type: 'modal_awal', keterangan: 'Modal buka toko', nominal: val, date: getLocalDateString() });
    alert('Modal awal tersimpan!');
}

function tambahPettyCash() {
    const ket = document.getElementById('input-petty-ket').value.trim();
    const nominal = parseFloat(document.getElementById('input-petty-nominal').value);
    if (!ket || isNaN(nominal) || nominal <= 0) return alert('Lengkapi data petty cash.');
    pettyCashList.push({ id: Date.now(), keterangan: ket, nominal: nominal });
    localStorage.setItem('pos_petty_cash', JSON.stringify(pettyCashList));
    document.getElementById('input-petty-ket').value = '';
    document.getElementById('input-petty-nominal').value = '';
    renderKasOverview();
    api.saveCashFlow({ type: 'petty_cash', keterangan: ket, nominal: nominal, date: getLocalDateString() });
    alert('Petty cash tercatat!');
}

function openTutupShiftModal() {
    const totalPetty = pettyCashList.reduce((sum, item) => sum + item.nominal, 0);
    const namaKasir = document.getElementById('profile-name') ? document.getElementById('profile-name').innerText : 'Kasir';
    const tunaiPenjualan = 0;
    const ekspektasiKas = modalAwal + tunaiPenjualan - totalPetty;
    if (document.getElementById('shift-modal-kasir')) document.getElementById('shift-modal-kasir').innerText = namaKasir;
    if (document.getElementById('shift-modal-awal')) document.getElementById('shift-modal-awal').innerText = formatRupiah(modalAwal);
    if (document.getElementById('shift-modal-tunai')) document.getElementById('shift-modal-tunai').innerText = formatRupiah(tunaiPenjualan);
    if (document.getElementById('shift-modal-petty')) document.getElementById('shift-modal-petty').innerText = formatRupiah(totalPetty);
    if (document.getElementById('shift-modal-ekspektasi')) document.getElementById('shift-modal-ekspektasi').innerText = formatRupiah(ekspektasiKas);
    if (document.getElementById('shift-input-fisik')) document.getElementById('shift-input-fisik').value = '';
    if (document.getElementById('shift-selisih-val')) document.getElementById('shift-selisih-val').innerText = 'Rp 0';
    const tutupShiftModal = document.getElementById('tutup-shift-modal');
    if (tutupShiftModal) tutupShiftModal.style.display = 'flex';
}

function closeTutupShiftModal() {
    const tutupShiftModal = document.getElementById('tutup-shift-modal');
    if (tutupShiftModal) tutupShiftModal.style.display = 'none';
}

function hitungSelisihShift() {
    const totalPetty = pettyCashList.reduce((sum, item) => sum + item.nominal, 0);
    const ekspektasi = modalAwal - totalPetty;
    const fisik = parseFloat(document.getElementById('shift-input-fisik').value) || 0;
    const selisih = fisik - ekspektasi;
    const el = document.getElementById('shift-selisih-val');
    if (el) {
        el.innerText = formatRupiah(selisih);
        el.style.color = selisih < 0 ? 'var(--danger)' : (selisih > 0 ? 'var(--success)' : 'var(--text-main)');
    }
}

function prosesCetakLaporanShift() {
    const totalPetty = pettyCashList.reduce((sum, item) => sum + item.nominal, 0);
    const tunaiPenjualan = 0;
    const ekspektasiKas = modalAwal + tunaiPenjualan - totalPetty;
    const fisik = parseFloat(document.getElementById('shift-input-fisik').value) || 0;
    const selisih = fisik - ekspektasiKas;
    const namaKasir = document.getElementById('profile-name') ? document.getElementById('profile-name').innerText : 'Kasir';
    if (document.getElementById('sr-waktu')) document.getElementById('sr-waktu').innerText = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (document.getElementById('sr-kasir')) document.getElementById('sr-kasir').innerText = namaKasir;
    if (document.getElementById('sr-modal')) document.getElementById('sr-modal').innerText = formatRupiah(modalAwal);
    if (document.getElementById('sr-petty')) document.getElementById('sr-petty').innerText = formatRupiah(totalPetty);
    if (document.getElementById('sr-ekspektasi')) document.getElementById('sr-ekspektasi').innerText = formatRupiah(ekspektasiKas);
    if (document.getElementById('sr-fisik')) document.getElementById('sr-fisik').innerText = formatRupiah(fisik);
    if (document.getElementById('sr-selisih')) document.getElementById('sr-selisih').innerText = formatRupiah(selisih);
    const pettyContainer = document.getElementById('sr-petty-list');
    if (pettyContainer) {
        if (pettyCashList.length === 0) {
            pettyContainer.innerHTML = '<div style="font-style: italic;">(Tidak ada transaksi)</div>';
        } else {
            pettyContainer.innerHTML = pettyCashList.map(item => `
                <div style="display: flex; justify-content: space-between;">
                    <span>- ${item.keterangan}</span>
                    <span>${formatRupiah(item.nominal)}</span>
                </div>
            `).join('');
        }
    }
    resetShiftData();
    closeTutupShiftModal();
    openShiftReceiptModal();
}

function resetShiftData() {
    modalAwal = 0;
    pettyCashList = [];
    localStorage.removeItem('pos_modal_awal');
    localStorage.removeItem('pos_petty_cash');
    renderKasOverview();
}

function eksekusiPrint() { window.print(); }

/* ==========================================
   14. PROTEKSI
   ========================================== */
document.addEventListener('copy', function(e) { e.preventDefault(); });
document.addEventListener('cut', function(e) { e.preventDefault(); });
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

document.addEventListener('keydown', function(e) {
    const key = e.key.toLowerCase();
    if (e.key === 'F12') { e.preventDefault(); return false; }
    if ((e.ctrlKey && ['c', 'x', 'u', 's'].includes(key)) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key))) {
        if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) return true;
        e.preventDefault();
        return false;
    }
});

/* ==========================================
   15. INIT
   ========================================== */
document.addEventListener('DOMContentLoaded', async () => {
    const jsonInput = document.getElementById('json-import-input');
    if (jsonInput) jsonInput.addEventListener('change', importLocalStorageJSON);
    applyBranding();
    initTheme();
    updateGreeting();
    // Login page muncul dulu — user harus login sebelum load cloud
    applyRolePermissions();
    updateCart();
    renderSavedBills();
    renderKasOverview();
    // Note: loadFromCloud dipanggil setelah login sukses
    const filterDateInput = document.getElementById('filter-date');
    if (filterDateInput) filterDateInput.addEventListener('change', () => updateDashboardMetrics());
    const kitchenTableNo = document.getElementById('kitchen-table-no');
    if (kitchenTableNo) kitchenTableNo.addEventListener('input', updateKitchenPreview);
    const kitchenNotes = document.getElementById('kitchen-order-notes');
    if (kitchenNotes) kitchenNotes.addEventListener('input', updateKitchenPreview);
    setupAutoSync();
});
