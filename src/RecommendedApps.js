import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import './RecommendedApps.css';

// ... (Airtable config and other constants remain the same) ...

const AppItem = ({ app, type, date, onAction }) => {
    // ... (AppItem helper component remains the same) ...
};

function RecommendedApps() {
    // ... (All state and functions like fetchData, handleAction, etc. remain the same) ...

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