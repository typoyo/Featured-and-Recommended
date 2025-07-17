import React, { useState } from 'react';
import Papa from 'papaparse';
import base from '../airtable';

function CSVUploader({ apps, onUploadSuccess }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Create a map of existing apps for quick lookups by name.
      // We store the whole app object to get its Airtable ID for updates.
      const existingAppsMap = new Map(
        apps.map(app => [app.fields['App Name']?.toLowerCase(), app])
      );

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        complete: async (results) => {
          const recordsToCreate = [];
          const recordsToUpdate = [];

          // Separate CSV rows into 'create' and 'update' lists
          for (const row of results.data) {
            const appName = row['App Name']?.trim();
            const lowercasedAppName = appName?.toLowerCase();
            const existingApp = existingAppsMap.get(lowercasedAppName);

            if (existingApp) {
              // If the app exists, prepare an update record
              recordsToUpdate.push({
                id: existingApp.id,
                fields: {
                  'Image URL': row['Image URL'],
                },
              });
            } else {
              // If the app is new, prepare a create record
              recordsToCreate.push({
                fields: {
                  'App Name': appName,
                  'App ID': row['App ID'],
                  'Partner Manager Name': row['Partner Manager Name'],
                  'Image URL': row['Image URL'],
                  'Featured Count': 0,
                  'Feature Obligation': 1,
                },
              });
            }
          }

          try {
            // Perform create operations in batches of 10
            if (recordsToCreate.length > 0) {
              for (let i = 0; i < recordsToCreate.length; i += 10) {
                const chunk = recordsToCreate.slice(i, i + 10);
                await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).create(chunk);
              }
            }
            
            // Perform update operations in batches of 10
            if (recordsToUpdate.length > 0) {
              for (let i = 0; i < recordsToUpdate.length; i += 10) {
                const chunk = recordsToUpdate.slice(i, i + 10);
                await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(chunk);
              }
            }

            // Provide a summary to the user
            alert(`Upload complete! \n- ${recordsToCreate.length} new apps created. \n- ${recordsToUpdate.length} existing apps updated.`);
            onUploadSuccess(); // Refresh all app data
            setIsModalOpen(false);

          } catch (err) {
            console.error(err);
            alert(`An error occurred during the upload.`);
          }
        },
      });
    };

    return (
      <>
        <button className="upload-button" onClick={() => setIsModalOpen(true)}>
          Upload CSV
        </button>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Upload New Apps CSV</h3>
              <p>Include "App Name", "App ID", "Partner Manager Name", and "Image URL" columns.</p>
              <input type="file" accept=".csv" onChange={handleFileUpload} />
              <button className="modal-close-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
      </>
    );
}

export default CSVUploader;