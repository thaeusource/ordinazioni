# 🚀 ISTRUZIONI RAPIDE - Sagra Print Server

## ⚡ AVVIO VELOCE

### Windows
```
1. Doppio click su: run.bat
2. Segui le istruzioni a schermo
3. Il server partirà automaticamente
```

### macOS/Linux
```
1. Apri terminale in questa cartella
2. Esegui: chmod +x run.sh && ./run.sh
3. Segui le istruzioni a schermo
```

## 🔧 CONFIGURAZIONE STAMPANTE

1. **Prima di tutto**: Collega la stampante USB e accendila
2. **Windows**: Vai in Pannello di Controllo > Stampanti, annota il nome
3. **macOS/Linux**: Apri terminale e scrivi: `lpstat -p`
4. **Modifica**: Apri `config/config.json` e sostituisci `YOUR_PRINTER_NAME_HERE` con il nome della tua stampante

## 🧪 TEST

- Browser: http://localhost:3001/health (verifica server)
- Test stampa: http://localhost:3001/test (stampa ricevuta di prova)

## ❓ PROBLEMI COMUNI

**Server non parte**
- Controlla che Node.js sia installato: `node --version`
- Esegui manualmente: `npm install` poi `npm start`

**Stampante non stampa**
- Verifica che sia accesa e collegata USB
- Controlla il nome in `config/config.json`
- Prova il test: http://localhost:3001/test

**Errore porta 3001**
- Cambia porta in `config/config.json` (es. 3002)
- Riavvia il server

## 📞 SUPPORTO

Per problemi tecnici consulta il file README.md completo.

**Versione:** 1.0  
**Testato con:** Qian QOP-T80UL-RI-02