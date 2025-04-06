@echo off
echo === Genkit Integration Quick Start ===

REM Check if API key is set
if "%GEMINI_API_KEY%"=="" (
  echo WARNING: GEMINI_API_KEY environment variable is not set
  echo Please set your API key by running:
  echo set GEMINI_API_KEY=your_actual_key
  echo.
  set /p CONTINUE=Continue with test key? (y/n): 
  if /i not "%CONTINUE%"=="y" exit /b
)

REM Verify dependencies
echo Checking dependencies...
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo ERROR: npm is not installed or not in PATH
  echo Please install Node.js from https://nodejs.org/
  exit /b 1
)

REM Run test
echo Running Genkit integration test...
node test-genkit.js

echo.
echo === COMPLETED ===
echo.
echo If you encountered errors:
echo 1. Make sure your API key is correct
echo 2. Check your internet connection
echo 3. Try reinstalling dependencies: npm install @genkit-ai/core @genkit-ai/googleai
