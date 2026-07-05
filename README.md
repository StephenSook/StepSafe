# StepSafe

AI-powered diabetic foot ulcer detection and classification for faster, more accurate wound assessment.

**First place, HMI Hackathon 2026 (Kennesaw State University).**

## Live Demo

- **App:** https://stepsafe-web.vercel.app
- **API docs:** https://stepsafe-api.onrender.com/docs

The backend runs on Render's free tier and spins down when idle. The first classification after a quiet period can take up to a minute while the service wakes; after that, results come back in a second or two.

## Overview

Every 20 seconds, someone loses a limb to diabetes worldwide, and up to 80% of these amputations are preventable with early detection. Diabetic foot ulcers (DFUs) are often misclassified by clinicians 30-40% of the time, and many rural or underserved clinics lack access to wound care specialists altogether.

StepSafe is a web-based clinical decision support tool that lets clinicians capture a photo of a diabetic foot ulcer and receive instant AI-driven wound classification. By turning any camera-equipped device into a virtual wound specialist, StepSafe helps standardize assessments and support earlier, more accurate interventions.

## Core Capabilities

- Capture or upload wound images directly from a phone or desktop browser.
- AI classification of infection, ischemia (poor blood flow), gangrene (tissue death), and normal tissue.
- Confidence scores for each prediction to support clinician judgment, not replace it.
- Severity assessment with suggested next-step clinical actions.
- Exportable clinical report (copy to clipboard or print to PDF) for EHR documentation.
- Mobile-responsive UI that runs in any modern browser, with no app install required.

## How It Works

1. A nurse or clinician captures or uploads a DFU image in the React frontend.
2. The image is sent via HTTP POST to a FastAPI backend (`/api/v1/classify`).
3. The backend preprocesses the image and passes it into a TensorFlow classification model trained on DFUC 2020/2021 and Kaggle DFU datasets (~20,000 expert-labeled images).
4. The model outputs class probabilities, which the frontend displays with a severity indicator and recommended action.

## Architecture

| Piece | Stack | Hosted on |
|---|---|---|
| Frontend (`StepSafe/frontend`) | React 19, Vite, Tailwind CSS 4 | Vercel (static, `/api/*` proxied to the backend) |
| Backend (`backend`) | Python, FastAPI, TensorFlow (MobileNetV2 transfer learning) | Render |

The current production model is a binary classifier (DFU vs normal); ischemia and gangrene probabilities are reported as 0 until the full 4-class model is trained.

## Running Locally

```bash
# Backend (Python 3.11)
cd backend
pip install -r requirements.txt
# place model weights at backend/ml_model/stepsafe_model.h5
uvicorn app.main:app --port 8000

# Frontend
cd StepSafe/frontend
npm install
npm run dev   # dev server proxies /api to localhost:8000
```

Or with Docker: `docker-compose up` from the repo root.

## Team

- Stephen Sookra: Frontend & pitch.
- Tylin: Backend/API & model integration.
- Ryann: Data & model training.
- Benjamin Mettler: Research, literature review, and presentation support (PowerPoint).
- Emma Pittman: Research, article sourcing, and presentation design (PowerPoint).

## Disclaimer

For educational and demonstration purposes only. Not medical advice. Results should be validated by a qualified healthcare professional; StepSafe is intended to support, not replace, clinical judgment.
