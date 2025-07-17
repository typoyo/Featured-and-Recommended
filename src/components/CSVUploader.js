import React, { useState } from 'react';
import Papa from 'papaparse';
import base from '../airtable';

function CSVUploader({ apps, onUploadSuccess }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleProcessUpload = () => {
        if (!selectedFile) {
            alert("Please select a file first.");
            return;
        }

        setIsUploading(true);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim(),
            complete: async (results) => {
                const recordsToUpdate = [];
                
                // Create a map of existing apps by their unique App ID for efficient lookups
                const existingAppIds = new Map(
                    apps.map(app => [app.fields['App ID'], app])
                );

                for (const row of results.data) {
                    const appId = row['App ID']?.trim();

                    // If there's no App ID, we can't do anything, so skip.
                    if (!appId) continue;
                    
                    const existingApp = existingAppIds.get(appId);

                    // --- NEW: Only proceed if the app already exists ---
                    if (existingApp) {
                        const fieldsToUpdate = {};

                        // Add fields to the update object only if they exist in the CSV row
                        if (row['App Name']) fieldsToUpdate['App Name'] = row['App Name'].trim();
                        if (row['Partner Manager Name']) fieldsToUpdate['Partner Manager Name'] = row['Partner Manager Name'];
                        
                        const imageUrl = row['Image URL']?.trim();
                        // Only add the image URL if it's valid and not just a base path
                        if (imageUrl && !imageUrl.endsWith('/')) {
                            fieldsToUpdate['Image URL'] = imageUrl;
                        }

                        // Only add to the update list if there is at least one field to change
                        if (Object.keys(fieldsToUpdate).length > 0) {
                            recordsToUpdate.push({
                                id: existingApp.id,
                                fields: fieldsToUpdate,
                            });
                        }
                    }
                    // If the app does not exist, do nothing.
                }
                
                const uniqueRecordsToUpdate = Array.from(new Map(recordsToUpdate.map(record => [record.id, record])).values());

                try {
                    if (uniqueRecordsToUpdate.length > 0) {
                        for (let i = 0; i < uniqueRecordsToUpdate.length; i += 10) {
                            const chunk = uniqueRecordsToUpdate.slice(i, i + 10);
                            await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(chunk);
                        }
                    }

                    alert(`Upload complete! \n- ${uniqueRecordsToUpdate.length} existing apps updated. \n- No new apps were created.`);
                    
                } catch (err) {
                    console.error(err);
                    alert(`An error occurred during the upload.`);
                } finally {
                    setIsUploading(false);
                    onUploadSuccess();
                    setIsModalOpen(false);
                    setSelectedFile(null);
                }
            },
        });
    };

    const openModal = () => {
        setSelectedFile(null);
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
                        {isUploading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Uploading, please wait...</p>
                            </div>
                        ) : (
                            <>
                                <h3>Update Existing Apps</h3>
                                <p>Provide a CSV with an "App ID" column to update records. Other columns are optional.</p>
                                <input type="file" accept=".csv" onChange={handleFileSelect} />
                                <div className="form-actions">
                                    <button type="button" className="cancel-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                    <button type="button" className="submit-button" onClick={handleProcessUpload} disabled={!selectedFile}>
                                        Upload File
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default CSVUploader;