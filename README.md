# AIStudioSandbox

# Genkit Integration Test

This project demonstrates how to integrate and test the Genkit AI library.

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

## Configuration

Set your Gemini API Key as an environment variable (recommended):

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

## Additional Resources

- [Genkit Documentation](https://genkit.ai/docs)
- [Google AI Platform](https://cloud.google.com/ai-platform)
