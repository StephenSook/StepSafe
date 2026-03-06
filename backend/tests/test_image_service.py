import numpy as np
import pytest

from app.services.image_service import preprocess_image


class TestPreprocessImage:
    def test_valid_jpeg_produces_correct_shape(self, valid_jpeg_bytes: bytes):
        result = preprocess_image(valid_jpeg_bytes)
        assert isinstance(result, np.ndarray)
        assert result.shape == (1, 224, 224, 3)

    def test_valid_png_produces_correct_shape(self, valid_png_bytes: bytes):
        result = preprocess_image(valid_png_bytes)
        assert result.shape == (1, 224, 224, 3)

    def test_output_dtype_is_float32(self, valid_jpeg_bytes: bytes):
        result = preprocess_image(valid_jpeg_bytes)
        assert result.dtype == np.float32

    def test_pixel_values_normalized_between_0_and_1(self, valid_jpeg_bytes: bytes):
        result = preprocess_image(valid_jpeg_bytes)
        assert result.min() >= 0.0
        assert result.max() <= 1.0

    def test_grayscale_image_converted_to_rgb(self, grayscale_jpeg_bytes: bytes):
        result = preprocess_image(grayscale_jpeg_bytes)
        assert result.shape == (1, 224, 224, 3)

    def test_corrupt_data_raises_value_error(self, corrupt_bytes: bytes):
        with pytest.raises(ValueError, match="Corrupt or unreadable image data"):
            preprocess_image(corrupt_bytes)

    def test_empty_bytes_raises_value_error(self):
        with pytest.raises(ValueError, match="Corrupt or unreadable image data"):
            preprocess_image(b"")
