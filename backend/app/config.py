import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "gramsetu_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "gramsetu_secure_pass_2026")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "gramsetu_db")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    _raw_db_url: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://gramsetu_user:gramsetu_secure_pass_2026@db:5432/gramsetu_db"
    )
    
    @property
    def DATABASE_URL(self) -> str:
        url = os.getenv("DATABASE_URL", "")
        if not url:
            return "sqlite:///./gramsetu.db"
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def get_database_url(self) -> str:
        return self.DATABASE_URL
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "gramsetu_super_secret_jwt_key_987654321_2026")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "app/uploads")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
    ALLOWED_EXTENSIONS: list[str] = [".jpg", ".jpeg", ".png", ".webp"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
