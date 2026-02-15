# YouTube Downloader → S3 Backend

A simple Node.js (Express) backend that downloads YouTube videos using **yt-dlp**, uploads them to **AWS S3**, and serves download links via **presigned URLs**.

---

## Prerequisites

### 1. Install yt-dlp & ffmpeg

```bash
# macOS (Homebrew)
brew install yt-dlp ffmpeg
```

### 2. Install Node dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env` and fill in your real AWS credentials:

```env
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=eu-north-1
S3_BUCKET_NAME=your-bucket-name
PORT=3000
```

> ⚠️ Make sure your S3 bucket exists in the specified region and the IAM user has `s3:PutObject` and `s3:GetObject` permissions.

---

## Run Locally

```bash
# Start server (with auto-restart on file changes)
npm run dev2

# Or without watch mode
npm run start2
```

You should see:

```
🚀 server2 running on http://localhost:3000
```

---

## API Endpoints

### 1. `POST /api/download` — Start a download job

```bash
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

**Response:**

```json
{
  "jobId": "a1b2c3d4-...",
  "status": "queued",
  "note": "Poll GET /api/status/:jobId to check progress."
}
```

### 2. `GET /api/status/:jobId` — Check job progress

```bash
curl http://localhost:3000/api/status/<jobId>
```

**Response (processing):**

```json
{
  "jobId": "a1b2c3d4-...",
  "status": "processing",
  "progress": "42.3%"
}
```

**Response (done):**

```json
{
  "jobId": "a1b2c3d4-...",
  "status": "done",
  "s3Key": "downloads/a1b2c3d4-....mp4",
  "downloadUrl": "https://your-bucket.s3.eu-north-1.amazonaws.com/...",
  "downloadEndpoint": "/api/download/a1b2c3d4-..."
}
```

**Response (error):**

```json
{
  "jobId": "a1b2c3d4-...",
  "status": "error",
  "error": "yt-dlp error message..."
}
```

### 3. `GET /api/download/:jobId` — Download the file

```bash
# -L follows the 302 redirect to S3
curl -L -o video.mp4 http://localhost:3000/api/download/<jobId>
```

Or simply open in your browser — it will redirect to S3 and start downloading.

---

## Job Status Flow

```
queued  →  processing  →  uploading  →  done
                                    →  error
```

---

## File Structure

```
backend/
├── server2.js          # Main server code
├── .env                # Your AWS credentials (git-ignored)
├── .env.example        # Template for .env
├── package.json
├── README-server2.md   # This file
└── tmp/                # Temporary downloads (auto-created, auto-cleaned)
```

---

## Notes

- **No database** — jobs are tracked in-memory (they are lost on restart).
- **No queue** — downloads run as background spawned processes.
- **Presigned URLs** expire after **10 minutes**; the `/api/download/:jobId` endpoint generates a fresh one on each request.
- `--no-playlist` is always passed to yt-dlp so playlist URLs only download a single video.
- Only YouTube URLs are accepted (youtube.com, www.youtube.com, m.youtube.com, youtu.be).
