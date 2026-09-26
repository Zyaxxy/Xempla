import os
import pytest
from fastapi.testclient import TestClient

# Use a test database path
TEST_DB_PATH = "/tmp/test_tasks.db"
os.environ["DB_PATH"] = TEST_DB_PATH

from backend.app.database import init_db
from backend.app.main import app


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    init_db(TEST_DB_PATH)
    yield
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_initial_empty_state(client):
    response = client.get("/api/tasks")
    assert response.status_code == 200
    assert response.json() == []

    response = client.get("/api/people")
    assert response.status_code == 200
    assert response.json() == []


def test_people_management(client):
    # Add person
    res = client.post("/api/people", json={"name": "Alice"})
    assert res.status_code == 201
    assert res.json() == {"name": "Alice"}

    # Duplicate person should return 409
    dup_res = client.post("/api/people", json={"name": "Alice"})
    assert dup_res.status_code == 409

    # Add second person
    client.post("/api/people", json={"name": "Bob"})

    # List people (should be sorted alphabetically)
    list_res = client.get("/api/people")
    assert list_res.status_code == 200
    assert list_res.json() == [{"name": "Alice"}, {"name": "Bob"}]

    # Empty name should fail validation
    invalid_res = client.post("/api/people", json={"name": "   "})
    assert invalid_res.status_code == 422


def test_task_lifecycle(client):
    # Add a person first
    client.post("/api/people", json={"name": "Alice"})

    # Create task
    task_payload = {
        "title": "Design Mockups",
        "description": "Create Figma designs for the board",
        "status": "todo",
        "assignee": "Alice",
    }
    create_res = client.post("/api/tasks", json=task_payload)
    assert create_res.status_code == 201
    task = create_res.json()
    assert task["title"] == "Design Mockups"
    assert task["description"] == "Create Figma designs for the board"
    assert task["status"] == "todo"
    assert task["assignee"] == "Alice"
    assert "id" in task
    assert "created_at" in task
    assert "updated_at" in task
    task_id = task["id"]

    # List tasks
    list_res = client.get("/api/tasks")
    assert list_res.status_code == 200
    tasks = list_res.json()
    assert len(tasks) == 1
    assert tasks[0]["id"] == task_id

    # Update status to in_progress
    patch_res = client.patch(f"/api/tasks/{task_id}", json={"status": "in_progress"})
    assert patch_res.status_code == 200
    updated_task = patch_res.json()
    assert updated_task["status"] == "in_progress"

    # Update assignee and title
    patch_res2 = client.patch(
        f"/api/tasks/{task_id}",
        json={"title": "Updated Title", "assignee": "Bob"},
    )
    assert patch_res2.status_code == 200
    updated_task2 = patch_res2.json()
    assert updated_task2["title"] == "Updated Title"
    assert updated_task2["assignee"] == "Bob"

    # Check that Bob was added to people list automatically
    people_res = client.get("/api/people")
    names = [p["name"] for p in people_res.json()]
    assert "Bob" in names

    # Unassign task
    patch_res3 = client.patch(f"/api/tasks/{task_id}", json={"assignee": None})
    assert patch_res3.status_code == 200
    assert patch_res3.json()["assignee"] is None

    # Delete task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 204

    # Verify task is deleted
    list_after_del = client.get("/api/tasks")
    assert list_after_del.status_code == 200
    assert list_after_del.json() == []

    # Deleting non-existent task returns 404
    del_again = client.delete(f"/api/tasks/{task_id}")
    assert del_again.status_code == 404

    # Updating non-existent task returns 404
    patch_non_existent = client.patch(f"/api/tasks/{task_id}", json={"status": "done"})
    assert patch_non_existent.status_code == 404


def test_invalid_task_inputs(client):
    # Empty title
    res = client.post("/api/tasks", json={"title": "   "})
    assert res.status_code == 422

    # Invalid status
    res = client.post("/api/tasks", json={"title": "Valid", "status": "invalid_status"})
    assert res.status_code == 422


def test_persistence_across_restarts():
    # 1. Start with fresh client and add data
    with TestClient(app) as client:
        client.post("/api/people", json={"name": "Charlie"})
        client.post(
            "/api/tasks",
            json={
                "title": "Persistent Task",
                "description": "Must survive restart",
                "status": "in_progress",
                "assignee": "Charlie",
            },
        )

    # 2. Simulate complete restart by creating a new client connecting to the same DB
    with TestClient(app) as new_client:
        people_res = new_client.get("/api/people")
        assert people_res.status_code == 200
        assert any(p["name"] == "Charlie" for p in people_res.json())

        tasks_res = new_client.get("/api/tasks")
        assert tasks_res.status_code == 200
        tasks = tasks_res.json()
        persisted = [t for t in tasks if t["title"] == "Persistent Task"]
        assert len(persisted) == 1
        assert persisted[0]["status"] == "in_progress"
        assert persisted[0]["assignee"] == "Charlie"


def test_spa_serving(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "Shared Task Board" in res.text or "<!doctype html>" in res.text.lower()


