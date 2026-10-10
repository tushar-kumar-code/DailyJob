# DailyJob (कामसाथी) Backend

Modern Python + FastAPI backend powered by Firebase (Firestore, Authentication, and Cloud Storage) for the **DailyJob** hyperlocal blue-collar employment platform.

---

## 1. Firebase Project Architecture & Isolation

> **CRITICAL SEPARATION GUARANTEE:**
> This backend is exclusively configured for the **NEW, DEDICATED DailyJob Firebase Project** (`dailyjob-platform`).
> It does **NOT** share any database, storage, credentials, or authentication realm with any other application (such as AI Career Coach or any legacy project).

```
DailyJob Application
        │
        ▼
NEW DailyJob Firebase Project (dailyjob-platform)
├── Firebase Authentication (Email/Password & Google Sign-In)
├── Firestore NoSQL Database
│   ├── users/{uid}
│   ├── jobs/{job_id}
│   ├── applications/{application_id}
│   ├── payments/{payment_id}
│   ├── bookmarks/{user_id_job_id}
│   ├── messages/{job_id}/items/{message_id}
│   ├── notifications/{notification_id}
│   ├── skills/{skill_id}
│   ├── disputes/{dispute_id}
│   └── safety_reports/{report_id}
└── Firebase Cloud Storage
    └── {uid}/{folder}/{unique_id}.{ext}
```

---

## 2. Directory Structure

```
DailyJob/
├── backend/
│   ├── app/
│   │   ├── main.py                     # Application entrypoint & CORS middleware
│   │   ├── api/                        # REST API Routers
│   │   │   ├── auth.py                 # Firebase token auth & session cookies
│   │   │   ├── users.py                # Dual worker/employer profile management
│   │   │   ├── jobs.py                 # Hyperlocal job creation, search & filtering
│   │   │   ├── applications.py         # Application lifecycle & state transitions
│   │   │   ├── attendance.py           # Geofenced GPS attendance check-in/out
│   │   │   ├── payments.py             # Ledger & wage settlement
│   │   │   ├── bookmarks.py            # Saved jobs
│   │   │   ├── messages.py             # In-job messaging threads
│   │   │   ├── notifications.py        # Real-time event notifications
│   │   │   ├── skills.py               # Trade benchmarks & skill assessments
│   │   │   ├── disputes.py             # Mediation & dispute resolution
│   │   │   ├── safety.py               # SOS alerts & workplace safety reports
│   │   │   ├── admin.py                # Platform oversight & metrics
│   │   │   └── uploads.py              # Cloud storage evidence uploads
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic BaseSettings (.env loading)
│   │   │   ├── security.py             # Token verification & user sync
│   │   │   └── dependencies.py         # Role dependencies (worker/employer/admin)
│   │   ├── firebase/
│   │   │   ├── client.py               # Firebase Admin SDK init with mock fallback
│   │   │   ├── auth.py                 # Firebase Auth verifier
│   │   │   ├── firestore.py            # Firestore client & in-memory mock engine
│   │   │   └── storage.py              # Firebase Cloud Storage client & validator
│   │   ├── models/                     # Lightweight domain models
│   │   ├── schemas/                    # Pydantic request/response validation schemas
│   │   ├── repositories/               # Firestore data access layer
│   │   ├── services/                   # Business rules & transition state machine
│   │   ├── utils/                      # Haversine distance, validators & helpers
│   │   └── constants/                  # Application status, roles & trade catalogs
│   ├── tests/                          # 100% Passing Pytest Test Suite (26 tests)
│   ├── requirements.txt                # Minimal Python dependencies
│   ├── .env.example                    # Environment template
│   └── README.md
```

---

## 3. Environment Setup & Credentials

### Step 1: Install Python Dependencies
```powershell
cd DailyJob\backend
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```

Contents of `.env`:
```env
ENVIRONMENT=development
PORT=8001
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://localhost:8001,http://127.0.0.1:8001

# NEW Dedicated DailyJob Firebase Project
FIREBASE_PROJECT_ID=dailyjob-platform
FIREBASE_STORAGE_BUCKET=dailyjob-platform.appspot.com
FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json

# Check-in proximity validation radius in meters
ATTENDANCE_PROXIMITY_METERS=500.0

# When serviceAccountKey.json is absent, enables offline mock Firestore/Auth for tests and development
USE_FIREBASE_MOCK_FALLBACK=true
```

### Step 3: Firebase Service Account Placement
For production or live Firebase connection:
1. Go to **Google Firebase Console** $\rightarrow$ **Project Settings** $\rightarrow$ **Service Accounts**.
2. Select the **DailyJob Platform** (`dailyjob-platform`) project.
3. Click **Generate new private key** and download the JSON file.
4. Rename it to `serviceAccountKey.json` and place it at:
   ```
   DailyJob/backend/serviceAccountKey.json
   ```
> `.gitignore` is pre-configured to ensure `serviceAccountKey.json` and `.env` are **never** committed to version control.

---

## 4. Running the Backend Server

Start the FastAPI application with Uvicorn:
```powershell
cd DailyJob\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Interactive OpenAPI Documentation:
- **Swagger UI**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **ReDoc**: [http://localhost:8001/redoc](http://localhost:8001/redoc)
- **OpenAPI Schema**: [http://localhost:8001/openapi.json](http://localhost:8001/openapi.json)

---

## 5. Running the Backend Test Suite

The test suite covers authentication, role authorization, job lifecycles, GPS proximity attendance, payments, in-job messaging, and security:
```powershell
cd DailyJob\backend
python -m pytest -v
```

All 26 test suites execute against the built-in offline mock Firestore engine with zero live credentials required:
```
tests/test_applications.py::test_apply_and_duplicate_prevention PASSED
tests/test_applications.py::test_employer_cannot_apply_to_own_job PASSED
tests/test_applications.py::test_application_lifecycle_transitions PASSED
tests/test_attendance.py::test_checkin_and_checkout_flow PASSED
tests/test_auth.py::test_missing_auth_token PASSED
tests/test_auth.py::test_invalid_auth_token PASSED
tests/test_auth.py::test_valid_auth_token PASSED
tests/test_auth.py::test_verify_token_endpoint PASSED
tests/test_disputes.py::test_dispute_creation_and_access PASSED
tests/test_jobs.py::test_worker_cannot_create_job PASSED
tests/test_jobs.py::test_employer_can_create_job PASSED
tests/test_jobs.py::test_list_and_filter_jobs PASSED
tests/test_jobs.py::test_employer_modify_own_job PASSED
tests/test_jobs.py::test_prevent_unauthorized_job_modification PASSED
tests/test_messages.py::test_messages_thread_and_authorization PASSED
tests/test_notifications.py::test_user_notifications PASSED
tests/test_payments.py::test_payment_lifecycle_and_authorization PASSED
tests/test_security.py::test_admin_metrics_access_control PASSED
tests/test_security.py::test_prevent_role_escalation PASSED
tests/test_security.py::test_bookmarks_isolation PASSED
tests/test_skills.py::test_trade_catalog PASSED
tests/test_skills.py::test_worker_skill_verification PASSED
tests/test_users.py::test_get_user_profile PASSED
tests/test_users.py::test_update_worker_profile PASSED
tests/test_users.py::test_switch_role PASSED
tests/test_users.py::test_prevent_escalating_to_admin PASSED
======================= 26 passed in 1.18s ========================
```

---

## 6. API Endpoints Catalog

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/config` | Public Firebase & client config |
| `POST` | `/api/auth/firebase-login` | Verify Firebase ID token & issue session |
| `POST` | `/api/auth/verify-token` | Alias for token verification |
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/signin` | Sign in existing user |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `POST` | `/api/auth/logout` | Terminate session cookie |

### Users & Profiles (`/api/user` and `/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/profile` | Retrieve current user profile |
| `POST` | `/api/user/profile` | Complete dual-role onboarding profile |
| `PUT` | `/api/user/profile/worker` | Update worker profile |
| `PUT` | `/api/user/profile/employer` | Update employer profile |
| `POST` | `/api/user/switch-role` | Switch between worker and employer modes |

### Jobs (`/api/jobs`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs` | Search & filter jobs (trade, city, min wage, distance) |
| `GET` | `/api/jobs/{id}` | Get full job details |
| `POST` | `/api/jobs` | Create new job posting (Employer only) |
| `GET` | `/api/employer/jobs` | List jobs posted by authenticated employer |
| `PATCH` | `/api/jobs/{id}` | Update job details (Owner/Admin only) |
| `DELETE` | `/api/jobs/{id}` | Remove job posting (Owner/Admin only) |

### Applications & Hiring (`/api/jobs/{id}/apply`, `/api/applications`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/jobs/{id}/apply` | Worker applies for job |
| `GET` | `/api/jobs/{id}/applicants` | Employer views job applicants |
| `GET` | `/api/user/applications` | Worker views own application history |
| `GET` | `/api/applications/{id}` | View single application details |
| `PATCH` | `/api/applications/{id}/status` | Controlled status update (`select`, `confirm`, `reject`) |

### Attendance & GPS Verification (`/api/applications`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/applications/{id}/check-in` | GPS check-in (validates distance $\le$ 500m) |
| `POST` | `/api/applications/{id}/check-out` | Shift completion checkout |

### Payments & Ledger (`/api/payments`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/payments` | Worker gross earnings & ledger summary |
| `GET` | `/api/payments/{app_id}` | View application payment receipt |
| `POST` | `/api/payments/{app_id}/mark-paid` | Employer marks job completed as paid |

### Bookmarks (`/api/jobs/{id}/bookmark`, `/api/user/saved-jobs`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/jobs/{id}/bookmark` | Save job to bookmarks |
| `DELETE` | `/api/jobs/{id}/bookmark` | Remove job from bookmarks |
| `GET` | `/api/user/saved-jobs` | List user's bookmarked jobs |

### In-Job Messaging (`/api/messages`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/messages/{job_id}` | Read message thread (Authorized participants only) |
| `POST` | `/api/messages/{job_id}` | Send message in job thread |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | List user notifications |
| `PATCH` | `/api/notifications/{id}/read` | Mark single notification as read |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read |

### Skills & Trades (`/api/skills`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/skills` | List worker verified skills |
| `POST` | `/api/skills/verify` | Submit online skill assessment |
| `GET` | `/api/skills/catalog` | System trade wage guidelines & safety requirements |

### Disputes & Safety (`/api/disputes`, `/api/safety`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/disputes` | File job dispute (Participants only) |
| `GET` | `/api/disputes` | List user disputes (Admin sees all) |
| `POST` | `/api/safety/sos` | Trigger emergency SOS alert |
| `POST` | `/api/safety/report` | Report workplace hazard |
| `GET` | `/api/safety/reports` | View safety reports |

### Admin Oversight (`/api/admin`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/metrics` | Platform overview (Admin only) |
| `GET` | `/api/admin/disputes` | Review all disputes (Admin only) |
| `PATCH` | `/api/admin/disputes/{id}` | Resolve or reject dispute (Admin only) |

### Storage Uploads (`/api/uploads`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/uploads` | Upload profile image or dispute evidence to Firebase Storage |
