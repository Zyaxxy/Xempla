#!/usr/bin/env bash
set -e

CLOUDFLARED_BIN="$HOME/.local/bin/cloudflared"

if [ ! -f "$CLOUDFLARED_BIN" ]; then
    echo "cloudflared not found at $CLOUDFLARED_BIN, checking PATH..."
    if command -v cloudflared &> /dev/null; then
        CLOUDFLARED_BIN="cloudflared"
    else
        echo "Error: cloudflared is not installed."
        echo "Run: mkdir -p ~/.local/bin && curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o ~/.local/bin/cloudflared && chmod +x ~/.local/bin/cloudflared"
        exit 1
    fi
fi

PORT="${PORT:-8000}"

echo "=========================================================="
echo "🌐 Starting Cloudflare Quick Tunnel on port $PORT..."
echo "=========================================================="
echo "Connecting to Cloudflare edge..."
echo "A public https://*.trycloudflare.com link will appear below."
echo "Share that link with your team so they can join your board."
echo "Press Ctrl+C to stop the tunnel."
echo "=========================================================="

exec "$CLOUDFLARED_BIN" tunnel --url "http://localhost:$PORT"
