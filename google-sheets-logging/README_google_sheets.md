# Google Sheets logging — CORS-proof

Apps Script ContentService cannot set CORS headers (no setHeader).  
This project posts with `fetch(..., { mode: "no-cors" })` and `Content-Type: text/plain` to avoid CORS/preflight.

## Steps
1) Create Apps Script and paste `Code.gs`
2) Set `SPREADSHEET_ID` (ID only)
3) Deploy as Web app:
   - Execute as: Me
   - Who has access: Anyone
4) Put Web app URL (/exec) into `app/public/config.json` -> logging.appsScriptUrl
