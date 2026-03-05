# PDF Quizzer (GitHub Pages)

Werkende starter:
- links een PDF (tekstboekje)
- rechts vragen uit `quiz.json`
- inleveren: direct nakijken + feedback
- logging: lokaal (browser) + CSV export

## Lokaal draaien
```bash
cd app
npm install
npm run dev
```

## Nieuwe quiz toevoegen
Maak `app/public/quizzes/<slug>/` met:
- `source.pdf`
- `quiz.json`

Open dan: `/#/quiz/<slug>`

## Deploy op GitHub Pages
1. Commit/push alles naar `main`
2. Repo Settings → Pages → Source = **GitHub Actions**
3. Repo Settings → Actions → General → Workflow permissions = **Read and write**
4. Push naar main of run workflow handmatig.

> We gebruiken `HashRouter`, dus refresh werkt op GitHub Pages.
