import React, { useState, useEffect } from 'react';
import base from './airtable';
import CSVUploader from './components/CSVUploader';
import CurrentlyFeatured from './components/CurrentlyFeatured';
import UpNext from './components/UpNext';
import Backlog from './components/Backlog';
import AppCard from './components/AppCard';
import SearchToAdd from './components/SearchToAdd';
import AddOneApp from './components/AddOneApp';
import UpdateObligationForm from './components/UpdateObligationForm';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import moment from 'moment';
import './FeaturedAppsManager.css';

function FeaturedAppsManager() {
  const [apps, setApps] = useState([]);
  const [activeApp, setActiveApp] = useState(null);
  const [isObligationModalOpen, setIsObligationModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [isAddOneModalOpen, setIsAddOneModalOpen] = useState(false);

  const fetchApps = () => {
    const records = [];
    base(process.env.REACT_APP_AIRTABLE_TABLE_NAME)
      .select({ view: 'Grid view' })
      .eachPage(
        (pageRecords, fetchNextPage) => {
          records.push(...pageRecords);
          fetchNextPage();
        },
        (err) => {
          if (err) {
            console.error(err);
            return;
          }
          // Sort apps based on their status and order fields
          const sortedRecords = records.sort((a, b) => {
            if (a.fields.Status === 'Currently Featured' && b.fields.Status === 'Currently Featured') {
              return (a.fields.Queue_Order || 0) - (b.fields.Queue_Order || 0);
            }
            if (a.fields.Status === 'Up Next' && b.fields.Status === 'Up Next') {
              return (a.fields.Queue_Order || 0) - (b.fields.Queue_Order || 0);
            }
            if (a.fields.Status === 'Backlog' && b.fields.Status === 'Backlog') {
              return (a.fields.Order || 0) - (b.fields.Order || 0);
            }
            return 0;
          });
          setApps(sortedRecords);
        }
      );
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreateOneApp = async (newAppData) => {
    // ... (handleCreateOneApp logic is unchanged)
  };

  const handleDragStart = (event) => {
    // ... (handleDragStart logic is unchanged)
  };

  const handleDragEnd = (event) => {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;

    const activeApp = apps.find(app => app.id === active.id);
    const overId = over.id;

    // --- LOGIC CHANGE IS HERE ---
    if (overId === 'up-next-column' && activeApp.fields.Status === 'Backlog') {
      const upNextApps = apps.filter(app => app.fields.Status === 'Up Next');
      if (upNextApps.length >= 8) {
        alert('The "Up Next" column is full. Please move an app out before adding another.');
        return;
      }
      const isAlreadyUpNext = upNextApps.some(app => app.fields['App Name'] === activeApp.fields['App Name']);
      if (isAlreadyUpNext) {
        alert("This app is already Up Next!");
        return;
      }

      // Set the Queue_Order to be the next available number
      const newQueueOrder = upNextApps.length;

      setApps(prevApps => prevApps.map(app =>
        app.id === active.id ? { ...app, fields: { ...app.fields, Status: 'Up Next', Queue_Order: newQueueOrder } } : app
      ));
      base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(active.id, {
        'Status': 'Up Next',
        'Queue_Order': newQueueOrder
      });
    }

    if (over.data?.current?.sortable?.containerId === 'backlog-column' && active.id !== over.id) {
        // ... (Backlog reordering logic is unchanged)
    }
  };

  const handleRemoveFromBacklog = async (appId) => {
    // ... (handleRemoveFromBacklog logic is unchanged)
  };

  const handleUpdateObligation = (appToEdit) => {
    // ... (handleUpdateObligation logic is unchanged)
  };

  const submitUpdateObligation = async (appId, newObligation) => {
    // ... (submitUpdateObligation logic is unchanged)
  };

  const handlePromoteApps = async () => {
    // ... (handlePromoteApps logic is unchanged)
  };

  const currentlyFeaturedApps = apps.filter(app => app.fields.Status === 'Currently Featured');
  const upNextApps = apps.filter(app => app.fields.Status === 'Up Next');
  const backlogApps = apps.filter(app => app.fields.Status === 'Backlog');

  // ... (date calculation logic is unchanged)

  return (
    // ... (JSX structure is unchanged)
  );
}

export default FeaturedAppsManager;