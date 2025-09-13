#!/bin/bash

# =============================================================================
# INSTALLER PRINT SERVER - macOS/Linux
# =============================================================================

set -e  # Exit on any error

# Vai alla directory principale del print-server (parent di scripts)
PRINT_SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_MIN_VERSION="16.0.0"

echo "🚀 Installer Print Server per Sagra"
echo "====================================="
echo "📂 Directory: $PRINT_SERVER_DIR"

# Funzione per confrontare versioni
version_compare() {
    if [[ $1 == $2 ]]; then
        echo "0"
    elif [[ $1 = $(echo -e "$1\n$2" | sort -V | head -n1) ]]; then
        echo "-1"
    else
        echo "1"
    fi
}

# Controlla se Node.js è installato
check_nodejs() {
    echo "🔍 Controllo Node.js..."
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version | sed 's/v//')
        echo "✅ Node.js trovato: v$NODE_VERSION"
        
        if [[ $(version_compare $NODE_VERSION $NODE_MIN_VERSION) -ge 0 ]]; then
            echo "✅ Versione Node.js OK"
            return 0
        else
            echo "❌ Versione Node.js troppo vecchia (richiesta: v$NODE_MIN_VERSION+)"
            return 1
        fi
    else
        echo "❌ Node.js non installato"
        return 1
    fi
}

# Installa Node.js su macOS
install_nodejs_macos() {
    echo "📦 Installazione Node.js su macOS..."
    
    if command -v brew >/dev/null 2>&1; then
        echo "🍺 Uso Homebrew per installare Node.js..."
        brew install node
    else
        echo "❌ Homebrew non trovato. Installa manualmente Node.js da:"
        echo "   https://nodejs.org/en/download/"
        exit 1
    fi
}

# Installa Node.js su Linux
install_nodejs_linux() {
    echo "📦 Installazione Node.js su Linux..."
    
    if command -v apt >/dev/null 2>&1; then
        # Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
        sudo yum install -y nodejs npm
    else
        echo "❌ Gestore pacchetti non supportato. Installa manualmente Node.js da:"
        echo "   https://nodejs.org/en/download/"
        exit 1
    fi
}

# Installa le dipendenze npm
install_dependencies() {
    echo "📦 Installazione dipendenze..."
    cd "$PRINT_SERVER_DIR"
    
    if [[ -f "package.json" ]]; then
        npm install
        echo "✅ Dipendenze installate"
    else
        echo "❌ package.json non trovato"
        exit 1
    fi
}

# Configura la stampante
configure_printer() {
    echo "🖨️  Configurazione stampante..."
    
    # Crea directory config se non esiste
    mkdir -p "$PRINT_SERVER_DIR/config"
    
    # Crea config.json se non esiste
    if [[ ! -f "$PRINT_SERVER_DIR/config/config.json" ]]; then
        cp "$PRINT_SERVER_DIR/config/config.template.json" "$PRINT_SERVER_DIR/config/config.json"
        echo "📝 File di configurazione creato: config/config.json"
    fi
    
    # Lista stampanti disponibili
    echo "📋 Stampanti disponibili:"
    if command -v lpstat >/dev/null 2>&1; then
        lpstat -p | grep "printer" || echo "   Nessuna stampante trovata"
    fi
    
    echo ""
    echo "📝 Prossimi passi:"
    echo "   1. Apri: $PRINT_SERVER_DIR/config/config.json"
    echo "   2. Imposta il nome della stampante nel campo 'printer.name'"
    echo "   3. Esegui: ./scripts/start.sh"
}
}

# Crea script di avvio
create_startup_script() {
    echo "🔧 Creazione script di avvio..."
    
    # Script per macOS/Linux
    cat > "$PRINT_SERVER_DIR/start-print-server.sh" << 'EOF'
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Avvio Print Server..."
echo "📂 Directory: $SCRIPT_DIR"

# Controlla configurazione
if [[ ! -f "config/config.json" ]]; then
    echo "❌ File config/config.json non trovato"
    exit 1
fi

# Controlla se la stampante è configurata
if grep -q "YOUR_PRINTER_NAME_HERE" config/config.json; then
    echo "⚠️  Stampante non configurata!"
    echo "📝 Modifica config/config.json per impostare il nome della stampante"
    echo ""
fi

# Avvia il server
node src/print-server.js
EOF

    chmod +x "$PRINT_SERVER_DIR/start-print-server.sh"
    echo "✅ Script di avvio creato: start-print-server.sh"
}

# Test del sistema
test_installation() {
    echo "🧪 Test installazione..."
    cd "$PRINT_SERVER_DIR"
    
    # Test sintassi
    if node -c print-server.js >/dev/null 2>&1; then
        echo "✅ Sintassi server OK"
    else
        echo "❌ Errore nella sintassi del server"
        exit 1
    fi
    
    echo "✅ Installazione completata con successo!"
}

# Main installation
main() {
    echo "📂 Directory di installazione: $PRINT_SERVER_DIR"
    echo ""
    
    # Controlla/installa Node.js
    if ! check_nodejs; then
        echo "📦 Installazione Node.js richiesta..."
        
        case "$(uname -s)" in
            Darwin*)
                install_nodejs_macos
                ;;
            Linux*)
                install_nodejs_linux
                ;;
            *)
                echo "❌ Sistema operativo non supportato: $(uname -s)"
                exit 1
                ;;
        esac
        
        # Ricontrolla dopo l'installazione
        if ! check_nodejs; then
            echo "❌ Installazione Node.js fallita"
            exit 1
        fi
    fi
    
    # Installa dipendenze
    install_dependencies
    
    # Configura stampante
    configure_printer
    
    # Crea script di avvio
    create_startup_script
    
    # Test finale
    test_installation
    
    echo ""
    echo "🎉 INSTALLAZIONE COMPLETATA!"
    echo "=========================="
    echo "📝 Prossimi passi:"
    echo "   1. Modifica config/config.json per configurare la stampante"
    echo "   2. Avvia il server: ./scripts/start.sh"
    echo "   3. Testa su: http://localhost:3001/health"
    echo ""
}

# Esegui installazione
main "$@"