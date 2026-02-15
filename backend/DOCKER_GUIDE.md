# Backend Docker Guide

## 0) Clone + prerequisites (server/member machine)

```bash
git clone <your-repo-url>
cd Technolaza
```

Make sure Docker engine/daemon is running before build:

```bash
docker version
docker compose version
```

## Build image

```bash
cd Technolaza

docker build -t technolaza-backend:latest ./backend
```

## Run container

```bash
docker run -d \
  --name technolaza-backend \
  -p 5001:5001 \
  technolaza-backend:latest
```

## Verify

```bash
curl http://localhost:5001/health
```

## Logs

```bash
docker logs -f technolaza-backend
```

## Stop / remove

```bash
docker stop technolaza-backend
docker rm technolaza-backend
```

## Build + run using compose (from repo root)

```bash
cd Technolaza

docker compose up --build -d
```

Stop compose:

```bash
docker compose down
```

## Rebuild after code changes

```bash
cd Technolaza

docker compose down
docker compose up --build -d
```
