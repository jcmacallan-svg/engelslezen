const SHEET_NAME = 'Submissions';
// ID only (between /d/ and /edit)
const SPREADSHEET_ID = 'PASTE_SHEET_ID_HERE';

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'Quiz logger online' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (body.kind !== 'submission') return ok_({ ok: false, error: 'Invalid kind' });

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

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
    return ok_({ ok: true });
  } catch (err) {
    return ok_({ ok: false, error: String(err) });
  }
}

function ok_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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
