#!/bin/bash

# =============================================================================
# SAGRA PRINT SERVER - AVVIO RAPIDO
# =============================================================================
# Questo script gestisce l'installazione e l'avvio automatico del print server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🍝 SAGRA PRINT SERVER v1.0"
echo "=========================="
echo ""

# Funzione per rilevare il sistema operativo
detect_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macos";;
        Linux*)     echo "linux";;
        CYGWIN*|MINGW*|MSYS*) echo "windows";;
        *)          echo "unknown";;
    esac
}

OS=$(detect_os)
echo "🖥️  Sistema operativo: $OS"

# Funzione di cleanup
cleanup() {
    echo ""
    echo "🛑 Arresto in corso..."
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "📦 Controllo installazione..."

# Controlla se è già installato
if [[ ! -f "config/config.json" ]] || [[ ! -d "node_modules" ]]; then
    echo "⚙️  Prima installazione rilevata"
    echo ""
    
    case $OS in
        "macos"|"linux")
            echo "🔧 Esecuzione installer Unix..."
            chmod +x scripts/install.sh
            ./scripts/install.sh
            ;;
        "windows")
            echo "🔧 Esecuzione installer Windows..."
            cmd //c scripts\\install.bat
            ;;
        *)
            echo "❌ Sistema operativo non supportato"
            exit 1
            ;;
    esac
    
    echo ""
    echo "✅ Installazione completata!"
    echo ""
fi

echo "🚀 Avvio print server..."
echo ""

# Avvia il server
case $OS in
    "macos"|"linux")
        chmod +x scripts/start.sh
        ./scripts/start.sh
        ;;
    "windows")
        cmd //c scripts\\start.bat
        ;;
    *)
        echo "❌ Sistema operativo non supportato per l'avvio"
        exit 1
        ;;
esac