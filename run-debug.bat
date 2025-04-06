@echo off
echo ==================================================
echo Genkit Debug Helper
echo ==================================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed.
    exit /b 1
)

echo Running debug script...
node debug-genkit.js

echo.
echo If you need to examine a different version of Genkit, try:
echo npm install @genkit-ai/core@[version] @genkit-ai/googleai@[version]
echo.
