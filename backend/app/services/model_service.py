import logging
from functools import lru_cache
from typing import Any

import numpy as np
import tensorflow as tf

from app.config import get_settings
from app.models.schemas import CLASS_NAMES, ClassificationResponse

logger = logging.getLogger(__name__)


def _build_model() -> tf.keras.Model:
    """Reconstruct the model architecture using the Functional API.

    The .h5 file was saved with Keras 3 Sequential format which cannot be
    deserialized by either Keras 3 (Sequential rebuild bug) or tf_keras
    (config key mismatches).  Rebuilding via the Functional API and loading
    only the weights avoids both problems.

    The model includes a Rescaling(1/255) layer, so callers must pass raw
    uint8-range pixel values — do NOT pre-normalise to [0, 1].
    """
    inputs = tf.keras.Input(shape=(224, 224, 3), name="input_layer_3")
    x = tf.keras.layers.Rescaling(
        scale=1.0 / 255, offset=0.0, name="rescaling_1"
    )(inputs)

    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights=None,
    )
    base.trainable = False
    x = base(x)

    x = tf.keras.layers.GlobalAveragePooling2D(name="global_average_pooling2d_1")(x)
    x = tf.keras.layers.Dense(128, activation="relu", name="dense_2")(x)
    x = tf.keras.layers.Dropout(0.3, name="dropout_1")(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid", name="dense_3")(x)

    return tf.keras.Model(inputs, outputs)


@lru_cache(maxsize=1)
def load_model() -> Any:
    """Load the Keras model once and cache it for the process lifetime."""
    settings = get_settings()
    logger.info("Loading model from %s", settings.model_path)

    model = _build_model()
    model.load_weights(settings.model_path)
    logger.info("Model loaded successfully")
    return model


def run_inference(tensor: np.ndarray) -> ClassificationResponse:
    """Run a forward pass and return a structured classification result.

    The loaded model is a binary classifier (Dense(1, sigmoid)) where the
    sigmoid output ≈ P(Normal).  We invert this to derive P(DFU) and map
    to the 4-class schema.  Ischemia and gangrene are set to 0 until a
    true 4-class model is trained.
    """
    model = load_model()

    raw = float(model.predict(tensor, verbose=0).flatten()[0])
    p_normal = round(raw, 4)
    p_abnormal = round(1.0 - raw, 4)

    class_probabilities = {
        "infection": p_abnormal,
        "ischemia": 0.0,
        "gangrene": 0.0,
        "normal": p_normal,
    }

    if raw < 0.5:
        predicted_class = "infection"
        confidence = p_abnormal
    else:
        predicted_class = "normal"
        confidence = p_normal

    return ClassificationResponse(
        predicted_class=predicted_class,
        confidence=confidence,
        class_probabilities=class_probabilities,
    )
