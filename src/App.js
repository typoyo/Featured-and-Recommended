// src/App.js
import React from 'react';
import ToolPage from './ToolPage';
import Login from './components/Login';
import { useAuth } from './useAuth';

function App() {
  const { user, login, logout } = useAuth();

  // Conditionally render the correct component based on login state
  const renderContent = () => {
    if (user) {
      return (
        <>
          <button onClick={logout} className="logout-button">Logout</button>
          <ToolPage />
        </>
      );
    }
    return <Login onLogin={login} />;
  };

  return (
    <div className="App">
      {renderContent()}
    </div>
  );
}

export default App;