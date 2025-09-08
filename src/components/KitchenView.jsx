import React from 'react';
import { Check } from 'lucide-react';

const KitchenView = ({ lineId, lines, orders, completeOrder }) => {
  const line = lines.find(l => l.id === lineId);
  
  if (!line) {
    return (
      <div className="main-content">
        <div className="empty-orders">
          <p>Linea non trovata</p>
        </div>
      </div>
    );
  }

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

export default KitchenView;