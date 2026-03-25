import cloudinary
import cloudinary.uploader
from core.config import settings
import uuid
from fastapi import UploadFile

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret
)


def upload_image(file: UploadFile) -> str:
    result = cloudinary.uploader.upload(file.file)
    return result["secure_url"]


