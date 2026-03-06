import logging
from io import BytesIO

import numpy as np
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

TARGET_SIZE = (224, 224)


def preprocess_image(raw_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes to a (1, 224, 224, 3) float32 tensor normalised to [0, 1]."""
    try:
        img = Image.open(BytesIO(raw_bytes))
    except (UnidentifiedImageError, Exception) as exc:
        logger.error("Failed to open image: %s", exc)
        raise ValueError("Corrupt or unreadable image data") from exc

    img = img.convert("RGB")
    img = img.resize(TARGET_SIZE, Image.LANCZOS)

    arr = np.asarray(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)
