/**
 * Firebase Service per App React
 * Gestisce connessione Firestore e operazioni sui dati
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config.js';

class FirestoreService {
  constructor() {
    this.db = db;
    this.unsubscribeCallbacks = new Map();
  }

  /**
   * Aggiunge un nuovo ordine a Firestore
   */
  async addOrder(orderData) {
    try {
      // Prepara documento ordine per Firestore
      const firestoreOrder = {
        customerNumber: orderData.customerNumber,
        station: orderData.station,
        items: orderData.items.map(item => ({
          id: item.id || `item_${Date.now()}_${Math.random()}`,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total,
        timestamp: serverTimestamp(),
        
        // Stato stampa iniziale
        printStatus: {
          printed: false,
          printedAt: null,
          printedBy: null,
          attempts: 0,
          lastAttempt: null,
          error: null
        },
        
        // Metadati
        createdBy: 'web-app', // TODO: aggiungere auth utente se necessario
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, 'orders'), firestoreOrder);
      
      console.log('✅ Ordine aggiunto a Firestore:', docRef.id);
      return { success: true, orderId: docRef.id, order: firestoreOrder };
      
    } catch (error) {
      console.error('❌ Errore aggiunta ordine:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitora lo stato di stampa di un ordine specifico
   */
  monitorOrderPrintStatus(orderId, callback) {
    const unsubscribe = onSnapshot(
      doc(this.db, 'orders', orderId),
      (doc) => {
        if (doc.exists()) {
          const order = { id: doc.id, ...doc.data() };
          callback(order);
        }
      },
      (error) => {
        console.error('❌ Errore monitoraggio ordine:', error);
        callback(null, error);
      }
    );

    this.unsubscribeCallbacks.set(`order_${orderId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Monitora tutti gli ordini con filtri
   */
  monitorOrders(filters = {}, callback) {
    let q = collection(this.db, 'orders');
    
    // Applica filtri
    if (filters.station) {
      q = query(q, where('station', '==', filters.station));
    }
    
    if (filters.printed !== undefined) {
      q = query(q, where('printStatus.printed', '==', filters.printed));
    }
    
    // Ordinamento
    q = query(q, orderBy('timestamp', filters.orderDirection || 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(orders);
      },
      (error) => {
        console.error('❌ Errore monitoraggio ordini:', error);
        callback([], error);
      }
    );

    const callbackKey = `orders_${JSON.stringify(filters)}`;
    this.unsubscribeCallbacks.set(callbackKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Monitora le stazioni di stampa attive
   */
  monitorPrintStations(callback) {
    const q = query(
      collection(this.db, 'printStations'),
      orderBy('name', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const stations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(stations);
      },
      (error) => {
        console.error('❌ Errore monitoraggio stazioni:', error);
        callback([], error);
      }
    );

    this.unsubscribeCallbacks.set('printStations', unsubscribe);
    return unsubscribe;
  }

  /**
   * Ottiene statistiche ordini
   */
  async getOrderStats() {
    try {
      // TODO: Implementare aggregazioni o utilizzare Cloud Functions
      // Per ora restituiamo dati di esempio
      return {
        total: 0,
        printed: 0,
        pending: 0,
        failed: 0,
        byStation: {}
      };
    } catch (error) {
      console.error('❌ Errore statistiche:', error);
      return null;
    }
  }

  /**
   * Ferma tutti i listener attivi
   */
  unsubscribeAll() {
    this.unsubscribeCallbacks.forEach((unsubscribe, key) => {
      console.log(`🔌 Disconnettendo listener: ${key}`);
      unsubscribe();
    });
    this.unsubscribeCallbacks.clear();
  }

  /**
   * Ferma un listener specifico
   */
  unsubscribe(key) {
    const unsubscribe = this.unsubscribeCallbacks.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeCallbacks.delete(key);
    }
  }
}

// Istanza singleton
let firestoreServiceInstance = null;

export const getFirestoreService = () => {
  if (!firestoreServiceInstance) {
    firestoreServiceInstance = new FirestoreService();
  }
  return firestoreServiceInstance;
};

export default FirestoreService;