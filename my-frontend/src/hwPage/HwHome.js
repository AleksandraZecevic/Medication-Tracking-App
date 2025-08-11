import React, { useEffect, useState } from "react";
import "./HwHome.css";

const API_URL = process.env.REACT_APP_API_URL || "http://88.200.63.148:2004";

export default function HwHome({ hw, onLogout }) {
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState("info"); // "info" or "prescriptions"

  // Profile state
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [hcwProfile, setHcwProfile] = useState(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    licence_num: "",
    specialization: "",
    institution: "",
  });
  const [profileError, setProfileError] = useState("");

  // Prescriptions state
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [filterUserId, setFilterUserId] = useState("");
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);

  // Side effects UI state
  const [sideEffectsMap, setSideEffectsMap] = useState({}); // entry_id => [sideEffects]
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [sideEffectInput, setSideEffectInput] = useState("");

  // for updating
  const [editName, setEditName] = useState(hw.name || "");
  const [editLastname, setEditLastname] = useState(hw.lastname || "");
  const [editEmail, setEditEmail] = useState(hw.email || "");
  const [editPassword, setEditPassword] = useState(""); // optional if not changing password
  const [editRole, setEditRole] = useState(hw.role || "");
  const [editLanguage, setEditLanguage] = useState(hw.language_pref || "");

  const [updateHW, setUpdateHW] = useState(false);
  const [formData, setFormData] = useState({
  licence_num: '',
  specialization: '',
  institution: '',
});

const handleUpdate = async (e) => {
  e.preventDefault();

  const updates = {};

    if (formData.licence_num.trim() !== "") updates.licence_num = formData.licence_num;
    if (formData.specialization.trim() !== "") updates.specialization = formData.specialization;
    if (formData.institution.trim() !== "") updates.institution = formData.institution;

  try {
    const res = await fetch(`${API_URL}/healthcareWorker/${hw.user_id}`, {
      method: 'PUT', // keep PUT since backend expects it
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const err = await res.json();
      alert("Update failed: " + err.error);
      return;
    }

    setUpdateHW(false);
    fetchHcwProfile();
    alert("Healthcare worker updated!");

  } catch (error) {
    alert("Update error: " + error.message);
  }
};

  const fetchHcwProfile = () => {
  setLoadingProfile(true);
  setProfileError("");
  fetch(`${API_URL}/healthcareWorker/${hw.user_id}`)
    .then(async (res) => {
      if (res.status === 404) {
        setHcwProfile(null);
        setAddingProfile(true);
        setLoadingProfile(false);
        return null;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch profile");
      }
      return res.json();
    })
    .then((data) => {
      if (data) {
        setHcwProfile(data);
        setProfileForm({
          licence_num: data.licence_num || data.license_num || "",
          specialization: data.specialization || "",
          institution: data.institution || "",
        });
        setAddingProfile(false);
      }
    })
    .catch((err) => {
      setProfileError("Error loading profile: " + err.message);
      setHcwProfile(null);
      setAddingProfile(true);
    })
    .finally(() => setLoadingProfile(false));
};

// run on mount or user_id change
useEffect(() => {
  fetchHcwProfile();
}, [hw.user_id]);

  // Fetch prescriptions when switching to "prescriptions" view or after profile is loaded
  useEffect(() => {
    if (view !== "prescriptions") return;
    if (!hcwProfile && !addingProfile) return;

    setLoadingPrescriptions(true);
    // Use licence_num or license_num as prescribed_by
    const prescribedBy = hcwProfile?.licence_num || hcwProfile?.license_num || "";
    fetch(`${API_URL}/medentry/by-doctor/${hw.user_id}`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch prescriptions");
        }
        return res.json();
      })
      .then((data) => {
        setPrescriptions(data);
        setFilteredPrescriptions(data);
      })
      .catch((err) => {
        alert("Error loading prescriptions: " + err.message);
        setPrescriptions([]);
        setFilteredPrescriptions([]);
      })
      .finally(() => setLoadingPrescriptions(false));
  }, [view, hcwProfile, addingProfile]);

  // Filter prescriptions by user_id
  useEffect(() => {
    if (!filterUserId.trim()) {
      setFilteredPrescriptions(prescriptions);
    } else {
      setFilteredPrescriptions(
        prescriptions.filter((p) => p.user_id.toString().includes(filterUserId.trim()))
      );
    }
  }, [filterUserId, prescriptions]);

  // Fetch side effects for a given medication entry
function fetchSideEffects(entry_id) {
  fetch(`${API_URL}/sideeffect/entry_id/${entry_id}`)
    .then((res) => res.json())
    .then((effects) => {
      setSideEffectsMap((prev) => ({
        ...prev,
        [entry_id]: Array.isArray(effects) ? effects : [], // force array
      }));
    })
    .catch(() => {
      setSideEffectsMap((prev) => ({ ...prev, [entry_id]: [] }));
    });
}
  // Toggle side effects popup for an entry
  function toggleSideEffects(entry_id) {
    if (selectedEntryId === entry_id) {
      setSelectedEntryId(null);
    } else {
      setSelectedEntryId(entry_id);
      fetchSideEffects(entry_id);
      setSideEffectInput("");
    }
  }

  // Handle side effect input change
  function handleSideEffectInputChange(e) {
    setSideEffectInput(e.target.value);
  }

  // Add side effect to an entry
function handleAddSideEffect(entry_id) {
  const desc = sideEffectInput.trim();
  if (!desc) return alert("Please enter a side effect description");

  fetch(`${API_URL}/sideeffect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entry_id,       // required: the medication entry id
      description: desc, // required: the side effect text
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to add side effect");
      // Refresh side effects list after adding
      fetchSideEffects(entry_id);
      setSideEffectInput("");
    })
    .catch((err) => alert(err.message));
}

  // Handle profile form input changes
  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfileForm((f) => ({ ...f, [name]: value }));
  }

  // Submit new profile info
  function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError("");

    const { licence_num, specialization, institution } = profileForm;
    if (!licence_num.trim() || !specialization.trim() || !institution.trim()) {
      setProfileError("Please fill all fields");
      return;
    }

    fetch(`${API_URL}/healthcareWorker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: hw.user_id,
        licence_num: licence_num.trim(),
        specialization: specialization.trim(),
        institution: institution.trim(),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to save profile");
        }
        alert("Profile saved successfully");
        // Reload profile after save
        setLoadingProfile(true);
        setAddingProfile(false);
        return fetch(`${API_URL}/healthcareWorker/${hw.user_id}`).then((r) => r.json());
      })
      .then((data) => {
        setHcwProfile(data);
        setProfileForm({
          licence_num: data.licence_num || data.license_num || "",
          specialization: data.specialization || "",
          institution: data.institution || "",
        });
      })
      .catch((err) => {
        setProfileError("Error saving profile: " + err.message);
      })
      .finally(() => setLoadingProfile(false));
  }

  const handleDeleteUser = async () => {
  if (!window.confirm("Are you sure you want to DELETE your account? This action cannot be undone.")) return;

  try {
    const res = await fetch(`http://88.200.63.148:2004/user/${hw.user_id}`, {
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
    password: editPassword || hw.password, // keep old password if unchanged
    role: editRole,
    language_pref: editLanguage
  };

  try {
    const res = await fetch(`http://88.200.63.148:2004/user/${hw.user_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser)
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


// RETURN ----------------------------------
// --------------------------------------------
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
          Manage Prescriptions
        </button>
      </div>

      {view === "info" && (
        <>
          {loadingProfile && <p>Loading profile...</p>}
          {profileError && <p className="error">{profileError}</p>}

          {!loadingProfile && !addingProfile && hcwProfile && (
            <div className="hw-profile">
              <h2>Your Profile</h2>
              <p><strong>Licence Number:</strong> {hcwProfile.licence_num || hcwProfile.license_num}</p>
              <p><strong>Specialization:</strong> {hcwProfile.specialization}</p>
              <p><strong>Institution:</strong> {hcwProfile.institution}</p>
              <button onClick={() => setUpdateHW(true)} className="button primary">Update info</button>
            </div>
          )}

          {updateHW && (
      <form
        className="hw-profile-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setUpdateHW(false);
        }}
      >
        <label>
          Licence Number:
          <input
            type="text"
            value={formData.licence_num}
            onChange={(e) => setFormData({ ...formData, licence_num: e.target.value })}
          />
        </label>
        <label>
          Specialization:
          <input
            type="text"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
          />
        </label>
        <label>
          Institution:
          <input
            type="text"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
          />
        </label>

        <div className="form-buttons">
          <button onClick={handleUpdate} type="submit" className="button primary" >Save</button>
          <button
            type="button"
            className="button cancel"
            onClick={() => setUpdateHW(false)}>Cancel</button>
        </div>
      </form>
    )}

          {!loadingProfile && addingProfile && (
            <form onSubmit={handleProfileSubmit} className="hw-profile-form">
              <h2>Add Your Healthcare Worker Info</h2>
              {profileError && <p className="error">{profileError}</p>}
              <label>
                Licence Number:
                <input
                  name="licence_num"
                  value={profileForm.licence_num}
                  onChange={handleProfileChange}
                  required
                />
              </label>
              <label>
                Specialization:
                <input
                  name="specialization"
                  value={profileForm.specialization}
                  onChange={handleProfileChange}
                  required
                />
              </label>
              <label>
                Institution:
                <input
                  name="institution"
                  value={profileForm.institution}
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
      {}

      {view === "prescriptions" && (
        <>
          {loadingPrescriptions && <p>Loading prescriptions...</p>}
          {!loadingPrescriptions && (
            <>
              <label style={{ marginBottom: 10, display: "block" }}>
                Filter by User ID:{" "}
                <input
                  type="text"
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  placeholder="Enter user ID"
                />
              </label>

              {filteredPrescriptions.length === 0 ? (
                <p>No prescriptions found.</p>
              ) : (
                <ul className="med-list">
                  {filteredPrescriptions.map((entry) => (
                    <li key={entry.entry_id} className="med-entry-box">
                      <div className="med-entry-header">
                        <strong>Entry ID:</strong> {entry.entry_id}
                      </div>
                      <div className="med-entry-content">
                        <p><strong>User ID:</strong> {entry.user_id}</p>
                        <p><strong>Medication ID:</strong> {entry.med_id}</p>
                        <p><strong>Prescribed By:</strong> {entry.prescribed_by}</p>
                        <p><strong>Purchase Date:</strong> {new Date(entry.purchase_date).toLocaleDateString()}</p>
                        <p><strong>Expiration Date:</strong> {new Date(entry.expiration_date).toLocaleDateString()}</p>

                        <button
                          className="button small"
                          onClick={() => toggleSideEffects(entry.entry_id)}
                        >
                          Side Effects ({sideEffectsMap[entry.entry_id]?.length || 0})
                        </button>

                        {selectedEntryId === entry.entry_id && (
                          <div className="side-effects-popup">
                            <ul>
                              {(Array.isArray(sideEffectsMap[entry.entry_id]) 
                                ? sideEffectsMap[entry.entry_id] 
                                : []
                               ).map(effect => (
                                        <div key={effect.se_id}>{effect.description}</div>
                              ))}
                            </ul>
                            <input
                              type="text"
                              placeholder="Add side effect"
                              value={sideEffectInput}
                              onChange={handleSideEffectInputChange}
                            />
                            <button
                              className="button small"
                              onClick={() => handleAddSideEffect(entry.entry_id)}
                            >
                              Add
                            </button>
                            <button
                              className="button small cancel"
                              onClick={() => setSelectedEntryId(null)}
                            >
                              Close
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
