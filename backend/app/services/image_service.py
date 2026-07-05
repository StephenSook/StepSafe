import logging
from io import BytesIO

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

TARGET_SIZE = (224, 224)

# Reject absurdly large images before they are fully decoded. A small
# compressed file can expand to hundreds of MB of raw pixels (a
# "decompression bomb") and OOM a small instance. 24 MP is generous for any
# real wound photo while capping worst-case decoded memory to ~70 MB.
Image.MAX_IMAGE_PIXELS = 24_000_000

# Enable HEIC/HEIF decoding (iPhone photos). The wheel bundles libheif, so no
# system package is required; guard the import so local dev without it still runs.
try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except ImportError:  # pragma: no cover
    logger.warning("pillow-heif not installed; HEIC/HEIF images will not decode")


def preprocess_image(raw_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes to a (1, 224, 224, 3) float32 tensor in [0, 255].

    The model contains a built-in Rescaling(1/255) layer, so pixel values
    must stay in the original [0, 255] range here.
    """
    try:
        img = Image.open(BytesIO(raw_bytes))
        # convert() and resize() force the actual decode, so keep them inside
        # the try: PIL is lazy and truncated files only fail here, not at open().
        img = img.convert("RGB")
        img = img.resize(TARGET_SIZE, Image.LANCZOS)
    except Image.DecompressionBombError as exc:
        logger.warning("Rejected oversized image: %s", exc)
        raise ValueError("Image resolution is too large to process") from exc
    except Exception as exc:
        logger.error("Failed to open image: %s", exc)
        raise ValueError("Corrupt or unreadable image data") from exc

    arr = np.asarray(img, dtype=np.float32)
    return np.expand_dims(arr, axis=0)
