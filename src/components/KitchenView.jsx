import React, { useState } from 'react';
import { Check, Eye, EyeOff, Clock, CheckCircle } from 'lucide-react';

const KitchenView = ({ lineId, lines, orders, completeOrder }) => {
  const [showCompleted, setShowCompleted] = useState(false);
  
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

  const pendingOrders = orders.filter(order => 
    order.status === 'pending' && 
    order.items && 
    order.items.some(item => item.preparationLine === lineId)
  );

  const completedOrders = orders.filter(order => 
    order.status === 'completed' && 
    order.items && 
    order.items.some(item => item.preparationLine === lineId)
  );

  const displayOrders = showCompleted ? completedOrders : pendingOrders;

  return (
    <div className="main-content">
      <div className="kitchen-header">
        <h2 style={{ color: line.color }}>
          {line.name}
        </h2>
        <div className="kitchen-controls">
          <div className="orders-count">
            {showCompleted ? 'Completati' : 'In coda'}: {displayOrders.length}
          </div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`toggle-button ${showCompleted ? 'showing-completed' : 'showing-pending'}`}
          >
            {showCompleted ? (
              <>
                <Clock size={16} />
                Mostra in Coda ({pendingOrders.length})
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Mostra Completati ({completedOrders.length})
              </>
            )}
          </button>
        </div>
      </div>

      <div className="orders-grid">
        {displayOrders.map(order => (
          <div key={order.id} className={`order-card ${showCompleted ? 'completed' : 'pending'}`}>
            <div className="order-header">
              <span className="order-number">#{order.customerNumber}</span>
              <div className="order-info">
                <span className="order-station">
                  Stazione {order.station}
                </span>
                {showCompleted && (
                  <span className="completed-badge">
                    <CheckCircle size={14} />
                    Completato
                  </span>
                )}
              </div>
            </div>
            <div className="order-time">
              <div>
                <strong>Ordinato:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('it-IT') : 'N/A'}
              </div>
              {showCompleted && order.updatedAt && (
                <div>
                  <strong>Completato:</strong> {new Date(order.updatedAt).toLocaleTimeString('it-IT')}
                </div>
              )}
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
            
            {!showCompleted ? (
              <button
                onClick={() => completeOrder(order.id)}
                className="complete-button"
              >
                <Check size={16} />
                Completato
              </button>
            ) : (
              <div className="order-total">
                <span>Totale ordine: €{order.total?.toFixed(2) || 'N/A'}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {displayOrders.length === 0 && (
        <div className="empty-orders">
          <p>
            {showCompleted 
              ? 'Nessun ordine completato per questa linea' 
              : 'Nessun ordine in coda'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default KitchenView;