"""
Control API routes for AgentShield-X Interactive Learning Academy
"""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.academy import (
    default_academy,
    AcademyLesson,
    LessonDifficulty,
)

router = APIRouter(prefix="/v1/academy", tags=["academy"])


class ChallengeSubmission(BaseModel):
    submission_text: str = Field(..., description="Test payload or solution text")


class CertificationRequest(BaseModel):
    candidate_name: str = Field(..., description="Full name of student/engineer")
    score: int = Field(100, description="Verification quiz score percentage")


@router.get("/lessons", response_model=Dict[str, Any])
def list_lessons():
    """List all guided interactive cybersecurity lessons and progress."""
    lessons = default_academy.get_lessons()
    return {
        "total": len(lessons),
        "lessons": [l.to_dict() for l in lessons],
    }


@router.get("/lessons/{lesson_id}", response_model=Dict[str, Any])
def get_lesson(lesson_id: str):
    """Retrieve details, attack vectors, and interactive challenges for a lesson."""
    try:
        lesson = default_academy.get_lesson(lesson_id)
        return lesson.to_dict()
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Lesson '{lesson_id}' not found")


@router.post("/lessons/{lesson_id}/complete", response_model=Dict[str, Any])
def complete_lesson(lesson_id: str):
    """Mark a learning module as completed."""
    try:
        return default_academy.complete_lesson(lesson_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Lesson '{lesson_id}' not found")


@router.post("/lessons/{lesson_id}/challenge", response_model=Dict[str, Any])
def verify_challenge(lesson_id: str, body: ChallengeSubmission):
    """Verify an interactive hands-on challenge submission against sandbox defenses."""
    try:
        return default_academy.verify_challenge(lesson_id, body.submission_text)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Lesson '{lesson_id}' not found")


@router.post("/certify", response_model=Dict[str, Any])
def issue_certification(body: CertificationRequest):
    """Issue a cryptographically sealed 'AgentShield Certified Defender' accreditation."""
    return default_academy.issue_certification(body.candidate_name, body.score)


@router.get("/stats", response_model=Dict[str, Any])
def get_academy_stats():
    """Retrieve overall learning completion progress and certification counts."""
    return default_academy.get_academy_stats()

