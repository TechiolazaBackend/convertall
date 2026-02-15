# Technolaza Backend API Guide

This document explains how to run, test, and extend the backend APIs in:

`/Users/aditya4/Desktop/Technolaza/backend`

## 1) Project Structure

- `index.js`: Server entry (starts Express app)
- `app.js`: Express app wiring (middlewares + routes)
- `routes/`: Route definitions
- `controllers/`: HTTP handlers
- `services/`: Business logic / integrations
- `middleware/`: Upload + error middleware
- `utils/`: Shared helpers (temp dirs, shell commands, zip, docs)

## 2) Runtime Requirements

### Core
- Node.js (Node 20+ recommended)
- npm

### External tools used by features
- `whisper-cli` (voice-to-text)
- Whisper model file (default: `/Users/aditya4/ggml-base.en.bin`)
- `ffmpeg` (audio conversion / YouTube mp3)
- `yt-dlp` (YouTube downloads)
- `soffice` from LibreOffice (pdf->word)
- `gm` + `gs` (pdf->image)

### Quick checks
```bash
which whisper-cli
ls -l /Users/aditya4/ggml-base.en.bin
which ffmpeg
which yt-dlp
which gm
which gs
ls -l /Applications/LibreOffice.app/Contents/MacOS/soffice
```

If `gm` and `gs` are missing on macOS:
```bash
brew install graphicsmagick ghostscript
```

## 3) Environment Variables

Optional overrides:

- `PORT` (default: `5001`)
- `WHISPER_BIN` (default: `/opt/homebrew/bin/whisper-cli`)
- `WHISPER_MODEL` (default: `/Users/aditya4/ggml-base.en.bin`)
- `SOFFICE_BIN` (default: `/Applications/LibreOffice.app/Contents/MacOS/soffice`)

Example:
```bash
PORT=5001 \
WHISPER_BIN=/opt/homebrew/bin/whisper-cli \
WHISPER_MODEL=/Users/aditya4/ggml-base.en.bin \
SOFFICE_BIN=/Applications/LibreOffice.app/Contents/MacOS/soffice \
npm run dev
```

## 4) Start the Server

```bash
cd /Users/aditya4/Desktop/Technolaza/backend
npm install
npm run dev
```

Health check:
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{"status":"ok"}
```

## 5) Global Request Rules

- Uploads are in-memory via `multer`.
- Global limits:
  - Max file size: `100MB` per file
  - Max files: `30`
- `images-to-pdf` has route-specific max `20` files.
- Error format:
```json
{"message":"..."}
```

## 6) API Endpoints

Base URL examples below assume `http://localhost:5001`.

---

### A) Image -> PDF

- **Method**: `POST`
- **URL**: `/api/convert/images-to-pdf`
- **Body**: `multipart/form-data`
  - `images` (one or more `.png/.jpg/.jpeg`)
- **Output**: `converted.pdf`

```bash
curl -X POST http://localhost:5001/api/convert/images-to-pdf \
  -F "images=@/absolute/path/image1.png" \
  -F "images=@/absolute/path/image2.jpg" \
  --output converted.pdf
```

Common errors:
- `400`: no images uploaded
- `400`: unsupported image format

---

### B) PDF -> Images

- **Method**: `POST`
- **URL**: `/api/convert/pdf-to-images`
- **Body**: `multipart/form-data`
  - `file` (PDF)
  - `format` = `png` | `jpg` | `both` (default `png`)
  - `delivery` = `zip` | `direct` (default `zip`)
- **Output**:
  - `zip`: downloadable zip (`pdf-images.zip`)
  - `direct`:
    - single image generated -> returns that image file directly
    - multiple images generated -> returns `multipart/mixed` response containing all images

```bash
curl -fS -X POST http://localhost:5001/api/convert/pdf-to-images \
  -F "file=@/absolute/path/input.pdf" \
  -F "format=both" \
  -F "delivery=zip" \
  --output pdf-images.zip
```

Direct mode example:
```bash
curl -X POST http://localhost:5001/api/convert/pdf-to-images \
  -F "file=@/absolute/path/input.pdf" \
  -F "format=png" \
  -F "delivery=direct" \
  --output pdf-images.multipart
```

Note:
- If you save error JSON as `.zip`, macOS Archive Utility shows “unsupported format”.
- Use `curl -fS` to make curl fail on HTTP errors instead of writing error JSON into a zip file.

Common errors:
- `400`: no PDF, invalid `format`, or invalid `delivery`
- `500`: missing dependencies (`gm` or `gs`)

---

### C) PDF -> Word

- **Method**: `POST`
- **URL**: `/api/convert/pdf-to-word`
- **Body**: `multipart/form-data`
  - `file` (PDF)
- **Output**: `.docx`

```bash
curl -X POST http://localhost:5001/api/convert/pdf-to-word \
  -F "file=@/absolute/path/input.pdf" \
  --output output.docx
```

Common errors:
- `400`: uploaded file is not PDF
- `500`: LibreOffice (`soffice`) not available

---

### D) Image Format Conversion (PNG <-> JPG)

- **Method**: `POST`
- **URL**: `/api/convert/image-format`
- **Body**: `multipart/form-data`
  - `image` (input image)
  - `targetFormat` = `png` | `jpg` (also accepts `jpeg`)
- **Output**: converted image file

```bash
curl -X POST http://localhost:5001/api/convert/image-format \
  -F "image=@/absolute/path/input.png" \
  -F "targetFormat=jpg" \
  --output converted.jpg
```

Common errors:
- `400`: invalid target format
- `400`: invalid/corrupt input image

---

### E) Voice -> Text (txt/docx/pdf)

- **Method**: `POST`
- **URL**: `/api/speech/voice-to-text`
- **Body**: `multipart/form-data`
  - `audio` (wav/mp3/etc.)
  - `outputFormat` = `txt` | `docx` | `pdf` (default `txt`)
- **Output**: transcript file (`transcript.txt/docx/pdf`)

```bash
curl -X POST http://localhost:5001/api/speech/voice-to-text \
  -F "audio=@/absolute/path/input.wav" \
  -F "outputFormat=pdf" \
  --output transcript.pdf
```

Common errors:
- `400`: no audio uploaded
- `400`: invalid output format
- `500`: whisper binary/model missing

---

### F) Text/PDF/Word -> Voice

- **Method**: `POST`
- **URL**: `/api/speech/to-voice`
- **Body**: `multipart/form-data`
  - Either `text` field, or `file` (`txt/pdf/docx`)
  - `outputFormat` = `mp3` | `wav` | `aiff` (default `mp3`)
- **Output**: synthesized speech audio

If both `text` and `file` are sent, `text` is used.

Text example:
```bash
curl -X POST http://localhost:5001/api/speech/to-voice \
  -F "text=Hello from Technolaza backend" \
  -F "outputFormat=mp3" \
  --output speech.mp3
```

File example:
```bash
curl -X POST http://localhost:5001/api/speech/to-voice \
  -F "file=@/absolute/path/input.docx" \
  -F "outputFormat=wav" \
  --output speech.wav
```

Common errors:
- `400`: no text/file
- `400`: unsupported input file type
- `500`: OS TTS dependency missing (`say` on macOS, `espeak` on Linux)
- `500`: `ffmpeg` missing for conversions

---

### G) YouTube Download (MP4/MP3)

- **Method**: `POST`
- **URL**: `/api/youtube/download`
- **Body**: `application/json`
  - `url`: valid YouTube URL
  - `type`: `mp4` | `mp3` (default `mp4`)
- **Output**: media file download

```bash
curl -X POST http://localhost:5001/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","type":"mp3"}' \
  --output youtube.mp3
```

Common errors:
- `400`: invalid URL
- `500`: `yt-dlp` missing
- `500`: `ffmpeg` missing for `mp3`
- `500`: unavailable/restricted video

## 7) Cleanup / Temp File Behavior

The backend creates temporary working folders in OS temp (via `os.tmpdir()`) and deletes them after download responses.

The project folder `tmp` (`/Users/aditya4/Desktop/Technolaza/backend/tmp`) is not used by current code and can be removed safely.

## 8) Troubleshooting

### PDF -> Image fails with dependency message
Install and verify:
```bash
brew install graphicsmagick ghostscript
which gm
which gs
```

### PDF -> Word fails
Verify LibreOffice binary:
```bash
ls -l /Applications/LibreOffice.app/Contents/MacOS/soffice
```
If custom path:
```bash
SOFFICE_BIN=/custom/path/to/soffice npm run dev
```

### Voice -> Text fails
Verify whisper:
```bash
which whisper-cli
ls -l /Users/aditya4/ggml-base.en.bin
```

### YouTube download fails
Verify:
```bash
which yt-dlp
which ffmpeg
```
Then test URL directly in browser to ensure it is publicly available.

## 9) Suggested Development Workflow

1. Keep new HTTP routes in `routes/`
2. Keep request/response shaping in `controllers/`
3. Keep heavy logic and tool integration in `services/`
4. Throw `HttpError(status, message)` from service layer for clean API errors
5. Add quick curl test commands for each new endpoint during development

---

If you want, next step I can add an `API_COLLECTION.json` (Postman/Insomnia style) under `/Users/aditya4/Desktop/Technolaza/backend` for one-click endpoint testing.
