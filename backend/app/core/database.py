from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

# Engine is created lazily — a bad DATABASE_URL will not crash startup,
# only fail when a DB operation is first attempted.
_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        try:
            _engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
            )
            logger.info("Database engine created: %s", settings.DATABASE_URL.split("@")[-1])
        except Exception as e:
            logger.error("Failed to create database engine: %s", e)
            raise
    return _engine


def get_db():
    global _SessionLocal
    try:
        if _SessionLocal is None:
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
        db = _SessionLocal()
        try:
            yield db
        finally:
            db.close()
    except Exception as e:
        logger.error("Database session error: %s", e)
        raise
