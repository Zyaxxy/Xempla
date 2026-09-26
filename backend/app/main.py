import os
import sqlite3
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .database import get_db_connection, init_db
from .models import (
    PersonCreate,
    PersonResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from . import crud


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Shared Task Board API",
    version="1.0.0",
    description="A lightweight shared task board backend",
    lifespan=lifespan,
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/tasks", response_model=List[TaskResponse])
def get_tasks():
    with get_db_connection() as conn:
        return crud.get_all_tasks(conn)


@app.post("/api/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate):
    with get_db_connection() as conn:
        task = crud.create_task(conn, task_in)
        return task


@app.patch("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task_in: TaskUpdate):
    with get_db_connection() as conn:
        task = crud.update_task(conn, task_id, task_in)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found",
            )
        return task


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str):
    with get_db_connection() as conn:
        deleted = crud.delete_task(conn, task_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found",
            )
        return None


@app.get("/api/people", response_model=List[PersonResponse])
def get_people():
    with get_db_connection() as conn:
        return crud.get_all_people(conn)


@app.post("/api/people", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
def add_person(person_in: PersonCreate):
    with get_db_connection() as conn:
        if crud.person_exists(conn, person_in.name):
            # 409 conflict if already exists
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Person '{person_in.name}' already exists",
            )
        try:
            return crud.add_person(conn, person_in.name, person_in.role or "")
        except sqlite3.IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Person '{person_in.name}' already exists",
            )


# Serve React production build
FRONTEND_DIST_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "frontend",
    "dist",
)

assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Allow API and docs routes to be handled above
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        raise HTTPException(status_code=404, detail="Not Found")
    if os.path.exists(FRONTEND_DIST_DIR):
        file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
    return {
        "message": "Shared Task Board API is running.",
        "docs": "/docs",
        "api_tasks": "/api/tasks",
        "api_people": "/api/people",
    }

