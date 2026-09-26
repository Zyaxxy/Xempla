import uuid
from datetime import datetime, timezone
import sqlite3
from typing import List, Optional, Dict, Any
from .models import TaskCreate, TaskUpdate


def get_current_iso_time() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_all_people(conn: sqlite3.Connection) -> List[Dict[str, str]]:
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM people ORDER BY name COLLATE NOCASE ASC")
    rows = cursor.fetchall()
    return [{"name": row["name"]} for row in rows]


def add_person(conn: sqlite3.Connection, name: str) -> Dict[str, str]:
    cursor = conn.cursor()
    cursor.execute("INSERT INTO people (name) VALUES (?)", (name,))
    conn.commit()
    return {"name": name}


def person_exists(conn: sqlite3.Connection, name: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM people WHERE name = ?", (name,))
    return cursor.fetchone() is not None


def ensure_person_exists(conn: sqlite3.Connection, name: str) -> None:
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO people (name) VALUES (?)", (name,))
    conn.commit()


def get_all_tasks(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, description, status, assignee, created_at, updated_at FROM tasks ORDER BY created_at ASC"
    )
    rows = cursor.fetchall()
    return [dict(row) for row in rows]


def get_task_by_id(conn: sqlite3.Connection, task_id: str) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, description, status, assignee, created_at, updated_at FROM tasks WHERE id = ?",
        (task_id,),
    )
    row = cursor.fetchone()
    if row:
        return dict(row)
    return None


def create_task(conn: sqlite3.Connection, data: TaskCreate) -> Dict[str, Any]:
    task_id = str(uuid.uuid4())
    now = get_current_iso_time()
    assignee = data.assignee

    if assignee:
        ensure_person_exists(conn, assignee)

    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO tasks (id, title, description, status, assignee, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            task_id,
            data.title,
            data.description or "",
            data.status or "todo",
            assignee,
            now,
            now,
        ),
    )
    conn.commit()
    return get_task_by_id(conn, task_id)  # type: ignore


def update_task(conn: sqlite3.Connection, task_id: str, data: TaskUpdate) -> Optional[Dict[str, Any]]:
    existing = get_task_by_id(conn, task_id)
    if not existing:
        return None

    update_fields = data.model_dump(exclude_unset=True)
    if not update_fields:
        return existing

    if "assignee" in update_fields and update_fields["assignee"]:
        ensure_person_exists(conn, update_fields["assignee"])

    now = get_current_iso_time()
    update_fields["updated_at"] = now

    set_clauses = [f"{field} = ?" for field in update_fields.keys()]
    values = list(update_fields.values())
    values.append(task_id)

    query = f"UPDATE tasks SET {', '.join(set_clauses)} WHERE id = ?"
    cursor = conn.cursor()
    cursor.execute(query, values)
    conn.commit()

    return get_task_by_id(conn, task_id)


def delete_task(conn: sqlite3.Connection, task_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    return cursor.rowcount > 0
