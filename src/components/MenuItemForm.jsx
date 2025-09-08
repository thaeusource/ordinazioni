import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

const MenuItemForm = ({ item, lines, onSave, onCancel }) => {
  const [formData, setFormData] = useState(item || {
    name: '',
    category: '',
    categoryColor: '#FF6B6B',
    preparationLine: '',
    price: 0,
    maxQuantity: 0,
    active: true,
    allergens: [],
    description: ''
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.preparationLine) {
      alert('Compila tutti i campi obbligatori');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="item-form">
      <div className="form-grid">
        <div className="form-group">
          <label>Nome Piatto *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Categoria *</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            placeholder="es: Primi, Secondi, Dolci, Bevande"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Colore Categoria</label>
          <input
            type="color"
            value={formData.categoryColor}
            onChange={(e) => setFormData({...formData, categoryColor: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Linea di Produzione *</label>
          <select
            value={formData.preparationLine}
            onChange={(e) => setFormData({...formData, preparationLine: e.target.value})}
            required
          >
            <option value="">Seleziona linea</option>
            {lines.map(line => (
              <option key={line.id} value={line.id}>{line.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Prezzo (€) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Quantità Massima</label>
          <input
            type="number"
            min="0"
            value={formData.maxQuantity}
            onChange={(e) => setFormData({...formData, maxQuantity: parseInt(e.target.value) || 0})}
          />
        </div>
        
        <div className="form-group full-width">
          <label>Descrizione</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows="2"
          />
        </div>
        
        <div className="form-group full-width">
          <label>Allergeni (separati da virgola)</label>
          <input
            type="text"
            value={formData.allergens.join(', ')}
            onChange={(e) => setFormData({...formData, allergens: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
            placeholder="es: glutine, lattosio, uova"
          />
        </div>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({...formData, active: e.target.checked})}
            />
            Attivo
          </label>
        </div>
      </div>
      
      <div className="form-actions">
        <button type="submit" className="save-button">
          <Save size={16} />
          Salva
        </button>
        <button type="button" onClick={onCancel} className="cancel-button">
          <X size={16} />
          Annulla
        </button>
      </div>
    </form>
  );
};

export default MenuItemForm;