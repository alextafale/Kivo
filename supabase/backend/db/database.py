from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base
from core.config import settings


DATABASE_URL = (
    f"postgresql+psycopg2://"
    f"{settings.postgres_user}:"
    f"{settings.postgres_password}@"
    f"{settings.postgres_host}:"
    f"{settings.postgres_port}/"
    f"{settings.postgres_db}"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
