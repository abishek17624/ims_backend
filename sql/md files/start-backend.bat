@echo off
echo ================================
echo    IMS Backend Server Starter
echo ================================
echo.

cd /d "c:\Users\ABISHEK\Desktop\Genworx\Angular\Project\New folder\ims_backend"
echo Current directory: %CD%
echo.

echo Checking Node.js installation...
node --version
echo.

echo Starting server on port 5000...
echo Press Ctrl+C to stop the server
echo.
echo ================================
echo.

REM Try to start the main server first
echo Attempting to start main server (server.js)...
node server.js

REM If that fails, try the simplified server
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Main server failed, trying simplified server...
    node start-server.js
)

echo.
echo Server stopped.
pause
