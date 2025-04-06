@echo off
REM Windows batch file to run the Genkit integration test

echo ==================================================
echo Genkit Integration Test Runner
echo ==================================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)

REM Update dependencies to correct version
echo Ensuring correct Genkit dependencies...
call npm install @genkit-ai/core@1.5.0 @genkit-ai/googleai@1.5.0

REM Check if GEMINI_API_KEY is set
if "%GEMINI_API_KEY%"=="" (
    echo Notice: GEMINI_API_KEY environment variable is not set. Using test key.
    echo For production use, set your API key with: set GEMINI_API_KEY=your_key_here
)

echo ==================================================
echo Running Genkit integration test...
echo ==================================================

REM Run the test
node test-genkit.js

REM Check exit status
if %ERRORLEVEL% equ 0 (
    echo ==================================================
    echo ✅ Test completed successfully!
    echo ==================================================
) else (
    echo ==================================================
    echo ❌ Test failed with errors. Check the output above.
    echo ==================================================
    exit /b 1
)

echo.
echo To run this test again, simply execute:
echo run-test.bat
echo.
