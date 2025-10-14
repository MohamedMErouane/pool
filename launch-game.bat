@echo off
echo 🎱 Enhanced Pool Game Launcher
echo ================================

echo.
echo Starting game server...
cd /d "%~dp0"

echo.
echo Available games:
echo 1. Enhanced Pool Game (New improved version)
echo 2. Test Visibility Game (Debugging version)
echo 3. Original Game (index.html)

echo.
choice /C 123 /M "Select game version to launch"

if errorlevel 3 goto original
if errorlevel 2 goto test
if errorlevel 1 goto enhanced

:enhanced
echo.
echo 🎯 Launching Enhanced Pool Game...
echo Open your browser and go to: http://localhost:3000/enhanced-pool-game.html
node server.js
goto end

:test
echo.
echo 🔧 Launching Test Visibility Game...
echo Open your browser and go to: http://localhost:3000/test-visibility.html
node server.js
goto end

:original
echo.
echo 🎱 Launching Original Game...
echo Open your browser and go to: http://localhost:3000/index.html
node server.js
goto end

:end
echo.
echo Press any key to exit...
pause >nul