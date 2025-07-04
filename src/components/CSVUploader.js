import React, { useState } from 'react';
import Papa from 'papaparse';
import base from '../airtable';

function CSVUploader({ apps, onUploadSuccess }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const existingAppNames = new Set(apps.map(app => app.fields['App Name']?.toLowerCase()));

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        complete: async (results) => {
          const allParsedRows = results.data;

          const newRecordsToCreate = allParsedRows.filter(row => {
            const appName = row['App Name']?.toLowerCase();
            return appName && !existingAppNames.has(appName);
          });
          const skippedCount = allParsedRows.length - newRecordsToCreate.length;

          if (skippedCount > 0) {
            alert(`${skippedCount} app(s) were skipped because they already exist.`);
          }
          if (newRecordsToCreate.length === 0) {
            if (skippedCount > 0) alert('No new apps to upload.');
            return;
          }

          const dataToUpload = newRecordsToCreate.map((row) => ({
            fields: {
              'App Name': row['App Name'],
              'App ID': row['App ID'],
              'Partner Manager Name': row['Partner Manager Name'],
              'Featured Count': 0,
              'Feature Obligation': 1,
            },
          }));

          const chunkSize = 10;
          try {
            for (let i = 0; i < dataToUpload.length; i += chunkSize) {
              const chunk = dataToUpload.slice(i, i + 10);
              await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).create(chunk);
            }
            alert(`${dataToUpload.length} new app(s) uploaded successfully!`);
            onUploadSuccess();
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
              <p>Please select a CSV file with "App Name", "App ID", and "Partner Manager Name" columns.</p>
              <input type="file" accept=".csv" onChange={handleFileUpload} />
              <button className="modal-close-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
      </>
    );
}

export default CSVUploader;