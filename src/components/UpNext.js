import React from 'react';
import AppCard from './AppCard';
import { useDroppable } from '@dnd-kit/core';

function UpNext({ apps, onUpdateObligation, displayDates }) {
  const { setNodeRef } = useDroppable({ id: 'up-next-column' });

  return (
    <div ref={setNodeRef} className="apps-list droppable-area">
      {apps.map(app => (
        <AppCard
          key={app.id}
          app={app}
          onUpdateObligation={onUpdateObligation}
          listType="Up Next"
          displayDates={displayDates}
        />
      ))}
      {apps.length < 8 && <div className="drop-placeholder">Drop App Here</div>}
    </div>
  );
}

export default UpNext;