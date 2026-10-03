#!/bin/bash
# ================================================================
# Setup Folder Buyer Baru untuk POS Kasir
# ================================================================
# Usage:
#   ./setup-buyer.sh <folder> "<Nama Toko>" "<TOKEN>"
#
# Contoh:
#   ./setup-buyer.sh kalaspace "Kala Space Cafe" "KalaSpace2025"
#   ./setup-buyer.sh kopisenja "Kopi Senja" "KopiSenja2025"
# ================================================================

set -e

FOLDER=$1
NAMA_TOKO=$2
TOKEN=$3

# ===== Validasi Input =====
if [ -z "$FOLDER" ] || [ -z "$NAMA_TOKO" ] || [ -z "$TOKEN" ]; then
  echo ""
  echo "❌ ERROR: Parameter tidak lengkap!"
  echo ""
  echo "Usage:"
  echo "  ./setup-buyer.sh <folder> \"<Nama Toko>\" \"<TOKEN>\""
  echo ""
  echo "Contoh:"
  echo "  ./setup-buyer.sh kalaspace \"Kala Space Cafe\" \"KalaSpace2025\""
  echo ""
  exit 1
fi

# ===== Cek Folder Sudah Ada =====
if [ -d "$FOLDER" ]; then
  echo ""
  echo "❌ Folder '$FOLDER' sudah ada!"
  echo "   Hapus dulu: rm -rf $FOLDER"
  echo ""
  exit 1
fi

# ===== Cek TEMPLATE Ada =====
if [ ! -d "TEMPLATE" ]; then
  echo ""
  echo "❌ Folder TEMPLATE tidak ditemukan!"
  echo "   Pastikan jalankan script dari root repo."
  echo ""
  exit 1
fi

# ===== Copy Folder Template =====
echo ""
echo "📁 Membuat folder buyer: $FOLDER"
cp -r TEMPLATE "$FOLDER"

# ===== Edit config.js =====
echo "🔧 Update config.js..."

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s|TOKEN_UNIK_BUYER_INI|$TOKEN|g" "$FOLDER/config.js"
  sed -i '' "s|Kala Space Cafe|$NAMA_TOKO|g" "$FOLDER/config.js"
else
  # Linux / WSL / Git Bash
  sed -i "s|TOKEN_UNIK_BUYER_INI|$TOKEN|g" "$FOLDER/config.js"
  sed -i "s|Kala Space Cafe|$NAMA_TOKO|g" "$FOLDER/config.js"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ SUCCESS! Folder '$FOLDER' siap untuk '$NAMA_TOKO'"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 Langkah selanjutnya:"
echo ""
echo "1️⃣  SETUP SPREADSHEET"
echo "    → Copy TEMPLATE-MASTER-DB"
echo "    → Rename: ${FOLDER}-DB"
echo "    → Isi Sheet 'Tenants' dengan token: $TOKEN"
echo "    → Copy SPREADSHEET_ID"
echo ""
echo "2️⃣  DEPLOY APPS SCRIPT"
echo "    → Buat project baru di script.google.com"
echo "    → Paste isi _backend/Code.gs"
echo "    → Ganti SPREADSHEET_ID + SECRET_TOKEN"
echo "    → Deploy Web App → Copy URL"
echo ""
echo "3️⃣  UPDATE API_URL"
echo "    → Edit file: $FOLDER/config.js"
echo "    → Ganti API_URL dengan URL Apps Script"
echo ""
echo "4️⃣  PUSH KE GITHUB"
echo "    → git add ."
echo "    → git commit -m \"Add buyer: $NAMA_TOKO\""
echo "    → git push"
echo ""
echo "5️⃣  TEST & KIRIM KE BUYER"
echo "    → URL: https://kasirpos.github.io/$FOLDER/"
echo "    → PIN default: 1234"
echo "    → Kirim file SETUP-BUYER.md ke buyer"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
