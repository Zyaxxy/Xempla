import uuid
from datetime import datetime, timezone
import sqlite3
from typing import List, Optional, Dict, Any
from .models import TaskCreate, TaskUpdate


def get_current_iso_time() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_all_people(conn: sqlite3.Connection) -> List[Dict[str, str]]:
    cursor = conn.cursor()
    cursor.execute("SELECT name, role FROM people ORDER BY name COLLATE NOCASE ASC")
    rows = cursor.fetchall()
    return [{"name": row["name"], "role": row["role"] or ""} for row in rows]


def add_person(conn: sqlite3.Connection, name: str, role: str = "") -> Dict[str, str]:
    cursor = conn.cursor()
    cursor.execute("INSERT INTO people (name, role) VALUES (?, ?)", (name, role or ""))
    conn.commit()
    return {"name": name, "role": role or ""}


def person_exists(conn: sqlite3.Connection, name: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM people WHERE name = ?", (name,))
    return cursor.fetchone() is not None


def ensure_person_exists(conn: sqlite3.Connection, name: str, role: str = "") -> None:
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO people (name, role) VALUES (?, ?)", (name, role or ""))
    conn.commit()


def calculate_priority_and_urgency(task: Dict[str, Any], now: Optional[datetime] = None) -> tuple[float, str]:
    """Calculate a weighted priority score and urgency classification.
    
    Formula factors in:
    1. Base priority weight (urgent: 3.0, high: 2.0, medium: 1.0, low: 0.5)
    2. Time remaining until due date
    3. Estimated effort hours (slack time = time remaining - effort)
    """
    if now is None:
        now = datetime.now(timezone.utc)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    status = task.get("status", "todo")
    if status == "done":
        return -1.0, "done"

    priority = task.get("priority", "medium")
    weights = {"urgent": 3.0, "high": 2.0, "medium": 1.0, "low": 0.5}
    weight = weights.get(priority, 1.0)

    estimated_hours = float(task.get("estimated_hours") or 1.0)
    due_date_str = task.get("due_date")

    if not due_date_str:
        score = weight * 10.0 + min(5.0, estimated_hours)
        return round(score, 2), "none"

    try:
        clean_due = due_date_str.replace("Z", "+00:00")
        due_dt = datetime.fromisoformat(clean_due)
        if due_dt.tzinfo is None:
            due_dt = due_dt.replace(tzinfo=timezone.utc)
    except Exception:
        score = weight * 10.0
        return round(score, 2), "none"

    hours_until_due = (due_dt - now).total_seconds() / 3600.0
    slack_hours = hours_until_due - estimated_hours

    if hours_until_due < 0:
        # Overdue
        score = 10000.0 + (abs(hours_until_due) * 10.0) + (weight * 100.0)
        return round(score, 2), "overdue"
    elif slack_hours <= 0 or hours_until_due <= estimated_hours * 1.2:
        # Critical - must start immediately to finish before due
        score = 5000.0 + (100.0 / max(0.1, hours_until_due + 0.1)) * weight
        return round(score, 2), "critical"
    elif hours_until_due <= 24.0 or slack_hours <= 4.0:
        # High urgency - due in next 24h or tight slack
        score = 1000.0 + (50.0 / max(1.0, hours_until_due)) * (weight * estimated_hours)
        return round(score, 2), "high"
    elif hours_until_due <= 72.0:
        # Medium urgency - due within 3 days
        score = 200.0 + (weight * 20.0) + (estimated_hours * 5.0) / (hours_until_due / 24.0)
        return round(score, 2), "medium"
    else:
        # Low urgency
        score = max(1.0, 50.0 + (weight * 10.0) - (hours_until_due / 24.0))
        return round(score, 2), "low"


def get_all_tasks(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, title, description, status, priority, due_date, estimated_hours, assignee, created_at, updated_at
        FROM tasks
        """
    )
    rows = cursor.fetchall()
    tasks = []
    now = datetime.now(timezone.utc)
    for row in rows:
        t = dict(row)
        score, urgency = calculate_priority_and_urgency(t, now)
        t["calculated_priority_score"] = score
        t["urgency_level"] = urgency
        tasks.append(t)

    # Sort tasks by calculated_priority_score DESC, then created_at ASC
    tasks.sort(key=lambda x: (-x["calculated_priority_score"], x["created_at"]))
    return tasks


def get_task_by_id(conn: sqlite3.Connection, task_id: str) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, title, description, status, priority, due_date, estimated_hours, assignee, created_at, updated_at
        FROM tasks WHERE id = ?
        """,
        (task_id,),
    )
    row = cursor.fetchone()
    if row:
        t = dict(row)
        score, urgency = calculate_priority_and_urgency(t)
        t["calculated_priority_score"] = score
        t["urgency_level"] = urgency
        return t
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
        INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_hours, assignee, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            task_id,
            data.title,
            data.description or "",
            data.status or "todo",
            data.priority or "medium",
            data.due_date,
            data.estimated_hours if data.estimated_hours is not None else 1.0,
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
