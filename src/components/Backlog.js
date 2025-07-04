import React, { useState } from 'react';
import AppCard from './AppCard';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function DraggableAppCard({ app, onRemove, listType }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AppCard
        app={app}
        onRemove={onRemove}
        listType={listType}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function Backlog({ apps, onRemove }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const displayedApps = isCollapsed ? apps.slice(0, 8) : apps;

  return (
    <SortableContext items={apps.map(app => app.id)} strategy={verticalListSortingStrategy} id="backlog-column">
      {apps.length > 8 && (
        <div className="backlog-controls">
          <button
            className="collapse-button"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? `Show All (${apps.length})` : 'Show Less'}
          </button>
        </div>
      )}
      <div className="apps-list">
        {displayedApps.map(app => (
          <DraggableAppCard
            key={app.id}
            app={app}
            onRemove={onRemove}
            listType="Backlog"
          />
        ))}
      </div>
    </SortableContext>
  );
}

export default Backlog;