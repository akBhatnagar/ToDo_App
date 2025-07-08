import React, { useState } from 'react';

const ChangePinModal = ({ onClose, onPinChanged, hiddenPin }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentPin !== hiddenPin) {
      setError('Current PIN is incorrect');
      return;
    }
    
    if (newPin.length < 4) {
      setError('PIN must be at least 4 characters');
      return;
    }
    
    if (newPin !== confirmPin) {
      setError('New PIN and confirmation do not match');
      return;
    }
    
    onPinChanged(newPin);
    onClose();
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Change PIN</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="current-pin">Current PIN</label>
            <input
              id="current-pin"
              type="password"
              required
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="Enter current PIN"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="new-pin">New PIN</label>
            <input
              id="new-pin"
              type="password"
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Enter new PIN (min 4 characters)"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="confirm-pin">Confirm New PIN</label>
            <input
              id="confirm-pin"
              type="password"
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Confirm new PIN"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Change PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePinModal;
