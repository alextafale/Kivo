from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from exceptions.handlers import register_exception_handlers

from routes.negocios   import router as negocios_router
from routes.sucursales import router as sucursal_router
from routes.profiles   import router as profiles_router   # ← nuevo


app = FastAPI()
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware)

app.include_router(negocios_router,  prefix="/api/v1")
app.include_router(sucursal_router,  prefix="/api/v1")
app.include_router(profiles_router,  prefix="/api/v1")    # → /api/v1/me


@app.get("/")
def read_root():
    return {"message": "Hi, FastAPI is working"}