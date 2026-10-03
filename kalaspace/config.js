/* =========================================================
   KONFIGURASI BUYER - KALA SPACE CAFE (NAMA TOKO)
   ========================================================= */

window.APP_CONFIG = {

    // ==== WAJIB DIISI (dari Apps Script deployment) ====
    API_URL:   'https://script.google.com/macros/s/AKfycbxAnjpzxMaUhYFmQGjTkiAiRjvToTZukMsZ0yE1Z0iIc0Q0Hp6Ayy5zZSJCFoab4bBm/exec',
    API_TOKEN: 'KalaSpace2025',

    // ==== BRANDING TOKO ====
    STORE_NAME:   'Kala Space Cafe',
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
