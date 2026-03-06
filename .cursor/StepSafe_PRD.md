# StepSafe — Product Requirements Document (PRD)
> **Version:** 1.0 | **Status:** Active Development  
> This document is the single source of truth for the StepSafe application. Cursor agents must read and respect all guidelines below before generating, editing, or refactoring any code.

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [Core Features & Functional Requirements](#5-core-features--functional-requirements)
6. [System Architecture](#6-system-architecture)
7. [Frontend Implementation](#7-frontend-implementation)
8. [Backend Implementation](#8-backend-implementation)
9. [AI Model & Classification Pipeline](#9-ai-model--classification-pipeline)
10. [API Contract](#10-api-contract)
11. [Data & Privacy](#11-data--privacy)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Testing Requirements](#13-testing-requirements)
14. [Code Implementation Guidelines](#14-code-implementation-guidelines)
15. [Cursor Agent Rules](#15-cursor-agent-rules)

---

## 1. Product Overview

**StepSafe** is a web-based clinical decision support tool that enables clinicians to capture or upload a photo of a diabetic foot ulcer (DFU) and receive instant AI-driven wound classification. It turns any camera-equipped device into a virtual wound specialist, helping standardize assessments and support earlier, more accurate clinical interventions — without requiring any app installation.

| Attribute | Value |
|---|---|
| Product Type | Clinical Decision Support (CDS) Web App |
| Primary Users | Nurses, clinicians, wound care practitioners |
| Deployment | Web (mobile-responsive, browser-based) |
| Core AI Task | Multi-class image classification of DFUs |
| Output Classes | Infection, Ischemia, Gangrene, Normal Tissue |

---

## 2. Problem Statement

- Every 20 seconds, someone loses a limb to diabetes worldwide.
- Up to **80% of amputations are preventable** with early detection.
- Clinicians misclassify DFUs **30–40% of the time**.
- Rural and underserved clinics often **lack access to wound care specialists**.

StepSafe addresses this by providing accessible, AI-augmented wound assessment at the point of care.

---

## 3. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Reduce DFU misclassification | Target < 15% misclassification on validated test set |
| Fast turnaround | Classification result delivered in < 3 seconds |
| Accessibility | Works on any modern browser/device with a camera |
| Clinical trust | Confidence scores displayed with every prediction |
| Adoption | Zero-install friction (no app store, no native install) |

---

## 4. User Personas

### Primary: Bedside Nurse / Clinician
- Captures wound images at point of care using a phone or tablet
- Needs fast, clear results with actionable next steps
- May have limited tech literacy — UI must be simple and intuitive

### Secondary: Wound Care Specialist (Remote)
- Reviews AI-flagged cases
- Needs detailed confidence breakdowns and severity indicators

### Tertiary: Clinic Administrator
- Tracks usage and assessment history
- Interested in audit trails and report exports (future scope)

---

## 5. Core Features & Functional Requirements

### 5.1 Image Capture & Upload
- Allow image capture directly from device camera via browser `MediaDevices` API
- Allow file upload (JPEG, PNG, HEIC) from local device storage
- Enforce file size limit: **max 10MB per image**
- Display image preview before submission
- Validate image dimensions: minimum **224×224px** (model input requirement)

### 5.2 AI Classification
- Send image to backend classification endpoint
- Return probabilities for all 4 classes: `infection`, `ischemia`, `gangrene`, `normal`
- Highlight the predicted (highest-confidence) class prominently
- Display all 4 class probabilities as a confidence breakdown

### 5.3 Severity Assessment & Recommended Actions
- Map predicted class + confidence to a severity level: `Low`, `Moderate`, `High`, `Critical`
- Display a human-readable recommended next action for each severity level
- Example: `Gangrene + High Confidence → Critical → "Refer immediately to vascular surgeon"`

### 5.4 Results Display
- Show: predicted class, confidence %, severity badge, recommended action
- Include a disclaimer: "AI output is for clinical decision support only — not a diagnosis"
- Allow the clinician to re-capture or upload a new image

### 5.5 Mobile-Responsive UI
- Must render correctly on iOS Safari, Android Chrome, and desktop browsers
- Minimum supported viewport: 375px wide
- Touch-friendly controls (min touch target: 44×44px)

---

## 6. System Architecture

```
┌───────────────────────────────────┐
│          CLIENT (Browser)         │
│   React + Tailwind CSS Frontend   │
│  Camera capture / File upload UI  │
│  Result display + Severity badge  │
└────────────────┬──────────────────┘
                 │ HTTP POST (multipart/form-data)
                 ▼
┌───────────────────────────────────┐
│        BACKEND API SERVER         │
│   Python + FastAPI                │
│   /api/v1/classify endpoint       │
│   Image preprocessing pipeline   │
│   Model inference call            │
└────────────────┬──────────────────┘
                 │ TensorFlow model inference
                 ▼
┌───────────────────────────────────┐
│         AI CLASSIFICATION MODEL   │
│   TensorFlow (SavedModel format)  │
│   Input: 224×224×3 RGB image      │
│   Output: 4-class softmax probs   │
│   Trained on DFUC 2020/2021 +     │
│   Kaggle DFU (~20,000 images)     │
└───────────────────────────────────┘
```

### Directory Structure

```
stepsafe/
├── frontend/                    # React application
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ImageCapture.jsx
│   │   │   ├── ResultCard.jsx
│   │   │   ├── ConfidenceBar.jsx
│   │   │   ├── SeverityBadge.jsx
│   │   │   └── Disclaimer.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── hooks/
│   │   │   └── useClassify.js   # API call + state management
│   │   ├── utils/
│   │   │   └── severity.js      # Severity mapping logic
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── routers/
│   │   │   └── classify.py      # /api/v1/classify route
│   │   ├── services/
│   │   │   ├── model_service.py # TF model loading + inference
│   │   │   └── image_service.py # Image preprocessing
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic request/response models
│   │   └── config.py            # App configuration + env vars
│   ├── ml_model/                # Saved TensorFlow model artifacts
│   │   └── saved_model/
│   ├── tests/
│   │   ├── test_classify.py
│   │   └── test_image_service.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 7. Frontend Implementation

### Tech Stack
- **Framework:** React 18 (with Vite)
- **Styling:** Tailwind CSS (utility-first, no custom CSS unless strictly needed)
- **HTTP Client:** `axios` or native `fetch` with async/await
- **State Management:** React `useState` + `useReducer` for local state; no Redux unless scope expands

### Key Implementation Details

#### Image Capture
```jsx
// Use the browser MediaDevices API for camera capture
const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
// 'environment' = rear camera on mobile devices
```

#### Image Upload & Preview
- Use a hidden `<input type="file" accept="image/*" capture="environment">` for native camera integration on mobile
- Generate a local object URL (`URL.createObjectURL(file)`) for preview before submission
- Revoke the object URL after upload to free memory

#### API Call Pattern
```javascript
// hooks/useClassify.js
const classifyImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('/api/v1/classify', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Classification failed');
  return response.json();
};
```

#### Severity Mapping (Frontend Logic)
```javascript
// utils/severity.js
export const getSeverity = (predictedClass, confidence) => {
  const map = {
    normal:    { level: 'Low',      action: 'Continue standard monitoring and foot care.' },
    infection: { level: 'Moderate', action: 'Initiate antibiotic assessment; consult wound care team.' },
    ischemia:  { level: 'High',     action: 'Urgent vascular assessment required.' },
    gangrene:  { level: 'Critical', action: 'Refer immediately to vascular surgeon or emergency care.' },
  };
  return map[predictedClass] ?? { level: 'Unknown', action: 'Consult a wound care specialist.' };
};
```

### Component Responsibilities

| Component | Responsibility |
|---|---|
| `ImageCapture` | Camera/file input, preview display, submit trigger |
| `ResultCard` | Container for all result UI |
| `ConfidenceBar` | Animated bar for each of the 4 class probabilities |
| `SeverityBadge` | Color-coded badge (green/yellow/orange/red) |
| `Disclaimer` | Always-visible legal/clinical disclaimer text |

---

## 8. Backend Implementation

### Tech Stack
- **Runtime:** Python 3.11+
- **Framework:** FastAPI
- **Model Inference:** TensorFlow 2.x
- **Image Processing:** Pillow (PIL)
- **Server:** Uvicorn (production: Gunicorn with Uvicorn workers)
- **Validation:** Pydantic v2

### Application Entry Point
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import classify

app = FastAPI(title="StepSafe API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add production URL in env config
    allow_methods=["POST"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/api/v1")
```

### Classification Router
```python
# app/routers/classify.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.image_service import preprocess_image
from app.services.model_service import run_inference
from app.models.schemas import ClassificationResponse

router = APIRouter()

@router.post("/classify", response_model=ClassificationResponse)
async def classify_wound(image: UploadFile = File(...)):
    if image.content_type not in ["image/jpeg", "image/png", "image/heic"]:
        raise HTTPException(status_code=415, detail="Unsupported image format")

    contents = await image.read()
    tensor = preprocess_image(contents)
    result = run_inference(tensor)
    return result
```

### Image Preprocessing
```python
# app/services/image_service.py
from PIL import Image
import numpy as np
import io

TARGET_SIZE = (224, 224)

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize(TARGET_SIZE, Image.LANCZOS)
    array = np.array(image, dtype=np.float32) / 255.0   # Normalize to [0, 1]
    return np.expand_dims(array, axis=0)                 # Shape: (1, 224, 224, 3)
```

### Model Service (Singleton Pattern)
```python
# app/services/model_service.py
import tensorflow as tf
import numpy as np
from functools import lru_cache
from app.models.schemas import ClassificationResponse

CLASSES = ["infection", "ischemia", "gangrene", "normal"]

@lru_cache(maxsize=1)
def _load_model():
    return tf.saved_model.load("ml_model/saved_model")

def run_inference(tensor: np.ndarray) -> ClassificationResponse:
    model = _load_model()
    predictions = model(tensor, training=False).numpy()[0]
    class_probs = {cls: float(prob) for cls, prob in zip(CLASSES, predictions)}
    predicted_class = max(class_probs, key=class_probs.get)
    confidence = class_probs[predicted_class]
    return ClassificationResponse(
        predicted_class=predicted_class,
        confidence=round(confidence, 4),
        class_probabilities=class_probs,
    )
```

### Pydantic Schemas
```python
# app/models/schemas.py
from pydantic import BaseModel

class ClassificationResponse(BaseModel):
    predicted_class: str           # "infection" | "ischemia" | "gangrene" | "normal"
    confidence: float              # 0.0 – 1.0
    class_probabilities: dict[str, float]  # All 4 class scores
```

### Environment Configuration
```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_path: str = "ml_model/saved_model"
    allowed_origins: list[str] = ["http://localhost:5173"]
    max_image_size_mb: int = 10

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 9. AI Model & Classification Pipeline

### Training Data
| Dataset | Images | Description |
|---|---|---|
| DFUC 2020 | ~4,000 | Expert-labeled DFU images |
| DFUC 2021 | ~15,683 | Expert-labeled DFU images |
| Kaggle DFU | Supplemental | Additional DFU examples |
| **Total** | **~20,000** | Multi-class labeled wound images |

### Output Classes
| Class | Clinical Meaning |
|---|---|
| `normal` | Healthy tissue or healing wound |
| `infection` | Signs of bacterial infection present |
| `ischemia` | Poor blood flow, tissue at risk |
| `gangrene` | Tissue death, immediate intervention needed |

### Model I/O
- **Input:** `float32` tensor of shape `(1, 224, 224, 3)`, pixel values normalized to `[0, 1]`
- **Output:** `float32` tensor of shape `(1, 4)`, softmax probabilities summing to 1.0
- **Training Environment:** Google Colab Pro with A100 GPU
- **Format:** TensorFlow `SavedModel`

### Inference Expectations
- Model must be loaded once at startup (singleton via `lru_cache`)
- Target inference latency: **< 500ms** on CPU; **< 100ms** on GPU
- Model file must not be committed to version control — load from a model registry or mounted volume in production

---

## 10. API Contract

### `POST /api/v1/classify`

**Request**
```
Content-Type: multipart/form-data
Body:
  image: <binary image file> (JPEG, PNG, or HEIC; max 10MB)
```

**Response `200 OK`**
```json
{
  "predicted_class": "infection",
  "confidence": 0.8732,
  "class_probabilities": {
    "infection": 0.8732,
    "ischemia": 0.0651,
    "gangrene": 0.0412,
    "normal": 0.0205
  }
}
```

**Error Responses**
| Status | Condition |
|---|---|
| `415` | Unsupported image format |
| `413` | Image exceeds 10MB size limit |
| `422` | Missing or malformed form field |
| `500` | Internal model inference error |

---

## 11. Data & Privacy

- **No patient images are stored** by default. All inference happens statelessly; images are processed in memory and discarded.
- If logging is added in future, images must be de-identified and stored with explicit consent.
- HTTPS is mandatory in all production deployments.
- Do not log raw image bytes, patient identifiers, or any PHI in application logs.
- Comply with HIPAA guidelines if deployed in a US clinical setting.

---

## 12. Error Handling Strategy

### Frontend
- Show a user-friendly error message if the API call fails (do not expose raw error strings)
- Handle network timeouts gracefully: retry once, then show "Service unavailable" UI
- Validate file type and size client-side before sending (fail fast)

### Backend
- Use FastAPI's `HTTPException` for all expected errors with appropriate status codes
- Wrap model inference in a `try/except` block — return `500` with a generic message on unexpected model errors
- Never expose stack traces or internal paths in API error responses
- Log errors server-side with structured logging (use Python's `logging` module or `structlog`)

---

## 13. Testing Requirements

### Backend Tests (pytest)
- Unit test `preprocess_image` with valid and invalid image inputs
- Unit test `run_inference` with a known tensor (mock model output)
- Integration test `POST /api/v1/classify` with a real test image
- Test all error paths: wrong format, oversized file, missing field

### Frontend Tests (Vitest + React Testing Library)
- Test `getSeverity()` utility with all 4 class inputs
- Test `ResultCard` renders predicted class and confidence correctly
- Test `ImageCapture` handles file selection and preview

### Coverage Target
- Backend: **≥ 80% line coverage**
- Frontend: **≥ 70% line coverage** on utility functions and key components

---

## 14. Code Implementation Guidelines

### General Principles
- **Clarity over cleverness.** Write code that reads like documentation.
- **Single responsibility.** Each function/component does one thing.
- **No magic numbers.** Define constants with descriptive names (e.g., `TARGET_SIZE = (224, 224)`, not `(224, 224)` inline).
- **Fail loudly in development, gracefully in production.** Use environment flags to toggle detailed error output.

### Python (Backend)
- Follow **PEP 8** strictly. Use `black` for formatting, `isort` for import ordering.
- Use **type hints everywhere** — function signatures, return types, Pydantic models.
- Use `async def` for all FastAPI route handlers.
- Load the model exactly **once** at startup using `lru_cache` or FastAPI's `lifespan` event.
- Never use `print()` — use structured `logging` throughout.
- All environment-sensitive values (paths, origins, limits) go in `config.py` / `.env`. No hardcoded secrets.

### JavaScript / React (Frontend)
- Use **functional components with hooks only** — no class components.
- Name components with `PascalCase`, hooks with `use` prefix, utilities with `camelCase`.
- Prefer `const` over `let`; never use `var`.
- All API calls live in custom hooks (`hooks/`) — never call `fetch` directly inside a component render.
- Use Tailwind utility classes directly in JSX — no inline `style={{}}` unless animating.
- Handle all promise rejections explicitly — never leave floating `.catch()` or unhandled async errors.

### Git & Commits
- Commit messages must follow: `<type>(<scope>): <short description>`  
  e.g., `feat(classify): add confidence bar animation`, `fix(api): handle HEIC image format`
- Never commit `.env` files, model weights, or patient data.
- Feature branches off `main`; PR required for all merges.

---

## 15. Cursor Agent Rules

> These rules govern how Cursor AI agents must behave when working in this codebase. They are non-negotiable.

### 🔴 NEVER do the following:
- **Never hardcode file paths** to the model, images, or environment-specific directories. Always use `config.py` settings.
- **Never store image data** in session, database, or local filesystem unless explicitly requested and reviewed for HIPAA compliance.
- **Never expose raw exception messages** to the API consumer. Catch and re-raise with controlled `HTTPException`.
- **Never add Redux or global state managers** without a documented reason — local React state is the default.
- **Never use `any` type in TypeScript** (if TypeScript is introduced) — always type explicitly.
- **Never commit placeholder API keys, secrets, or passwords** — use `.env` and `config.py`.
- **Never load the TensorFlow model inside a route handler** — the model must be loaded once at startup.
- **Never make the classification endpoint accept JSON** — it must remain `multipart/form-data` (image binary).

### 🟢 ALWAYS do the following:
- **Always validate image type and size** at both the frontend (client-side) and backend (server-side).
- **Always return all 4 class probabilities** in the classification response — not just the top-1 prediction.
- **Always display the clinical disclaimer** on the results screen, every time, without exception.
- **Always normalize images** to `[0, 1]` before passing to the model (divide by 255.0).
- **Always use `lru_cache`** (or FastAPI `lifespan`) to load the model exactly once per process.
- **Always use Tailwind classes** for styling in the React frontend.
- **Always write a corresponding test** when adding a new utility function, service, or API route.
- **Always use async/await** — never `.then().catch()` chains in frontend code.
- **Always handle the case** where the API is unreachable or slow — show a loading state and error fallback.

### 🟡 Conventions to follow:
- The `ml_model/` directory contains only model artifacts — no training code goes here.
- Training scripts, notebooks, and data processing code live in a separate `training/` directory (not served by the app).
- New API endpoints must be added as new files in `app/routers/` — do not add routes to `main.py`.
- All new React components go in `src/components/` with a corresponding `.test.jsx` file.
- The severity mapping logic lives exclusively in `src/utils/severity.js` — do not duplicate it in components.

### 🏗️ When adding a new feature:
1. Define the requirement and API contract in this PRD first (or annotate the section).
2. Create/update the Pydantic schema in `app/models/schemas.py`.
3. Implement the service logic in `app/services/`.
4. Wire up the route in `app/routers/`.
5. Add frontend hook in `src/hooks/`.
6. Build the UI component in `src/components/`.
7. Write tests for both backend and frontend.
8. Update this PRD to reflect any changes to the architecture or contract.

---

*Last updated: 2026-03-05 | Maintained by the StepSafe development team*
