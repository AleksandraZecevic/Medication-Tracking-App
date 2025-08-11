import React, { useEffect, useState } from "react";
import "./CgHome.css";

const API_URL = process.env.REACT_APP_API_URL || "http://88.200.63.148:2004";

export default function CgHome({ cg, onLogout }) {
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState("info");

  // Form states for editing user info
  const [editName, setEditName] = useState(cg.name || "");
  const [editLastname, setEditLastname] = useState(cg.lastname || "");
  const [editEmail, setEditEmail] = useState(cg.email || "");
  const [editPassword, setEditPassword] = useState(""); // optional if not changing password
  const [editRole, setEditRole] = useState(cg.role || "");
  const [editLanguage, setEditLanguage] = useState(cg.language_pref || "");

  // Caregiver profile state and loading/error
  const [cgProfile, setcgProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    licence_num: "",
    specialization: "",
  });

  // Load caregiver profile on mount or when cg.user_id changes
  useEffect(() => {
    async function fetchProfile() {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const res = await fetch(`${API_URL}/caregiver/${cg.user_id}`);
        if (res.ok) {
          const data = await res.json();
          setcgProfile(data);
          setAddingProfile(false);
        } else if (res.status === 404) {
          setcgProfile(null);
          setAddingProfile(true);
        } else {
          throw new Error("Failed to load profile");
        }
      } catch (err) {
        setProfileError(err.message);
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [cg.user_id]);

  // Handle input change for caregiver profile form
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit caregiver profile form
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    try {
      const res = await fetch(`${API_URL}/caregiver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: cg.user_id,
          certification: profileForm.licence_num,
          care_center_name: profileForm.specialization,
        }),
      });
      if (res.ok) {
        alert("Caregiver profile added successfully!");
        setAddingProfile(false);
        // reload profile
        const profileRes = await fetch(`${API_URL}/caregiver/${cg.user_id}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setcgProfile(profileData);
        }
      } else {
        const text = await res.text();
        setProfileError(text);
      }
    } catch (err) {
      setProfileError(err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Are you sure you want to DELETE your account? This action cannot be undone.")) return;

    try {
      const res = await fetch(`${API_URL}/user/${cg.user_id}`, {
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

  const handleUpdateUser = async () => {
    const updatedUser = {
      name: editName,
      lastname: editLastname,
      email: editEmail,
      password: editPassword || cg.password, // keep old password if unchanged
      role: editRole,
      language_pref: editLanguage,
    };

    try {
      const res = await fetch(`${API_URL}/user/${cg.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      if (res.ok) {
        const result = await res.json();
        alert("User updated successfully!");
        console.log("Updated user:", result);
        setShowSettings(false);
      } else {
        const errMsg = await res.text();
        alert(`Failed to update user: ${errMsg}`);
      }
    } catch (err) {
      alert("Error updating user: " + err.message);
    }
  };

  return (
    <div className="page cg-home">
      <div className="cg-header user-header">
        <h1 className="title">Welcome, {cg.name}</h1>
        <div className="user-header-buttons">
          <button className="button settings" onClick={() => setShowSettings((prev) => !prev)}>
            Settings
          </button>
          <button className="button logout" onClick={onLogout}>
            Logout
          </button>
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

          <button className="button delete-btn" onClick={handleDeleteUser}>
            Delete User Account
          </button>

          <button className="button cancel" onClick={() => setShowSettings(false)}>
            Close
          </button>
        </div>
      )}

      <div className="menu" style={{ marginBottom: 20 }}>
        <button
          className={`button primary ${view === "info" ? "active" : ""}`}
          onClick={() => setView("info")}
        >
          Info
        </button>
        <button
          className={`button primary ${view === "prescriptions" ? "active" : ""}`}
          onClick={() => setView("prescriptions")}
          disabled={addingProfile} // disable if no profile yet
          title={addingProfile ? "Add your info first" : ""}
        >
          Manage Patients
        </button>
      </div>

      {view === "info" && (
        <>
          {loadingProfile && <p>Loading profile...</p>}
          {profileError && <p className="error">{profileError}</p>}

          {!loadingProfile && !addingProfile && cgProfile && (
            <div className="hw-profile">
              <h2>Your Profile</h2>
              <p>
                <strong>Certification:</strong> {cgProfile.certification}
              </p>
              <p>
                <strong>Care Center Name:</strong> {cgProfile.care_center_name}
              </p>
            </div>
          )}

          {!loadingProfile && addingProfile && (
            <form onSubmit={handleProfileSubmit} className="hw-profile-form">
              <h2>Add Your Caregiver Info</h2>
              {profileError && <p className="error">{profileError}</p>}
              <label>
                Certification:
                <input
                  name="certification"
                  value={profileForm.certification}
                  onChange={handleProfileChange}
                  required
                />
              </label>
              <label>
                Care Center Name:
                <input
                  name="care_center_name"
                  value={profileForm.care_center_name}
                  onChange={handleProfileChange}
                  required
                />
              </label>

              <button type="submit" className="button primary">
                Save Info
              </button>
            </form>
          )}
        </>
      )}

      {view === "prescriptions" && (
        <div>
          {/* Your Manage Patients UI or component here */}
          <p>Manage Patients view coming soon...</p>
        </div>
      )}
    </div>
  );
}
