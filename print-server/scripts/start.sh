#!/bin/bash

# =============================================================================
# AVVIO PRINT SERVER - macOS/Linux
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Vai alla directory principale del print-server (parent di scripts)
cd "$SCRIPT_DIR/.."

echo "🚀 Avvio Print Server per Sagra"
echo "================================"
echo "📂 Directory: $(pwd)"

# Controlla che Node.js sia installato
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js non installato"
    echo "📦 Esegui prima: scripts/install.sh"
    exit 1
fi

# Controlla configurazione
if [[ ! -f "config/config.json" ]]; then
    echo "❌ File config/config.json non trovato"
    echo "📝 Esegui prima: scripts/install.sh"
    exit 1
fi

# Controlla se la stampante è configurata
if grep -q "YOUR_PRINTER_NAME_HERE" config/config.json; then
    echo "⚠️  Stampante non configurata!"
    echo "📝 Modifica config/config.json per impostare il nome della stampante"
    echo ""
    echo "💡 Per vedere le stampanti disponibili:"
    echo "   lpstat -p"
    echo ""
    read -p "Continuare comunque? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Controlla le dipendenze
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installazione dipendenze..."
    npm install
fi

# Funzione per gestire il segnale di stop
cleanup() {
    echo ""
    echo "🛑 Arresto Print Server..."
    exit 0
}

# Cattura i segnali di terminazione
trap cleanup SIGINT SIGTERM

# Avvia il server
echo "✅ Avvio server..."
echo "🌐 Server disponibile su: http://localhost:$(grep -o '"port": [0-9]*' config/config.json | grep -o '[0-9]*')"
echo "💡 Premi Ctrl+C per fermare"
echo ""

node src/print-server.js