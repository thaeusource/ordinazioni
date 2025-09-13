import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { firebaseService } from './services/firebaseService';
import { createPrintService, getPrintService } from './services/printService';
import CassaView from './components/CassaView.jsx';
import KitchenView from './components/KitchenView';
import ConfigView from './components/ConfigView';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState('cassa');
  const [currentStation, setCurrentStation] = useState(1);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerNumber, setCustomerNumber] = useState(1);
  
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
        width: 32,
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

        // Cleanup subscriptions on unmount
        return () => {
          unsubscribeOrders();
          unsubscribeMenu();
          unsubscribeLines();
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
        
        // Print receipt
        printReceipt({ ...orderData, id: orderId });
      }
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Errore nel processare l\'ordine. Riprova.');
    }
  };

  const printReceipt = async (order) => {
    console.log('STAMPA SCONTRINO - Cliente #' + order.customerNumber);
    
    // Se print server è abilitato, prova a usare il nuovo servizio
    if (printServerConfig.enabled) {
      try {
        const printService = getPrintService();
        
        // Prepara dati ordine per il nuovo formato
        const orderData = {
          customerNumber: order.customerNumber.toString(),
          station: `Stazione ${order.station}`,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price // Mantieni formato euro (non centesimi)
          })),
          total: order.total
        };
        
        // Usa il nuovo metodo del servizio di stampa
        await printService.printOrderReceipt(orderData);
        console.log('✅ Scontrino stampato tramite nuovo print service');
        return; // Stampa riuscita, esci
        
      } catch (error) {
        console.warn('⚠️ Errore print service:', error.message, '- uso browser print');
      }
    }
    
    // Fallback: browser print (invariato)
    const receiptContent = `
=== SAGRA PARROCCHIA ===
Numero: ${order.customerNumber}
Stazione: ${order.station}
Ora: ${new Date().toLocaleTimeString('it-IT')}
${'='.repeat(25)}
${order.items.map(item => 
  `${item.name}\n${item.quantity}x €${item.price.toFixed(2)} = €${(item.quantity * item.price).toFixed(2)}`
).join('\n')}
${'='.repeat(25)}
TOTALE: €${order.total.toFixed(2)}
${'='.repeat(25)}
Ritira alle cucine indicate
    `.trim();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.body.innerHTML = `
      <html>
        <head>
          <title>Scontrino #${order.customerNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 58mm; margin: 0; }
            .center { text-align: center; }
            .line { border-top: 1px solid #000; margin: 5px 0; }
          </style>
        </head>
        <body>
          <pre>${receiptContent}</pre>
        </body>
      </html>
    `;
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
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
            printServerConfig={printServerConfig}
            setPrintServerConfig={setPrintServerConfig}
          />
        )}
      </main>
    </div>
  );
};

export default App;