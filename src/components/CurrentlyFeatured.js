import React from 'react';
import AppCard from './AppCard';

function CurrentlyFeatured({ apps, onUpdateObligation, displayDates }) {
  return (
    <div className="apps-list">
      {apps.map(app => (
        <AppCard
          key={app.id}
          app={app}
          onUpdateObligation={onUpdateObligation}
          listType="Currently Featured"
          displayDates={displayDates}
        />
      ))}
    </div>
  );
}

export default CurrentlyFeatured;