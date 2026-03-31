from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv(override=True)


class Settings(BaseSettings):
    postgres_user:       str
    postgres_password:   str
    postgres_host:       str
    postgres_port:       int
    postgres_db:         str

    supabase_url:        str  
    supabase_jwt_secret: str

    cloudinary_cloud_name: str
    cloudinary_api_key:    str
    cloudinary_api_secret: str

    class Config:
        env_file = ".env"
        extra = "forbid"


settings = Settings()