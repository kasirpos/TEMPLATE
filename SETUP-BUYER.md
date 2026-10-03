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
