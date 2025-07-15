import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import './RecommendedApps.css';

// --- Airtable Configuration ---
const AIRTABLE_API_KEY = process.env.REACT_APP_AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.REACT_APP_RECOMMENDED_BASE_ID; 
const APPS_TABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Apps`;
const STATE_TABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/State`;
const airtableHeaders = {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
};


// --- Helper Component for App Items ---
const AppItem = ({ app, type, date, onAction }) => {
    const handleCopy = (e) => {
        const idToCopy = app.appId;
        navigator.clipboard.writeText(idToCopy).then(() => {
            const badge = e.currentTarget;
            const originalText = badge.textContent;
            badge.textContent = 'Copied!';
            badge.classList.add('copied');
            setTimeout(() => {
                badge.textContent = originalText;
                badge.classList.remove('copied');
            }, 1500);
        });
    };

    return (
        <div className="rec-app-card">
            <div className="rec-app-info">
                <h4 className="rec-app-name">{app.appName}</h4>
                {date && <p className="rec-feature-dates">{type === 'current' ? 'Due:' : 'Starts:'} {date}</p>}
                {type === 'previous' && app.completedDate && <p className="rec-feature-dates">Completed: {app.completedDate}</p>}
            </div>
            <div className="rec-app-actions">
                <button onClick={handleCopy} className="rec-app-id-button">{app.appId}</button>
                {type === 'search' && (
                    <button className="rec-action-button add" onClick={() => onAction('add', app.appId)}>
                        <i className="bds-icon bds-add"></i>
                    </button>
                )}
                {type === 'queue' && (
                    <button className="rec-action-button remove" onClick={() => onAction('remove', app.appId)}>
                        &times;
                    </button>
                )}
            </div>
        </div>
    );
};


// --- Main Component ---
function RecommendedApps() {
    const [masterAppList, setMasterAppList] = useState([]);
    const [appState, setAppState] = useState({ recordId: null, currentRotation: [], upNextApps: [], previousApps: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isQueueExpanded, setIsQueueExpanded] = useState(false);
    const fileInputRef = useRef(null);

    const fetchData = useCallback(async () => {
        setIsSyncing(true);
        try {
            // Fetch Apps
            let allAppRecords = [];
            let offset = null;
            do {
                const url = offset ? `${APPS_TABLE_URL}?offset=${offset}` : APPS_TABLE_URL;
                const response = await fetch(url, { headers: airtableHeaders });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Airtable 'Apps' Error: ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();
                if (data && data.records) {
                    allAppRecords.push(...data.records);
                }
                offset = data.offset;
            } while (offset);
            
            const uniqueApps = Array.from(new Map(allAppRecords.map(app => [app.fields.appId, app])).values());
            setMasterAppList(uniqueApps.map(r => ({ id: r.id, ...r.fields })));

            // Fetch State
            const stateResponse = await fetch(STATE_TABLE_URL, { headers: airtableHeaders });
            if (!stateResponse.ok) {
                const errorData = await stateResponse.json();
                throw new Error(`Airtable 'State' Error: ${errorData.error?.message || stateResponse.statusText}`);
            }

            const stateData = await stateResponse.json();
            if (stateData && stateData.records && stateData.records.length > 0) {
                const record = stateData.records[0];
                setAppState({
                    recordId: record.id,
                    currentRotation: JSON.parse(record.fields.currentRotation || '[]'),
                    upNextApps: JSON.parse(record.fields.upNextApps || '[]'),
                    previousApps: JSON.parse(record.fields.previousApps || '[]'),
                });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            alert(`Could not fetch data from Airtable. ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateAirtableState = useCallback(async (newState) => {
        if (!appState.recordId) return;
        try {
            await fetch(`${STATE_TABLE_URL}/${appState.recordId}`, {
                method: 'PATCH',
                headers: airtableHeaders,
                body: JSON.stringify({ fields: newState })
            });
            await fetchData();
        } catch (error) {
            console.error("Error updating Airtable state:", error);
            alert("Could not save changes to Airtable.");
        }
    }, [appState.recordId, fetchData]);

    const handleAction = (action, appId) => {
        if (action === 'add') {
            const appToAdd = masterAppList.find(app => app.appId === appId);
            const isAlreadyInUse = appState.upNextApps.some(app => app.appId === appId) || appState.currentRotation.some(app => app.appId === appId);
            if (appToAdd && !isAlreadyInUse) {
                const updatedQueue = [...appState.upNextApps, appToAdd];
                updateAirtableState({ upNextApps: JSON.stringify(updatedQueue) });
            } else {
                alert("This app is already in use.");
            }
        }
        if (action === 'remove') {
            const updatedQueue = appState.upNextApps.filter(app => app.appId !== appId);
            updateAirtableState({ upNextApps: JSON.stringify(updatedQueue) });
        }
    };

    const handleManualAdd = async () => {
        const newAppName = prompt("Enter the new App Name:");
        if (!newAppName) return;
        const newAppId = prompt("Enter the new App ID:");
        if (!newAppId) return;
        const trimmedAppId = newAppId.trim();
        if (masterAppList.some(app => app.appId === trimmedAppId)) {
            return alert(`Error: App ID "${trimmedAppId}" already exists.`);
        }
        try {
            await fetch(APPS_TABLE_URL, {
                method: 'POST',
                headers: airtableHeaders,
                body: JSON.stringify({ records: [{ fields: { appId: trimmedAppId, appName: newAppName.trim() } }] })
            });
            alert(`Success: "${newAppName}" has been added.`);
            fetchData();
        } catch (error) {
            alert("Could not add app to Airtable.");
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet);
                const appsToUpload = json.map(row => {
                    const idKey = Object.keys(row).find(k => k.toLowerCase().includes('app id'));
                    const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('app name'));
                    if (idKey && nameKey) {
                        const appId = String(row[idKey]).trim();
                        const appName = String(row[nameKey]).trim();
                        if (appId && appName && !masterAppList.some(app => app.appId === appId)) {
                            return { fields: { appId, appName } };
                        }
                    }
                    return null;
                }).filter(Boolean);
                if (appsToUpload.length > 0) {
                    for (let i = 0; i < appsToUpload.length; i += 10) {
                        const chunk = appsToUpload.slice(i, i + 10);
                        await fetch(APPS_TABLE_URL, {
                            method: 'POST',
                            headers: airtableHeaders,
                            body: JSON.stringify({ records: chunk })
                        });
                    }
                    alert(`Upload complete! ${appsToUpload.length} new apps added.`);
                    fetchData();
                } else {
                    alert("Upload complete! No new apps were found to add.");
                }
            } catch (error) {
                alert("Upload Failed!");
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    const handlePromote = () => {
        if (appState.currentRotation.length > 0) return alert("Cannot promote. The current rotation is not empty.");
        const appsToPromote = appState.upNextApps.slice(0, 3);
        const remainingInQueue = appState.upNextApps.slice(3);
        updateAirtableState({
            currentRotation: JSON.stringify(appsToPromote),
            upNextApps: JSON.stringify(remainingInQueue)
        });
    };

    const handleComplete = () => {
        if (window.confirm("Are you sure you want to complete the current rotation?")) {
            const completedDate = new Date().toLocaleDateString();
            const completedApps = appState.currentRotation.map(app => ({...app, completedDate}));
            const updatedPreviousApps = [...appState.previousApps, ...completedApps];
            updateAirtableState({
                previousApps: JSON.stringify(updatedPreviousApps),
                currentRotation: '[]'
            });
        }
    };

    const searchResults = searchTerm.length > 1
        ? masterAppList.filter(app => {
            const appName = app.appName?.toLowerCase() || '';
            const appId = app.appId?.toLowerCase() || '';
            const term = searchTerm.toLowerCase();
            return appName.includes(term) || appId.includes(term);
          })
        : [];

    return (
        <div className="rec-app-container">
            <div className="rec-main-header">
                <h1 className="rec-title"><i className="bds-icon bds-apps"></i>App Recommendation Tracker</h1>
            </div>
            <div className="rec-main-content">
                <div className="rec-column">
                    <div className="rec-panel">
                        <div className="rec-panel-header">
                            <h2 className="rec-panel-title"><i className="bds-icon bds-bolt"></i>Current Rotation</h2>
                            <button onClick={handleComplete} className="rec-button secondary" disabled={appState.currentRotation.length === 0}><i className="bds-icon bds-check"></i>Complete</button>
                        </div>
                        <div className="rec-panel-body no-padding">
                            {appState.currentRotation.length > 0
                                ? appState.currentRotation.map(app => <AppItem key={`current-${app.appId}`} app={app} type="current" />)
                                : <p className="rec-placeholder-text">No apps in current rotation.</p>}
                        </div>
                    </div>
                </div>
                <div className="rec-column">
                     <div className="rec-panel">
                        <div className="rec-panel-header">
                            <h2 className="rec-panel-title"><i className="bds-icon bds-layers"></i>Up Next (Queue)</h2>
                            <button onClick={handlePromote} className="rec-button primary" disabled={appState.upNextApps.length === 0 || appState.currentRotation.length > 0}><i className="bds-icon bds-arrow-upward"></i>Promote</button>
                        </div>
                        <div className="rec-panel-body no-padding">
                             {(isQueueExpanded ? appState.upNextApps : appState.upNextApps.slice(0, 6)).map(app => (
                                <AppItem key={`queue-${app.appId}`} app={app} type="queue" onAction={handleAction} />
                            ))}
                            {appState.upNextApps.length === 0 && <p className="rec-placeholder-text">No apps in the queue.</p>}
                        </div>
                        {appState.upNextApps.length > 6 &&
                            <div className="rec-panel-footer">
                                <button onClick={() => setIsQueueExpanded(!isQueueExpanded)} className="rec-button-link">
                                    {isQueueExpanded ? 'Show less' : `Show ${appState.upNextApps.length - 6} more`}
                                </button>
                            </div>
                        }
                    </div>
                </div>
                <div className="rec-column">
                     <div className="rec-panel">
                        <div className="rec-panel-header">
                            <h2 className="rec-panel-title"><i className="bds-icon bds-search"></i>Search & Add</h2>
                            <button onClick={fetchData} className={`rec-button secondary icon-only ${isSyncing ? 'is-syncing' : ''}`} title="Refresh data from Airtable">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V4.5" /></svg>
                            </button>
                        </div>
                        <div className="rec-panel-body">
                            <div className="rec-form-group">
                                <div className="rec-form-input-wrapper">
                                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="rec-form-input" placeholder="Search by App Name or ID..." />
                                    <button onClick={handleManualAdd} className="rec-button primary icon-only" title="Manually add a new app">+</button>
                                </div>
                            </div>
                            <div className="rec-apps-list">
                                {searchResults.map(app => <AppItem key={`search-${app.appId}`} app={app} type="search" onAction={handleAction}/>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="rec-main-content" style={{ marginTop: '20px' }}>
                <div className="rec-column full-width">
                     <div className="rec-panel">
                        <div className="rec-panel-header">
                            <h2 className="rec-panel-title"><i className="bds-icon bds-time"></i>Previously Recommended Apps</h2>
                        </div>
                        <div className="rec-panel-body no-padding">
                            <div className="rec-apps-list">
                                {appState.previousApps.length > 0
                                    ? [...appState.previousApps].reverse().map(app => <AppItem key={`previous-${app.appId}`} app={app} type="previous" />)
                                    : <p className="rec-placeholder-text">No previously recommended apps.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             <div className="footer-actions">
                 <button onClick={() => fileInputRef.current.click()} className="upload-button"><i className="bds-icon bds-upload"></i>Upload Spreadsheet</button>
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, .xlsx" style={{ display: 'none' }} />
            </div>
        </div>
    );
}

export default RecommendedApps;
