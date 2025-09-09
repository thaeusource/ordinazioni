import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { ref, push, onValue, update, off } from 'firebase/database';
import { db, rtdb } from '../firebase/config';

// Firestore Collections
const COLLECTIONS = {
  ORDERS: 'orders',
  MENU: 'menu',
  CONFIG: 'config',
  LINES: 'lines'
};

// Real-time Database paths
const RT_PATHS = {
  ORDERS: 'orders',
  ORDER_STATUS: 'orderStatus'
};

export class FirebaseService {
  
  // ============ MENU MANAGEMENT ============
  
  async getMenu() {
    try {
      const menuQuery = query(
        collection(db, COLLECTIONS.MENU),
        orderBy('category'),
        orderBy('name')
      );
      const snapshot = await getDocs(menuQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting menu:', error);
      return [];
    }
  }

  subscribeToMenu(callback) {
    const menuQuery = query(
      collection(db, COLLECTIONS.MENU),
      orderBy('category'),
      orderBy('name')
    );
    
    return onSnapshot(menuQuery, (snapshot) => {
      const menu = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      callback(menu);
    }, (error) => {
      console.error('Error in menu subscription:', error);
      callback([]);
    });
  }

  async updateMenuItem(itemId, updates) {
    try {
      const itemRef = doc(db, COLLECTIONS.MENU, itemId);
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating menu item:', error);
      return false;
    }
  }

  async addMenuItem(item) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.MENU), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding menu item:', error);
      return null;
    }
  }

    async deleteMenuItem(itemId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.MENU, itemId));
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }
  }

  // ============ ORDER MANAGEMENT ============
  
  async createOrder(orderData) {
    try {
      // Add to Firestore for persistence
      const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add to Real-time Database for instant updates
      const rtOrder = {
        ...orderData,
        id: docRef.id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const rtRef = ref(rtdb, `${RT_PATHS.ORDERS}/${docRef.id}`);
      await update(rtRef, rtOrder);

      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      // Update in Firestore
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp()
      });
      
      // Update in Real-time Database
      const rtRef = ref(rtdb, `${RT_PATHS.ORDERS}/${orderId}`);
      await update(rtRef, {
        status,
        updatedAt: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }
  
  async deleteOrder(orderId) {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, COLLECTIONS.ORDERS, orderId));
      
      // Delete from Real-time Database
      const rtRef = ref(rtdb, `${RT_PATHS.ORDERS}/${orderId}`);
      await update(rtRef, null);
      
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  subscribeToOrders(callback) {
    const ordersRef = ref(rtdb, RT_PATHS.ORDERS);
    
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      const orders = data ? Object.values(data) : [];
      
      // Sort by creation time
      orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      callback(orders);
    }, (error) => {
      console.error('Error in orders subscription:', error);
      callback([]);
    });

    return () => off(ordersRef, 'value', unsubscribe);
  }

  // ============ CONFIGURATION ============
  
  async getConfig() {
    try {
      const configQuery = query(collection(db, COLLECTIONS.CONFIG));
      const snapshot = await getDocs(configQuery);
      const config = {};
      
      snapshot.docs.forEach(doc => {
        config[doc.id] = doc.data();
      });
      
      return config;
    } catch (error) {
      console.error('Error getting config:', error);
      return {};
    }
  }

  subscribeToConfig(callback) {
    const configQuery = query(collection(db, COLLECTIONS.CONFIG));
    
    return onSnapshot(configQuery, (snapshot) => {
      const config = {};
      snapshot.docs.forEach(doc => {
        config[doc.id] = doc.data();
      });
      callback(config);
    }, (error) => {
      console.error('Error in config subscription:', error);
      callback({});
    });
  }

  async updateConfig(configKey, data) {
    try {
      const configRef = doc(db, COLLECTIONS.CONFIG, configKey);
      await updateDoc(configRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  }

  // ============ PREPARATION LINES ============
  
  async getLines() {
    try {
      const linesQuery = query(
        collection(db, COLLECTIONS.LINES),
        orderBy('order')
      );
      const snapshot = await getDocs(linesQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting lines:', error);
      return [];
    }
  }

  async addLine(line) {
    try {
      const lineRef = doc(db, COLLECTIONS.LINES, line.id);
      await setDoc(lineRef, {
        ...line,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return line.id;
    } catch (error) {
      console.error('Error adding line:', error);
      return null;
    }
  }

  async updateLine(lineId, updates) {
    try {
      const lineRef = doc(db, COLLECTIONS.LINES, lineId);
      await updateDoc(lineRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating line:', error);
      return false;
    }
  }

  async deleteLine(lineId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.LINES, lineId));
      return true;
    } catch (error) {
      console.error('Error deleting line:', error);
      return false;
    }
  }

  subscribeToLines(callback) {
    const linesQuery = query(
      collection(db, COLLECTIONS.LINES),
      orderBy('order')
    );
    
    return onSnapshot(linesQuery, (snapshot) => {
      const lines = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      callback(lines);
    }, (error) => {
      console.error('Error in lines subscription:', error);
      callback([]);
    });
  }

  // ============ UTILITY FUNCTIONS ============
  
  async initializeDefaultData() {
    try {
      // Check if data already exists
      const menuSnapshot = await getDocs(collection(db, COLLECTIONS.MENU));
      if (!menuSnapshot.empty) {
        console.log('Data already exists, skipping initialization');
        return true;
      }

      console.log('Initializing default data...');

      // Default menu items
      const defaultMenu = [
        {
          name: 'Pasta al pomodoro',
          category: 'Primi',
          categoryColor: '#FF6B6B',
          preparationLine: 'salato',
          price: 8.50,
          maxQuantity: 50,
          currentQuantity: 50,
          active: true,
          allergens: ['glutine'],
          description: 'Pasta fresca con pomodoro e basilico'
        },
        {
          name: 'Risotto ai funghi',
          category: 'Primi',
          categoryColor: '#FF6B6B',
          preparationLine: 'salato',
          price: 9.00,
          maxQuantity: 30,
          currentQuantity: 30,
          active: true,
          allergens: ['glutine'],
          description: 'Risotto cremoso con funghi porcini'
        },
        {
          name: 'Tiramisù',
          category: 'Dolci',
          categoryColor: '#4ECDC4',
          preparationLine: 'dolce',
          price: 5.00,
          maxQuantity: 25,
          currentQuantity: 25,
          active: true,
          allergens: ['uova', 'lattosio'],
          description: 'Tiramisù fatto in casa'
        },
        {
          name: 'Panna cotta',
          category: 'Dolci',
          categoryColor: '#4ECDC4',
          preparationLine: 'dolce',
          price: 4.50,
          maxQuantity: 20,
          currentQuantity: 20,
          active: true,
          allergens: ['lattosio'],
          description: 'Panna cotta ai frutti di bosco'
        },
        {
          name: 'Acqua',
          category: 'Bevande',
          categoryColor: '#45B7D1',
          preparationLine: 'bevande',
          price: 1.50,
          maxQuantity: 100,
          currentQuantity: 100,
          active: true,
          allergens: [],
          description: 'Acqua naturale 50cl'
        },
        {
          name: 'Vino rosso',
          category: 'Bevande',
          categoryColor: '#45B7D1',
          preparationLine: 'bevande',
          price: 4.00,
          maxQuantity: 50,
          currentQuantity: 50,
          active: true,
          allergens: ['solfiti'],
          description: 'Vino rosso locale'
        }
      ];

      // Add menu items
      for (const item of defaultMenu) {
        await this.addMenuItem(item);
      }

      // Default preparation lines
      const defaultLines = [
        { 
          id: 'salato', 
          name: 'Cucina Salato', 
          color: '#FF6B6B',
          order: 1,
          active: true,
          printer: 'thermal-printer-1'
        },
        { 
          id: 'dolce', 
          name: 'Cucina Dolce', 
          color: '#4ECDC4',
          order: 2,
          active: true,
          printer: 'thermal-printer-2'
        },
        { 
          id: 'bevande', 
          name: 'Bar', 
          color: '#45B7D1',
          order: 3,
          active: true,
          printer: 'thermal-printer-3'
        }
      ];

      // Add lines
      for (const line of defaultLines) {
        await addDoc(collection(db, COLLECTIONS.LINES), line);
      }

      // Default configuration
      const defaultConfig = {
        stations: [
          { id: 1, name: 'Cassa 1', active: true },
          { id: 2, name: 'Cassa 2', active: true },
          { id: 3, name: 'Cassa 3', active: false }
        ]
      };

      await addDoc(collection(db, COLLECTIONS.CONFIG), defaultConfig);

      console.log('Default data initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing default data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();