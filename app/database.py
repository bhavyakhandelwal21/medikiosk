import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

default_db_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "medikiosk.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_db_file}")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
