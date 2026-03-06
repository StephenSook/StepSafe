import io

import numpy as np
import pytest
from PIL import Image


@pytest.fixture()
def valid_jpeg_bytes() -> bytes:
    """A minimal valid JPEG image (50x50 red square)."""
    img = Image.new("RGB", (50, 50), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture()
def valid_png_bytes() -> bytes:
    """A minimal valid PNG image (50x50 blue square)."""
    img = Image.new("RGB", (50, 50), color=(0, 0, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture()
def grayscale_jpeg_bytes() -> bytes:
    """A grayscale JPEG that must be converted to RGB."""
    img = Image.new("L", (50, 50), color=128)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture()
def corrupt_bytes() -> bytes:
    return b"this is not an image at all"


@pytest.fixture()
def dummy_softmax_output() -> np.ndarray:
    """Fake softmax probabilities for 4 classes."""
    return np.array([[0.05, 0.10, 0.80, 0.05]], dtype=np.float32)
