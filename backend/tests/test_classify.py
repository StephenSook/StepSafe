import io
from unittest.mock import patch

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.models.schemas import CLASS_NAMES, ClassificationResponse


@pytest.fixture()
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture()
def jpeg_upload_bytes() -> bytes:
    img = Image.new("RGB", (100, 100), color=(128, 64, 32))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture()
def mock_inference():
    response = ClassificationResponse(
        predicted_class="normal",
        confidence=0.92,
        class_probabilities={
            "infection": 0.03,
            "ischemia": 0.02,
            "gangrene": 0.03,
            "normal": 0.92,
        },
    )
    with patch("app.routers.classify.run_inference", return_value=response) as m:
        yield m


# --- Integration / happy-path tests ---


class TestClassifyEndpointSuccess:
    def test_valid_jpeg_returns_200(
        self, client: TestClient, jpeg_upload_bytes: bytes, mock_inference
    ):
        resp = client.post(
            "/api/v1/classify",
            files={"image": ("foot.jpg", jpeg_upload_bytes, "image/jpeg")},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["predicted_class"] in CLASS_NAMES
        assert 0.0 <= body["confidence"] <= 1.0
        assert set(body["class_probabilities"].keys()) == set(CLASS_NAMES)

    def test_valid_png_returns_200(
        self, client: TestClient, mock_inference
    ):
        img = Image.new("RGB", (80, 80), color=(0, 255, 0))
        buf = io.BytesIO()
        img.save(buf, format="PNG")

        resp = client.post(
            "/api/v1/classify",
            files={"image": ("foot.png", buf.getvalue(), "image/png")},
        )
        assert resp.status_code == 200

    def test_response_schema_matches(
        self, client: TestClient, jpeg_upload_bytes: bytes, mock_inference
    ):
        resp = client.post(
            "/api/v1/classify",
            files={"image": ("foot.jpg", jpeg_upload_bytes, "image/jpeg")},
        )
        body = resp.json()
        parsed = ClassificationResponse(**body)
        assert parsed.predicted_class == "normal"
        assert parsed.confidence == 0.92


# --- Error-path tests ---


class TestClassifyEndpointErrors:
    def test_unsupported_content_type_returns_415(self, client: TestClient):
        resp = client.post(
            "/api/v1/classify",
            files={"image": ("doc.pdf", b"%PDF-fake", "application/pdf")},
        )
        assert resp.status_code == 415
        assert "Unsupported image type" in resp.json()["detail"]

    def test_gif_returns_415(self, client: TestClient):
        resp = client.post(
            "/api/v1/classify",
            files={"image": ("anim.gif", b"GIF89a", "image/gif")},
        )
        assert resp.status_code == 415

    def test_oversized_image_returns_413(self, client: TestClient):
        oversized = b"\x00" * (11 * 1024 * 1024)  # 11 MB
        resp = client.post(
            "/api/v1/classify",
            files={"image": ("big.jpg", oversized, "image/jpeg")},
        )
        assert resp.status_code == 413
        assert "size limit" in resp.json()["detail"]

    def test_missing_image_field_returns_422(self, client: TestClient):
        resp = client.post("/api/v1/classify")
        assert resp.status_code == 422

    def test_corrupt_image_returns_422(self, client: TestClient):
        resp = client.post(
            "/api/v1/classify",
            files={"image": ("bad.jpg", b"not-a-real-image", "image/jpeg")},
        )
        assert resp.status_code == 422
        assert "Corrupt or unreadable" in resp.json()["detail"]

    def test_model_failure_returns_500(
        self, client: TestClient, jpeg_upload_bytes: bytes
    ):
        with patch(
            "app.routers.classify.run_inference",
            side_effect=RuntimeError("GPU OOM"),
        ):
            resp = client.post(
                "/api/v1/classify",
                files={"image": ("foot.jpg", jpeg_upload_bytes, "image/jpeg")},
            )
        assert resp.status_code == 500
        assert "internal error" in resp.json()["detail"].lower()
        assert "GPU OOM" not in resp.json()["detail"]

    def test_500_does_not_leak_stack_trace(
        self, client: TestClient, jpeg_upload_bytes: bytes
    ):
        with patch(
            "app.routers.classify.run_inference",
            side_effect=RuntimeError("secret path /data/model"),
        ):
            resp = client.post(
                "/api/v1/classify",
                files={"image": ("foot.jpg", jpeg_upload_bytes, "image/jpeg")},
            )
        body = resp.json()
        assert "/data/model" not in body["detail"]
        assert "Traceback" not in body.get("detail", "")
