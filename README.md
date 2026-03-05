SafeStep
AI-powered diabetic foot ulcer detection and classification for faster, more accurate wound assessment.

Overview
Every 20 seconds, someone loses a limb to diabetes worldwide, and up to 80% of these amputations are preventable with early detection. Diabetic foot ulcers (DFUs) are often misclassified by clinicians 30–40% of the time, and many rural or underserved clinics lack access to wound care specialists altogether.

SafeStep is a web-based clinical decision support tool that lets clinicians capture a photo of a diabetic foot ulcer and receive instant AI-driven wound classification. By turning any camera-equipped device into a virtual wound specialist, SafeStep helps standardize assessments and support earlier, more accurate interventions.

Core Capabilities
Capture or upload wound images directly from a phone or desktop browser.

AI classification of infection, ischemia (poor blood flow), gangrene (tissue death), and normal tissue.

Confidence scores for each prediction to support clinician judgment, not replace it.

Severity assessment with suggested next-step clinical actions.

Mobile-responsive UI that runs in any modern browser, with no app install required.

How It Works
A nurse or clinician captures or uploads a DFU image in the React frontend.

The image is sent via HTTP POST to a FastAPI backend.

The backend preprocesses the image and passes it into a TensorFlow classification model trained on DFUC 2020/2021 and Kaggle DFU datasets (~20,000 expert-labeled images).

The model outputs class probabilities for infection, ischemia, gangrene, and normal tissue.

The frontend displays the predicted class, confidence, severity indicator, and recommended action.

Tech Stack
Frontend: React, Tailwind CSS.

Backend/API: Python, FastAPI.

AI Model: TensorFlow, trained on DFUC 2020 (4,000 images), DFUC 2021 (15,683 images), plus Kaggle DFU data.

Training Environment: Google Colab Pro with A100 GP
