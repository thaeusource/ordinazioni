import React, { useState, useEffect } from 'react';
import { Plus, Minus, Printer, Check, Settings, RefreshCw } from 'lucide-react';
import { firebaseService } from './services/firebaseService';
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

  const printReceipt = (order) => {
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

    console.log('STAMPA SCONTRINO:', receiptContent);
    
    // Try to use browser print API
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
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
    `);
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

  const CassaView = () => (
    <div className="main-content">
      <div className="section-header">
        <h2>Cassa - Stazione {currentStation}</h2>
        <select 
          value={currentStation} 
          onChange={(e) => setCurrentStation(parseInt(e.target.value))}
          className="station-select"
        >
          <option value={1}>Stazione 1</option>
          <option value={2}>Stazione 2</option>
          <option value={3}>Stazione 3</option>
        </select>
      </div>

      <div className="cassa-grid">
        {/* Menu */}
        <div className="menu-section">
          <h3>Menu</h3>
          <div className="menu-list">
            {menu.map(item => (
              <div key={item.id} className={`menu-item ${item.available <= 0 ? 'disabled' : ''}`}>
                <div className="menu-item-content">
                  <div className="menu-item-info">
                    <div className="category-indicator">
                      <div 
                        className="category-dot"
                        style={{ backgroundColor: item.categoryColor }}
                      ></div>
                      <span className="item-name">{item.name}</span>
                    </div>
                    <div className="item-details">
                      {item.category} - Linea: {item.preparationLine}
                    </div>
                    <div className="item-price">
                      €{item.price.toFixed(2)} - Disponibili: {item.available}
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.available <= 0}
                    className={`add-button ${item.available <= 0 ? 'disabled' : ''}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="cart-section">
          <h3>Carrello - Cliente #{customerNumber}</h3>
          <div className="cart-content">
            {cart.length === 0 ? (
              <p className="empty-cart">Carrello vuoto</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.name}</span>
                        <div className="cart-item-price">
                          €{item.price.toFixed(2)} x {item.quantity}
                        </div>
                      </div>
                      <div className="cart-controls">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="cart-button remove"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="cart-button add"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <div className="total-price">
                    <span>Totale:</span>
                    <span>€{getTotalPrice()}</span>
                  </div>
                  <button
                    onClick={processOrder}
                    className="checkout-button"
                  >
                    <Printer size={20} />
                    Stampa Scontrino
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const KitchenView = (lineId) => {
    const line = lines.find(l => l.id === lineId);
    if (!line) return <div>Linea non trovata</div>;

    const lineOrders = orders.filter(order => 
      order.status === 'pending' && 
      order.items && 
      order.items.some(item => item.preparationLine === lineId)
    );

    return (
      <div className="main-content">
        <div className="kitchen-header">
          <h2 style={{ color: line.color }}>
            {line.name}
          </h2>
          <div className="orders-count">
            Ordini in coda: {lineOrders.length}
          </div>
        </div>

        <div className="orders-grid">
          {lineOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-number">#{order.customerNumber}</span>
                <span className="order-station">
                  Stazione {order.station}
                </span>
              </div>
              <div className="order-time">
                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('it-IT') : 'N/A'}
              </div>
              <div className="order-items">
                {order.items
                  .filter(item => item.preparationLine === lineId)
                  .map((item, index) => (
                    <div key={index} className="order-item">
                      <span>{item.name}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => completeOrder(order.id)}
                className="complete-button"
              >
                <Check size={16} />
                Completato
              </button>
            </div>
          ))}
        </div>

        {lineOrders.length === 0 && (
          <div className="empty-orders">
            <p>Nessun ordine in coda</p>
          </div>
        )}
      </div>
    );
  };

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
        {currentView === 'cassa' && <CassaView />}
        {lines.find(l => l.id === currentView) && KitchenView(currentView)}
        {currentView === 'config' && (
          <div className="main-content">
            <h2>Configurazione</h2>
            <div className="config-content">
              <p>
                Sezione di configurazione per menu, linee di produzione e impostazioni.
                Da implementare con interfaccia per modificare menu, prezzi, disponibilità, ecc.
              </p>
              <div className="config-stats">
                <div className="stat-card">
                  <h4>Menu Items</h4>
                  <p>{menu.length} piatti configurati</p>
                </div>
                <div className="stat-card">
                  <h4>Linee Produzione</h4>
                  <p>{lines.length} linee attive</p>
                </div>
                <div className="stat-card">
                  <h4>Ordini Oggi</h4>
                  <p>{orders.length} ordini totali</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;