@echo off
REM =============================================================================
REM AVVIO PRINT SERVER - Windows
REM =============================================================================

cd /d "%~dp0\.."

echo 🚀 Avvio Print Server per Sagra
echo ================================
echo 📂 Directory: %cd%

REM Controlla Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js non installato
    echo 📦 Esegui prima: scripts\install.bat
    pause
    exit /b 1
)

REM Controlla configurazione
if not exist "config\config.json" (
    echo ❌ File config\config.json non trovato
    echo 📝 Esegui prima: scripts\install.bat
    pause
    exit /b 1
)

REM Controlla dipendenze
if not exist "node_modules" (
    echo 📦 Installazione dipendenze...
    npm install
)

REM Controlla se la stampante è configurata
findstr "YOUR_PRINTER_NAME_HERE" config\config.json >nul
if not errorlevel 1 (
    echo ⚠️  Stampante non configurata!
    echo 📝 Modifica config\config.json per impostare il nome della stampante
    echo.
    echo 💡 Per vedere le stampanti disponibili apri Pannello di Controllo ^> Stampanti
    echo.
    set /p choice="Continuare comunque? (y/N): "
    if /i not "%choice%"=="y" exit /b 1
)

echo ✅ Avvio server...
for /f "tokens=2 delims=:" %%i in ('findstr "port" config\config.json') do set port=%%i
set port=%port: =%
set port=%port:,=%
echo 🌐 Server disponibile su: http://localhost:%port%
echo 💡 Premi Ctrl+C per fermare
echo.

node src\print-server.js

pause