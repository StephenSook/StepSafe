import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import classify


def _configure_logging() -> None:
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                datefmt="%Y-%m-%dT%H:%M:%S",
            )
        )
        root.addHandler(handler)


_configure_logging()
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

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error(
            "Unhandled exception on %s %s: %s",
            request.method,
            request.url.path,
            exc,
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected internal error occurred"},
        )

    application.include_router(classify.router, prefix="/api/v1")

    return application


app = create_app()
