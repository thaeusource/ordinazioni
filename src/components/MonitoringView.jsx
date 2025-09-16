import React from 'react';

const MonitoringView = ({ allOrders, printStations, orderStats }) => {
  return (
    <div className="monitoring-view">
      <div className="monitoring-header">
        <h2>📊 Monitoraggio Sistema di Stampa</h2>
      </div>
      
      {/* Statistiche */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Ordini Totali</h3>
          <div className="stat-number">{orderStats.total}</div>
        </div>
        <div className="stat-card success">
          <h3>Stampati</h3>
          <div className="stat-number">{orderStats.printed}</div>
        </div>
        <div className="stat-card warning">
          <h3>In Coda</h3>
          <div className="stat-number">{orderStats.pending}</div>
        </div>
        <div className="stat-card error">
          <h3>Errori</h3>
          <div className="stat-number">{orderStats.failed}</div>
        </div>
      </div>
      
      {/* Stazioni di Stampa */}
      <div className="print-stations">
        <h3>🖨️ Stazioni di Stampa</h3>
        <div className="stations-grid">
          {printStations.map(station => (
            <div key={station.id} className={`station-card ${station.online ? 'online' : 'offline'}`}>
              <div className="station-header">
                <h4>{station.name}</h4>
                <span className={`status ${station.online ? 'online' : 'offline'}`}>
                  {station.online ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
              <div className="station-info">
                <p>Ultimo ping: {new Date(station.lastPing?.toDate()).toLocaleTimeString()}</p>
                <p>Ordini stampati: {station.totalPrinted || 0}</p>
              </div>
            </div>
          ))}
          {printStations.length === 0 && (
            <div className="no-stations">
              <p>Nessuna stazione di stampa collegata</p>
              <p>Avvia l'app print-station per vedere le stazioni qui</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Ordini Recenti */}
      <div className="recent-orders">
        <h3>📝 Ordini Recenti</h3>
        <div className="orders-list">
          {allOrders.slice(0, 10).map(order => {
            // Gestisci timestamp diversi (timestamp, createdAt)
            const orderTimestamp = order.timestamp || order.createdAt;
            const timeDisplay = orderTimestamp?.toDate ? 
              new Date(orderTimestamp.toDate()).toLocaleTimeString() : 
              'N/A';
            
            return (
              <div key={order.id} className={`order-card ${order.printStatus?.printed ? 'printed' : order.printStatus?.error ? 'error' : 'pending'}`}>
                <div className="order-header">
                  <span className="customer-number">#{order.customerNumber}</span>
                  <span className="timestamp">{timeDisplay}</span>
                  <span className={`print-status ${order.printStatus?.printed ? 'printed' : order.printStatus?.error ? 'error' : 'pending'}`}>
                    {order.printStatus?.printed ? '✅ Stampato' : 
                     order.printStatus?.error ? '❌ Errore' : 
                     '⏳ In coda'}
                  </span>
                </div>
                <div className="order-details">
                  <p>Stazione: {order.station}</p>
                  <p>Totale: €{order.total?.toFixed(2)}</p>
                  <p>Articoli: {order.items?.length}</p>
                </div>
              </div>
            );
          })}
          {allOrders.length === 0 && (
            <div className="no-orders">
              <p>Nessun ordine trovato</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringView;