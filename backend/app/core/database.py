from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()
_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
        _engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
        logger.info("Database: %s", settings.DATABASE_URL)
    return _engine


def init_db():
    from app.models import upload, result  # noqa: F401
    Base.metadata.create_all(bind=get_engine())
    logger.info("Database tables created")


def get_db():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
