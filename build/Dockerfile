FROM node:22-bookworm

ARG DEBIAN_FRONTEND=noninteractive

# Xvfb provides a virtual display; the rest are libraries VS Code (Electron) needs to start
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      xvfb xauth \
      libasound2 libatk-bridge2.0-0 libatk1.0-0 libdrm2 libgbm1 libgtk-3-0 libnss3 \
      libsecret-1-0 libxkbfile1 libxshmfence1 libxss1 && \
    rm -rf /var/lib/apt/lists/*

# pnpm comes from Corepack, at the version pinned by `packageManager` in package.json.
# /cache is a volume, so Corepack's download and pnpm's store persist between runs.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV COREPACK_HOME=/cache/corepack
RUN corepack enable

WORKDIR /app

# node_modules and out/ are volumes too (see gulpfile.js), so the host's Windows/macOS builds are
# neither used nor overwritten
ENTRYPOINT ["sh", "-c", "pnpm install --frozen-lockfile --ignore-scripts --store-dir /cache/pnpm-store && pnpm build-test && xvfb-run -a pnpm test"]
