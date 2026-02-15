FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ghostscript \
    graphicsmagick \
    libreoffice \
    libreoffice-writer \
    yt-dlp \
    ca-certificates \
    git \
    cmake \
    build-essential \
    curl \
  && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 https://github.com/ggml-org/whisper.cpp.git /opt/whisper.cpp \
  && cmake -S /opt/whisper.cpp -B /opt/whisper.cpp/build -DCMAKE_BUILD_TYPE=Release \
  && cmake --build /opt/whisper.cpp/build -j"$(nproc)" \
  && ln -s /opt/whisper.cpp/build/bin/whisper-cli /usr/local/bin/whisper-cli \
  && mkdir -p /app/models \
  && bash /opt/whisper.cpp/models/download-ggml-model.sh base.en \
  && cp /opt/whisper.cpp/models/ggml-base.en.bin /app/models/ggml-base.en.bin

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=5001
ENV WHISPER_BIN=/usr/local/bin/whisper-cli
ENV WHISPER_MODEL=/app/models/ggml-base.en.bin
ENV SOFFICE_BIN=/usr/bin/soffice

EXPOSE 5001

CMD ["npm", "start"]
