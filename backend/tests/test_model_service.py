from unittest.mock import MagicMock, patch

import numpy as np

from app.models.schemas import CLASS_NAMES, ClassificationResponse
from app.services.model_service import run_inference


class TestRunInference:
    def _make_mock_model(self, logits: np.ndarray) -> MagicMock:
        mock_output_tensor = MagicMock()
        mock_output_tensor.values.return_value = iter(
            [MagicMock(numpy=MagicMock(return_value=logits))]
        )

        mock_infer = MagicMock(return_value={"output_0": MagicMock()})

        mock_model = MagicMock()
        mock_model.signatures = {"serving_default": mock_infer}
        return mock_model, mock_infer

    @patch("app.services.model_service.load_model")
    @patch("app.services.model_service.tf")
    def test_returns_classification_response(self, mock_tf, mock_load):
        raw_probs = np.array([0.05, 0.10, 0.80, 0.05], dtype=np.float32)
        mock_model = MagicMock()
        mock_infer = MagicMock()

        mock_softmax = MagicMock()
        mock_softmax.numpy.return_value = raw_probs.reshape(1, -1)

        mock_infer.return_value = {"output_0": MagicMock()}
        mock_model.signatures = {"serving_default": mock_infer}
        mock_load.return_value = mock_model

        mock_tf.constant.return_value = MagicMock()
        mock_tf.nn.softmax.return_value = mock_softmax

        tensor = np.random.rand(1, 224, 224, 3).astype(np.float32)
        result = run_inference(tensor)

        assert isinstance(result, ClassificationResponse)
        assert result.predicted_class == "gangrene"
        assert result.confidence == 0.8
        assert set(result.class_probabilities.keys()) == set(CLASS_NAMES)

    @patch("app.services.model_service.load_model")
    @patch("app.services.model_service.tf")
    def test_probabilities_sum_close_to_one(self, mock_tf, mock_load):
        raw_probs = np.array([0.25, 0.25, 0.25, 0.25], dtype=np.float32)
        mock_softmax = MagicMock()
        mock_softmax.numpy.return_value = raw_probs.reshape(1, -1)

        mock_model = MagicMock()
        mock_infer = MagicMock()
        mock_infer.return_value = {"output_0": MagicMock()}
        mock_model.signatures = {"serving_default": mock_infer}
        mock_load.return_value = mock_model

        mock_tf.constant.return_value = MagicMock()
        mock_tf.nn.softmax.return_value = mock_softmax

        tensor = np.random.rand(1, 224, 224, 3).astype(np.float32)
        result = run_inference(tensor)

        total = sum(result.class_probabilities.values())
        assert abs(total - 1.0) < 0.01

    @patch("app.services.model_service.load_model")
    @patch("app.services.model_service.tf")
    def test_confidence_matches_predicted_class_probability(
        self, mock_tf, mock_load
    ):
        raw_probs = np.array([0.70, 0.10, 0.15, 0.05], dtype=np.float32)
        mock_softmax = MagicMock()
        mock_softmax.numpy.return_value = raw_probs.reshape(1, -1)

        mock_model = MagicMock()
        mock_infer = MagicMock()
        mock_infer.return_value = {"output_0": MagicMock()}
        mock_model.signatures = {"serving_default": mock_infer}
        mock_load.return_value = mock_model

        mock_tf.constant.return_value = MagicMock()
        mock_tf.nn.softmax.return_value = mock_softmax

        tensor = np.random.rand(1, 224, 224, 3).astype(np.float32)
        result = run_inference(tensor)

        assert result.predicted_class == "infection"
        assert result.confidence == result.class_probabilities["infection"]

    @patch("app.services.model_service.load_model")
    def test_model_failure_propagates(self, mock_load):
        mock_load.side_effect = RuntimeError("Model file not found")

        tensor = np.random.rand(1, 224, 224, 3).astype(np.float32)
        try:
            run_inference(tensor)
            assert False, "Expected RuntimeError"
        except RuntimeError as exc:
            assert "Model file not found" in str(exc)
