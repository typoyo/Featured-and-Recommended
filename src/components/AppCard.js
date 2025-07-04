import React from 'react';

function AppCard({ app, onRemove, listType, dragHandleProps, onUpdateObligation, displayDates }) {
  const appName = app.fields?.['App Name'] ?? 'No Name Provided';
  const appId = app.fields?.['App ID'] ?? 'No ID';
  const pmName = app.fields?.['Partner Manager Name'] ?? 'N/A';
  const featuredCount = app.fields?.['Featured Count'] || 0;
  const featureObligation = app.fields?.['Feature Obligation'] || 1;

  const copyToClipboard = () => {
    if (appId && appId !== 'No ID') {
      // The .then() that created the alert has been removed.
      navigator.clipboard.writeText(appId)
        .catch(err => console.error('Failed to copy: ', err));
    }
  };

  return (
    <div className="app-card">
      {listType === 'Backlog' && (
        <button className="remove-button" onClick={() => onRemove(app.id)}>
          &times;
        </button>
      )}

      <div className="app-info" {...dragHandleProps}>
        <h4 className="app-name">{appName}</h4>
        {displayDates && (
          <p className={listType === 'Currently Featured' ? 'feature-dates current-dates' : 'feature-dates future-dates'}>
            {displayDates.start} &ndash; {displayDates.end}
          </p>
        )}
      </div>

      <div className="app-actions">
        {listType !== 'Backlog' && (
          <div
            className="feature-count"
            onClick={() => onUpdateObligation(app)}
            title="Click to edit obligation"
          >
            ({featuredCount}/{featureObligation})
          </div>
        )}
        <button
          className="app-id-button"
          onClick={copyToClipboard}
          disabled={!appId || appId === 'No ID'}
        >
          {appId}
        </button>
        <p className="partner-manager">PM: {pmName}</p>
      </div>
    </div>
  );
}

export default AppCard;