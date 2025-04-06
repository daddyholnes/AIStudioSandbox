@echo off
echo === AIStudioSandbox Verification Tool ===
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: Node.js is not installed or not in PATH
  echo Please install Node.js from https://nodejs.org/
  exit /b 1
)

REM Run the verification script
echo Running verification tests...
echo.
node verify-all.js

echo.
echo === Verification Complete ===
