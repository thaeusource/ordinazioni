import React, { useState } from 'react';
import { Edit2, Trash2, Save, X, PlusCircle } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import MenuItemForm from './MenuItemForm';
import LineForm from './LineForm';

const ConfigView = ({ menu, lines, orders }) => {
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [editingLine, setEditingLine] = useState(null);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);

  // Menu Management Functions
  const handleSaveMenuItem = async (itemData) => {
    try {
      if (editingMenuItem) {
        // Update existing item
        const success = await firebaseService.updateMenuItem(editingMenuItem.id, {
          ...itemData,
          currentQuantity: itemData.maxQuantity // Reset quantity when updating
        });
        if (success) {
          setEditingMenuItem(null);
        }
      } else {
        // Add new item
        const itemId = await firebaseService.addMenuItem({
          ...itemData,
          currentQuantity: itemData.maxQuantity
        });
        if (itemId) {
          setShowAddMenuItem(false);
        }
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Errore nel salvare il piatto');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo piatto?')) {
      try {
        await firebaseService.deleteMenuItem(itemId);
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Errore nell\'eliminare il piatto');
      }
    }
  };

  // Line Management Functions
  const handleSaveLine = async (lineData) => {
    try {
      if (editingLine) {
        // Update existing line
        const success = await firebaseService.updateLine(editingLine.id, lineData);
        if (success) {
          setEditingLine(null);
        }
      } else {
        // Add new line
        const lineId = await firebaseService.addLine(lineData);
        if (lineId) {
          setShowAddLine(false);
        }
      }
    } catch (error) {
      console.error('Error saving line:', error);
      alert('Errore nel salvare la linea');
    }
  };

  const handleDeleteLine = async (lineId) => {
    // Check if line has menu items
    const hasItems = menu.some(item => item.preparationLine === lineId);
    if (hasItems) {
      alert('Non puoi eliminare una linea che ha piatti assegnati. Riassegna prima i piatti ad altre linee.');
      return;
    }

    if (window.confirm('Sei sicuro di voler eliminare questa linea?')) {
      try {
        await firebaseService.deleteLine(lineId);
      } catch (error) {
        console.error('Error deleting line:', error);
        alert('Errore nell\'eliminare la linea');
      }
    }
  };

  return (
    <div className="main-content">
      <h2>Configurazione Sistema</h2>
      
      {/* Statistics */}
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

      {/* Menu Management */}
      <div className="config-section">
        <div className="section-header">
          <h3>Gestione Menu</h3>
          <button 
            onClick={() => setShowAddMenuItem(true)}
            className="add-button"
          >
            <PlusCircle size={16} />
            Aggiungi Piatto
          </button>
        </div>

        {showAddMenuItem && (
          <div className="form-container">
            <h4>Nuovo Piatto</h4>
            <MenuItemForm 
              item={null}
              lines={lines}
              onSave={handleSaveMenuItem}
              onCancel={() => setShowAddMenuItem(false)}
            />
          </div>
        )}

        <div className="config-table">
          <div className="table-header">
            <span>Nome</span>
            <span>Categoria</span>
            <span>Linea</span>
            <span>Prezzo</span>
            <span>Disponibili</span>
            <span>Azioni</span>
          </div>
          {menu.map(item => (
            <div key={item.id} className="table-row">
              {editingMenuItem?.id === item.id ? (
                <div className="form-container full-width">
                  <MenuItemForm 
                    item={editingMenuItem}
                    lines={lines}
                    onSave={handleSaveMenuItem}
                    onCancel={() => setEditingMenuItem(null)}
                  />
                </div>
              ) : (
                <>
                  <span className="item-name">
                    <div 
                      className="category-dot"
                      style={{ backgroundColor: item.categoryColor }}
                    ></div>
                    {item.name}
                  </span>
                  <span>{item.category}</span>
                  <span>{lines.find(l => l.id === item.preparationLine)?.name || item.preparationLine}</span>
                  <span>€{item.price.toFixed(2)}</span>
                  <span className={item.available <= 0 ? 'out-of-stock' : ''}>
                    {item.available}/{item.maxQuantity}
                  </span>
                  <span className="actions">
                    <button 
                      onClick={() => setEditingMenuItem(item)}
                      className="edit-button"
                      title="Modifica"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="delete-button"
                      title="Elimina"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lines Management */}
      <div className="config-section">
        <div className="section-header">
          <h3>Gestione Linee di Produzione</h3>
          <button 
            onClick={() => setShowAddLine(true)}
            className="add-button"
          >
            <PlusCircle size={16} />
            Aggiungi Linea
          </button>
        </div>

        {showAddLine && (
          <div className="form-container">
            <h4>Nuova Linea</h4>
            <LineForm 
              line={null}
              onSave={handleSaveLine}
              onCancel={() => setShowAddLine(false)}
            />
          </div>
        )}

        <div className="config-table">
          <div className="table-header">
            <span>Nome</span>
            <span>ID</span>
            <span>Colore</span>
            <span>Ordine</span>
            <span>Stampante</span>
            <span>Azioni</span>
          </div>
          {lines.map(line => (
            <div key={line.id} className="table-row">
              {editingLine?.id === line.id ? (
                <div className="form-container full-width">
                  <LineForm 
                    line={editingLine}
                    onSave={handleSaveLine}
                    onCancel={() => setEditingLine(null)}
                  />
                </div>
              ) : (
                <>
                  <span className="item-name">
                    <div 
                      className="category-dot"
                      style={{ backgroundColor: line.color }}
                    ></div>
                    {line.name}
                  </span>
                  <span>{line.id}</span>
                  <span>
                    <div 
                      className="color-preview"
                      style={{ backgroundColor: line.color }}
                      title={line.color}
                    ></div>
                  </span>
                  <span>{line.order}</span>
                  <span>{line.printer || 'N/A'}</span>
                  <span className="actions">
                    <button 
                      onClick={() => setEditingLine(line)}
                      className="edit-button"
                      title="Modifica"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteLine(line.id)}
                      className="delete-button"
                      title="Elimina"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfigView;