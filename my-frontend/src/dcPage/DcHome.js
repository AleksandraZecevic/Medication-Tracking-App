import React, { useEffect, useState } from "react";
import "./DcHome.css";

const API_URL = process.env.REACT_APP_API_URL || "http://88.200.63.148:2004";

export default function DcHome({ dc, onLogout }) {
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState("info");

  // User account editing form states
  const [editName, setEditName] = useState(dc.name || "");
  const [editLastname, setEditLastname] = useState(dc.lastname || "");
  const [editEmail, setEditEmail] = useState(dc.email || "");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState(dc.role || "");
  const [editLanguage, setEditLanguage] = useState(dc.language_pref || "");

  // Donation Center profile states
  const [dcProfile, setDcProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [addingProfile, setAddingProfile] = useState(false);

  // Form state for adding/editing donation center profile
  const [profileForm, setProfileForm] = useState({
    center_name: "",
    address: "",
    verification_status: "",
  });

  // Editing mode for profile update
  const [updatingDc, setUpdatingDc] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    center_name: "",
    address: "",
    verification_status: "",
  });

  const refreshDcProfile = async () => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const res = await fetch(`${API_URL}/donationCenter/${dc.user_id}`);
      if (res.ok) {
        const data = await res.json();
        setDcProfile(data);
        setAddingProfile(false);
      } else if (res.status === 404) {
        setDcProfile(null);
        setAddingProfile(true);
      } else {
        throw new Error("Failed to load profile");
      }
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Fetch Donation Center profile on mount or when dc.user_id changes
  useEffect(() => {
    refreshDcProfile();
  }, [dc.user_id]);


  // Handle profile form change (both add & update)
 const handleProfileChange = (e) => {
  const { name, value } = e.target;

  // For updating the profile form only, but applies to both add & update forms
  if (updatingDc) {
    setUpdateForm((prev) => ({
      ...prev,
      [name]: name === "verification_status" ? Number(value) : value,
    }));
  } else {
    setProfileForm((prev) => ({
      ...prev,
      [name]: name === "verification_status" ? Number(value) : value,
    }));
  }
};

  // Submit new profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    try {
      const res = await fetch(`${API_URL}/donationCenter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: dc.user_id,
          center_name: profileForm.center_name,
          address: profileForm.address,
          verification_status: profileForm.verification_status,
        }),
      });
      if (res.ok) {
        alert("Donation Center profile added successfully!");
        setAddingProfile(false);
        setProfileForm({ center_name: "", address: "", verification_status: "" });
        await refreshDcProfile();
      } else {
        const text = await res.text();
        setProfileError(text);
      }
    } catch (err) {
      setProfileError(err.message);
    }
  };

  // Submit update to profile
  const handleUpdateDcProfile = async (e) => {
    e.preventDefault();
    const updates = {};
    if (updateForm.center_name.trim() !== "") updates.center_name = updateForm.center_name;
    if (updateForm.address.trim() !== "") updates.address = updateForm.address;
   if (updateForm.verification_status === 0 || updateForm.verification_status === 1) {
  updates.verification_status = updateForm.verification_status;
}

    try {
      const res = await fetch(`${API_URL}/donationCenter/${dc.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.text();
        alert("Update failed: " + err);
        return;
      }

      await refreshDcProfile();
      setUpdatingDc(false);
      setUpdateForm({ center_name: "", address: "", verification_status: "" });
      alert("Donation Center updated successfully!");
    } catch (err) {
      alert("Error updating donation center: " + err.message);
    }
  };

  // User account update handlers (same as CgHome)
  const handleUpdateUser = async () => {
    const updatedUser = {
      name: editName,
      lastname: editLastname,
      email: editEmail,
      password: editPassword || dc.password,
      role: editRole,
      language_pref: editLanguage,
    };

    try {
      const res = await fetch(`${API_URL}/user/${dc.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      if (res.ok) {
        const result = await res.json();
        alert("User updated successfully!");
        setShowSettings(false);
      } else {
        const errMsg = await res.text();
        alert(`Failed to update user: ${errMsg}`);
      }
    } catch (err) {
      alert("Error updating user: " + err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Are you sure you want to DELETE your account? This action cannot be undone.")) return;

    try {
      const res = await fetch(`${API_URL}/user/${dc.user_id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("User account deleted. Logging out.");
        setShowSettings(false);
        onLogout();
      } else {
        alert("Failed to delete user.");
      }
    } catch (err) {
      alert("Error deleting user: " + err.message);
    }
  };

  //  RETURN  -----------------
  // -------------------------------

  if (!dc || !dc.name) {
    return (
        <p>loading...</p>
    );
  }

  return (
    <div className="page dc-home">
      <div className="dc-header user-header">
        <h1 className="title">Welcome, {dc.name}</h1>
        <div className="user-header-buttons">
          <button className="button settings" onClick={() => setShowSettings((prev) => !prev)}>Settings</button>
          <button className="button logout" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-modal">
          <h3>Update Account</h3>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="First Name"
          />
          <input
            type="text"
            value={editLastname}
            onChange={(e) => setEditLastname(e.target.value)}
            placeholder="Last Name"
          />
          <input
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="New Password (optional)"
          />
          <input
            type="text"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            placeholder="Role"
          />
          <input
            type="text"
            value={editLanguage}
            onChange={(e) => setEditLanguage(e.target.value)}
            placeholder="Language"
          />

          <button onClick={handleUpdateUser}>Save Changes</button>
          <button onClick={() => setShowSettings(false)}>Cancel</button>

          <hr />

          <button className="button delete-btn" onClick={handleDeleteUser}>Delete User Account</button>
          <button className="button cancel" onClick={() => setShowSettings(false)}>Close</button>
        </div>
      )}

      <div className="menu" style={{ marginBottom: 20 }}>
        <button
          className={`button primary ${view === "info" ? "active" : ""}`}
          onClick={() => setView("info")}
        >
          Info
        </button>
        
      </div>

      {view === "info" && (
        <>
          {loadingProfile && <p>Loading profile...</p>}
          {profileError && <p className="error">{profileError}</p>}

          {!loadingProfile && !addingProfile && dcProfile && !updatingDc && (
            <div className="dc-profile">
              <h2>Your Profile</h2>
              <p><strong>Center Name:</strong> {dcProfile.center_name}</p>
              <p><strong>Address:</strong> {dcProfile.address}</p>
              <p><strong>Verification Status:</strong> {dcProfile.verification_status}</p>
              <button
                className="button primary"
                onClick={() => {
                  setUpdateForm({
                    center_name: dcProfile.center_name || "",
                    address: dcProfile.address || "",
                    verification_status: dcProfile.verification_status || "",
                  });
                  setUpdatingDc(true);
                }}
              >
                Update Info
              </button>
            </div>
          )}

          {!loadingProfile && addingProfile && !updatingDc && (
            <form onSubmit={handleProfileSubmit} className="dc-profile-form">
              <h2>Add Your Donation Center Info</h2>
              {profileError && <p className="error">{profileError}</p>}
              <label>
                Center Name:
                <input
                  name="center_name"
                  value={profileForm.center_name}
                  onChange={handleProfileChange}
                  required
                />
              </label>
              <label>
                Address:
                <input
                  name="address"
                  value={profileForm.address}
                  onChange={handleProfileChange}
                  required
                />
              </label>
              <label>
                Verification Status:
                <input
                  name="verification_status"
                  value={profileForm.verification_status}
                  onChange={handleProfileChange}
                  required
                />
              </label>

              <button type="submit" className="button primary">Save Info</button>
            </form>
          )}

          {updatingDc && (
            <form onSubmit={handleUpdateDcProfile} className="dc-profile-form">
              <label>
                Center Name:
                <input
                  name="center_name"
                  value={updateForm.center_name}
                  onChange={handleProfileChange}
                />
              </label>
              <label>
                Address:
                <input
                  name="address"
                  value={updateForm.address}
                  onChange={handleProfileChange}
                />
              </label>
                  <label>
        Verification Status:
        <select
          name="verification_status"
          value={updateForm.verification_status}
          onChange={handleProfileChange}
          required
        >
          <option value={1}>Verified</option>
          <option value={0}>Not Verified</option>
        </select>
      </label>
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setUpdatingDc(false)}>Cancel</button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
