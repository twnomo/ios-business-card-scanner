@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================
echo   GitHub Upload Script (v1.0.6)
echo ========================================

:: 1. Set Git Identity
echo [*] Setting Git identity...
git config --global user.email "twnomo@gmail.com"
git config --global user.name "twnomo"

:: 2. Initialize Git if needed
if not exist ".git" (
    echo [*] Initializing Git repository...
    git init
) else (
    echo [!] Git already initialized.
)

:: 3. Add all files
echo [*] Adding files to staging...
git add .

:: 4. Commit changes
echo [*] Committing changes...
git commit -m "Initial commit v1.0.6: Business Card Scanner with Guided Crop"

:: 5. Set branch to main
echo [*] Setting branch to main...
git branch -M main

:: 6. Handle Remote Origin
echo [*] Setting remote origin...
:: Try to add, if fails (already exists), then set-url
git remote add origin https://github.com/twnomo/ios-business-card-scanner.git 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Remote origin already exists, updating URL...
    git remote set-url origin https://github.com/twnomo/ios-business-card-scanner.git
)

:: 7. Push (using --force to overwrite initial README/License on GitHub)
echo [*] Pushing to GitHub (Force Push)...
echo (You may be prompted for a login or Personal Access Token in a popup window)
git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo   SUCCESS: Project uploaded to GitHub!
    echo ========================================
) else (
    echo ========================================
    echo   FAILED: An error occurred during push.
    echo   Please check your GitHub credentials.
    echo ========================================
)

pause
