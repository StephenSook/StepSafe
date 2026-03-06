from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_path: str = "ml_model/saved_model"
    allowed_origins: list[str] = ["http://localhost:5173"]
    max_image_size_mb: int = 10

    model_config = {"env_file": ".env"}


def get_settings() -> Settings:
    return _settings


_settings = Settings()
