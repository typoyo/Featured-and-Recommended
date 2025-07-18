import React, { useState } from 'react';
import Papa from 'papaparse';
import base from '../airtable'; // Corrected path

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
        const ignoreKeywords = ['dev', 'staging', 'preproduction', 'qa', 'preprod', 'private', 'sandbox'];

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim(),
            complete: async (results) => {
                const recordsToCreate = [];
                const recordsToUpdate = [];
                const existingAppIds = new Map(apps.map(app => [app.fields['App ID'], app]));

                for (const row of results.data) {
                    const appName = row['App Name']?.trim();
                    const appId = row['App ID']?.trim();

                    if (!appName || !appId) continue;

                    const lowercasedAppName = appName.toLowerCase();
                    const containsIgnoreKeyword = ignoreKeywords.some(keyword => lowercasedAppName.includes(keyword));
                    if (containsIgnoreKeyword) continue;
                    
                    const existingApp = existingAppIds.get(appId);

                    if (existingApp) {
                        const fieldsToUpdate = {};
                        if (row['App Name']) fieldsToUpdate['App Name'] = appName;
                        if (row['Partner Manager Name']) fieldsToUpdate['Partner Manager Name'] = row['Partner Manager Name'];
                        
                        const imageUrl = row['Image URL']?.trim();
                        if (imageUrl && !imageUrl.endsWith('/')) {
                            fieldsToUpdate['Image URL'] = imageUrl;
                        }

                        if (Object.keys(fieldsToUpdate).length > 0) {
                            recordsToUpdate.push({
                                id: existingApp.id,
                                fields: fieldsToUpdate,
                            });
                        }
                    } else {
                        const imageUrl = row['Image URL']?.trim();
                        if (imageUrl && !imageUrl.endsWith('/')) {
                             recordsToCreate.push({
                                fields: {
                                    'App Name': appName,
                                    'App ID': appId,
                                    'Partner Manager Name': row['Partner Manager Name'],
                                    'Image URL': imageUrl,
                                    'Featured Count': 0,
                                    'Feature Obligation': 1,
                                },
                            });
                        }
                    }
                }
                
                const uniqueRecordsToUpdate = Array.from(new Map(recordsToUpdate.map(record => [record.id, record])).values());

                try {
                    if (recordsToCreate.length > 0) {
                        for (let i = 0; i < recordsToCreate.length; i += 10) {
                            const chunk = recordsToCreate.slice(i, i + 10);
                            await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).create(chunk);
                        }
                    }
                    if (uniqueRecordsToUpdate.length > 0) {
                        for (let i = 0; i < uniqueRecordsToUpdate.length; i += 10) {
                            const chunk = uniqueRecordsToUpdate.slice(i, i + 10);
                            await base(process.env.REACT_APP_AIRTABLE_TABLE_NAME).update(chunk);
                        }
                    }

                    alert(`Upload complete! \n- ${recordsToCreate.length} new apps created. \n- ${uniqueRecordsToUpdate.length} existing apps updated.`);
                    
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
                                <h3>Update or Create Apps</h3>
                                <p>Provide a CSV with an "App ID" column to update records. New apps require an "Image URL".</p>
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