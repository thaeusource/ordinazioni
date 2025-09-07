# 🎪 Sagra Ordering System

Sistema completo per la gestione delle ordinazioni durante sagre e feste parrocchiali.

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

## 📱 Utilizzo dell'Applicazione

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

### Opzione 1: Stampanti USB
```javascript
// Integrazione con librerie ESC/POS
npm install escpos escpos-usb
```

### Opzione 2: Stampanti WiFi
```javascript
// API Star CloudPRNT o simili
const printReceipt = async (orderData) => {
  const response = await fetch('/api/print', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
};
```

### Opzione 3: Browser Printing
Il sistema include già la funzionalità di stampa browser per scontrini.

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