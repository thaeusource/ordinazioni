# 🎪 Sagra Ordering System

Sistema completo per la gestione delle ordinazioni durante sagre e feste parrocchiali.


## 📁 Struttura del Progetto

La struttura attuale del progetto è la seguente:

```text
ordinazioni/
├── src/
│   ├── main.jsx               # Entry point principale React
│   ├── App.jsx                # Componente principale React
│   ├── App.css                # Stili principali
│   ├── index.css              # Stili globali
│   ├── components/
│   │   ├── CassaView.jsx      # UI cassa e gestione carrello
│   │   ├── ConfigView.jsx     # UI configurazione e dashboard
│   │   ├── KitchenView.jsx    # UI cucine per ordini
│   │   ├── MenuItemForm.jsx   # Form per aggiungere menu items
│   │   ├── LineForm.jsx       # Form per gestire linee di preparazione
│   │   └── PrintTestComponent.jsx # Componente test sistema stampa
│   ├── services/
│   │   ├── firebaseService.js # Funzioni per Firestore/RTDB
│   │   ├── printService.js    # Servizio comunicazione print server
│   │   └── receiptGenerator.js # Generatore ricevute ESC/POS
│   ├── firebase/
│   │   └── config.js          # Configurazione Firebase
│   └── assets/                # Risorse statiche
├── public/                    # File pubblici statici
├── print-server/              # Print server standalone per stampanti USB
│   ├── print-server.js        # Server Node.js generico ESC/POS
│   ├── config-manager.js      # Gestione configurazione
│   ├── print-manager.js       # Gestione stampa cross-platform
│   ├── escpos-commands.js     # Libreria comandi ESC/POS
│   ├── config.json            # Configurazione runtime
│   ├── config.template.json   # Template configurazione
│   ├── package.json           # Dipendenze print server
│   ├── install.bat           # Auto-installer Windows
│   ├── install.sh            # Auto-installer Unix/macOS/Linux
│   ├── start.bat             # Script avvio Windows
│   ├── start.sh              # Script avvio Unix/macOS/Linux
│   └── README.md             # Documentazione print server
├── dist/                      # Build di produzione (generata)
├── .firebase/                 # Cache Firebase (generata)
├── package.json               # Dipendenze e script
├── package-lock.json          # Lock file dipendenze
├── vite.config.js             # Configurazione Vite
├── tailwind.config.js         # Configurazione Tailwind CSS
├── eslint.config.js           # Configurazione ESLint
├── index.html                 # Template HTML principale
├── firebase.json              # Configurazione Firebase
├── firestore.rules            # Regole di sicurezza Firestore
├── firestore.indexes.json     # Indici Firestore
├── database.rules.json        # Regole Realtime Database
├── .env                       # Variabili ambiente Firebase
├── .firebaserc                # Configurazione progetti Firebase
├── .gitignore                 # File ignorati da Git
└── README.md                  # Documentazione
```

## 🚀 Quick Start

### 1. Setup del Progetto

```bash
# Clona il progetto (o crea una nuova cartella)
mkdir sagra-ordering-system
cd sagra-ordering-system

# Inizializza il progetto
npm init -y

# Installa le dipendenze
npm install react react-dom firebase lucide-react
npm install -D @vitejs/plugin-react vite eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh @types/react @types/react-dom
```

### 2. Setup Firebase

#### Crea il Progetto Firebase
1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca "Crea un progetto"
3. Nome progetto: `sagra-parrocchia-[nome-della-tua-parrocchia]`
4. Abilita Google Analytics (opzionale)

#### Configura i Servizi

**Firestore Database:**
1. Nel menu laterale: "Firestore Database"
2. Clicca "Crea database"
3. Modalità: "Test mode" (per iniziare)
4. Località: "eur3 (europe-west)" (consigliato per l'Italia)

**Realtime Database:**
1. Nel menu laterale: "Realtime Database"
2. Clicca "Crea database"
3. Località: "Europe-west1"
4. Modalità: "Test mode"

**Firebase Hosting:**
1. Nel menu laterale: "Hosting"
2. Clicca "Inizia"
3. Installa Firebase CLI globalmente: `npm install -g firebase-tools`

#### Configurazione Web App
1. Nelle impostazioni del progetto, sezione "Le tue app"
2. Clicca sull'icona web `</>`
3. Nome app: "Sagra Manager"
4. Abilita Firebase Hosting
5. Copia la configurazione Firebase

### 3. Configurazione Locale

#### File di Ambiente
Crea il file `.env` nella root del progetto:

```bash
# Sostituisci con i tuoi valori reali da Firebase
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=sagra-parrocchia.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sagra-parrocchia-123
VITE_FIREBASE_STORAGE_BUCKET=sagra-parrocchia-123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_DATABASE_URL=https://sagra-parrocchia-123-default-rtdb.europe-west1.firebasedatabase.app/
```

#### Inizializza Firebase nel progetto

```bash
# Login in Firebase CLI
firebase login

# Inizializza Firebase nel progetto
firebase init

# Seleziona:
# - Firestore
# - Realtime Database  
# - Hosting
# - Emulators (opzionale per sviluppo)

# Configura hosting:
# - Public directory: dist
# - SPA: Yes
# - GitHub integration: No
```

### 4. Sviluppo

```bash
# Avvia sviluppo locale
npm run dev

# Build di produzione
npm run build

# Anteprima build
npm run preview

# Deploy su Firebase
npm run firebase:deploy
```

## �️ Sistema di Stampa Avanzato

### Architettura del Sistema di Stampa

Il sistema di stampa è ora completamente modulare e separato in:

1. **Print Server Generico** (`print-server/`): Server Node.js standalone che gestisce solo la comunicazione con stampanti ESC/POS
2. **Receipt Generator** (`src/services/receiptGenerator.js`): Modulo React per generare comandi ESC/POS specifici per le ricevute
3. **Print Service** (`src/services/printService.js`): Servizio React per comunicare con il print server

### API Print Server

#### Endpoint Generici
- `POST /print` - Stampa comandi ESC/POS grezzi
- `POST /print-text` - Stampa testo semplice con opzioni
- `GET /ping` - Verifica connessione
- `GET /status` - Stato stampante
- `GET /config` - Configurazione server

#### Endpoint Compatibilità (deprecati)
- `POST /print-receipt` - Stampa ricevuta (usa internamente /print)

### Utilizzo nel Codice React

```javascript
import { getPrintService } from './services/printService';

// Stampa ricevuta ordine
const printService = getPrintService();
await printService.printOrderReceipt({
  customerNumber: '123',
  station: 'Stazione 1',
  items: [
    { name: 'Pizza', quantity: 2, price: 8.00 }
  ],
  total: 16.00
});

// Stampa testo semplice
await printService.printText('Test di stampa', {
  center: true,
  bold: true
});

// Stampa comandi ESC/POS grezzi
const commands = [0x1B, 0x40, ...]; // Comandi ESC/POS
await printService.printRawCommands(commands);
```

### Test di Stampa

L'app include un pannello di test completo accessibile dalla **Configurazione → Stampante**:

- Test connessione server
- Verifica stato stampante
- Test testo semplice
- Test ricevuta completa
- Test comandi ESC/POS grezzi

### Configurazione Stampante

1. **Installa il print server** su ogni PC cassa
2. **Configura la stampante** nel file `print-server/config.json`
3. **Avvia il server** con `npm start` o `./start.sh`
4. **Testa nell'app** usando i controlli nella sezione Configurazione

### Cross-Platform Support

Il print server supporta:
- **Windows**: Comando `copy` per stampanti USB/LPT
- **macOS**: Comando `lp` con CUPS
- **Linux**: Comando `lp` con CUPS

La configurazione viene automaticamente rilevata e adattata al sistema operativo.

## 🎪 Utilizzo del Sistema

### Cassa
- Seleziona stazione (1, 2 o 3)
- Aggiungi prodotti al carrello
- Stampa scontrino con numero cliente
- Il sistema aggiorna automaticamente le disponibilità

### Cucine
- Ogni linea vede solo i propri ordini
- Ordini in tempo reale dalla cassa
- Pulsante "Completato" per rimuovere ordini
- Visualizzazione numero cliente e stazione

### Configurazione
- Statistiche ordini in tempo reale
- Dashboard stato generale
- Sezione per future configurazioni avanzate

## 🔧 Configurazione Avanzata

### Menu Items (Firestore Collection: `menu`)

```javascript
{
  name: "Pasta al pomodoro",
  category: "Primi",
  categoryColor: "#FF6B6B", 
  preparationLine: "salato",
  price: 8.50,
  maxQuantity: 50,
  currentQuantity: 45,
  active: true,
  allergens: ["glutine"],
  description: "Pasta fresca con pomodoro e basilico"
}
```

### Preparation Lines (Firestore Collection: `lines`)

```javascript
{
  id: "salato",
  name: "Cucina Salato",
  color: "#FF6B6B",
  order: 1,
  active: true,
  printer: "thermal-printer-1"
}
```

### Orders (Real-time Database: `orders/`)

```javascript
{
  customerNumber: 123,
  station: 1,
  items: [
    {
      id: "item001",
      name: "Pasta al pomodoro", 
      quantity: 2,
      price: 8.50,
      preparationLine: "salato"
    }
  ],
  total: 17.00,
  status: "pending", // pending, completed
  createdAt: 1640995200000,
  updatedAt: 1640995200000
}
```

## 🖨️ Setup Stampanti Termiche

Il sistema supporta stampa tramite **Print Server USB standalone** per stampanti termiche come la Qian QOP-T80UL-RI-02.

### Architettura Produzione

```
Firebase Hosting ──► React App (Web)
                           │
                           │ HTTP Request  
                           ▼
PC Cassa Locale ──► Print Server ──USB──► Stampante Termica
```

### Setup Print Server

1. **Su ogni PC Cassa**, copia la cartella `print-server/` 
2. **Installa Node.js** se non presente
3. **Collega stampante USB** e verifica driver
4. **Avvia print server**:

```bash
cd print-server
npm install     # Solo la prima volta
npm start       # Avvia server su porta 3001
```

5. **Configura nell'app**: Vai in Configurazione → Stampante e verifica connessione

### Test Funzionamento

- **Health check**: http://localhost:3001/health
- **Test stampa**: http://localhost:3001/test  
- **Lista stampanti**: http://localhost:3001/printers

### Opzioni Alternative

#### Opzione 1: Print Server USB (Raccomandato)
- ✅ Stampa diretta su carta termica
- ✅ Qualità professionale
- ✅ Velocità di stampa
- ✅ Compatibile Qian QOP-T80UL-RI-02

#### Opzione 2: Browser Printing (Fallback)
- ⚠️ Qualità dipendente da stampante
- ⚠️ Richiede configurazione manuale
- ✅ Funziona senza print server

## 📊 Firebase Security Rules

### Firestore (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases


### Emulators config
Database Emulator, Hosting Emulator
i  Port for auth already configured: 9099
i  Port for firestore already configured: 8080
i  Port for database already configured: 9000
✔ Which port do you want to use for the hosting emulator? 5000
i  Emulator UI already enabled with port: 4000
✔ Would you like to download the emulators now? Yes