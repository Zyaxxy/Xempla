#!/usr/bin/env python3
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
FRONTEND_DIST = os.path.join(FRONTEND_DIR, "dist")


def ensure_frontend_built():
    if not os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        print("Frontend production build not found. Building now...")
        subprocess.check_call(["npm", "run", "build"], cwd=FRONTEND_DIR)
        print("Frontend build complete!")


def main():
    ensure_frontend_built()

    import uvicorn

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))

    print(f"\n=======================================================")
    print(f"🚀 Shared Task Board running at: http://localhost:{port}")
    print(f"📖 API Documentation (Swagger):  http://localhost:{port}/docs")
    print(f"=======================================================\n")

    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    main()
