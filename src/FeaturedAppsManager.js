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
  const [isAddOneModalOpen, setIsAddOneModalOpen] = useState(false); // New state for this modal

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
          const sortedRecords = records.sort((a, b) => {
            if (a.fields.Status === 'Backlog') {
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

  // Updated handler to also close the modal
  const handleCreateOneApp = async (newAppData) => {
    try {
      await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).create([
        {
          fields: {
            ...newAppData,
            'Featured Count': 0,
            'Feature Obligation': 1,
          },
        },
      ]);
      fetchApps();
      setIsAddOneModalOpen(false); // Close modal on success
    } catch (err) {
      console.error(err);
      alert('Failed to create the new app.');
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveApp(apps.find(app => app.id === active.id));
  };

  const handleDragEnd = (event) => {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;
    const activeApp = apps.find(app => app.id === active.id);
    const overId = over.id;
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
      setApps(prevApps => prevApps.map(app =>
        app.id === active.id ? { ...app, fields: { ...app.fields, Status: 'Up Next' } } : app
      ));
      base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(active.id, { 'Status': 'Up Next' });
    }
    if (over.data?.current?.sortable?.containerId === 'backlog-column' && active.id !== over.id) {
        const oldIndex = apps.findIndex(app => app.id === active.id);
        const newIndex = apps.findIndex(app => app.id === over.id);
        const newSortedApps = arrayMove(apps, oldIndex, newIndex);
        setApps(newSortedApps);
        const updates = newSortedApps
          .filter(app => app.fields.Status === 'Backlog')
          .map((app, index) => ({ id: app.id, fields: { Order: index } }));
        for (let i = 0; i < updates.length; i += 10) {
          const chunk = updates.slice(i, i + 10);
          base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(chunk);
        }
    }
  };

  const handleRemoveFromBacklog = async (appId) => {
    try {
      await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(appId, { "Status": null });
      fetchApps();
    } catch (err) {
      console.error(err);
      alert('Failed to remove app from backlog.');
    }
  };

  const handleUpdateObligation = (appToEdit) => {
    setEditingApp(appToEdit);
    setIsObligationModalOpen(true);
  };

  const submitUpdateObligation = async (appId, newObligation) => {
    if (newObligation && !isNaN(newObligation) && newObligation > 0) {
      try {
        await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(appId, {
          'Feature Obligation': parseInt(newObligation, 10)
        });
        fetchApps();
      } catch (err) {
        console.error(err);
        alert('Failed to update obligation count.');
      }
    }
    setIsObligationModalOpen(false);
    setEditingApp(null);
  };

  const handlePromoteApps = async () => {
    const upNextApps = apps.filter(app => app.fields.Status === 'Up Next').slice(0, 8);
    const currentlyFeaturedApps = apps.filter(app => app.fields.Status === 'Currently Featured');
    if (upNextApps.length === 0) {
      alert("There are no apps in the 'Up Next' column to promote.");
      return;
    }
    let startDate, endDate;
    const currentRotationStart = currentlyFeaturedApps.length > 0 ? moment(currentlyFeaturedApps[0].fields['Start Date']) : null;
    if (currentRotationStart && currentRotationStart.isValid()) {
        startDate = currentRotationStart.clone().add(14, 'days');
    } else {
        const today = moment();
        startDate = today.clone().day(5);
        if (startDate.isBefore(today, 'day')) {
            startDate.add(1, 'week');
        }
    }
    endDate = startDate.clone().add(13, 'days');
    const updates = [];
    currentlyFeaturedApps.forEach(app => {
      updates.push({ id: app.id, fields: { 'Status': null } });
    });
    upNextApps.forEach(app => {
      updates.push({
        id: app.id,
        fields: {
          'Status': 'Currently Featured',
          'Start Date': startDate.format('YYYY-MM-DD'),
          'End Date': endDate.format('YYYY-MM-DD'),
          'Featured Count': (app.fields['Featured Count'] || 0) + 1
        }
      });
    });
    try {
      for (let i = 0; i < updates.length; i += 10) {
        const chunk = updates.slice(i, i + 10);
        await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(chunk);
      }
      fetchApps();
    } catch (err) {
      console.error(err);
      alert('An error occurred during promotion.');
    }
  };

  const currentlyFeaturedApps = apps.filter(app => app.fields.Status === 'Currently Featured');
  const upNextApps = apps.filter(app => app.fields.Status === 'Up Next');
  const backlogApps = apps.filter(app => app.fields.Status === 'Backlog');

  let currentRotationDates = null;
  const currentRotationStartObj = currentlyFeaturedApps.length > 0 ? moment(currentlyFeaturedApps[0].fields['Start Date']) : null;
  if (currentRotationStartObj && currentRotationStartObj.isValid()) {
    currentRotationDates = {
      start: currentRotationStartObj.format('MM/DD/YY'),
      end: moment(currentlyFeaturedApps[0].fields['End Date']).format('MM/DD/YY'),
    };
  }
  
  let nextRotationDates;
  if (currentRotationStartObj && currentRotationStartObj.isValid()) {
    const nextStartDate = currentRotationStartObj.clone().add(14, 'days');
    nextRotationDates = {
        start: nextStartDate.format('MM/DD/YY'),
        end: nextStartDate.clone().add(13, 'days').format('MM/DD/YY'),
    };
  } else {
    const today = moment();
    const nextFriday = today.clone().day(5);
    if (nextFriday.isBefore(today, 'day')) {
        nextFriday.add(1, 'week');
    }
    nextRotationDates = {
        start: nextFriday.format('MM/DD/YY'),
        end: nextFriday.clone().add(13, 'days').format('MM/DD/YY'),
    };
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="app-container">
        <div className="main-header">
          <h1>Featured Apps Manager</h1>
        </div>
        <div className="main-content">
          <div className="column">
            <div className="column-header">
              <h2>Currently Featured ({currentlyFeaturedApps.length})</h2>
            </div>
            <CurrentlyFeatured
              apps={currentlyFeaturedApps}
              onUpdateObligation={handleUpdateObligation}
              displayDates={currentRotationDates}
            />
          </div>
          <div className="column">
            <div className="column-header">
              <h2>Up Next ({upNextApps.length})</h2>
              <button className="promote-button" onClick={handlePromoteApps}>Promote</button>
            </div>
            <UpNext
              apps={upNextApps}
              onUpdateObligation={handleUpdateObligation}
              displayDates={nextRotationDates}
            />
          </div>
          <div className="column">
            <div className="column-header">
              <h2>Backlog ({backlogApps.length})</h2>
              <SearchToAdd apps={apps} onAppAdded={fetchApps} />
            </div>
            <Backlog apps={backlogApps} onRemove={handleRemoveFromBacklog} />
          </div>
        </div>

        <div className="footer-actions">
            {/* The button now opens the modal */}
            <button className="add-one-button" onClick={() => setIsAddOneModalOpen(true)}>+ Add One App</button>
            <CSVUploader apps={apps} onUploadSuccess={fetchApps} />
        </div>
      </div>

      <DragOverlay>
        {activeApp ? (
          <div className="dragging-card-overlay">
            <AppCard app={activeApp} listType={activeApp.fields.Status} />
          </div>
        ) : null}
      </DragOverlay>

      {isObligationModalOpen && (
        <div className="modal-overlay">
          <UpdateObligationForm
            app={editingApp}
            onSubmit={submitUpdateObligation}
            onCancel={() => setIsObligationModalOpen(false)}
          />
        </div>
      )}
      
      {/* Add the modal for adding one app */}
      {isAddOneModalOpen && (
          <AddOneApp 
            onAppAdded={handleCreateOneApp}
            onCancel={() => setIsAddOneModalOpen(false)}
          />
      )}
    </DndContext>
  );
}

export default FeaturedAppsManager;