from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv(override=True) 
class Settings(BaseSettings):
    postgres_user: str
    postgres_password: str
    postgres_host: str
    postgres_port: int
    postgres_db: str

    class Config:
        env_file = ".env"
        extra = "forbid"

settings = Settings()
