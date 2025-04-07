# AIStudioSandbox

An experimental AI-powered development environment sandbox.

# Genkit Integration Test

This project demonstrates how to integrate and test the Genkit AI library using version 1.5.

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Gemini API key (set as `GEMINI_API_KEY` environment variable)

## Installation Steps

1.  Clone or download this project.
2.  Open a terminal/command prompt in the project directory.
3.  Install dependencies:
    ```bash
    npm install
    ```
    *(This will install dependencies listed in `package.json`, including Genkit 1.5)*

## Configuration

Set your Gemini API Key as an environment variable:

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

## Running the Application

To start the development server (includes API, WebSocket, and Vite client):

```bash
npm run dev
```

The application should be available at `http://localhost:5173`.

## Running Tests

### Genkit Integration Test:

Run the specific test script for Genkit:

```bash
node test-genkit.js
```

### Comprehensive Verification Suite:

Run a series of checks for dependencies, servers, and basic API/WebSocket functionality:

```bash
node verify-all.js
```

*(Note: This script might attempt to start servers if they aren't running.)*

## Important Note About API Keys

This project primarily uses the `GEMINI_API_KEY` environment variable for Google AI services (including Genkit). Ensure this variable is set correctly. Other keys like `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` can be set to enable those specific AI providers.

## Troubleshooting

-   **Node.js Version:** Ensure you have Node.js v18 or higher (`node --version`).
-   **Dependencies:** If you encounter module errors, delete `node_modules` and `package-lock.json`, then run `npm install` again.
-   **API Key:** Double-check that your `GEMINI_API_KEY` is correctly set in your environment.
-   **Port Conflicts:** Ensure ports 3000 (API), 3001 (WebSocket), and 5173 (Vite) are free. Use `node scripts/check-ports.js` to check.
-   **Firewall:** On Windows, you might need to allow connections through the firewall. Run `powershell -ExecutionPolicy Bypass -File .\scripts\setup-firewall.ps1` as Administrator.

## Development Environment Setup (Windows Specific Fixes)

If you encounter issues specifically on Windows related to `esbuild` or `xterm`, try running the provided PowerShell script:

```powershell
.\fix-dependencies.ps1
```

This script cleans the installation and reinstalls specific versions known to work better on Windows. After running it, use `yarn install --ignore-optional` and `yarn dev`.

## Additional Resources

-   [Genkit Documentation](https://firebase.google.com/docs/genkit) (Note: Genkit is now part of Firebase)
-   [Google AI Platform](https://cloud.google.com/vertex-ai)
-   [LiveKit Documentation](https://docs.livekit.io/)
