import React, { useState } from 'react';

function AddOneApp({ onAppAdded, onCancel }) {
  const [appName, setAppName] = useState('');
  const [appId, setAppId] = useState('');
  const [pmName, setPmName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAppAdded({
      'App Name': appName,
      'App ID': appId,
      'Partner Manager Name': pmName,
    });
    onCancel();
  };

  return (
    <div className="modal-overlay">
        <div className="modal-content">
            <h3>Add a Single App</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>App Name</label>
                    <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} required autoFocus />
                </div>
                <div className="form-group">
                    <label>App ID</label>
                    <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Partner Manager Name</label>
                    <input type="text" value={pmName} onChange={(e) => setPmName(e.target.value)} required />
                </div>
                <div className="form-actions">
                    <button type="button" className="cancel-button" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="submit-button">Add App</button>
                </div>
            </form>
        </div>
    </div>
  );
}

export default AddOneApp;