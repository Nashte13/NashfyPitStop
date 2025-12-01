"""
Pydantic models for API requests/responses
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class RaceReactionCreate(BaseModel):
    member_email: EmailStr
    race_year: int
    race_round: int
    race_name: Optional[str] = None
    comment: Optional[str] = None
    reaction_type: Optional[str] = None

class RaceReactionResponse(BaseModel):
    id: int
    member_name: str
    member_email: str
    race_year: int
    race_round: int
    race_name: Optional[str]
    comment: Optional[str]
    reaction_type: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ClubMemberCreate(BaseModel):
    name: str
    email: EmailStr
    city: Optional[str] = None

class ClubMemberResponse(BaseModel):
    id: int
    name: str
    email: str
    city: Optional[str]
    status: str
    submitted_at: datetime
    
    class Config:
        from_attributes = True

