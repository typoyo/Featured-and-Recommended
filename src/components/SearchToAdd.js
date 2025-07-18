import React, { useState, useMemo, useEffect } from 'react';
import base from '../airtable'; // Corrected path

function SearchToAdd({ apps, onAppAdded }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [randomSuggestions, setRandomSuggestions] = useState([]);

  const uniqueAvailableApps = useMemo(() => {
    const seenNames = new Set();
    return apps.filter(app => {
      const appName = app.fields['App Name']?.toLowerCase();
      if (appName && !seenNames.has(appName)) {
        seenNames.add(appName);
        return true;
      }
      return false;
    });
  }, [apps]);

  useEffect(() => {
    if (isModalOpen) {
      const shuffled = [...uniqueAvailableApps].sort(() => 0.5 - Math.random());
      setRandomSuggestions(shuffled.slice(0, 5));
    }
  }, [isModalOpen, uniqueAvailableApps]);


  const filteredApps = useMemo(() => {
    if (!searchTerm) {
      return [];
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return uniqueAvailableApps.filter(app => {
      const appName = app.fields['App Name']?.toLowerCase() || '';
      const appId = app.fields['App ID']?.toLowerCase() || '';
      const pmName = app.fields['Partner Manager Name']?.toLowerCase() || '';
      return appName.includes(lowercasedSearchTerm) ||
             appId.includes(lowercasedSearchTerm) ||
             pmName.includes(lowercasedSearchTerm);
    });
  }, [searchTerm, uniqueAvailableApps]);

  const appsToDisplay = searchTerm ? filteredApps : randomSuggestions;

  const handleAddToBacklog = async (appId) => {
    try {
      await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(appId, {
        'IsInBacklog': true,
      });
      onAppAdded();
    } catch (err) {
      console.error(err);
      alert('Failed to move app to backlog.');
    }
  };

  return (
    <>
      <button className="open-search-button" onClick={() => setIsModalOpen(true)}>
        + Add App to Backlog
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Search and Add to Backlog</h3>
            <p>Search for any app to move it to the backlog.</p>
            <input
              type="text"
              placeholder="Search by App, ID, or PM..."
              className="search-bar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <ul className="search-results-list">
              {appsToDisplay.length > 0 ? (
                appsToDisplay.map(app => (
                  <li key={app.id} className="search-result-item">
                    <span>
                      {app.fields['App Name']} <small>({app.fields['Partner Manager Name']})</small>
                    </span>
                    <button onClick={() => handleAddToBacklog(app.id)}>Add</button>
                  </li>
                ))
              ) : (
                searchTerm && <li className="no-results-message">No apps found.</li>
              )}
            </ul>
            <button className="modal-close-button" onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default SearchToAdd;