from pydantic import BaseModel, Field

CLASS_NAMES: list[str] = ["infection", "ischemia", "gangrene", "normal"]


class ClassificationResponse(BaseModel):
    predicted_class: str = Field(
        ...,
        description="Predicted condition label",
        examples=["infection"],
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score for the predicted class",
    )
    class_probabilities: dict[str, float] = Field(
        ...,
        description="Probability for each of the 4 classes",
    )


class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Human-readable error message")
