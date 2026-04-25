from pydantic_settings import BaseSettings
from typing import Set


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./musiclens.db"
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: Set[str] = {"mp3", "wav", "flac", "ogg", "m4a"}
    ANALYSIS_TIMEOUT_SECONDS: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
