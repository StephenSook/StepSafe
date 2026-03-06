import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import get_settings
from app.models.schemas import ClassificationResponse, ErrorResponse
from app.services.image_service import preprocess_image
from app.services.model_service import run_inference

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/heic"}


@router.post(
    "/classify",
    response_model=ClassificationResponse,
    responses={
        413: {"model": ErrorResponse, "description": "Image too large"},
        415: {"model": ErrorResponse, "description": "Unsupported image type"},
        422: {"model": ErrorResponse, "description": "Invalid image data"},
        500: {"model": ErrorResponse, "description": "Internal inference error"},
    },
)
async def classify_image(image: UploadFile = File(...)):
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        logger.warning("Rejected upload with content_type=%s", image.content_type)
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported image type '{image.content_type}'. "
                f"Accepted types: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
            ),
        )

    settings = get_settings()
    max_bytes = settings.max_image_size_mb * 1024 * 1024
    raw_bytes = await image.read()

    if len(raw_bytes) > max_bytes:
        logger.warning(
            "Rejected oversized upload: %d bytes (limit %d)", len(raw_bytes), max_bytes
        )
        raise HTTPException(
            status_code=413,
            detail=f"Image exceeds the {settings.max_image_size_mb} MB size limit",
        )

    try:
        tensor = preprocess_image(raw_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        result = run_inference(tensor)
    except Exception as exc:
        logger.error("Model inference failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500, detail="Classification failed due to an internal error"
        ) from exc

    logger.info(
        "Classification result: predicted_class=%s confidence=%.4f",
        result.predicted_class,
        result.confidence,
    )
    return result
