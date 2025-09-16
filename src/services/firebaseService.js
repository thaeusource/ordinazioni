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
import { db } from '../firebase/config';

// Firestore Collections
const COLLECTIONS = {
  ORDERS: 'orders',
  MENU: 'menu',
  CONFIG: 'config',
  LINES: 'lines'
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

      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      // Update in Firestore only
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp()
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
      
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  subscribeToOrders(callback) {
    // Use Firestore real-time listener instead of Realtime Database
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      
      callback(orders);
    }, (error) => {
      console.error('Error in orders subscription:', error);
      callback([]);
    });

    return unsubscribe;
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
          name: 'Hot dog',
          category: 'Salato',
          categoryColor: '#FF6B6B',
          preparationLine: 'salato',
          price: 8.50,
          maxQuantity: 150,
          currentQuantity: 150,
          active: true,
          allergens: ['glutine'],
          description: 'Hot dog con wurstel, senape e crauti.'
        },
        {
          name: 'Panino con salamella',
          category: 'Salato',
          categoryColor: '#FF6B6B',
          preparationLine: 'salato',
          price: 9.00,
          maxQuantity: 500,
          currentQuantity: 500,
          active: true,
          allergens: ['glutine'],
          description: 'Panino con salamella alla griglia. Cipolla e salse a piacimento.'
        },
        {
          name: 'Couscous con verdure',
          category: 'Salato',
          categoryColor: '#FF6B6B',
          preparationLine: 'salato',
          price: 9.00,
          maxQuantity: 150,
          currentQuantity: 150,
          active: true,
          allergens: ['glutine'],
          description: 'Couscous con verdure.'
        },
        {
          name: 'Panino con tomino alla griglia',
          category: 'Salato',
          categoryColor: '#FF6B6B',
          preparationLine: 'salato',
          price: 9.00,
          maxQuantity: 70,
          currentQuantity: 70,
          active: true,
          allergens: ['glutine'],
          description: 'Panino con tomino alla griglia. Cipolla e salse a piacimento.'
        },
        {
          name: 'Waffle',
          category: 'Dolci',
          categoryColor: '#4ECDC4',
          preparationLine: 'dolce',
          price: 5.00,
          maxQuantity: 200,
          currentQuantity: 200,
          active: true,
          allergens: ['uova', 'lattosio'],
          description: 'Waffle caldo con Nutella e panna montata.'
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
          name: 'Acqua naturale 50cl',
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
          name: 'Acqua frizzante 50cl',
          category: 'Bevande',
          categoryColor: '#45B7D1',
          preparationLine: 'bevande',
          price: 1.50,
          maxQuantity: 100,
          currentQuantity: 100,
          active: true,
          allergens: [],
          description: 'Acqua frizzante 50cl'
        },
        {
          name: 'Birra in lattina 33cl',
          category: 'Bevande',
          categoryColor: '#45B7D1',
          preparationLine: 'bevande',
          price: 4.00,
          maxQuantity: 50,
          currentQuantity: 50,
          active: true,
          allergens: ['glutine'],
          description: 'Birra in lattina 33cl'
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
        },
        { 
          id: 'dolce', 
          name: 'Cucina Dolce', 
          color: '#4ECDC4',
          order: 2,
          active: true,
        },
        { 
          id: 'bevande', 
          name: 'Bar', 
          color: '#45B7D1',
          order: 3,
          active: true,
        }
      ];

      // Add lines
      for (const line of defaultLines) {
        await this.addLine(line);
      }

      // Default configuration
      const defaultConfig = {
        stations: [
          { id: 1, name: 'Cassa 1', active: true },
          { id: 2, name: 'Cassa 2', active: true },
          { id: 3, name: 'Cassa 3', active: true }
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