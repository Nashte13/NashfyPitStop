"""
FastF1 Service
Handles all FastF1 library operations and data processing
"""
import fastf1
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import logging
import asyncio
from functools import lru_cache

logger = logging.getLogger(__name__)

# Enable FastF1 caching for better performance
fastf1.Cache.enable_cache('./cache')  # Cache directory

class FastF1Service:
    """Service for interacting with FastF1 library"""
    
    def __init__(self):
        """Initialize FastF1 service"""
        logger.info("Initializing FastF1 service")
        # Set timezone for EAT (UTC+3)
        self.eat_offset = timedelta(hours=3)
    
    def _convert_to_eat(self, utc_time: datetime) -> datetime:
        """Convert UTC time to East Africa Time (UTC+3)"""
        if utc_time:
            return utc_time + self.eat_offset
        return utc_time
    
    def _format_datetime(self, dt: datetime) -> str:
        """Format datetime to ISO string"""
        if dt:
            return dt.isoformat()
        return None
    
    async def get_race_schedule(self, year: int, include_sessions: bool = False) -> List[Dict]:
        """
        Get race schedule for a given year
        
        Args:
            year: F1 season year
            include_sessions: Whether to include practice and qualifying session times
            
        Returns:
            List of race dictionaries with schedule information
        """
        try:
            logger.info(f"Loading schedule for year {year}")
            
            # Run in executor to avoid blocking
            loop = asyncio.get_event_loop()
            schedule = await loop.run_in_executor(
                None,
                self._fetch_schedule_sync,
                year,
                include_sessions
            )
            
            return schedule
        except Exception as e:
            logger.error(f"Error in get_race_schedule: {str(e)}")
            raise
    
    def _fetch_schedule_sync(self, year: int, include_sessions: bool) -> List[Dict]:
        """Synchronous schedule fetching (runs in executor)"""
        try:
            # Get schedule from FastF1
            schedule = fastf1.get_event_schedule(year)
            
            races = []
            for idx, event in schedule.iterrows():
                race_info = {
                    "round": int(event['RoundNumber']),
                    "raceName": event['EventName'],
                    "country": event['Country'],
                    "locality": event['Location'],
                    "circuit": event['Location'],
                    "date": event['EventDate'].strftime('%Y-%m-%d') if pd.notna(event['EventDate']) else None,
                    "year": year
                }
                
                # Get session times if available
                try:
                    # Try to load session data for more accurate times
                    session = fastf1.get_session(year, event['RoundNumber'], 'R')
                    session.load()
                    
                    if session.date:
                        race_datetime = session.date
                        race_info["date"] = race_datetime.strftime('%Y-%m-%d')
                        race_info["time"] = race_datetime.strftime('%H:%M:%S')
                        race_info["datetime"] = self._format_datetime(self._convert_to_eat(race_datetime))
                        race_info["datetime_utc"] = self._format_datetime(race_datetime)
                    else:
                        # Fallback to event date
                        if pd.notna(event['EventDate']):
                            race_info["time"] = "14:00:00"  # Default time
                            race_info["datetime"] = f"{race_info['date']}T14:00:00+03:00"
                except Exception as e:
                    logger.warning(f"Could not load session data for round {event['RoundNumber']}: {str(e)}")
                    # Use event date as fallback
                    if pd.notna(event['EventDate']):
                        race_info["time"] = "14:00:00"
                        race_info["datetime"] = f"{race_info['date']}T14:00:00+03:00"
                
                # Add session times if requested
                if include_sessions:
                    try:
                        fp1 = fastf1.get_session(year, event['RoundNumber'], 'FP1')
                        fp2 = fastf1.get_session(year, event['RoundNumber'], 'FP2')
                        fp3 = fastf1.get_session(year, event['RoundNumber'], 'FP3')
                        qual = fastf1.get_session(year, event['RoundNumber'], 'Q')
                        
                        race_info["sessions"] = {
                            "fp1": self._format_datetime(self._convert_to_eat(fp1.date)) if fp1.date else None,
                            "fp2": self._format_datetime(self._convert_to_eat(fp2.date)) if fp2.date else None,
                            "fp3": self._format_datetime(self._convert_to_eat(fp3.date)) if fp3.date else None,
                            "qualifying": self._format_datetime(self._convert_to_eat(qual.date)) if qual.date else None,
                            "race": race_info.get("datetime")
                        }
                    except Exception as e:
                        logger.warning(f"Could not load session times: {str(e)}")
                
                # Determine race status
                if race_info.get("datetime"):
                    race_dt = datetime.fromisoformat(race_info["datetime"].replace('+03:00', ''))
                    now = datetime.now() + self.eat_offset
                    race_info["status"] = "upcoming" if race_dt > now else "done"
                else:
                    race_info["status"] = "scheduled"
                
                races.append(race_info)
            
            return races
        except Exception as e:
            logger.error(f"Error fetching schedule: {str(e)}")
            raise
    
    async def get_race_results(self, year: int, round: Optional[int] = None, latest: bool = False) -> Dict:
        """
        Get race results for a season or specific race
        
        Args:
            year: F1 season year
            round: Specific race round number (optional)
            latest: Get latest completed race (optional)
            
        Returns:
            Dictionary with race results
        """
        try:
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None,
                self._fetch_results_sync,
                year,
                round,
                latest
            )
            return results
        except Exception as e:
            logger.error(f"Error in get_race_results: {str(e)}")
            raise
    
    def _fetch_results_sync(self, year: int, round: Optional[int], latest: bool) -> Dict:
        """Synchronous results fetching"""
        try:
            if latest:
                # Get latest completed race
                schedule = fastf1.get_event_schedule(year)
                now = datetime.now()
                completed_races = []
                
                for idx, event in schedule.iterrows():
                    try:
                        session = fastf1.get_session(year, event['RoundNumber'], 'R')
                        session.load()
                        if session.date and session.date < now:
                            completed_races.append((event['RoundNumber'], session.date))
                    except:
                        continue
                
                if not completed_races:
                    return {"error": "No completed races found"}
                
                # Get most recent
                latest_round = max(completed_races, key=lambda x: x[1])[0]
                round = latest_round
            
            if not round:
                return {"error": "Round number required or no completed races found"}
            
            # Load race session
            session = fastf1.get_session(year, round, 'R')
            session.load()
            
            # Get results
            results_df = session.results
            
            results = {
                "year": year,
                "round": round,
                "raceName": session.event['EventName'],
                "country": session.event['Country'],
                "circuit": session.event['Location'],
                "date": self._format_datetime(self._convert_to_eat(session.date)) if session.date else None,
                "results": []
            }
            
            for idx, driver in results_df.iterrows():
                results["results"].append({
                    "position": int(driver['Position']) if pd.notna(driver['Position']) else None,
                    "driver": driver['Abbreviation'],
                    "driverName": driver['FullName'],
                    "team": driver['TeamName'],
                    "points": float(driver['Points']) if pd.notna(driver['Points']) else 0,
                    "time": str(driver['Time']) if pd.notna(driver['Time']) else None,
                    "status": driver['Status'] if pd.notna(driver['Status']) else None,
                    "fastestLap": str(driver['FastestLapTime']) if pd.notna(driver['FastestLapTime']) else None
                })
            
            return results
        except Exception as e:
            logger.error(f"Error fetching results: {str(e)}")
            raise
    
    async def get_driver_standings(self, year: int, after_round: Optional[int] = None) -> List[Dict]:
        """Get driver championship standings"""
        try:
            loop = asyncio.get_event_loop()
            standings = await loop.run_in_executor(
                None,
                self._fetch_driver_standings_sync,
                year,
                after_round
            )
            return standings
        except Exception as e:
            logger.error(f"Error in get_driver_standings: {str(e)}")
            raise
    
    def _fetch_driver_standings_sync(self, year: int, after_round: Optional[int]) -> List[Dict]:
        """Synchronous driver standings fetching"""
        try:
            # FastF1 doesn't have direct standings API, so we calculate from results
            schedule = fastf1.get_event_schedule(year)
            driver_points = {}
            
            max_round = after_round if after_round else len(schedule)
            
            for idx, event in schedule.iterrows():
                round_num = int(event['RoundNumber'])
                if after_round and round_num > after_round:
                    break
                
                try:
                    session = fastf1.get_session(year, round_num, 'R')
                    session.load()
                    
                    if session.results is not None:
                        for _, driver in session.results.iterrows():
                            abbrev = driver['Abbreviation']
                            points = float(driver['Points']) if pd.notna(driver['Points']) else 0
                            
                            if abbrev not in driver_points:
                                driver_points[abbrev] = {
                                    "driver": abbrev,
                                    "driverName": driver['FullName'],
                                    "team": driver['TeamName'],
                                    "points": 0,
                                    "wins": 0
                                }
                            
                            driver_points[abbrev]["points"] += points
                            if driver['Position'] == 1:
                                driver_points[abbrev]["wins"] += 1
                except Exception as e:
                    logger.warning(f"Could not load results for round {round_num}: {str(e)}")
                    continue
            
            # Sort by points
            standings = sorted(driver_points.values(), key=lambda x: x["points"], reverse=True)
            
            # Add position
            for i, driver in enumerate(standings, 1):
                driver["position"] = i
            
            return standings
        except Exception as e:
            logger.error(f"Error fetching driver standings: {str(e)}")
            raise
    
    async def get_constructor_standings(self, year: int, after_round: Optional[int] = None) -> List[Dict]:
        """Get constructor championship standings"""
        try:
            loop = asyncio.get_event_loop()
            standings = await loop.run_in_executor(
                None,
                self._fetch_constructor_standings_sync,
                year,
                after_round
            )
            return standings
        except Exception as e:
            logger.error(f"Error in get_constructor_standings: {str(e)}")
            raise
    
    def _fetch_constructor_standings_sync(self, year: int, after_round: Optional[int]) -> List[Dict]:
        """Synchronous constructor standings fetching"""
        try:
            schedule = fastf1.get_event_schedule(year)
            team_points = {}
            
            max_round = after_round if after_round else len(schedule)
            
            for idx, event in schedule.iterrows():
                round_num = int(event['RoundNumber'])
                if after_round and round_num > after_round:
                    break
                
                try:
                    session = fastf1.get_session(year, round_num, 'R')
                    session.load()
                    
                    if session.results is not None:
                        for _, driver in session.results.iterrows():
                            team = driver['TeamName']
                            points = float(driver['Points']) if pd.notna(driver['Points']) else 0
                            
                            if team not in team_points:
                                team_points[team] = {
                                    "team": team,
                                    "points": 0,
                                    "wins": 0
                                }
                            
                            team_points[team]["points"] += points
                            if driver['Position'] == 1:
                                team_points[team]["wins"] += 1
                except Exception as e:
                    logger.warning(f"Could not load results for round {round_num}: {str(e)}")
                    continue
            
            # Sort by points
            standings = sorted(team_points.values(), key=lambda x: x["points"], reverse=True)
            
            # Add position
            for i, team in enumerate(standings, 1):
                team["position"] = i
            
            return standings
        except Exception as e:
            logger.error(f"Error fetching constructor standings: {str(e)}")
            raise
    
    async def get_telemetry(self, year: int, round: int, session: str, driver: Optional[str] = None) -> Dict:
        """
        Get telemetry data for a specific session
        
        Args:
            year: F1 season year
            round: Race round number
            session: Session type (FP1, FP2, FP3, Q, R)
            driver: Driver abbreviation (optional)
            
        Returns:
            Dictionary with telemetry data
        """
        try:
            loop = asyncio.get_event_loop()
            telemetry = await loop.run_in_executor(
                None,
                self._fetch_telemetry_sync,
                year,
                round,
                session,
                driver
            )
            return telemetry
        except Exception as e:
            logger.error(f"Error in get_telemetry: {str(e)}")
            raise
    
    def _fetch_telemetry_sync(self, year: int, round: int, session: str, driver: Optional[str]) -> Dict:
        """Synchronous telemetry fetching"""
        try:
            sess = fastf1.get_session(year, round, session)
            sess.load()
            
            if driver:
                # Get specific driver telemetry
                driver_laps = sess.laps.pick_driver(driver)
                if len(driver_laps) == 0:
                    return {"error": f"No data found for driver {driver}"}
                
                telemetry = driver_laps.get_telemetry()
                
                return {
                    "driver": driver,
                    "laps": len(driver_laps),
                    "telemetry": {
                        "time": telemetry['Time'].tolist() if 'Time' in telemetry.columns else [],
                        "speed": telemetry['Speed'].tolist() if 'Speed' in telemetry.columns else [],
                        "rpm": telemetry['RPM'].tolist() if 'RPM' in telemetry.columns else [],
                        "throttle": telemetry['Throttle'].tolist() if 'Throttle' in telemetry.columns else [],
                        "brake": telemetry['Brake'].tolist() if 'Brake' in telemetry.columns else [],
                        "gear": telemetry['nGear'].tolist() if 'nGear' in telemetry.columns else [],
                        "drs": telemetry['DRS'].tolist() if 'DRS' in telemetry.columns else []
                    }
                }
            else:
                # Get all drivers summary
                drivers = sess.results['Abbreviation'].tolist()
                return {
                    "drivers": drivers,
                    "message": "Specify a driver to get detailed telemetry"
                }
        except Exception as e:
            logger.error(f"Error fetching telemetry: {str(e)}")
            raise
    
    async def get_lap_times(self, year: int, round: int, session: str, driver: Optional[str] = None) -> Dict:
        """Get lap times for a specific session"""
        try:
            loop = asyncio.get_event_loop()
            lap_times = await loop.run_in_executor(
                None,
                self._fetch_lap_times_sync,
                year,
                round,
                session,
                driver
            )
            return lap_times
        except Exception as e:
            logger.error(f"Error in get_lap_times: {str(e)}")
            raise
    
    def _fetch_lap_times_sync(self, year: int, round: int, session: str, driver: Optional[str]) -> Dict:
        """Synchronous lap times fetching"""
        try:
            sess = fastf1.get_session(year, round, session)
            sess.load()
            
            if driver:
                driver_laps = sess.laps.pick_driver(driver)
                laps_data = []
                for idx, lap in driver_laps.iterrows():
                    laps_data.append({
                        "lap": int(lap['LapNumber']) if pd.notna(lap['LapNumber']) else None,
                        "time": str(lap['LapTime']) if pd.notna(lap['LapTime']) else None,
                        "sector1": str(lap['Sector1Time']) if pd.notna(lap['Sector1Time']) else None,
                        "sector2": str(lap['Sector2Time']) if pd.notna(lap['Sector2Time']) else None,
                        "sector3": str(lap['Sector3Time']) if pd.notna(lap['Sector3Time']) else None,
                        "compound": lap['Compound'] if pd.notna(lap['Compound']) else None,
                        "tyreAge": int(lap['TyreLife']) if pd.notna(lap['TyreLife']) else None
                    })
                
                return {
                    "driver": driver,
                    "laps": laps_data
                }
            else:
                # Get all drivers
                all_laps = sess.laps
                drivers_summary = {}
                
                for drv in sess.results['Abbreviation']:
                    driver_laps = all_laps.pick_driver(drv)
                    if len(driver_laps) > 0:
                        best_lap = driver_laps.pick_fastest()
                        drivers_summary[drv] = {
                            "totalLaps": len(driver_laps),
                            "bestLap": str(best_lap['LapTime'].iloc[0]) if pd.notna(best_lap['LapTime'].iloc[0]) else None
                        }
                
                return {
                    "drivers": drivers_summary
                }
        except Exception as e:
            logger.error(f"Error fetching lap times: {str(e)}")
            raise
    
    async def get_next_race(self) -> Dict:
        """Get information about the next upcoming race"""
        try:
            current_year = datetime.now().year
            schedule = await self.get_race_schedule(current_year)
            
            now = datetime.now() + self.eat_offset
            
            for race in schedule:
                if race.get("datetime"):
                    try:
                        race_dt = datetime.fromisoformat(race["datetime"].replace('+03:00', ''))
                        if race_dt > now:
                            return {
                                "race": race,
                                "countdown": {
                                    "days": (race_dt - now).days,
                                    "hours": (race_dt - now).seconds // 3600,
                                    "minutes": ((race_dt - now).seconds % 3600) // 60,
                                    "seconds": (race_dt - now).seconds % 60,
                                    "total_seconds": int((race_dt - now).total_seconds())
                                }
                            }
                    except:
                        continue
            
            # If no upcoming race in current year, check next year
            next_year = current_year + 1
            schedule_next = await self.get_race_schedule(next_year)
            if schedule_next:
                return {
                    "race": schedule_next[0],
                    "countdown": None,
                    "message": "Next race is in next season"
                }
            
            return {"error": "No upcoming race found"}
        except Exception as e:
            logger.error(f"Error getting next race: {str(e)}")
            raise
    
    async def get_race_info(self, year: int, round: int, session: str = 'R') -> Dict:
        """
        Get comprehensive race information including timing, track status, session status, etc.
        """
        try:
            loop = asyncio.get_event_loop()
            race_info = await loop.run_in_executor(
                None,
                self._fetch_race_info_sync,
                year,
                round,
                session
            )
            return race_info
        except Exception as e:
            logger.error(f"Error in get_race_info: {str(e)}")
            raise
    
    def _fetch_race_info_sync(self, year: int, round: int, session: str) -> Dict:
        """Synchronous race info fetching"""
        try:
            sess = fastf1.get_session(year, round, session)
            sess.load()
            
            race_info = {
                "year": year,
                "round": round,
                "session": session,
                "event_name": sess.event['EventName'] if hasattr(sess, 'event') else None,
                "country": sess.event['Country'] if hasattr(sess, 'event') else None,
                "location": sess.event['Location'] if hasattr(sess, 'event') else None,
                "circuit": sess.event['Location'] if hasattr(sess, 'event') else None,
                "date": self._format_datetime(self._convert_to_eat(sess.date)) if sess.date else None,
            }
            
            # Session Status
            if hasattr(sess, 'session_status'):
                race_info["session_status"] = {
                    "status": str(sess.session_status) if sess.session_status is not None else None
                }
            
            # Track Status
            if hasattr(sess, 'track_status'):
                track_status = sess.track_status
                if track_status is not None and len(track_status) > 0:
                    race_info["track_status"] = {
                        "status": track_status['Status'].tolist() if 'Status' in track_status.columns else [],
                        "time": track_status['Time'].tolist() if 'Time' in track_status.columns else [],
                        "message": track_status['Message'].tolist() if 'Message' in track_status.columns else []
                    }
            
            # Race Control Messages
            if hasattr(sess, 'race_control_messages'):
                messages = sess.race_control_messages
                if messages is not None and len(messages) > 0:
                    race_info["race_control_messages"] = [
                        {
                            "time": str(msg.get('Time', '')) if isinstance(msg, dict) else str(msg),
                            "message": str(msg.get('Message', '')) if isinstance(msg, dict) else str(msg),
                            "category": str(msg.get('Category', '')) if isinstance(msg, dict) else None
                        }
                        for msg in messages.to_dict('records') if hasattr(messages, 'to_dict')
                    ] or []
            
            # Timing Data (Laps)
            if hasattr(sess, 'laps') and sess.laps is not None:
                laps = sess.laps
                if len(laps) > 0:
                    # Get summary of all drivers' laps
                    drivers_summary = {}
                    for driver in sess.results['Abbreviation'] if hasattr(sess, 'results') and sess.results is not None else []:
                        driver_laps = laps.pick_driver(driver)
                        if len(driver_laps) > 0:
                            drivers_summary[driver] = {
                                "total_laps": len(driver_laps),
                                "best_lap_time": str(driver_laps.pick_fastest()['LapTime'].iloc[0]) if len(driver_laps.pick_fastest()) > 0 else None,
                                "average_lap_time": str(driver_laps['LapTime'].mean()) if 'LapTime' in driver_laps.columns else None
                            }
                    race_info["timing_data"] = {
                        "drivers": drivers_summary,
                        "total_laps": len(laps)
                    }
            
            # Circuit Information
            try:
                circuit_info = sess.get_circuit_info()
                if circuit_info:
                    race_info["circuit_info"] = {
                        "corners": len(circuit_info.corners) if hasattr(circuit_info, 'corners') else 0,
                        "marshal_sectors": len(circuit_info.marshal_sectors) if hasattr(circuit_info, 'marshal_sectors') else 0
                    }
            except:
                pass
            
            return race_info
        except Exception as e:
            logger.error(f"Error fetching race info: {str(e)}")
            raise
    
    async def get_track_status(self, year: int, round: int, session: str = 'R') -> Dict:
        """Get track status (flags, safety car, etc.)"""
        try:
            loop = asyncio.get_event_loop()
            status = await loop.run_in_executor(
                None,
                self._fetch_track_status_sync,
                year,
                round,
                session
            )
            return status
        except Exception as e:
            logger.error(f"Error in get_track_status: {str(e)}")
            raise
    
    def _fetch_track_status_sync(self, year: int, round: int, session: str) -> Dict:
        """Synchronous track status fetching"""
        try:
            sess = fastf1.get_session(year, round, session)
            sess.load()
            
            if hasattr(sess, 'track_status') and sess.track_status is not None:
                track_status = sess.track_status
                return {
                    "statuses": track_status.to_dict('records') if hasattr(track_status, 'to_dict') else [],
                    "current_status": str(track_status['Status'].iloc[-1]) if len(track_status) > 0 and 'Status' in track_status.columns else None
                }
            return {"statuses": [], "current_status": None}
        except Exception as e:
            logger.error(f"Error fetching track status: {str(e)}")
            raise

