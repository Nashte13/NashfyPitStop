"""
Database configuration and models for NashfyPitStop
"""
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()

# Database configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'nashfypitstop')

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database Models
class ClubMember(Base):
    """Club member model"""
    __tablename__ = 'club_members'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    city = Column(String(100))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default='pending')  # pending, approved, rejected
    is_active = Column(Boolean, default=True)
    
    # Relationships
    reactions = relationship("RaceReaction", back_populates="member", cascade="all, delete-orphan")

class RaceReaction(Base):
    """Race reaction/comment model"""
    __tablename__ = 'race_reactions'
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey('club_members.id'), nullable=False)
    race_year = Column(Integer, nullable=False, index=True)
    race_round = Column(Integer, nullable=False, index=True)
    race_name = Column(String(255))
    comment = Column(Text)
    reaction_type = Column(String(50))  # emoji or text reaction
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    member = relationship("ClubMember", back_populates="reactions")

def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

