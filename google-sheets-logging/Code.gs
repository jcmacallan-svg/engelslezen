/**
 * Google Apps Script Web App (POST endpoint) for logging quiz submissions.
 *
 * Steps:
 * 1) Google Drive -> New -> Google Apps Script
 * 2) Paste this code into Code.gs
 * 3) Set SPREADSHEET_ID below (or leave empty to auto-create on first request)
 * 4) Deploy -> New deployment -> Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5) Copy the Web app URL and paste into: app/public/config.json -> logging.appsScriptUrl
 */

const SHEET_NAME = 'Submissions';
const SPREADSHEET_ID = ''; // optional

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (body.kind !== 'submission') return jsonResponse({ ok: false, error: 'Invalid kind' }, 400);

    const ss = getOrCreateSpreadsheet_();
    const sheet = getOrCreateSheet_(ss, SHEET_NAME);

    const fixedHeaders = ['createdAt', 'studentName', 'quizTitle', 'score', 'maxScore'];
    const answerKeys = body.answers ? Object.keys(body.answers).sort() : [];
    const headers = fixedHeaders.concat(answerKeys);

    ensureHeaderRow_(sheet, headers);

    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headerRow.map(h => {
      if (h === 'createdAt') return body.createdAt || '';
      if (h === 'studentName') return body.studentName || '';
      if (h === 'quizTitle') return body.quizTitle || '';
      if (h === 'score') return body.score ?? '';
      if (h === 'maxScore') return body.maxScore ?? '';
      return (body.answers && body.answers[h] !== undefined) ? body.answers[h] : '';
    });

    sheet.appendRow(row);
    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSpreadsheet_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  const ss = SpreadsheetApp.create('PDF Quizzer Submissions');
  console.log('Created spreadsheet. ID:', ss.getId());
  return ss;
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureHeaderRow_(sheet, headers) {
  const lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].filter(String);
  const merged = existing.slice();
  headers.forEach(h => { if (merged.indexOf(h) === -1) merged.push(h); });
  if (merged.length !== existing.length) {
    sheet.getRange(1, 1, 1, merged.length).setValues([merged]);
    sheet.setFrozenRows(1);
  }
}
