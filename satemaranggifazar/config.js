/* =========================================================
   KONFIGURASI BUYER - Sate Maranggi Fazar
   File ini di-edit per pembeli.
   Token tidak ada di sini — disimpan di Cloudflare Worker.
   ========================================================= */

window.APP_CONFIG = {

    // ==== API Worker (proxy). Token TIDAK ada di sini. ====
    API_BASE: 'https://poskasir.muhasa48.workers.dev/pos?tenant=satemaranggifazar',

    // ==== BRANDING TOKO ====
    STORE_NAME:   'Sate Maranggi Fazar',
    STORE_SLOGAN: 'Selamat Datang! Silahkan masuk ke akun anda.',
    STORE_LOGO:   '',

    // ==== PAJAK & MATA UANG ====
    CURRENCY:     'Rp',
    TAX_PERCENT:  0,

    // ==== FITUR TOGGLE ====
    ENABLE_KITCHEN_PRINT:  true,
    ENABLE_CUSTOMER_PRINT: true,
    ENABLE_CASHFLOW:       true,
    ENABLE_COUPON:         true,

    // ==== INFO VERSI ====
    VERSION: 'v1.1.5',

    // ==== KONTAK SUPPORT ====
    SUPPORT_WA: '6288216637292',
    SUPPORT_IG: '@muhasa_digital',

    // ==== USER DEFAULT ====
    DEFAULT_USERS: [
        { username: 'admin',  displayName: 'Admin'  },
        { username: 'Kasir1', displayName: 'Kasir 1' },
        { username: 'Kasir2', displayName: 'Kasir 2' }
    ],
    DEFAULT_PIN: '1234'
};
