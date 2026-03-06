import logging
from functools import lru_cache
from typing import Any

import numpy as np
import tensorflow as tf

from app.config import get_settings
from app.models.schemas import CLASS_NAMES, ClassificationResponse

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def load_model() -> Any:
    """Load the TF SavedModel once and cache it for the process lifetime."""
    settings = get_settings()
    logger.info("Loading SavedModel from %s", settings.model_path)
    model = tf.saved_model.load(settings.model_path)
    logger.info("SavedModel loaded successfully")
    return model


def run_inference(tensor: np.ndarray) -> ClassificationResponse:
    """Run a forward pass and return a structured classification result."""
    model = load_model()

    input_tensor = tf.constant(tensor, dtype=tf.float32)
    infer = model.signatures["serving_default"]
    output = infer(input_tensor)

    logits = next(iter(output.values()))
    probabilities = tf.nn.softmax(logits, axis=-1).numpy().flatten()

    class_probabilities = {
        name: round(float(prob), 4)
        for name, prob in zip(CLASS_NAMES, probabilities)
    }

    predicted_idx = int(np.argmax(probabilities))

    return ClassificationResponse(
        predicted_class=CLASS_NAMES[predicted_idx],
        confidence=round(float(probabilities[predicted_idx]), 4),
        class_probabilities=class_probabilities,
    )
