@echo off
title Freshy Food - Storefront & Admin Launcher
color 0A

echo ========================================================
echo        FRESHY FOOD (ফ্রেশি ফুড) - 1-CLICK LAUNCHER
echo      প্রকৃতির খাঁটি উপহার, সুস্থ জীবনের অঙ্গীকার
echo ========================================================
echo.
echo [1] Launch Freshy Food Storefront (index.html)
echo [2] Launch Admin Dashboard & Order Manager (admin.html)
echo [3] Start Local HTTP Server & Open Both (Port 8080)
echo.

set /p choice="Enter your choice (1, 2, or 3, default is 3): "
if "%choice%"=="" set choice=3

if "%choice%"=="1" (
    echo [INFO] Opening Storefront...
    start "" index.html
    exit
)

if "%choice%"=="2" (
    echo [INFO] Opening Admin Dashboard...
    start "" admin.html
    exit
)

:: Option 3: Python server
python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo.
    echo [OK] Python detected! Starting fast local server on port 8080...
    echo [INFO] Opening Storefront: http://localhost:8080/
    echo [INFO] Opening Admin Dashboard: http://localhost:8080/admin.html
    start "" http://localhost:8080/
    start "" http://localhost:8080/admin.html
    echo.
    echo ========================================================
    echo  Server running! Press Ctrl+C in this window to stop.
    echo  Admin Login: freshyfood.official@gmail.com / freshyfood2026
    echo ========================================================
    python -m http.server 8080
) else (
    echo [INFO] Python not found. Opening files directly in browser...
    start "" index.html
    start "" admin.html
    echo [OK] Launched successfully!
    pause
)
