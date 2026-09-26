from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

TaskStatus = Literal["todo", "in_progress", "done"]
TaskPriority = Literal["low", "medium", "high", "urgent"]


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(default="", max_length=2000, description="Optional task description")
    status: TaskStatus = Field(default="todo", description="Task status")
    priority: TaskPriority = Field(default="medium", description="Task base importance priority")
    due_date: Optional[str] = Field(default=None, description="ISO-8601 formatted due date and time")
    estimated_hours: Optional[float] = Field(default=1.0, ge=0.1, le=100.0, description="Estimated effort in hours")
    assignee: Optional[str] = Field(default=None, description="Name of the assigned person")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Title cannot be empty or only whitespace")
        return stripped

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            return stripped if stripped else None
        return None

    @field_validator("assignee")
    @classmethod
    def validate_assignee(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            return stripped if stripped else None
        return None


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default="")
    status: Optional[TaskStatus] = Field(default="todo")
    priority: Optional[TaskPriority] = Field(default="medium")
    due_date: Optional[str] = Field(default=None)
    estimated_hours: Optional[float] = Field(default=1.0, ge=0.1, le=100.0)
    assignee: Optional[str] = Field(default=None)

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Title cannot be empty or only whitespace")
        return stripped

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            return stripped if stripped else None
        return None

    @field_validator("assignee")
    @classmethod
    def validate_assignee(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            return stripped if stripped else None
        return None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None)
    status: Optional[TaskStatus] = Field(default=None)
    priority: Optional[TaskPriority] = Field(default=None)
    due_date: Optional[str] = Field(default=None)
    estimated_hours: Optional[float] = Field(default=None, ge=0.1, le=100.0)
    assignee: Optional[str] = Field(default=None)

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Title cannot be empty or only whitespace")
            return stripped
        return None

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            return stripped if stripped else None
        return None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[str] = None
    estimated_hours: Optional[float] = 1.0
    calculated_priority_score: Optional[float] = None
    urgency_level: Optional[str] = None
    assignee: Optional[str] = None
    created_at: str
    updated_at: str


class PersonCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Name cannot be empty or only whitespace")
        return stripped


class PersonResponse(BaseModel):
    name: str
