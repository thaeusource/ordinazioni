# Print Station

App locale che monitora Firestore per nuovi ordini e li stampa automaticamente.

## Setup

1. **Installa dipendenze:**
   ```bash
   npm install
   ```

2. **Configura Firebase:**
   - Vai alla [Firebase Console](https://console.firebase.google.com)
   - Seleziona il tuo progetto
   - Vai a **Project Settings** → **Service accounts**
   - Clicca **"Generate new private key"**
   - Scarica il file JSON e rinominalo `firebase-service-account.json`
   - Posizionalo in `config/firebase-service-account.json`
   
   ⚠️ **IMPORTANTE**: Non committare mai questo file! È già escluso nel .gitignore

3. **Configura variabili d'ambiente:**
   ```bash
   cp .env.example .env
   # Modifica .env con i tuoi valori
   ```

4. **Configura stampante:**
   - Copia `config.json` dal print-server o creane uno nuovo
   - Imposta il nome corretto della stampante

## Utilizzo

### Avvio normale:
```bash
npm start
```

### Avvio in modalità sviluppo (auto-restart):
```bash
npm run dev
```

## Configurazione Stazioni

Ogni postazione deve avere un ID univoco:

- **cucina1** - Cucina principale
- **cucina2** - Cucina secondaria  
- **bar** - Banco bar
- **dolci** - Postazione dolci

Modifica il file `.env`:
```
STATION_ID=cucina1
STATION_NAME=Cucina Principale
```

## Come funziona

1. 📡 Si connette a Firebase Firestore
2. 👀 Monitora nuovi ordini per la sua stazione
3. 🖨️ Stampa automaticamente quando arriva un ordine
4. ✅ Marca l'ordine come stampato
5. 💓 Invia heartbeat ogni 30 secondi

## Struttura Files

```
print-station/
├── src/
│   ├── print-station.js      # App principale
│   ├── config-manager.js     # Gestione configurazione
│   ├── print-manager.js      # Gestione stampa
│   ├── receiptGenerator.js   # Generazione scontrini
│   └── escpos-commands.js    # Comandi ESC/POS
├── config/
│   ├── config.json           # Configurazione stampante
│   └── firebase-service-account.json  # Credenziali Firebase
├── .env                      # Variabili d'ambiente
└── package.json
```

## Troubleshooting

### Errore connessione Firebase
- Verifica che `firebase-service-account.json` sia presente
- Controlla le permissions del service account

### Stampante non funziona  
- Verifica che il nome stampante in `config.json` sia corretto
- Testa con il print-server standalone

### Ordini non arrivano
- Controlla che `STATION_ID` corrisponda al campo `station` degli ordini
- Verifica connessione internet