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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

