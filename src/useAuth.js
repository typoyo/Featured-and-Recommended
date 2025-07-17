import { useState, createContext, useContext, useMemo } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // On initial load, try to get the user session from localStorage
  const [user, setUser] = useState(() => {
    const savedSession = localStorage.getItem('userSession');
    if (!savedSession) {
      return null;
    }

    const { user, timestamp } = JSON.parse(savedSession);
    const sessionAge = Date.now() - timestamp;
    const eightHours = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

    // If the session is older than 8 hours, clear it
    if (sessionAge > eightHours) {
      localStorage.removeItem('userSession');
      return null;
    }

    // Otherwise, the user is still logged in
    return user;
  });

  const login = (email, password) => {
    const validEmailsString = process.env.REACT_APP_USER_EMAILS || '';
    const validPasswordsString = process.env.REACT_APP_USER_PASSWORDS || '';

    const validEmails = validEmailsString.split(',');
    const validPasswords = validPasswordsString.split(',');

    const userIndex = validEmails.findIndex(validEmail => validEmail === email);

    if (userIndex !== -1 && validPasswords[userIndex] === password) {
      const userData = { email };
      setUser(userData);
      // Save the session to localStorage with a timestamp
      localStorage.setItem('userSession', JSON.stringify({ user: userData, timestamp: Date.now() }));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    // Clear the session from localStorage
    localStorage.removeItem('userSession');
  };

  const value = useMemo(() => ({
    user,
    login,
    logout
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};