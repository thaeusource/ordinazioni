import React from 'react';
import { Plus, Minus, Printer } from 'lucide-react';

const CassaView = ({ 
  currentStation, 
  setCurrentStation, 
  menu, 
  cart, 
  customerNumber,
  addToCart, 
  removeFromCart, 
  getTotalPrice, 
  processOrder 
}) => {
  return (
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
};

export default CassaView;