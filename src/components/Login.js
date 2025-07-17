// src/components/Login.js
import React, { useState } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // onLogin will be a function passed from App.js to check credentials
    const loginSuccess = onLogin(email, password);
    if (!loginSuccess) {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content login-modal">
        <h3>Tool Login</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="submit-button">Login</button>
          </div>
        </form>
        <p className="login-footer-message">
          Need access or a password reset? Slack message Tyler Danger.
        </p>
      </div>
    </div>
  );
}

export default Login;