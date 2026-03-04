from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from exceptions.handlers import register_exception_handlers

from routes.negocios import router as negocios_router


app = FastAPI()
register_exception_handlers(app)

origins = ["*"]

app.include_router(negocios_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Hi, FastAPI is working"}
