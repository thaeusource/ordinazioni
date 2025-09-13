@echo off
REM =============================================================================
REM INSTALLER PRINT SERVER - Windows
REM =============================================================================

setlocal enabledelayedexpansion

REM Vai alla directory principale del print-server (parent di scripts)
set "PRINT_SERVER_DIR=%~dp0.."
cd /d "%PRINT_SERVER_DIR%"
set "NODE_MIN_VERSION=16.0.0"

echo 🚀 Installer Print Server per Sagra
echo =====================================
echo 📂 Directory: %PRINT_SERVER_DIR%

REM Controlla se Node.js è installato
echo 🔍 Controllo Node.js...
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    set NODE_VERSION=!NODE_VERSION:v=!
    echo ✅ Node.js trovato: v!NODE_VERSION!
) else (
    echo ❌ Node.js non installato
    goto :install_nodejs
)

REM Se Node.js è installato, procedi
goto :install_dependencies

:install_nodejs
echo 📦 Installazione Node.js richiesta...
echo 🌐 Apertura pagina download Node.js...
start https://nodejs.org/en/download/
echo.
echo ⏸️  Installa Node.js LTS e riavvia questo script
echo.
pause
exit /b 1

:install_dependencies
echo 📦 Installazione dipendenze...
cd /d "%PRINT_SERVER_DIR%"

if exist package.json (
    call npm install
    if %errorlevel% equ 0 (
        echo ✅ Dipendenze installate
    ) else (
        echo ❌ Errore nell'installazione delle dipendenze
        pause
        exit /b 1
    )
) else (
    echo ❌ package.json non trovato
    pause
    exit /b 1
)

REM Configura la stampante
echo 🖨️  Configurazione stampante...

REM Crea directory config se non esiste
if not exist "%PRINT_SERVER_DIR%\config" mkdir "%PRINT_SERVER_DIR%\config"

REM Crea config.json se non esiste
if not exist "%PRINT_SERVER_DIR%\config\config.json" (
    copy "%PRINT_SERVER_DIR%\config\config.template.json" "%PRINT_SERVER_DIR%\config\config.json" >nul
    echo 📝 File di configurazione creato: config\config.json
)

REM Lista stampanti disponibili
echo 📋 Stampanti disponibili:
wmic printer list brief

echo.
echo 📝 Per configurare la stampante:
echo    1. Apri: %PRINT_SERVER_DIR%\config\config.json
echo    2. Sostituisci 'YOUR_PRINTER_NAME_HERE' con il nome della tua stampante
echo    3. Usa 'wmic printer list brief' per vedere le stampanti disponibili
echo.

REM Crea script di avvio
echo 🔧 Creazione script di avvio...

REM Script BAT per Windows
(
echo @echo off
echo setlocal
echo.
echo set "SCRIPT_DIR=%%~dp0"
echo cd /d "%%SCRIPT_DIR%%"
echo.
echo echo 🚀 Avvio Print Server...
echo echo 📂 Directory: %%SCRIPT_DIR%%
echo.
echo REM Controlla configurazione
echo if not exist config\config.json (
echo     echo ❌ File config\config.json non trovato
echo     pause
echo     exit /b 1
echo ^)
echo.
echo REM Controlla se la stampante è configurata
echo findstr /c:"YOUR_PRINTER_NAME_HERE" config\config.json >nul
echo if %%errorlevel%% equ 0 (
echo     echo ⚠️  Stampante non configurata!
echo     echo 📝 Modifica config\config.json per impostare il nome della stampante
echo     echo.
echo ^)
echo.
echo REM Avvia il server
echo echo ✅ Avvio server...
echo node src\print-server.js
echo.
echo if %%errorlevel%% neq 0 (
echo     echo ❌ Errore nell'avvio del server
echo     pause
echo ^)
) > "%PRINT_SERVER_DIR%start-print-server.bat"

echo ✅ Script di avvio creato: start-print-server.bat

REM Crea script per installare come servizio Windows
(
echo @echo off
echo REM Installa Print Server come servizio Windows
echo REM Richiede npm install -g node-windows
echo.
echo echo 📦 Installazione node-windows...
echo npm install -g node-windows
echo.
echo echo 🔧 Configurazione servizio...
echo node -e "var Service = require('node-windows'^).Service; var svc = new Service({name:'PrintServer',description:'Thermal Print Server per Sagra',script:'%PRINT_SERVER_DIR%print-server.js'}^); svc.on('install',function(^){svc.start();console.log('Servizio installato e avviato'^);}^); svc.install(^);"
echo.
echo echo ✅ Servizio installato!
echo echo 🌐 Il server sarà disponibile su http://localhost:3001
) > "%PRINT_SERVER_DIR%install-service.bat"

echo ✅ Script servizio creato: install-service.bat

REM Test del sistema
echo 🧪 Test installazione...

REM Test sintassi
node -c print-server.js >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Sintassi server OK
) else (
    echo ❌ Errore nella sintassi del server
    pause
    exit /b 1
)

echo ✅ Installazione completata con successo!

echo.
echo 🎉 INSTALLAZIONE COMPLETATA!
echo ==========================
echo 📝 Prossimi passi:
echo    1. Modifica config\config.json per configurare la stampante
echo    2. Avvia il server: scripts\start.bat
echo    3. Testa su: http://localhost:3001/health
echo.

pause