import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { firebaseService } from './services/firebaseService';
import { createPrintService, getPrintService } from './services/printService';
import { getFirestoreService } from './services/firestoreService';
import CassaView from './components/CassaView.jsx';
import KitchenView from './components/KitchenView';
import ConfigView from './components/ConfigView';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState('cassa');
  const [currentStation, setCurrentStation] = useState('cassa1');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerNumber, setCustomerNumber] = useState(1);
  
  // Stati Firestore per monitoraggio stampa
  const [allOrders, setAllOrders] = useState([]);
  const [printStations, setPrintStations] = useState([]);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    printed: 0,
    pending: 0,
    failed: 0
  });
  
  // Configurazione Print Server
  const [printServerConfig, setPrintServerConfig] = useState({
    host: 'localhost',
    port: '3001',
    enabled: true
  });

  // Inizializza Print Service
  useEffect(() => {
    const printConfig = {
      baseUrl: `http://${printServerConfig.host}:${printServerConfig.port}`,
      receiptConfig: {
        title: 'FESTA DELLA PARROCCHIA',
        footer: 'Ritira alle cucine indicate',
        width: 48,  // 80mm = ~48 caratteri
        currency: 'EUR'
      }
    };
    
    createPrintService(printConfig);
  }, [printServerConfig]);

  // Initialize Firebase data and subscriptions
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        
        // Initialize default data if needed
        await firebaseService.initializeDefaultData();
        
        // Subscribe to real-time updates
        const unsubscribeOrders = firebaseService.subscribeToOrders((ordersData) => {
          setOrders(ordersData);
          // Update customer number based on existing orders
          const maxNumber = ordersData.reduce((max, order) => 
            Math.max(max, order.customerNumber || 0), 0);
          setCustomerNumber(maxNumber + 1);
        });

        const unsubscribeMenu = firebaseService.subscribeToMenu((menuData) => {
          setMenu(menuData.map(item => ({
            ...item,
            available: item.currentQuantity || 0
          })));
        });

        const unsubscribeLines = firebaseService.subscribeToLines((linesData) => {
          setLines(linesData);
        });

        // Monitoraggio Firestore per stampa
        const firestoreService = getFirestoreService();
        
        // Monitora tutti gli ordini per statistiche
        const unsubscribeAllOrders = firestoreService.monitorOrders({}, (ordersData) => {
          // console.log('📊 Debug - Dati ordini ricevuti:', ordersData);
          // console.log('📊 Debug - Numero ordini:', ordersData.length);
          
          setAllOrders(ordersData);
          
          // Calcola statistiche
          const stats = ordersData.reduce((acc, order) => {
            // console.log('📊 Debug - Processando ordine:', {
            //   id: order.id,
            //   customerNumber: order.customerNumber,
            //   printStatus: order.printStatus
            // });
            
            acc.total++;
            if (order.printStatus?.printed) {
              acc.printed++;
            } else if (order.printStatus?.error) {
              acc.failed++;
            } else {
              acc.pending++;
            }
            return acc;
          }, { total: 0, printed: 0, pending: 0, failed: 0 });
          
          // console.log('📊 Debug - Statistiche calcolate:', stats);
          setOrderStats(stats);
        });
        
        // Monitora stazioni di stampa
        const unsubscribePrintStations = firestoreService.monitorPrintStations((stationsData) => {
          // console.log('🖨️ Debug - Stazioni di stampa ricevute:', stationsData);
          setPrintStations(stationsData);
        });

        // Cleanup subscriptions on unmount
        return () => {
          unsubscribeOrders();
          unsubscribeMenu();
          unsubscribeLines();
          unsubscribeAllOrders();
          unsubscribePrintStations();
          firestoreService.unsubscribeAll();
        };
        
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const addToCart = (item) => {
    if (item.available <= 0) return;
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(cartItem => 
        cartItem.id === itemId 
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.id !== itemId));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const processOrder = async () => {
    if (cart.length === 0) return;

    try {
      const orderData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          preparationLine: item.preparationLine
        })),
        total: parseFloat(getTotalPrice()),
        station: currentStation,
        customerNumber: customerNumber,
        status: 'pending'
      };

      // Create order in Firebase
      const orderId = await firebaseService.createOrder(orderData);
      
      if (orderId) {
        // Update menu item quantities
        for (const cartItem of cart) {
          const menuItem = menu.find(m => m.id === cartItem.id);
          if (menuItem) {
            const newQuantity = Math.max(0, menuItem.available - cartItem.quantity);
            await firebaseService.updateMenuItem(cartItem.id, {
              currentQuantity: newQuantity
            });
          }
        }

        // Clear cart and increment customer number
        setCart([]);
        setCustomerNumber(customerNumber + 1);
        
        /*****************************************
         * Warning! The receipt will be printed automatically via Firestore trigger! There is not a direct call!
         * *****************************************/
      }
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Errore nel processare l\'ordine. Riprova.');
    }
  };

  const completeOrder = async (orderId) => {
    try {
      await firebaseService.updateOrderStatus(orderId, 'completed');
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <RefreshCw className="loading-spinner" size={48} />
        <p>Caricamento sistema sagra...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="app-title">Sagra Manager</h1>
          <div className="nav-buttons">
            <button
              onClick={() => setCurrentView('cassa')}
              className={`nav-button ${currentView === 'cassa' ? 'active' : ''}`}
            >
              Cassa
            </button>
            {lines.map(line => (
              <button
                key={line.id}
                onClick={() => setCurrentView(line.id)}
                className={`nav-button ${currentView === line.id ? 'active' : ''}`}
                style={{
                  backgroundColor: currentView === line.id ? line.color : undefined,
                  color: currentView === line.id ? 'white' : undefined
                }}
              >
                {line.name}
              </button>
            ))}
            <button
              onClick={() => setCurrentView('config')}
              className={`nav-button ${currentView === 'config' ? 'active' : ''}`}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>
        {currentView === 'cassa' && (
          <CassaView 
            currentStation={currentStation}
            setCurrentStation={setCurrentStation}
            menu={menu}
            cart={cart}
            customerNumber={customerNumber}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            getTotalPrice={getTotalPrice}
            processOrder={processOrder}
          />
        )}
        
        {lines.find(l => l.id === currentView) && (
          <KitchenView 
            lineId={currentView}
            lines={lines}
            orders={orders}
            completeOrder={completeOrder}
          />
        )}
        
        {currentView === 'config' && (
          <ConfigView 
            menu={menu}
            lines={lines}
            orders={orders}
            allOrders={allOrders}
            printStations={printStations}
            orderStats={orderStats}
          />
        )}
      </main>
    </div>
  );
};

export default App;