/**
 * Print Station - App locale che monitora Firestore per nuovi ordini
 * Integrazione Firestore + Print Server locale (Client SDK)
 */

import 'dotenv/config';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  setDoc,
  doc,
  addDoc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase/config.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ConfigManager from './config-manager.js';
import PrintManager from './print-manager.js';
import ReceiptGenerator from './receiptGenerator.js';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PrintStation {
    constructor() {
        console.log('🖨️  Inizializzazione Print Station...');
        
        // Configurazione locale (print server)
        this.configManager = new ConfigManager();
        this.config = this.configManager.loadConfig();
        this.printManager = new PrintManager(this.configManager);
        this.receiptGenerator = new ReceiptGenerator();
        
        // Configurazione station
        this.stationId = process.env.STATION_ID || 'cassa1';
        this.stationName = process.env.STATION_NAME || 'Cassa 1';

        // Stato
        this.isActive = false;
        this.unsubscribe = null;
        this.heartbeatInterval = null;
        
        console.log(`📍 Stazione: ${this.stationId} (${this.stationName})`);
        console.log(`🖨️  Stampante: ${this.config.printer.name}`);
    }

    /**
     * Inizializza Firebase Client SDK
     */
    async initializeFirebase() {
        try {
            // Usa direttamente Firestore senza autenticazione
            // Le regole Firestore permettono accesso (allow read, write: if true)
            this.db = db;
            console.log('✅ Firebase Client SDK inizializzato (senza auth)');
            return true;
            
        } catch (error) {
            console.error('❌ Errore inizializzazione Firebase:', error.message);
            return false;
        }
    }

    /**
     * Avvia il monitoraggio degli ordini
     */
    async start() {
        console.log('🚀 Avvio Print Station...');
        
        // Inizializza Firebase
        if (!await this.initializeFirebase()) {
            console.error('❌ Impossibile avviare senza Firebase');
            process.exit(1);
        }
        
        // Registra la stazione
        await this.registerStation();
        
        // Avvia monitoraggio ordini
        this.startOrderMonitoring();
        
        // Avvia heartbeat
        this.startHeartbeat();
        
        this.isActive = true;
        console.log('✅ Print Station attiva e in ascolto...');
        
        // Gestione graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    /**
     * Registra la stazione su Firestore
     */
    async registerStation() {
        try {
            const stationData = {
                id: this.stationId,
                name: this.stationName,
                printerName: this.config.printer.name,
                online: true,
                lastPing: serverTimestamp(),
                printServerConfig: {
                    tempDir: this.config?.system?.tempDir || './temp'
                },
                stats: {
                    totalPrinted: 0,
                    todayPrinted: 0,
                    lastPrintedAt: null
                }
            };
            
            // Crea/aggiorna documento stazione
            const stationRef = doc(this.db, 'printStations', this.stationId);
            await setDoc(stationRef, stationData, { merge: true });
            
            console.log(`✅ Stazione ${this.stationId} registrata su Firestore`);
            
        } catch (error) {
            console.error('❌ Errore registrazione stazione:', error);
        }
    }

    /**
     * Avvia il monitoraggio degli ordini in tempo reale
     */
    startOrderMonitoring() {
        // Query più semplice - solo per stazione, filtreremo dopo
        const ordersQuery = query(
            collection(this.db, 'orders'),
            where('station', '==', this.stationId)
        );

        this.unsubscribe = onSnapshot(
            ordersQuery,
            (snapshot) => this.handleOrdersSnapshot(snapshot),
            (error) => {
                console.error('❌ Errore monitoraggio ordini:', error);
                // Riprova dopo 5 secondi
                setTimeout(() => this.startOrderMonitoring(), 5000);
            }
        );
        
        console.log(`👀 Monitoraggio ordini per stazione "${this.stationId}" avviato`);
    }

    /**
     * Gestisce gli snapshot degli ordini da Firestore
     */
    async handleOrdersSnapshot(snapshot) {
        for (const change of snapshot.docChanges()) {
            if (change.type === 'added') {
                const order = { id: change.doc.id, ...change.doc.data() };
                
                // Filtra lato client solo ordini non stampati
                if (order.printStatus?.printed !== true) {
                    console.log(`🆕 Nuovo ordine ricevuto: ${order.customerNumber}`);
                    await this.processOrder(order);
                }
            }
        }
    }

    /**
     * Processa un singolo ordine (stampa)
     */
    async processOrder(order) {
        const startTime = Date.now();
        let success = false;
        let error = null;
        
        try {
            console.log(`🖨️  Stampando ordine ${order.customerNumber}...`);
            
            // Prepara dati per receiptGenerator
            const orderData = {
                customerNumber: order.customerNumber.toString(),
                station: `Stazione ${order.station}`,
                items: order.items,
                total: order.total
            };
            
            // Genera comandi ESC/POS
            const printCommands = this.receiptGenerator.generateOrderReceipt(orderData);
            
            // Stampa tramite print manager
            const result = await this.printManager.printRawContent(printCommands);
            
            if (result.success) {
                console.log(`✅ Ordine ${order.customerNumber} stampato con successo`);
                success = true;
                
                // Aggiorna statistiche
                await this.updatePrintStats();
                
            } else {
                throw new Error(result.error || 'Stampa fallita');
            }
            
        } catch (err) {
            error = err.message;
            console.error(`❌ Errore stampa ordine ${order.customerNumber}:`, error);
        }
        
        // Aggiorna stato ordine su Firestore
        await this.updateOrderPrintStatus(order.id, success, error, Date.now() - startTime);
    }

    /**
     * Aggiorna lo stato di stampa dell'ordine su Firestore
     */
    async updateOrderPrintStatus(orderId, success, error = null, duration = 0) {
        try {
            const updateData = {
                'printStatus.printed': success,
                'printStatus.printedAt': success ? serverTimestamp() : null,
                'printStatus.printedBy': success ? this.stationId : null,
                'printStatus.attempts': (await this.getOrderAttempts(orderId)) + 1,
                'printStatus.lastAttempt': serverTimestamp(),
                'printStatus.error': error,
                updatedAt: serverTimestamp()
            };
            
            const orderRef = doc(this.db, 'orders', orderId);
            await updateDoc(orderRef, updateData);
            
            if (success) {
                console.log(`📝 Ordine ${orderId} marcato come stampato (${duration}ms)`);
            } else {
                console.log(`📝 Ordine ${orderId} marcato come fallito: ${error}`);
            }
            
        } catch (err) {
            console.error('❌ Errore aggiornamento stato ordine:', err);
        }
    }

    /**
     * Ottiene il numero di tentativi di stampa per un ordine
     */
    async getOrderAttempts(orderId) {
        try {
            const orderRef = doc(this.db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                return orderSnap.data().printStatus?.attempts || 0;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Aggiorna le statistiche di stampa
     */
    async updatePrintStats() {
        try {
            const stationRef = doc(this.db, 'printStations', this.stationId);
            
            // Ottieni le statistiche attuali e incrementa
            const stationSnap = await getDoc(stationRef);
            if (stationSnap.exists()) {
                const currentStats = stationSnap.data().stats || {};
                await setDoc(stationRef, {
                    stats: {
                        totalPrinted: (currentStats.totalPrinted || 0) + 1,
                        todayPrinted: (currentStats.todayPrinted || 0) + 1,
                        lastPrintedAt: serverTimestamp()
                    }
                }, { merge: true });
            }
            
        } catch (error) {
            console.error('❌ Errore aggiornamento statistiche:', error);
        }
    }

    /**
     * Avvia l'heartbeat periodico
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            try {
                const stationRef = doc(this.db, 'printStations', this.stationId);
                await setDoc(stationRef, {
                    lastPing: serverTimestamp(),
                    online: true
                }, { merge: true });
                
            } catch (error) {
                console.error('❌ Errore heartbeat:', error);
            }
        }, 30000); // Ogni 30 secondi
        
        console.log('💓 Heartbeat avviato (ogni 30s)');
    }

    /**
     * Ferma la print station
     */
    async stop() {
        console.log('🛑 Arresto Print Station...');
        
        this.isActive = false;
        
        // Ferma monitoraggio ordini
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        // Ferma heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        // Marca stazione come offline
        try {
            const stationRef = doc(this.db, 'printStations', this.stationId);
            await setDoc(stationRef, {
                online: false,
                lastPing: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('❌ Errore aggiornamento stato stazione:', error);
        }
        
        console.log('✅ Print Station arrestata');
        process.exit(0);
    }
}

// Avvia la print station
const printStation = new PrintStation();
printStation.start().catch(error => {
    console.error('❌ Errore fatale:', error);
    process.exit(1);
});

export default PrintStation;