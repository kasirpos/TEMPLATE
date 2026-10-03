# 🚀 Panduan Instalasi POS Kasir

Selamat! Anda telah membeli **POS Kasir**. Ikuti panduan ini (~15 menit).

---

## 📋 Persiapan

- ✅ Akun Google (Gmail)
- ✅ Browser Chrome / Edge
- ✅ Koneksi internet stabil

---

## Bagian 1: Copy Google Spreadsheet (3 menit)

### 1.1 Buka Link Template

Admin kirim link via WhatsApp → klik.

### 1.2 Copy Spreadsheet

1. **File → Make a copy**
2. Rename: `POS - [Nama Toko Anda]`
3. Klik **Make a copy**
4. Buka file copy tersebut

### 1.3 Isi Data Toko

Buka tab **`Tenants`** (paling kiri), edit **baris ke-2**:

| Kolom | Isi | Contoh |
|-------|-----|--------|
| `tenantId` | ID unik huruf kecil | `kalaspace` |
| `storeName` | Nama toko | `Kala Space Cafe` |
| `token` | Password unik (**CATAT!**) | `KalaSpace2025` |
| `plan` | Paket | `pro` |
| `expiredAt` | YYYY-MM-DD | `2026-12-31` |
| `active` | Status aktif | `TRUE` |

> ⚠️ **PENTING:** Catat `token` di notepad — dipakai di Bagian 2 & 3.

### 1.4 Copy ID Spreadsheet

Lihat URL browser Anda:
https://docs.google.com/spreadsheets/d/[COPY_BAGIAN_INI]/edit


**Contoh:** `1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

> 💾 Simpan ID ini di notepad.

---

## Bagian 2: Deploy Apps Script (7 menit)

### 2.1 Buka Apps Script

1. Kunjungi [script.google.com](https://script.google.com)
2. Login dengan **akun Google yang sama**
3. Klik **+ New Project**

### 2.2 Rename Project

Klik **"Untitled project"** → ganti jadi: `POS Backend - [Nama Toko]` → **Rename**.

### 2.3 Paste Kode

1. Hapus semua isi file `Code.gs` (default)
2. Copy kode **`Code.gs`** yang dikirim admin
3. Paste ke editor

### 2.4 Ganti 2 Baris

Cari di paling atas:

```javascript
const SPREADSHEET_ID = 'PASTE_ID_SPREADSHEET_DI_SINI';
const SECRET_TOKEN   = 'TOKEN_UNIK_BUYER_INI';

Ganti jadi:

javascript
const SPREADSHEET_ID = 'ID_DARI_BAGIAN_1.4';
const SECRET_TOKEN   = 'TOKEN_YANG_ANDA_ISI_DI_BAGIAN_1.3';
Contoh:

javascript
const SPREADSHEET_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';
const SECRET_TOKEN   = 'KalaSpace2025';
2.5 Save & Test
Klik 💾 Save (Ctrl+S)

Pilih fungsi testSetup dari dropdown → klik ▶️ Run

Klik Review Permissions → pilih akun Anda → Advanced → Go to ... (unsafe) → Allow

Cek log (View → Logs):
