import React, { useState } from 'react';

const PinModal = ({ onClose, onPinVerified, hiddenPin }) => {
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputPin === hiddenPin) {
      onPinVerified();
    } else {
      setError('Incorrect PIN');
    }
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Enter PIN</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="pin">PIN</label>
            <input
              type="password"
              required
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};

export default PinModal;
