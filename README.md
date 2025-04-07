# AIStudioSandbox

# Genkit Integration Test

This project demonstrates how to integrate and test the Genkit AI library using version 1.5.

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Gemini API key (optional for testing, required for production use)

## Installation Steps

1. Clone or download this project to your machine
2. Open terminal/command prompt in the project directory
3. Install dependencies:
   ```
   npm install
   ```
   
   Or to specifically install the required Genkit 1.5 versions:
   ```
   npm install @genkit-ai/core@1.5.0 @genkit-ai/googleai@1.5.0
   ```

## Configuration

Set your Gemini API Key as an environment variable (required for full functionality):

### Windows (Command Prompt)
```bash
set GEMINI_API_KEY=your_api_key_here
```

### Windows (PowerShell)
```bash
$env:GEMINI_API_KEY="your_api_key_here"
```

### macOS/Linux
```bash
export GEMINI_API_KEY=your_api_key_here
```

## Running the Test

### Windows:
```
run-test.bat
```

### macOS/Linux:
```
chmod +x run-test.sh
./run-test.sh
```

Or simply run with Node.js directly:
```
node test-genkit.js
```

## Important Note About API Keys

This project is configured to use the `GEMINI_API_KEY` environment variable. If you already have this set in your environment, you don't need to change anything.

If you're experiencing issues with multiple API key variables, please note:
- Use only `GEMINI_API_KEY` for this project
- Remove or don't set `GOOGLE_API_KEY` if it causes conflicts
- Both variables would typically point to the same key, but we'll use only one to avoid issues

## Troubleshooting

- Ensure Node.js v18+ is installed
- If modules are missing, run `npm install` again
- Check console errors for specific issues

If you encounter errors:

1. Verify Node.js version (should be 18+):
   ```bash
   node --version
   ```

2. Check that dependencies are installed:
   ```bash
   npm list @genkit-ai/core @genkit-ai/googleai
   ```

3. If using an API key, verify it's set correctly:
   ```bash
   echo %GEMINI_API_KEY%  # Windows Command Prompt
   echo $env:GEMINI_API_KEY  # Windows PowerShell
   echo $GEMINI_API_KEY  # macOS/Linux
   ```

4. If seeing import errors, make sure your package.json has "type": "module" or use the .mjs extension

If you encounter any issues:

1. Make sure Node.js 18+ is installed
2. Run `npm install @genkit-ai/core @genkit-ai/googleai` manually
3. Check the console output for any specific error messages

# Development Environment Setup

## Fixing Dependency Issues

This project requires specific dependencies for the Windows environment. Follow these steps to resolve common dependency issues:

1. Run the provided fix script:
```powershell
.\fix-dependencies.ps1
```

2. Or manually perform these steps:
   - Clean existing installation:
     ```powershell
     rm -r node_modules
     rm package-lock.json
     ```
   - Install specific esbuild for Windows:
     ```powershell
     npm install --save-exact @esbuild/win32-x64@0.19.2
     ```
   - Install correct xterm packages:
     ```powershell
     npm install @xterm/xterm@5.3.0 @xterm/addon-fit@0.8.0
     ```
   - Install required global tools:
     ```powershell
     npm install -g yarn
     npm install -g concurrently
     ```
   - Reinstall dependencies with Yarn:
     ```powershell
     yarn install --ignore-optional
     ```

3. Start the application:
   ```powershell
   yarn dev
   ```

This setup resolves the platform mismatch errors while maintaining real-time TypeScript execution capabilities.

## Additional Resources

- [Genkit Documentation](https://genkit.ai/docs)
- [Google AI Platform](https://cloud.google.com/ai-platform)
