// src/useAuth.js
import { useState, createContext, useContext, useMemo } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    // Get the comma-separated lists from environment variables
    const validEmailsString = process.env.REACT_APP_USER_EMAILS || '';
    const validPasswordsString = process.env.REACT_APP_USER_PASSWORDS || '';

    // Split them into arrays
    const validEmails = validEmailsString.split(',');
    const validPasswords = validPasswordsString.split(',');

    // Find the index of the entered email
    const userIndex = validEmails.findIndex(validEmail => validEmail === email);

    // Check if the user exists and if the password at the same index matches
    if (userIndex !== -1 && validPasswords[userIndex] === password) {
      setUser({ email });
      return true; // Login successful
    }

    return false; // Login failed
  };

  const logout = () => {
    setUser(null);
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