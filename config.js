/* ============================================================
   POS KASIR — MASTER CONFIG FILE
   ============================================================
   ✏️  EDIT FILE INI SAJA untuk mengubah:
       - Endpoint API
       - Harga paket Basic & Pro
       - Teks promo
       - Daftar toko "Dipercaya oleh"
       - Fitur section & pricing

   ⚠️  Kalau ubah HARGA, wajib ubah juga di master.gs:
       - PRICE_BASIC
       - PRICE_PRO
       Lalu redeploy Apps Script (New version).
   ============================================================ */

window.POS_CONFIG = {

    /* ============================================================
       1. API ENDPOINT
       ============================================================ */
    API_BASE: 'https://poskasir.muhasa48.workers.dev/master',


    /* ============================================================
       2. QRIS
       ============================================================ */
    QRIS: {
        imageUrl: 'https://res.cloudinary.com/n5omj6b6/image/upload/v1791515733/IMG_20261009_101239.png',
        merchantName: 'Muhasa.id'
    },


    /* ============================================================
       3. TEKS PROMO (Hero Badge + Countdown Banner)
       ============================================================ */
    PROMO: {
        enabled: true,

        // Hero badge di bagian atas
        heroBadge: 'Tanpa Install · Setup 5 Menit · Support 24/7',

        // Countdown banner di section pricing
        bannerTitle: 'Promo Spesial — <em>Pro dari Rp 150.000 jadi Rp 75.000</em>',
        bannerSubtitle: 'Hemat Rp 75.000/bulan · berlaku untuk 50 pembeli pertama'
    },


    /* ============================================================
       4. LOGO STRIP (Dipercaya oleh)
       ============================================================ */
    LOGO_STRIP: {
        label: 'Dipercaya oleh',
        stores: [
            'Kala Space Cafe',
            'Kopi Senja',
            'Sate Solo Pak Yamin',
            'RM Dapur Nusantara',
            'Soto Boyolali Hj Hesti',
            'Es Teh Solo',
            'Martabak Bangka 99',
            'Seblak Prasmanan Bekasi',
            'Sweet Bakery Co.',
            'Cafe Breaks',
            'Waroeng Iga Bakar & Steak'
        ],
        moreText: '+50 toko lainnya di seluruh Indonesia'
    },


    /* ============================================================
       5. HARGA PAKET
       ============================================================ */
    PLANS: {
        basic: {
            price: 100000,
            priceDisplay: '100',
            priceUnit: 'rb',
            formLabel: 'Rp 100rb',
            formDesc: 'Untuk toko kecil',
            originalPrice: null,
            discountPercent: null,
            ctaLabel: 'Pilih Basic',
            ctaClass: 'secondary'
        },
        pro: {
            price: 75000,
            priceDisplay: '75',
            priceUnit: 'rb',
            formLabel: 'Rp 75rb',
            formDesc: 'Hemat Rp 75.000 dari Rp 150.000',
            originalPrice: 150000,
            discountPercent: 50,
            ctaLabel: 'Ambil Promo Pro',
            ctaClass: 'primary'
        }
    },

    DEFAULT_PLAN: 'pro',


    /* ============================================================
       6. FITUR SECTION
       ============================================================ */
    FEATURES: [

        /* -------- KATEGORI 1: KASIR & TRANSAKSI -------- */
        {
            category: 'Kasir & Transaksi',
            icon: 'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z',
            items: [
                {
                    title: 'Kasir Cepat',
                    desc: 'Input pesanan multi-item dengan hitungan otomatis. Cukup tap produk, jumlah, dan bayar.',
                    tag: 'basic',
                    icon: 'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5z'
                },
                {
                    title: 'Cetak Struk Pelanggan',
                    desc: 'Cetak struk thermal 58mm langsung dari browser. Support printer thermal standar kasir.',
                    tag: 'basic',
                    icon: 'M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5zM19 19.09H5V4.91h14v14.18zM6 15h12v2H6zm0-4h12v2H6zm0-4h12v2H6z'
                },
                {
                    title: 'Cetak Struk Dapur',
                    desc: 'Kirim pesanan ke dapur dengan tipe Dine In/Takeaway, nomor meja, dan catatan khusus pelanggan.',
                    tag: 'basic',
                    icon: 'M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5zM19 19.09H5V4.91h14v14.18zM6 15h12v2H6zm0-4h12v2H6zm0-4h12v2H6z'
                },
                {
                    title: 'Split Bill / Hold Bill',
                    desc: 'Simpan pesanan pelanggan sementara. Lanjutkan kapan saja tanpa kehilangan data.',
                    tag: 'basic',
                    icon: 'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z'
                }
            ]
        },

        /* -------- KATEGORI 2: LAPORAN & ANALISA -------- */
        {
            category: 'Laporan & Analisa',
            icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
            items: [
                {
                    title: 'Dashboard Omset',
                    desc: 'Lihat omset harian, bulanan, dan grafik penjualan live. Tahu performa toko dalam sekejap.',
                    tag: 'basic',
                    icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'
                },
                {
                    title: 'Laporan Harian',
                    desc: 'Rekap transaksi per hari — omset, jumlah transaksi, produk terlaris, dan total tunai.',
                    tag: 'basic',
                    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'
                },
                {
                    title: 'Export CSV',
                    desc: 'Download riwayat transaksi ke CSV. Mudah diolah di Excel untuk laporan pajak atau audit.',
                    tag: 'basic',
                    icon: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'
                },
                {
                    title: 'Manajemen HPP & Margin',
                    desc: 'Hitung margin keuntungan tiap produk. Ketahui produk mana untung besar, mana yang rugi.',
                    tag: 'pro',
                    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z'
                },
                {
                    title: 'Laporan Laba Rugi',
                    desc: 'Lihat profit bersih toko per periode. Omset dikurangi HPP = margin asli bisnis Anda.',
                    tag: 'pro',
                    icon: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z'
                }
            ]
        },

        /* -------- KATEGORI 3: PROMO & MARKETING -------- */
        {
            category: 'Promo & Marketing',
            icon: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
            items: [
                {
                    title: 'Kupon Diskon',
                    desc: 'Buat kode kupon seperti "JUMATBERKAH" dengan diskon persen atau nominal. Batas penggunaan bisa diatur.',
                    tag: 'pro',
                    icon: 'M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z'
                },
                {
                    title: 'Diskon Per Produk',
                    desc: 'Beri diskon khusus per produk — persen atau nominal. Cocok untuk produk slow-moving atau promo flash sale.',
                    tag: 'pro',
                    icon: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'
                }
            ]
        },

        /* -------- KATEGORI 4: OPERASIONAL TOKO -------- */
        {
            category: 'Operasional Toko',
            icon: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
            items: [
                {
                    title: 'Kas & Petty Cash',
                    desc: 'Catat modal awal, pengeluaran operasional (beli gas, bayar listrik), dan lihat estimasi kas laci.',
                    tag: 'basic',
                    icon: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'
                },
                {
                    title: 'Tutup Shift Kasir',
                    desc: 'Hitung uang fisik di laci, bandingkan dengan sistem, cetak rekap penutupan shift untuk serah terima.',
                    tag: 'basic',
                    icon: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'
                },
                {
                    title: 'Cloud Sync Google Sheet',
                    desc: 'Data otomatis tersimpan ke Google Spreadsheet pribadi Anda. Backup aman & bisa diakses kapan saja.',
                    tag: 'basic',
                    icon: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z'
                },
                {
                    title: 'Custom Warna & Dark Mode',
                    desc: 'Sesuaikan warna aksen aplikasi dengan brand toko Anda. Plus dark mode untuk kenyamanan mata.',
                    tag: 'basic',
                    icon: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'
                }
            ]
        }
    ],


    /* ============================================================
       7. FITUR DI KARTU PRICING
       ============================================================ */
    PRICING_FEATURES: {
        basic: [
            '1 Toko / Cabang',
            'Kasir Cepat & Multi-Item',
            'Cetak Struk Pelanggan & Dapur',
            'Split Bill / Hold Bill',
            'Dashboard Omset & Laporan Harian',
            'Export CSV',
            'Kas & Petty Cash',
            'Tutup Shift Kasir',
            'Cloud Sync Google Spreadsheet',
            'Custom Warna & Dark Mode',
            'Support via WhatsApp'
        ],
        pro: [
            { text: 'Semua Fitur Basic', strong: true },
            { text: '2 Toko / Cabang', strong: true },
            { text: 'Manajemen HPP & Margin', strong: true },
            { text: 'Laporan Laba Rugi', strong: true },
            'Kupon Diskon',
            'Diskon Per Produk',
            { text: 'Priority Support', strong: true }
        ]
    }
};
