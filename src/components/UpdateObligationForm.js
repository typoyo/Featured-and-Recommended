import React, { useState } from 'react';

function UpdateObligationForm({ app, onSubmit, onCancel }) {
  const [obligation, setObligation] = useState(app.fields['Feature Obligation'] || 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(app.id, obligation);
  };

  return (
    <div className="modal-content">
      <h3>Update Obligation for "{app.fields['App Name']}"</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Feature Obligation Count</label>
          <input
            type="number"
            value={obligation}
            onChange={(e) => setObligation(parseInt(e.target.value, 10))}
            min="1"
            autoFocus
            required
          />
        </div>
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onCancel}>Cancel</button>
          <button type="submit" className="submit-button">Save</button>
        </div>
      </form>
    </div>
  );
}

export default UpdateObligationForm;