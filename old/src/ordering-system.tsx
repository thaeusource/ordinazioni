import React, { useState, useEffect } from 'react';
import { Plus, Minus, Printer, Check, Settings, Eye, EyeOff } from 'lucide-react';

// Mock Firebase functions (sostituire con vero Firebase)
const mockFirebase = {
  orders: [],
  menu: [
    { id: 1, name: 'Pasta al pomodoro', category: 'Primi', color: '#FF6B6B', line: 'salato', price: 8.50, maxQty: 50, available: 50 },
    { id: 2, name: 'Risotto ai funghi', category: 'Primi', color: '#FF6B6B', line: 'salato', price: 9.00, maxQty: 30, available: 30 },
    { id: 3, name: 'Tiramisù', category: 'Dolci', color: '#4ECDC4', line: 'dolce', price: 5.00, maxQty: 25, available: 25 },
    { id: 4, name: 'Panna cotta', category: 'Dolci', color: '#4ECDC4', line: 'dolce', price: 4.50, maxQty: 20, available: 20 },
    { id: 5, name: 'Acqua', category: 'Bevande', color: '#45B7D1', line: 'bevande', price: 1.50, maxQty: 100, available: 100 },
    { id: 6, name: 'Vino rosso', category: 'Bevande', color: '#45B7D1', line: 'bevande', price: 4.00, maxQty: 50, available: 50 }
  ],
  lines: [
    { id: 'salato', name: 'Salato', color: '#FF6B6B' },
    { id: 'dolce', name: 'Dolce', color: '#4ECDC4' },
    { id: 'bevande', name: 'Bar', color: '#45B7D1' }
  ],
  addOrder: function(order) {
    const newOrder = { ...order, id: Date.now(), timestamp: new Date(), status: 'pending' };
    this.orders.push(newOrder);
    return newOrder;
  },
  updateOrderStatus: function(orderId, status) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) order.status = status;
  },
  updateItemAvailability: function(itemId, newQty) {
    const item = this.menu.find(i => i.id === itemId);
    if (item) item.available = newQty;
  }
};

const App = () => {
  const [currentView, setCurrentView] = useState('cassa');
  const [currentStation, setCurrentStation] = useState(1);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState(mockFirebase.menu);
  const [lines] = useState(mockFirebase.lines);

  // Simula aggiornamenti real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders([...mockFirebase.orders]);
    }, 1000);
    return () => clearInterval(interval);
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

  const processOrder = () => {
    if (cart.length === 0) return;

    const order = {
      items: cart,
      total: getTotalPrice(),
      station: currentStation,
      customerNumber: mockFirebase.orders.length + 1
    };

    // Aggiorna disponibilità
    cart.forEach(cartItem => {
      const menuItem = menu.find(m => m.id === cartItem.id);
      if (menuItem) {
        menuItem.available -= cartItem.quantity;
        mockFirebase.updateItemAvailability(cartItem.id, menuItem.available);
      }
    });

    const newOrder = mockFirebase.addOrder(order);
    setMenu([...menu]);
    setCart([]);
    
    // Simula stampa scontrino
    printReceipt(newOrder);
  };

  const printReceipt = (order) => {
    const receiptContent = `
=== SAGRA PARROCCHIA ===
Numero: ${order.customerNumber}
Stazione: ${order.station}
Ora: ${order.timestamp.toLocaleTimeString()}
${'='.repeat(25)}
${order.items.map(item => 
  `${item.name}\n${item.quantity}x €${item.price.toFixed(2)} = €${(item.quantity * item.price).toFixed(2)}`
).join('\n')}
${'='.repeat(25)}
TOTALE: €${order.total}
${'='.repeat(25)}
Ritira alle cucine indicate
    `.trim();

    console.log('STAMPA SCONTRINO:', receiptContent);
    alert('Scontrino stampato!\n\n' + receiptContent);
  };

  const completeOrder = (orderId) => {
    mockFirebase.updateOrderStatus(orderId, 'completed');
    setOrders([...mockFirebase.orders]);
  };

  const CassaView = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Cassa - Stazione {currentStation}</h2>
        <select 
          value={currentStation} 
          onChange={(e) => setCurrentStation(parseInt(e.target.value))}
          className="p-2 border rounded"
        >
          <option value={1}>Stazione 1</option>
          <option value={2}>Stazione 2</option>
          <option value={3}>Stazione 3</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Menu</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {menu.map(item => (
              <div key={item.id} className={`p-3 border rounded-lg ${item.available <= 0 ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.category} - Linea: {item.line}
                    </div>
                    <div className="text-sm">
                      €{item.price.toFixed(2)} - Disponibili: {item.available}
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.available <= 0}
                    className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrello */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Carrello</h3>
          <div className="border rounded-lg p-4">
            {cart.length === 0 ? (
              <p className="text-gray-500">Carrello vuoto</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <div className="text-sm text-gray-600">
                          €{item.price.toFixed(2)} x {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="bg-red-500 text-white p-1 rounded"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-green-500 text-white p-1 rounded"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Totale:</span>
                    <span>€{getTotalPrice()}</span>
                  </div>
                  <button
                    onClick={processOrder}
                    className="w-full mt-4 bg-green-600 text-white p-3 rounded-lg flex items-center justify-center gap-2"
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
    const lineOrders = orders.filter(order => 
      order.status === 'pending' && 
      order.items.some(item => item.line === lineId)
    );

    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold" style={{ color: line.color }}>
            {line.name}
          </h2>
          <div className="text-lg font-semibold">
            Ordini in coda: {lineOrders.length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lineOrders.map(order => (
            <div key={order.id} className="border rounded-lg p-4 bg-yellow-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold">#{order.customerNumber}</span>
                <span className="text-sm text-gray-600">
                  Stazione {order.station}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {order.timestamp.toLocaleTimeString()}
              </div>
              <div className="space-y-1 mb-4">
                {order.items
                  .filter(item => item.line === lineId)
                  .map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-semibold">x{item.quantity}</span>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => completeOrder(order.id)}
                className="w-full bg-green-600 text-white p-2 rounded flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Completato
              </button>
            </div>
          ))}
        </div>

        {lineOrders.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Nessun ordine in coda</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Sagra Manager</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('cassa')}
              className={`px-4 py-2 rounded ${currentView === 'cassa' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Cassa
            </button>
            {lines.map(line => (
              <button
                key={line.id}
                onClick={() => setCurrentView(line.id)}
                className={`px-4 py-2 rounded ${currentView === line.id ? 'text-white' : 'bg-gray-200'}`}
                style={{ 
                  backgroundColor: currentView === line.id ? line.color : undefined 
                }}
              >
                {line.name}
              </button>
            ))}
            <button
              onClick={() => setCurrentView('config')}
              className={`px-4 py-2 rounded ${currentView === 'config' ? 'bg-gray-500 text-white' : 'bg-gray-200'}`}
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
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Configurazione</h2>
            <p className="text-gray-600">
              Sezione di configurazione per menu, linee di produzione e impostazioni.
              Da implementare con interfaccia per modificare menu, prezzi, disponibilità, ecc.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;