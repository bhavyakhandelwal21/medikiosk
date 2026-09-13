from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class DBUser(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), default="Patient")
    role = Column(String(20), default="patient")
    created_at = Column(DateTime, default=datetime.utcnow)

class DBIntakeSession(Base):
    __tablename__ = "intake_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    source_type = Column(String(30))
    target_language = Column(String(30), default="English")
    raw_input = Column(Text, nullable=False)
    chief_complaint = Column(String(255))
    extracted_data_json = Column(Text)
    concise_doctor_summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBPrescriptionDocument(Base):
    __tablename__ = "prescription_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    session_id = Column(Integer, nullable=True, index=True)
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
