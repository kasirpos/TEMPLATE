/* =========================================================
   POS KASIR - APPS SCRIPT BACKEND
   Versi: Fixed (date/time + delete transaction)
   ========================================================= */

/* ====== KONFIGURASI WAJIB ====== */
const SPREADSHEET_ID = 'PASTE_ID_SPREADSHEET_DI_SINI';
const SECRET_TOKEN   = 'TOKEN_UNIK_BUYER_INI';

/* =========================================================
   ENTRY POINT
   ========================================================= */
function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    const params   = e.parameter || {};
    const postData = e.postData ? JSON.parse(e.postData.contents) : {};
    const action   = params.action || postData.action;
    const token    = params.token  || postData.token;

    if (!validateToken(token)) {
      return jsonResponse({ success: false, error: 'Token tidak valid / expired' });
    }

    let result;
    switch (action) {
      case 'ping':              result = { message: 'pong', time: new Date() }; break;
      case 'getAll':            result = getAllData(); break;
      case 'saveProduct':       result = saveProduct(postData.data); break;
      case 'deleteProduct':     result = deleteProduct(postData.id); break;
      case 'saveTransaction':   result = saveTransaction(postData.data); break;
      case 'voidTransaction':   result = voidTransaction(postData.id); break;
      case 'hideTransaction':   result = hideTransaction(postData.id); break;
      case 'deleteTransaction': result = deleteTransaction(postData.id); break;
      case 'saveCoupon':        result = saveCoupon(postData.data); break;
      case 'deleteCoupon':      result = deleteCoupon(postData.code); break;
      case 'saveCashFlow':      result = saveCashFlow(postData.data); break;
      case 'bulkSave':          result = bulkSave(postData.data); break;
      default: result = { error: 'Action tidak dikenal: ' + action };
    }
    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* =========================================================
   VALIDASI TOKEN
   ========================================================= */
function validateToken(token) {
  if (!token || token !== SECRET_TOKEN) return false;

  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Tenants');
  if (!sh) return false;

  const data    = sh.getDataRange().getValues();
  const headers = data[0];
  const tokenCol  = headers.indexOf('token');
  const activeCol = headers.indexOf('active');
  const expCol    = headers.indexOf('expiredAt');

  for (let i = 1; i < data.length; i++) {
    if (data[i][tokenCol] === token && data[i][activeCol] === true) {
      const expiredAt = new Date(data[i][expCol]);
      if (expiredAt < new Date()) return false;
      return true;
    }
  }
  return false;
}

/* =========================================================
   UTIL
   ========================================================= */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function sheetToObjects(sh) {
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function safeParseJSON(str) {
  try { return JSON.parse(str); } catch(e) { return null; }
}

function findRow(sh, idColumn, idValue) {
  const data = sh.getDataRange().getValues();
  const idCol = data[0].indexOf(idColumn);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(idValue)) return i + 1;
  }
  return -1;
}

/* ===== HELPER: Format Date & Time biar tidak ISO ===== */
function formatDate(val) {
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  if (typeof val === 'string') {
    return val.substring(0, 10);
  }
  return '';
}

function formatTime(val) {
  if (val instanceof Date) {
    const h = String(val.getHours()).padStart(2, '0');
    const m = String(val.getMinutes()).padStart(2, '0');
    return h + '.' + m;
  }
  return String(val || '');
}

/* =========================================================
   READ
   ========================================================= */
function getAllData() {
  const products = sheetToObjects(getSheet('Products')).map(p => ({
    id: Number(p.id),
    name: p.name,
    category: p.category,
    price: Number(p.price),
    hpp: Number(p.hpp) || 0,
    discountType: p.discountType || 'percent',
    discountValue: Number(p.discountValue) || 0,
    icon: p.icon || 'ri-cup-line',
    image: p.image || ''
  }));

  const transactions = sheetToObjects(getSheet('Transactions')).map(t => ({
    id: t.id,
    date: formatDate(t.date),
    time: formatTime(t.time),
    cashier: t.cashier,
    subtotal: Number(t.subtotal) || 0,
    discountAmount: Number(t.discountAmount) || 0,
    couponDiscount: Number(t.couponDiscount) || 0,
    couponCode: t.couponCode || null,
    tax: Number(t.tax) || 0,
    total: Number(t.total) || 0,
    paid: Number(t.paid) || 0,
    change: Number(t.change) || 0,
    isVoid: t.isVoid === true || t.isVoid === 'TRUE',
    isHidden: t.isHidden === true || t.isHidden === 'TRUE',
    items: safeParseJSON(t.items_json) || []
  }));

  const coupons = sheetToObjects(getSheet('Coupons')).map(c => ({
    code: c.code,
    type: c.type,
    value: Number(c.value) || 0,
    limit: Number(c.limit) || 0,
    used: Number(c.used) || 0,
    active: c.active === true || c.active === 'TRUE'
  }));

  const cashflow = sheetToObjects(getSheet('CashFlow')).map(c => ({
    id: c.id,
    type: c.type,
    keterangan: c.keterangan,
    nominal: Number(c.nominal) || 0,
    date: formatDate(c.date)
  }));

  return { products, transactions, coupons, cashflow };
}

/* =========================================================
   WRITE: PRODUCTS
   ========================================================= */
function saveProduct(p) {
  const sh = getSheet('Products');
  const headers = sh.getDataRange().getValues()[0];
  const rowData = headers.map(h => {
    if (h === 'updatedAt') return new Date();
    return p[h] !== undefined ? p[h] : '';
  });

  const foundRow = findRow(sh, 'id', p.id);
  if (foundRow > 0) {
    sh.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sh.appendRow(rowData);
  }
  return { ok: true, id: p.id };
}

function deleteProduct(id) {
  const sh = getSheet('Products');
  const foundRow = findRow(sh, 'id', id);
  if (foundRow > 0) sh.deleteRow(foundRow);
  return { ok: true };
}

/* =========================================================
   WRITE: TRANSACTIONS
   ========================================================= */
function saveTransaction(t) {
  const sh = getSheet('Transactions');
  const headers = sh.getDataRange().getValues()[0];

  const row = headers.map(h => {
    if (h === 'items_json') return JSON.stringify(t.items || []);
    if (h === 'isVoid' || h === 'isHidden') return t[h] ? true : false;
    return t[h] !== undefined ? t[h] : '';
  });

  sh.appendRow(row);

  // Paksa kolom date & time jadi PLAIN TEXT (biar tidak auto-convert jadi Date object)
  const newRow = sh.getLastRow();
  const dateCol = headers.indexOf('date') + 1;
  const timeCol = headers.indexOf('time') + 1;

  if (dateCol > 0) {
    sh.getRange(newRow, dateCol).setNumberFormat('@STRING@').setValue(t.date || '');
  }
  if (timeCol > 0) {
    sh.getRange(newRow, timeCol).setNumberFormat('@STRING@').setValue(t.time || '');
  }

  return { ok: true, id: t.id };
}

function voidTransaction(id)   { return updateTrxFlag(id, 'isVoid', true); }
function hideTransaction(id)   { return updateTrxFlag(id, 'isHidden', true); }

function updateTrxFlag(id, column, value) {
  const sh = getSheet('Transactions');
  const headers = sh.getDataRange().getValues()[0];
  const colIdx = headers.indexOf(column) + 1;
  const foundRow = findRow(sh, 'id', id);
  if (foundRow > 0) {
    sh.getRange(foundRow, colIdx).setValue(value);
    return { ok: true };
  }
  return { ok: false, error: 'Trx tidak ditemukan' };
}

/* ===== DELETE PERMANEN ===== */
function deleteTransaction(id) {
  const sh = getSheet('Transactions');
  const foundRow = findRow(sh, 'id', id);
  if (foundRow > 0) {
    sh.deleteRow(foundRow);
    return { ok: true, deleted: id };
  }
  return { ok: false, error: 'Trx tidak ditemukan: ' + id };
}

/* =========================================================
   WRITE: COUPONS
   ========================================================= */
function saveCoupon(c) {
  const sh = getSheet('Coupons');
  const headers = sh.getDataRange().getValues()[0];
  const row = headers.map(h => c[h] !== undefined ? c[h] : '');

  const found = findRow(sh, 'code', c.code);
  if (found > 0) sh.getRange(found, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
  return { ok: true };
}

function deleteCoupon(code) {
  const sh = getSheet('Coupons');
  const found = findRow(sh, 'code', code);
  if (found > 0) sh.deleteRow(found);
  return { ok: true };
}

/* =========================================================
   WRITE: CASHFLOW
   ========================================================= */
function saveCashFlow(c) {
  const sh = getSheet('CashFlow');
  sh.appendRow([
    c.id || Date.now(),
    c.type,
    c.keterangan || '',
    c.nominal || 0,
    c.date || formatDate(new Date())
  ]);
  return { ok: true };
}

/* =========================================================
   BULK SAVE
   ========================================================= */
function bulkSave(data) {
  if (data.products && Array.isArray(data.products)) {
    const sh = getSheet('Products');
    const lastRow = sh.getLastRow();
    if (lastRow > 1) sh.deleteRows(2, lastRow - 1);

    const rows = data.products.map(p => [
      p.id, p.name, p.category, p.price, p.hpp || 0,
      p.discountType || 'percent', p.discountValue || 0,
      p.icon || '', p.image || '', new Date()
    ]);
    if (rows.length) sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  if (data.coupons && Array.isArray(data.coupons)) {
    const sh = getSheet('Coupons');
    const lastRow = sh.getLastRow();
    if (lastRow > 1) sh.deleteRows(2, lastRow - 1);

    const rows = data.coupons.map(c => [
      c.code, c.type, c.value, c.limit, c.used || 0, c.active !== false
    ]);
    if (rows.length) sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  return { ok: true };
}

/* =========================================================
   TEST FUNCTION
   ========================================================= */
function testSetup() {
  const result = getAllData();
  Logger.log('✅ Produk: ' + result.products.length);
  Logger.log('✅ Transaksi: ' + result.transactions.length);
  Logger.log('✅ Kupon: ' + result.coupons.length);
  Logger.log('✅ Setup OK!');
}
