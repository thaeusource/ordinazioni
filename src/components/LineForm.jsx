import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

const LineForm = ({ line, onSave, onCancel }) => {
  const [formData, setFormData] = useState(line || {
    id: '',
    name: '',
    color: '#FF6B6B',
    order: 0,
    active: true,
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id || !formData.name) {
      alert('Compila tutti i campi obbligatori');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="item-form">
      <div className="form-grid">
        <div className="form-group">
          <label>ID Linea *</label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
            placeholder="es: salato, dolce, bevande"
            required
            disabled={!!line} // Disable for editing
          />
        </div>
        
        <div className="form-group">
          <label>Nome Linea *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="es: Cucina Salato, Bar"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Colore</label>
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({...formData, color: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Ordine</label>
          <input
            type="number"
            min="0"
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
          />
        </div>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({...formData, active: e.target.checked})}
            />
            Attiva
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

export default LineForm;