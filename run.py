#!/usr/bin/env python3
import os
import shutil
import signal
import subprocess
import sys
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
FRONTEND_DIST = os.path.join(FRONTEND_DIR, "dist")


def ensure_frontend_built():
    if not os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        print("Frontend production build not found. Building now...")
        subprocess.check_call(["npm", "run", "build"], cwd=FRONTEND_DIR)
        print("Frontend build complete!")


def find_cloudflared() -> str:
    user_bin = os.path.expanduser("~/.local/bin/cloudflared")
    if os.path.isfile(user_bin) and os.access(user_bin, os.X_OK):
        return user_bin
    system_bin = shutil.which("cloudflared")
    if system_bin:
        return system_bin
    return ""


def main():
    use_tunnel = "--tunnel" in sys.argv or "-t" in sys.argv

    ensure_frontend_built()

    import uvicorn

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))

    print(f"\n=======================================================")
    print(f"🚀 Shared Task Board running at: http://localhost:{port}")
    print(f"📖 API Documentation (Swagger):  http://localhost:{port}/docs")

    cloudflared_proc = None

    if use_tunnel:
        cf_bin = find_cloudflared()
        if not cf_bin:
            print("❌ Error: cloudflared binary not found.")
            print("Run: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o ~/.local/bin/cloudflared && chmod +x ~/.local/bin/cloudflared")
            sys.exit(1)

        print(f"🌐 Cloudflare Tunnel enabled. Initializing public link...")
        print(f"=======================================================\n")

        # Launch cloudflared tunnel
        cloudflared_proc = subprocess.Popen(
            [cf_bin, "tunnel", "--url", f"http://localhost:{port}"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        def cleanup(sig=None, frame=None):
            if cloudflared_proc:
                cloudflared_proc.terminate()
            sys.exit(0)

        signal.signal(signal.SIGINT, cleanup)
        signal.signal(signal.SIGTERM, cleanup)

        # Print tunnel output in background
        import threading

        def stream_tunnel_output():
            for line in iter(cloudflared_proc.stdout.readline, ""):
                if "trycloudflare.com" in line:
                    for part in line.split():
                        if "trycloudflare.com" in part:
                            clean_url = part.strip().rstrip("|,.")
                            print(f"\n✨ PUBLIC LINK: {clean_url}\n")
                elif "error" in line.lower():
                    print(f"[tunnel] {line.strip()}")

        t = threading.Thread(target=stream_tunnel_output, daemon=True)
        t.start()
    else:
        print(f"💡 Tip: Run with --tunnel to get an instant public link")
        print(f"=======================================================\n")

    try:
        uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
    finally:
        if cloudflared_proc:
            cloudflared_proc.terminate()


if __name__ == "__main__":
    main()
