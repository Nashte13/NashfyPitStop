"""
NashfyPitStop Backend API
FastAPI server for F1 data using FastF1 library
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import logging
from typing import Optional, List
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.fastf1_service import FastF1Service
from database import get_db, init_db, ClubMember, RaceReaction
from models import RaceReactionCreate, RaceReactionResponse, ClubMemberCreate, ClubMemberResponse
from sqlalchemy.orm import Session
from fastapi import Depends

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NashfyPitStop API",
    description="F1 data API using FastF1 library",
    version="1.0.0"
)

# Configure CORS - Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:3000",
        "file://",  # For local file access
        "*"  # Allow all origins for development (restrict in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize FastF1 service
fastf1_service = FastF1Service()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "NashfyPitStop API is running",
        "version": "1.0.0"
    }

@app.get("/api/race-schedule")
async def get_race_schedule(
    year: int = Query(2025, description="F1 season year"),
    include_sessions: bool = Query(False, description="Include practice, qualifying sessions")
):
    """
    Get F1 race schedule for a given year
    Returns list of races with dates, times, and circuit information
    """
    try:
        logger.info(f"Fetching race schedule for year {year}")
        schedule = await fastf1_service.get_race_schedule(year, include_sessions)
        return {
            "success": True,
            "year": year,
            "races": schedule,
            "count": len(schedule)
        }
    except Exception as e:
        logger.error(f"Error fetching race schedule: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch race schedule: {str(e)}"
        )

@app.get("/api/race-results")
async def get_race_results(
    year: int = Query(2025, description="F1 season year"),
    round: Optional[int] = Query(None, description="Specific race round number"),
    latest: bool = Query(False, description="Get latest completed race")
):
    """
    Get race results for a season or specific race
    """
    try:
        logger.info(f"Fetching race results for year {year}, round {round}")
        results = await fastf1_service.get_race_results(year, round, latest)
        return {
            "success": True,
            "year": year,
            "results": results
        }
    except Exception as e:
        logger.error(f"Error fetching race results: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch race results: {str(e)}"
        )

@app.get("/api/driver-standings")
async def get_driver_standings(
    year: int = Query(2025, description="F1 season year"),
    after_round: Optional[int] = Query(None, description="Standings after specific round")
):
    """
    Get driver championship standings
    """
    try:
        logger.info(f"Fetching driver standings for year {year}")
        standings = await fastf1_service.get_driver_standings(year, after_round)
        return {
            "success": True,
            "year": year,
            "standings": standings
        }
    except Exception as e:
        logger.error(f"Error fetching driver standings: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch driver standings: {str(e)}"
        )

@app.get("/api/constructor-standings")
async def get_constructor_standings(
    year: int = Query(2025, description="F1 season year"),
    after_round: Optional[int] = Query(None, description="Standings after specific round")
):
    """
    Get constructor championship standings
    """
    try:
        logger.info(f"Fetching constructor standings for year {year}")
        standings = await fastf1_service.get_constructor_standings(year, after_round)
        return {
            "success": True,
            "year": year,
            "standings": standings
        }
    except Exception as e:
        logger.error(f"Error fetching constructor standings: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch constructor standings: {str(e)}"
        )

@app.get("/api/telemetry")
async def get_telemetry(
    year: int = Query(2025, description="F1 season year"),
    round: int = Query(1, description="Race round number"),
    session: str = Query("R", description="Session type: FP1, FP2, FP3, Q, R (race)"),
    driver: Optional[str] = Query(None, description="Driver abbreviation (e.g., VER, HAM)")
):
    """
    Get telemetry data for a specific session
    Note: Telemetry data is only available for completed sessions
    """
    try:
        logger.info(f"Fetching telemetry for {year} Round {round}, Session {session}, Driver {driver}")
        telemetry = await fastf1_service.get_telemetry(year, round, session, driver)
        return {
            "success": True,
            "year": year,
            "round": round,
            "session": session,
            "telemetry": telemetry
        }
    except Exception as e:
        logger.error(f"Error fetching telemetry: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch telemetry: {str(e)}"
        )

@app.get("/api/lap-times")
async def get_lap_times(
    year: int = Query(2025, description="F1 season year"),
    round: int = Query(1, description="Race round number"),
    session: str = Query("R", description="Session type: FP1, FP2, FP3, Q, R (race)"),
    driver: Optional[str] = Query(None, description="Driver abbreviation")
):
    """
    Get lap times for a specific session
    """
    try:
        logger.info(f"Fetching lap times for {year} Round {round}, Session {session}")
        lap_times = await fastf1_service.get_lap_times(year, round, session, driver)
        return {
            "success": True,
            "year": year,
            "round": round,
            "session": session,
            "lap_times": lap_times
        }
    except Exception as e:
        logger.error(f"Error fetching lap times: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch lap times: {str(e)}"
        )

@app.get("/api/race-info")
async def get_race_info(
    year: int = Query(2025, description="F1 season year"),
    round: int = Query(1, description="Race round number"),
    session: str = Query("R", description="Session type: FP1, FP2, FP3, Q, R (race)")
):
    """
    Get comprehensive race information (timing, track status, session status, etc.)
    """
    try:
        logger.info(f"Fetching race info for {year} Round {round}, Session {session}")
        race_info = await fastf1_service.get_race_info(year, round, session)
        return {
            "success": True,
            "race_info": race_info
        }
    except Exception as e:
        logger.error(f"Error fetching race info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch race info: {str(e)}"
        )

@app.get("/api/track-status")
async def get_track_status(
    year: int = Query(2025, description="F1 season year"),
    round: int = Query(1, description="Race round number"),
    session: str = Query("R", description="Session type: FP1, FP2, FP3, Q, R (race)")
):
    """
    Get track status (flags, safety car, etc.)
    """
    try:
        logger.info(f"Fetching track status for {year} Round {round}, Session {session}")
        status = await fastf1_service.get_track_status(year, round, session)
        return {
            "success": True,
            "track_status": status
        }
    except Exception as e:
        logger.error(f"Error fetching track status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch track status: {str(e)}"
        )

@app.get("/api/next-race")
async def get_next_race():
    """
    Get information about the next upcoming race
    """
    try:
        logger.info("Fetching next race information")
        next_race = await fastf1_service.get_next_race()
        return {
            "success": True,
            "race": next_race
        }
    except Exception as e:
        logger.error(f"Error fetching next race: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch next race: {str(e)}"
        )

# Database endpoints for reactions and club members
@app.post("/api/race-reactions", response_model=RaceReactionResponse)
async def create_race_reaction(
    reaction: RaceReactionCreate,
    db: Session = Depends(get_db)
):
    """
    Create a race reaction/comment
    Requires: User must be a club member
    """
    try:
        # Check if user is a club member
        member = db.query(ClubMember).filter(
            ClubMember.email == reaction.member_email,
            ClubMember.status == 'approved',
            ClubMember.is_active == True
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=403,
                detail="You must be an approved club member to react. Please join the club first."
            )
        
        # Create reaction
        db_reaction = RaceReaction(
            member_id=member.id,
            race_year=reaction.race_year,
            race_round=reaction.race_round,
            race_name=reaction.race_name,
            comment=reaction.comment,
            reaction_type=reaction.reaction_type
        )
        
        db.add(db_reaction)
        db.commit()
        db.refresh(db_reaction)
        
        return RaceReactionResponse(
            id=db_reaction.id,
            member_name=member.name,
            member_email=member.email,
            race_year=db_reaction.race_year,
            race_round=db_reaction.race_round,
            race_name=db_reaction.race_name,
            comment=db_reaction.comment,
            reaction_type=db_reaction.reaction_type,
            created_at=db_reaction.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating reaction: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create reaction: {str(e)}"
        )

@app.get("/api/race-reactions", response_model=List[RaceReactionResponse])
async def get_race_reactions(
    race_year: int = Query(..., description="Race year"),
    race_round: int = Query(..., description="Race round number"),
    db: Session = Depends(get_db)
):
    """
    Get all reactions for a specific race
    """
    try:
        reactions = db.query(RaceReaction).join(ClubMember).filter(
            RaceReaction.race_year == race_year,
            RaceReaction.race_round == race_round
        ).order_by(RaceReaction.created_at.desc()).all()
        
        return [
            RaceReactionResponse(
                id=r.id,
                member_name=r.member.name,
                member_email=r.member.email,
                race_year=r.race_year,
                race_round=r.race_round,
                race_name=r.race_name,
                comment=r.comment,
                reaction_type=r.reaction_type,
                created_at=r.created_at
            )
            for r in reactions
        ]
    except Exception as e:
        logger.error(f"Error fetching reactions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch reactions: {str(e)}"
        )

@app.post("/api/club-members", response_model=ClubMemberResponse)
async def create_club_member(
    member: ClubMemberCreate,
    db: Session = Depends(get_db)
):
    """
    Join the club (create a new club member)
    """
    try:
        # Check if email already exists
        existing = db.query(ClubMember).filter(ClubMember.email == member.email).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already registered. Please use a different email."
            )
        
        # Create new member
        db_member = ClubMember(
            name=member.name,
            email=member.email,
            city=member.city,
            status='pending'  # Requires approval
        )
        
        db.add(db_member)
        db.commit()
        db.refresh(db_member)
        
        return ClubMemberResponse(
            id=db_member.id,
            name=db_member.name,
            email=db_member.email,
            city=db_member.city,
            status=db_member.status,
            submitted_at=db_member.submitted_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating club member: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to join club: {str(e)}"
        )

@app.get("/api/club-members/check")
async def check_club_member(
    email: str = Query(..., description="Email to check"),
    db: Session = Depends(get_db)
):
    """
    Check if an email is registered and approved as a club member
    """
    try:
        member = db.query(ClubMember).filter(ClubMember.email == email).first()
        
        if not member:
            return {
                "is_member": False,
                "is_approved": False,
                "message": "Not a club member"
            }
        
        return {
            "is_member": True,
            "is_approved": member.status == 'approved' and member.is_active,
            "status": member.status,
            "name": member.name
        }
    except Exception as e:
        logger.error(f"Error checking club member: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check membership: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

