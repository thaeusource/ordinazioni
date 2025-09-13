# Print Server per Sagra - Documentazione# 🖨️ Sagra Print Server



Server di stampa termico cross-platform per ricevute della sagra con stampante Qian QOP-T80UL-RI-02.Server standalone per stampanti termiche USB compatibile con Qian QOP-T80UL-RI-02 e altri modelli ESC/POS.



## 🎯 Caratteristiche## 📋 Requisiti



- ✅ **Cross-platform**: Windows, macOS, Linux- **Node.js** 16+ installato sul PC

- ✅ **Configurazione esterna**: File config.json- **Stampante USB** Qian QOP-T80UL-RI-02 collegata e accesa

- ✅ **Comandi ESC/POS**: Supporto completo per stampanti termiche- **Driver stampante** installati (solitamente automatici)

- ✅ **API REST**: Integrazione semplice con app web

- ✅ **Auto-installer**: Script di installazione automatica## 🚀 Installazione Rapida

- ✅ **Gestione errori**: Fallback e diagnostica

- ✅ **Servizio Windows**: Installazione come servizio### 1. Preparazione PC Cassa



## 📦 Installazione```bash

# Copia questa cartella sul PC della cassa

### Installazione Automatica# Esempio: C:\sagra-print-server\



#### macOS/Linux# Apri terminale/prompt nella cartella

```bashcd C:\sagra-print-server

chmod +x install.sh

./install.sh# Installa dipendenze (solo la prima volta)

```npm install

```

#### Windows

```cmd### 2. Avvio Server

install.bat

``````bash

# Avvia il server di stampa

### Installazione Manualenpm start



1. **Installa Node.js** (versione 16.0.0+)# Il server sarà disponibile su http://localhost:3001

   - macOS: `brew install node````

   - Windows: Download da [nodejs.org](https://nodejs.org)

   - Linux: `sudo apt install nodejs npm`### 3. Test Funzionamento



2. **Installa dipendenze**Visita http://localhost:3001/health nel browser per verificare che tutto funzioni.

   ```bash

   npm installPer stampare un test: http://localhost:3001/test

   ```

## 🔧 Configurazione

3. **Configura stampante**

   ```bash### Variabili Ambiente (opzionali)

   cp config.template.json config.json

   # Modifica config.json con il nome della tua stampanteCrea un file `.env` per personalizzare:

   ```

```bash

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