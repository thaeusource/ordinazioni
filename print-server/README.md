# 🖨️ Sagra Print Server v1.0

Server di stampa termico per ricevute della sagra con supporto cross-platform per stampanti ESC/POS.  
**Testato con: Qian QOP-T80UL-RI-02**

## 📋 Contenuto Pacchetto

Questo pacchetto contiene tutto il necessario per installare e utilizzare il print server:

```
sagra-print-server/
├── 🚀 run.sh / run.bat     # AVVIO RAPIDO
├── 📦 package.json         # Configurazione Node.js
├── 📚 README.md           # Questa guida
├── src/                   # Codice sorgente
│   ├── print-server.js    # Server principale
│   ├── config-manager.js  # Gestione configurazione
│   ├── print-manager.js   # Gestione stampa cross-platform
│   └── escpos-commands.js # Comandi ESC/POS
├── scripts/               # Script di installazione
│   ├── install.sh         # Installer Unix (macOS/Linux)
│   ├── install.bat        # Installer Windows
│   ├── start.sh           # Avvio Unix
│   └── start.bat          # Avvio Windows
└── config/                # Configurazione
    ├── config.json        # Config principale (auto-generato)
    └── config.template.json # Template di configurazione
```

## � AVVIO RAPIDO (Raccomandato)

### 1. Copia il Pacchetto
Copia questa cartella completa sul PC della cassa:
- **Windows**: `C:\sagra-print-server\`
- **macOS/Linux**: `~/sagra-print-server/`

### 2. Avvio Automatico

#### Windows
```cmd
# Doppio click su: run.bat
# OPPURE da prompt comandi:
run.bat
```

#### macOS/Linux
```bash
# Da terminale:
chmod +x run.sh
./run.sh
```

**Il sistema farà tutto automaticamente:**
- ✅ Installa dipendenze Node.js se necessario
- ✅ Configura il print server
- ✅ Avvia il servizio sulla porta 3001

## 📦 Requisiticmd### 2. Avvio Server

- **Sistema Operativo**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **Stampante**: Qian QOP-T80UL-RI-02 collegata via USB
- **Node.js**: v16.0.0+ (installato automaticamente dagli script)

## 🔧 Configurazione Avanzata

### Configurazione Stampante

Il file `config/config.json` viene creato automaticamente al primo avvio:

```json
{
  "printer": {
    "name": "POS80_RAW",
    "encoding": "utf8"
  },
  "server": {
    "port": 3001,
    "host": "0.0.0.0"
  }
}
```

### Trovare il Nome della Stampante

#### Windows
```cmd
# Pannello di Controllo > Stampanti
# OPPURE da terminale:
wmic printer list brief
```

#### macOS
```bash
lpstat -p
```

#### Linux
```bash
lpstat -p
```

### Modifica Configurazione

Modifica `config/config.json` e imposta il nome corretto della stampante:
```json
{
  "printer": {
    "name": "IL_TUO_NOME_STAMPANTE_QUI"
  }
}
```

## 🧪 Test del Sistema

### Test di Base
1. Avvia il server con `./run.sh` (Unix) o `run.bat` (Windows)
2. Apri browser: `http://localhost:3001/health`
3. Testa stampa: `http://localhost:3001/test`

### Test da App React
L'app della sagra si collegherà automaticamente al print server su `http://localhost:3001`

## ⚙️ ConfigurazionePORT=3001              # Porta del server

HOST=localhost         # Host del server  

### File config.jsonDEBUG=true            # Log dettagliati

```json```

{

  "server": {### Avvio Automatico Windows

    "port": 3001,

    "host": "0.0.0.0"Crea un file `start.bat`:

  },

  "printer": {```batch

    "name": "NOME_DELLA_TUA_STAMPANTE",@echo off

    "width": 32cd /d "C:\sagra-print-server"

  },npm start

  "receipt": {pause

    "title": "SAGRA PARROCCHIA",```

    "footer": "Ritira alle cucine indicate"

  }## 📱 Integrazione App

}

```L'app React si collega automaticamente a `http://localhost:3001` per stampare gli scontrini.



### Trovare il Nome della Stampante## 🔧 Risoluzione Problemi



#### macOS/Linux### Stampante non trovata

```bash- Verifica connessione USB

lpstat -p- Riavvia stampante

```- Controlla driver Windows



#### Windows### Errori di porta

```cmd- Cambia PORT in `.env`

wmic printer list brief- Verifica che la porta non sia occupata

```

### Permessi USB

## 🚀 Avvio- Avvia come amministratore (Windows)

- Controlla permessi dispositivi USB

### Avvio Semplice

```bash## 📖 API Endpoints

# macOS/Linux

./start.sh| Endpoint | Metodo | Descrizione |

|----------|--------|-------------|

# Windows| `/health` | GET | Stato server e stampante |

start-print-server.bat| `/test` | GET | Stampa test |

```| `/printers` | GET | Lista stampanti USB |

| `/print-receipt` | POST | Stampa scontrino |

### Avvio Manuale

```bash### Esempio Stampa Scontrino

node print-server.js

``````javascript

fetch('http://localhost:3001/print-receipt', {

### Servizio Windows  method: 'POST',

```cmd  headers: { 'Content-Type': 'application/json' },

# Installa come servizio  body: JSON.stringify({

install-service.bat    receiptData: {

      customerNumber: 123,

# Gestione servizio      station: 1,

net start PrintServer      items: [

net stop PrintServer        { name: "Hot dog", quantity: 2, price: 8.50 }

```      ],

      total: 17.00,

## 🌐 API Endpoints      timestamp: Date.now()

    }

### GET /health  })

Verifica stato del server e della stampante.})

```

### POST /test

Stampa ricevuta di test.## 📞 Supporto



### POST /print-receiptPer problemi durante l'evento, controlla:

Stampa ricevuta ordine.1. Server avviato: http://localhost:3001/health

2. Stampante collegata: http://localhost:3001/printers  

**Richiesta:**3. Test di stampa: http://localhost:3001/test

```json

{---

  "customerNumber": "123",

  "station": "Stazione 1",**Versione:** 1.0.0  

  "items": [**Compatibilità:** Qian QOP-T80UL-RI-02, stampanti ESC/POS

    {"qty": 2, "name": "Pizza Margherita", "price": 800},
    {"qty": 1, "name": "Coca Cola", "price": 250}
  ],
  "total": 1850
}
```

### GET /printers
Lista stampanti disponibili.

### POST /test-simple
Test di stampa semplice (non ESC/POS).

## 📁 Struttura File

```
print-server/
├── config.json              # Configurazione
├── config.template.json     # Template configurazione
├── print-server.js          # Server principale
├── config-manager.js        # Gestione configurazione
├── print-manager.js         # Gestione stampa cross-platform
├── escpos-commands.js        # Comandi ESC/POS
├── install.sh               # Installer macOS/Linux
├── install.bat              # Installer Windows
├── start.sh                 # Avvio macOS/Linux
└── package.json             # Dipendenze Node.js
```

---

**Versione:** 1.0  
**Compatibilità:** Node.js 16.0.0+  
**Piattaforme:** Windows, macOS, Linux  
**Stampante:** Qian QOP-T80UL-RI-02 (e compatibili ESC/POS)