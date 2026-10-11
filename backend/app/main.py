import logging
import sys
import time

# Force UTF-8 output on Windows so Unicode characters don't crash
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from .core.config import settings
from .firebase.client import initialize_firebase

# Import API routers
from .api import (
    auth,
    users,
    jobs,
    applications,
    attendance,
    payments,
    bookmarks,
    messages,
    notifications,
    skills,
    disputes,
    safety,
    admin,
    uploads,
)

# ---------------------------------------------------------------------------
# TERMINAL LOGGER - Color-coded real-time activity monitor (FastAPI Backend)
# ---------------------------------------------------------------------------
class _C:  # ANSI color codes
    RESET   = "\x1b[0m"
    BRIGHT  = "\x1b[1m"
    DIM     = "\x1b[2m"
    GRAY    = "\x1b[90m"
    CYAN    = "\x1b[36m"
    GREEN   = "\x1b[32m"
    YELLOW  = "\x1b[33m"
    RED     = "\x1b[31m"
    MAGENTA = "\x1b[35m"
    BLUE    = "\x1b[34m"
    WHITE   = "\x1b[37m"

def _ts():
    return time.strftime("%H:%M:%S")

def _color_status(code: int) -> str:
    if code >= 500: return f"{_C.BRIGHT}{_C.RED}{code}{_C.RESET}"
    if code >= 400: return f"{_C.RED}{code}{_C.RESET}"
    if code >= 300: return f"{_C.YELLOW}{code}{_C.RESET}"
    return f"{_C.GREEN}{code}{_C.RESET}"

def _color_method(method: str) -> str:
    colors = {
        "GET":     _C.CYAN,
        "POST":    _C.GREEN,
        "PUT":     _C.YELLOW,
        "PATCH":   _C.YELLOW,
        "DELETE":  _C.RED,
        "OPTIONS": _C.GRAY,
    }
    c = colors.get(method, _C.WHITE)
    return f"{c}{_C.BRIGHT}{method:<7}{_C.RESET}"

class _AppLogger:
    @staticmethod
    def info(msg):    print(f"{_C.GRAY}[{_ts()}]{_C.RESET} {_C.CYAN}[INFO]  {_C.RESET}{msg}")
    @staticmethod
    def success(msg): print(f"{_C.GRAY}[{_ts()}]{_C.RESET} {_C.GREEN}[OK]    {_C.RESET}{msg}")
    @staticmethod
    def warn(msg):    print(f"{_C.GRAY}[{_ts()}]{_C.RESET} {_C.YELLOW}[WARN]  {_C.RESET}{msg}")
    @staticmethod
    def error(msg):   print(f"{_C.GRAY}[{_ts()}]{_C.RESET} {_C.RED}[ERROR] {_C.RESET}{msg}")
    @staticmethod
    def divider():    print(f"{_C.GRAY}{'-' * 72}{_C.RESET}")
    @staticmethod
    def banner(msg):  print(f"\n{_C.BRIGHT}{_C.MAGENTA}{msg}{_C.RESET}\n")
    @staticmethod
    def request(method, path, status, ms, client_ip):
        time_color = _C.GREEN if ms < 100 else (_C.YELLOW if ms < 500 else _C.RED)
        time_str   = f"{time_color}{ms}ms{_C.RESET}"
        ip_str     = f"{_C.GRAY}{(client_ip or '?'):<15}{_C.RESET}"
        print(
            f"{_C.GRAY}[{_ts()}]{_C.RESET} "
            f"{_color_method(method)} "
            f"{_color_status(status)} "
            f"{time_str:>10}  "
            f"{ip_str}  "
            f"{_C.WHITE}{path}{_C.RESET}"
        )

app_log = _AppLogger()

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        client_ip = request.headers.get("x-forwarded-for") or (
            request.client.host if request.client else "?"
        )
        try:
            response: Response = await call_next(request)
        except Exception as exc:
            elapsed_ms = int((time.monotonic() - start) * 1000)
            app_log.request(request.method, request.url.path, 500, elapsed_ms, client_ip)
            app_log.error(f"Unhandled exception on {request.url.path}: {exc}")
            raise

        elapsed_ms = int((time.monotonic() - start) * 1000)
        app_log.request(request.method, request.url.path, response.status_code, elapsed_ms, client_ip)
        return response

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("dailyjob.app")

app = FastAPI(
    title="DailyJob API",
    description="Python FastAPI + Firebase Backend for DailyJob (कामसाथी) Hyperlocal Employment Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration
origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev / mobile / web clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logger middleware (must be added AFTER CORS)
app.add_middleware(RequestLoggerMiddleware)

@app.on_event("startup")
def on_startup():
    app_log.divider()
    app_log.banner("  DailyJob (KaamSaathi) - FastAPI Backend Server")
    app_log.info(f"Backend API  : http://localhost:8001")
    app_log.info(f"Swagger Docs : http://localhost:8001/docs")
    app_log.info(f"ReDoc        : http://localhost:8001/redoc")
    app_log.divider()
    app_log.info("Format: [TIME] METHOD STATUS TIME  IP  PATH")
    app_log.divider()
    app_log.info("Initializing Firebase...")
    initialize_firebase()
    app_log.success("DailyJob FastAPI backend ready. Requests aa rahe hain yahan:")
    app_log.divider()

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(attendance.router)
app.include_router(payments.router)
app.include_router(bookmarks.router)
app.include_router(messages.router)
app.include_router(notifications.router)
app.include_router(skills.router)
app.include_router(disputes.router)
app.include_router(safety.router)
app.include_router(admin.router)
app.include_router(uploads.router)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount frontend assets for direct integrated access on FastAPI port 8001
_frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if os.path.exists(os.path.join(_frontend_dir, "index.html")):
    if os.path.exists(os.path.join(_frontend_dir, "css")):
        app.mount("/css", StaticFiles(directory=os.path.join(_frontend_dir, "css")), name="css")
    if os.path.exists(os.path.join(_frontend_dir, "js")):
        app.mount("/js", StaticFiles(directory=os.path.join(_frontend_dir, "js")), name="js")
    if os.path.exists(os.path.join(_frontend_dir, "assets")):
        app.mount("/assets", StaticFiles(directory=os.path.join(_frontend_dir, "assets")), name="assets")

    @app.get("/", tags=["Frontend"], include_in_schema=False)
    @app.get("/app", tags=["Frontend"], include_in_schema=False)
    @app.get("/index.html", tags=["Frontend"], include_in_schema=False)
    def serve_frontend_app():
        return FileResponse(os.path.join(_frontend_dir, "index.html"))

@app.get("/api", tags=["Health"])
def root():
    return {
        "name": "DailyJob Platform (कामसाथी) - Integrated API",
        "status": "online",
        "version": "1.0.0",
        "integration": {
            "frontend_url": "/",
            "backend_url": "/api",
            "proxy_gateway": "/api/*",
            "swagger_docs": "/docs",
            "redoc_docs": "/redoc"
        },
        "firebaseProjectId": settings.FIREBASE_PROJECT_ID
    }

@app.get("/health", tags=["Health"])
@app.get("/healthz", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "project": settings.FIREBASE_PROJECT_ID,
        "database": "Firestore",
        "auth": "Firebase Auth",
        "storage": "Firebase Storage"
    }
