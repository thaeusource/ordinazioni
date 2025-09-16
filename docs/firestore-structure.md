# Struttura Dati Firestore per Sistema Ordini + Stampa

## Collections

### `orders` - Ordini principali
```javascript
orders/{orderId} = {
  // Dati ordine base
  customerNumber: 123,
  station: "cucina1", // o "cucina2", "bar", etc.
  items: [
    {
      id: "item1",
      name: "Pizza Margherita",
      quantity: 2,
      price: 8.00
    }
  ],
  total: 18.50,
  timestamp: "2025-09-14T14:30:00.000Z",
  
  // Stato stampa
  printStatus: {
    printed: false,
    printedAt: null,
    printedBy: null, // ID postazione che ha stampato
    attempts: 0,
    lastAttempt: null,
    error: null
  },
  
  // Metadati
  createdBy: "user123",
  createdAt: "2025-09-14T14:30:00.000Z",
  updatedAt: "2025-09-14T14:30:00.000Z"
}
```

### `printStations` - Configurazione postazioni
```javascript
printStations/{stationId} = {
  id: "cucina1",
  name: "Cucina Principale",
  printerName: "POS80_Series_POS80_Printer_USB",
  isActive: true,
  lastHeartbeat: "2025-09-14T14:35:00.000Z",
  printServerConfig: {
    port: 3001,
    tempDir: "/tmp/print"
  },
  
  // Statistiche
  stats: {
    totalPrinted: 45,
    todayPrinted: 12,
    lastPrintedAt: "2025-09-14T14:32:00.000Z"
  }
}
```

### `printJobs` - Job di stampa (opzionale per debugging)
```javascript
printJobs/{jobId} = {
  orderId: "order123",
  stationId: "cucina1",
  status: "completed", // pending, processing, completed, failed
  createdAt: "2025-09-14T14:30:00.000Z",
  completedAt: "2025-09-14T14:30:15.000Z",
  error: null,
  printJobId: "JOB-1757860494564" // dal print server
}
```

## Query Patterns

### Per l'App Web (Firebase Hosting):
```javascript
// Tutti gli ordini
orders.orderBy('timestamp', 'desc')

// Ordini non stampati
orders.where('printStatus.printed', '==', false)
  .orderBy('timestamp', 'asc')

// Ordini per stazione
orders.where('station', '==', 'cucina1')
  .orderBy('timestamp', 'desc')
```

### Per l'App di Stampa Locale:
```javascript
// Ascolta nuovi ordini da stampare per questa stazione
orders.where('station', '==', 'cucina1')
  .where('printStatus.printed', '==', false)
  .onSnapshot(callback)

// Aggiorna heartbeat della stazione
printStations.doc('cucina1').update({
  lastHeartbeat: new Date(),
  isActive: true
})
```

## Regole di Sicurezza Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders - leggibili e scrivibili da tutti gli utenti autenticati
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }
    
    // Print stations - leggibili da tutti, aggiornabili solo dalla stazione
    match /printStations/{stationId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null 
        && resource.data.id == stationId;
    }
    
    // Print jobs - solo per debugging, accesso limitato
    match /printJobs/{jobId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Flusso di Lavoro

1. **Nuovo Ordine** (Web App):
   - Crea documento in `orders` con `printStatus.printed = false`
   - Firestore notifica in real-time all'app di stampa

2. **Stampa** (App Locale):
   - Riceve notifica del nuovo ordine
   - Genera e invia comandi ESC/POS alla stampante
   - Aggiorna `printStatus.printed = true` + timestamp

3. **Monitoraggio** (Web App):
   - Mostra stato stampa in tempo reale
   - Lista ordini stampati/non stampati
   - Statistiche per stazione