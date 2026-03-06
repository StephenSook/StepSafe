import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import classify

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Loading TensorFlow model from %s", settings.model_path)
    try:
        from app.services.model_service import load_model

        load_model()
        logger.info("Model loaded successfully")
    except Exception:
        logger.warning(
            "Model not loaded at startup — will attempt on first request",
            exc_info=True,
        )
    yield
    logger.info("Shutting down StepSafe API")


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title="StepSafe API",
        version="1.0.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["POST"],
        allow_headers=["*"],
    )

    application.include_router(classify.router, prefix="/api/v1")

    return application


app = create_app()
