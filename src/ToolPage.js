import React, { useState, useEffect } from 'react';
import FeaturedAppsManager from './FeaturedAppsManager';
import RecommendedApps from './RecommendedApps';
import './ToolPage.css';

function ToolPage() {
  const [activeTab, setActiveTab] = useState('featured');

  useEffect(() => {
    const savedTabState = localStorage.getItem('appManagerTabState');
    if (savedTabState) {
      const { tab, timestamp } = JSON.parse(savedTabState);
      const threeHours = 3 * 60 * 60 * 1000;
      if (Date.now() - timestamp < threeHours) {
        setActiveTab(tab);
      } else {
        localStorage.removeItem('appManagerTabState');
      }
    }
  }, []);

  useEffect(() => {
    const tabState = {
      tab: activeTab,
      timestamp: Date.now()
    };
    localStorage.setItem('appManagerTabState', JSON.stringify(tabState));
  }, [activeTab]);

  return (
    <div className="tool-page-container">
      <div className="tabs-nav">
        <button
          className={activeTab === 'featured' ? 'active' : ''}
          onClick={() => setActiveTab('featured')}
        >
          Featured Apps Manager
        </button>
        <button
          className={activeTab === 'recommended' ? 'active' : ''}
          onClick={() => setActiveTab('recommended')}
        >
          Recommended Apps
        </button>
      </div>
      <div className="tab-content">
        {/* Render both components, but use CSS to show/hide them */}
        <div className={`tab-pane ${activeTab === 'featured' ? 'active' : ''}`}>
          <FeaturedAppsManager />
        </div>
        <div className={`tab-pane ${activeTab === 'recommended' ? 'active' : ''}`}>
          <RecommendedApps />
        </div>
      </div>
    </div>
  );
}

export default ToolPage;