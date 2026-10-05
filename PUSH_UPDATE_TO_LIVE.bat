@echo off
title Freshy Food - Push Update to GitHub & Live Website
color 0B
echo ========================================================
echo        FRESHY FOOD - 1-CLICK LIVE DEPLOYER
echo      GitHub + Vercel / Netlify Auto-Deploy Pipeline
echo ========================================================
echo.
echo [1/3] Scanning changes...
git add .
echo [2/3] Committing updates...
set /p msg="Enter update note (Press Enter for default): "
if "%msg%"=="" set msg=Update Freshy Food Storefront & Dashboard
git commit -m "%msg%"
echo.
echo [3/3] Pushing to GitHub...
git push origin main
if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo  [SUCCESS] Pushed to GitHub successfully!
    echo  Vercel / Netlify will update the live website in 5s!
    echo ========================================================
) else (
    echo.
    echo [NOTICE] Push failed or remote not connected yet.
)
echo.
pause
