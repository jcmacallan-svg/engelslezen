# Google Sheets logging (centrale inzendingen)

## 1) Apps Script maken
1. Google Drive → Nieuw → **Apps Script**
2. Open `Code.gs` en plak de inhoud uit `google-sheets-logging/Code.gs`
3. (Optioneel) vul `SPREADSHEET_ID` in als je al een Sheet hebt, anders laat leeg

## 2) Deploy als Web App
1. Klik **Deploy** → **New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Deploy
6. Kopieer de **Web app URL**

## 3) URL in de app zetten
Open `app/public/config.json` en plak de URL bij `logging.appsScriptUrl`.

## 4) Wat wordt gelogd?
- createdAt, studentName, quizTitle, score, maxScore
- plus alle vraag-IDs als kolommen (q1, q2, ...), met de gekozen antwoorden.
