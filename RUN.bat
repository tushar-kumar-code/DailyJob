@echo off
setlocal enabledelayedexpansion
title DailyJob (कामसाथी) - Application Launcher
cls

:: Navigate to script directory
cd /d "%~dp0"

:: Check CLI Argument
if /i "%1"=="both" goto start_both
if /i "%1"=="all" goto start_both
if /i "%1"=="frontend" goto start_frontend
if /i "%1"=="fe" goto start_frontend
if /i "%1"=="backend" goto start_backend
if /i "%1"=="be" goto start_backend
if /i "%1"=="test" goto run_tests
if /i "%1"=="tests" goto run_tests
if /i "%1"=="menu" goto menu
if /i "%1"=="help" goto show_help

:: By default (no arguments), automatically start both Frontend + Backend
goto start_both

:menu
echo ================================================================
echo    DailyJob - Application Launcher
echo ================================================================
echo.
echo   [1] Start Both (Frontend + Backend)  [RECOMMENDED]
echo   [2] Start Frontend Only  (Node.js  - http://localhost:8000)
echo   [3] Start Backend Only   (FastAPI  - http://localhost:8001)
echo   [4] Run Backend Tests    (Pytest   - 26 tests)
echo   [5] Exit
echo.
echo ================================================================
set "choice=1"
set /p "choice=Select an option [1-5] (Press Enter for 1): "

if "%choice%"=="" set "choice=1"
if "%choice%"=="1" goto start_both
if "%choice%"=="2" goto start_frontend
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto run_tests
if "%choice%"=="5" goto exit_script

echo.
echo [!] Invalid option selected. Defaulting to [1] Both...
timeout /t 2 >nul
goto start_both

:: -------------------------------------------------------------
:: OPTION 1: START BOTH FRONTEND & BACKEND
:: -------------------------------------------------------------
:start_both
cls
echo ================================================================
echo    Starting DailyJob: Frontend + Backend
echo ================================================================
echo.

call :check_node
if %errorlevel% neq 0 goto end_pause

call :check_python
if %errorlevel% neq 0 goto end_pause

echo [*] Checking and freeing ports 8000 and 8001...
call :free_ports

echo [*] Starting Integrated Services (Frontend + Backend Proxy)...
echo [*] Browser will open automatically as soon as server is ready...
echo.

echo ----------------------------------------------------------------
echo   INTEGRATED SERVICES STATUS:
echo   - Unified Web Portal: http://localhost:8000  (or http://127.0.0.1:8000)
echo   - Backend REST API:   http://localhost:8001
echo   - Reverse Proxy:      http://localhost:8000/api/* -> Port 8001
echo   - Swagger API Docs:   http://localhost:8000/docs
echo   - ReDoc Docs:         http://localhost:8000/redoc
echo ----------------------------------------------------------------
echo   Server ko STOP karne ke liye terminal me [ Ctrl + C ] dabayein
echo ================================================================
echo.

title DailyJob (कामसाथी) - Integrated Server
node server.js --open
goto end_pause

:: -------------------------------------------------------------
:: OPTION 2: START FRONTEND ONLY
:: -------------------------------------------------------------
:start_frontend
cls
echo ================================================================
echo    Starting DailyJob: Frontend Only (Node.js)
echo ================================================================
echo.

call :check_node
if %errorlevel% neq 0 goto end_pause

echo [*] Checking and freeing port 8000...
call :free_ports

echo ----------------------------------------------------------------
echo   Frontend URL: http://localhost:8000
echo   Server ko STOP karne ke liye terminal me [ Ctrl + C ] dabayein
echo ================================================================
echo.

title DailyJob Frontend (Node.js - Port 8000)
node server.js --open
goto end_pause

:: -------------------------------------------------------------
:: OPTION 3: START BACKEND ONLY
:: -------------------------------------------------------------
:start_backend
cls
echo ================================================================
echo    Starting DailyJob: Backend Only (FastAPI / Uvicorn)
echo ================================================================
echo.

call :check_python
if %errorlevel% neq 0 goto end_pause

echo [*] Opening Swagger API Docs: http://localhost:8001/docs
timeout /t 2 /nobreak >nul 2>&1
start http://localhost:8001/docs

echo ----------------------------------------------------------------
echo   Backend URL:      http://localhost:8001
echo   Swagger Docs:     http://localhost:8001/docs
echo   Server ko STOP karne ke liye terminal me [ Ctrl + C ] dabayein
echo ================================================================
echo.

title DailyJob Backend (FastAPI - Port 8001)
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
goto end_pause

:: -------------------------------------------------------------
:: OPTION 4: RUN BACKEND TESTS
:: -------------------------------------------------------------
:run_tests
cls
echo ================================================================
echo    Running DailyJob Backend Pytest Suite
echo ================================================================
echo.

call :check_python
if %errorlevel% neq 0 goto end_pause

cd /d "%~dp0backend"
python -m pytest -v
echo.
echo ================================================================
echo   Tests complete.
echo ================================================================
goto end_pause

:: -------------------------------------------------------------
:: HELP
:: -------------------------------------------------------------
:show_help
echo.
echo Usage: RUN.bat [both ^| frontend ^| backend ^| test ^| help]
echo.
echo Commands:
echo   RUN.bat          - Interactive menu (Default: starts both)
echo   RUN.bat both     - Starts both Frontend and Backend
echo   RUN.bat frontend - Starts only Node.js Frontend (port 8000)
echo   RUN.bat backend  - Starts only FastAPI Backend (port 8001)
echo   RUN.bat test     - Runs backend pytest test suite
echo.
exit /b 0

:: -------------------------------------------------------------
:: HELPER FUNCTIONS
:: -------------------------------------------------------------
:check_node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js install nahi hai ya PATH me nahi hai.
    echo [!] Kripya https://nodejs.org se Node.js install karein.
    exit /b 1
)
exit /b 0

:check_python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python install nahi hai ya PATH me nahi hai.
    echo [!] Kripya Python 3.10+ install karein aur PATH me add karein.
    exit /b 1
)
exit /b 0

:free_ports
:: Free ports 8000 and 8001 using netstat and taskkill if occupied by stale processes
node -e "const { execSync } = require('child_process'); [8000, 8001].forEach(port => { try { const out = execSync('netstat -ano | findstr :' + port, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }); out.trim().split('\n').forEach(line => { const parts = line.trim().split(/\s+/); const pid = parseInt(parts[parts.length - 1], 10); if (parts[3] === 'LISTENING' && pid && pid !== process.pid) { try { execSync('taskkill /F /PID ' + pid, { stdio: 'ignore' }); } catch(_) {} } }); } catch(_) {} });" >nul 2>&1
exit /b 0

:end_pause
if %errorlevel% neq 0 (
    echo.
    echo ================================================================
    echo [!] Server ruk gaya hai (Exit code: %errorlevel%).
    echo [R] Dubara restart karne ke liye 'R' dabayein, ya band karne ke liye Enter.
    echo ================================================================
    set "restart_choice="
    set /p "restart_choice=Choice (R/Enter): "
    if /i "!restart_choice!"=="r" (
        cls
        goto start_both
    )
)
goto :eof

:exit_script
exit /b 0
