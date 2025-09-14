@echo off
REM =============================================================================
REM SAGRA PRINT SERVER - AVVIO RAPIDO WINDOWS
REM =============================================================================

cd /d "%~dp0"

echo 🍝 SAGRA PRINT SERVER v1.0
echo ==========================
echo.

echo 📦 Controllo installazione...

REM Controlla se è già installato
if not exist "config\config.json" (
    echo ⚙️  Prima installazione rilevata
    echo.
    echo 🔧 Esecuzione installer Windows...
    call scripts\install.bat
    echo.
    echo ✅ Installazione completata!
    echo.
)

if not exist "node_modules" (
    echo ⚙️  Dipendenze mancanti, esecuzione installer...
    echo.
    call scripts\install.bat
    echo.
)

echo 🚀 Avvio print server...
echo.

REM Avvia il server
call scripts\start.bat

pause