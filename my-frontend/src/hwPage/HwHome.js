import React, { useEffect, useState } from "react";
import "./HwHome.css";  // create a separate CSS or reuse styles as needed

export default function HwHome({ hw, onLogout }) {
  const [showSettings, setShowSettings] = useState(false);

  // Placeholder handlers - you'll replace with real functions
  const handleManagePatients = () => alert("Manage Patients clicked");
  const handleReviewSideEffects = () => alert("Review Side Effects clicked");
  const handleManagePrescriptions = () => alert("Manage Prescriptions clicked");
  const handleViewDonations = () => alert("View Donation Requests clicked");
  const handleUpdateUser = () => alert("Update User Info clicked");
  const handleDeleteUser = () => alert("Delete User Account clicked");

  return (
    <div className="page hw-home">
      <div className="hw-header user-header">
        <h1 className="title">Welcome, {hw.name}</h1>
        <div className="user-header-buttons">
          <button
            className="button settings"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            Settings
          </button>
          <button className="button logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-popup">
          <button className="button" onClick={handleUpdateUser}>
            Update User Info
          </button>
          <button className="button delete-btn" onClick={handleDeleteUser}>
            Delete User Account
          </button>
          <button className="button cancel" onClick={() => setShowSettings(false)}>
            Close
          </button>
        </div>
      )}

      <div className="menu">
        <button className="button primary" onClick={handleManagePatients}>
          Manage Patients' Medication Logs
        </button>
        <button className="button primary" onClick={handleReviewSideEffects}>
          Review Side Effects & Allergies
        </button>
        <button className="button primary" onClick={handleManagePrescriptions}>
          Manage Prescriptions
        </button>
        <button className="button primary" onClick={handleViewDonations}>
          View Donation Requests
        </button>
      </div>
    </div>
  );
}
