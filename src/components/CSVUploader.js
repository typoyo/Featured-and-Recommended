import React, { useState } from 'react';
import Papa from 'papaparse';
import base from '../airtable';

function CSVUploader({ apps, onUploadSuccess }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    // New: State to hold the selected file
    const [selectedFile, setSelectedFile] = useState(null);

    // This function now just saves the chosen file to state
    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    // This function is now called when the new "Upload" button is clicked
    const handleProcessUpload = () => {
      if (!selectedFile) {
        alert("Please select a file first.");
        return;
      }

      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        complete: async (results) => {
          const recordsToCreate = [];
          const recordsToUpdate = [];
          const existingAppsMap = new Map(
            apps.map(app => [app.fields['App Name']?.toLowerCase(), app])
          );

          for (const row of results.data) {
            const appName = row['App Name']?.trim();
            const lowercasedAppName = appName?.toLowerCase();
            const existingApp = existingAppsMap.get(lowercasedAppName);

            if (existingApp) {
              recordsToUpdate.push({
                id: existingApp.id,
                fields: { 'Image URL': row['Image URL'] },
              });
            } else {
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
            if (recordsToCreate.length > 0) {
              for (let i = 0; i < recordsToCreate.length; i += 10) {
                const chunk = recordsToCreate.slice(i, i + 10);
                await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).create(chunk);
              }
            }
            if (recordsToUpdate.length > 0) {
              for (let i = 0; i < recordsToUpdate.length; i += 10) {
                const chunk = recordsToUpdate.slice(i, i + 10);
                await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(chunk);
              }
            }
            alert(`Upload complete! \n- ${recordsToCreate.length} new apps created. \n- ${recordsToUpdate.length} existing apps updated.`);
            onUploadSuccess();
            setIsModalOpen(false);
            setSelectedFile(null); // Reset the selected file
          } catch (err) {
            console.error(err);
            alert(`An error occurred during the upload.`);
          }
        },
      });
    };
    
    const openModal = () => {
        setSelectedFile(null); // Reset file on modal open
        setIsModalOpen(true);
    };

    return (
      <>
        <button className="upload-button" onClick={openModal}>
          Upload CSV
        </button>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Upload New Apps CSV</h3>
              <p>Include "App Name", "App ID", "Partner Manager Name", and "Image URL" columns.</p>
              <input type="file" accept=".csv" onChange={handleFileSelect} />
              <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  {/* The new submit button */}
                  <button type="button" className="submit-button" onClick={handleProcessUpload} disabled={!selectedFile}>
                    Upload File
                  </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
}

export default CSVUploader;