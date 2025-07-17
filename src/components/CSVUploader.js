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

        const ignoreKeywords = ['dev', 'staging', 'preproduction', 'qa', 'preprod', 'private', 'sandbox'];

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim(),
            complete: async (results) => {
                const recordsToCreate = [];
                const recordsToUpdate = [];
                
                const existingAppNames = new Map(
                    apps.map(app => [app.fields['App Name']?.toLowerCase(), app])
                );
                const existingAppIds = new Map(
                    apps.map(app => [app.fields['App ID'], app])
                );

                for (const row of results.data) {
                    const appName = row['App Name']?.trim();
                    const appId = row['App ID']?.trim();
                    const imageUrl = row['Image URL']?.trim();

                    if (!appName || !appId) continue;

                    // --- NEW: Skip if the Image URL is incomplete ---
                    if (!imageUrl || imageUrl.endsWith('/')) {
                        continue;
                    }

                    const lowercasedAppName = appName.toLowerCase();

                    const containsIgnoreKeyword = ignoreKeywords.some(keyword => lowercasedAppName.includes(keyword));
                    if (containsIgnoreKeyword) {
                        continue; 
                    }

                    let existingApp = existingAppIds.get(appId) || existingAppNames.get(lowercasedAppName);

                    if (existingApp) {
                        recordsToUpdate.push({
                            id: existingApp.id,
                            fields: {
                                'App Name': appName,
                                'Partner Manager Name': row['Partner Manager Name'],
                                'Image URL': imageUrl,
                            },
                        });
                    } else {
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
                                <h3>Upload New Apps CSV</h3>
                                <p>Include "App Name", "App ID", "Partner Manager Name", and "Image URL" columns.</p>
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