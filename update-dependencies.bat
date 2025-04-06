@echo off
echo === Updating dependencies ===
echo Uninstalling deprecated packages...
call npm uninstall xterm xterm-addon-fit @esbuild-kit/core-utils

echo Installing modern replacements...
call npm install @xterm/xterm@latest @xterm/addon-fit@latest tsx

echo Updating packages with security fixes...
call npm update esbuild prismjs --legacy-peer-deps

echo Running security audit...
call npm audit

echo === Dependency update complete ===
