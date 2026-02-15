# Technolaza Frontend

Next.js frontend for all backend conversion/speech/media endpoints.

## Run

```bash
cd /Users/aditya4/Desktop/Technolaza/frontend
npm install
npm run dev
```

App URL: [http://localhost:3000](http://localhost:3000)

## Backend URL

By default it uses:

`http://localhost:5001`

You can:
- change it from the UI top field (`Backend URL`), or
- set env var:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:5001 npm run dev
```

## Covered Features

- Image -> PDF
- PDF -> Images (`png/jpg/both`, `zip/direct`)
- PDF -> Word
- PNG <-> JPG conversion
- Voice -> Text (`txt/docx/pdf`)
- Text/PDF/Word -> Voice (`mp3/wav/aiff`)
- YouTube download (`mp3/mp4`)
