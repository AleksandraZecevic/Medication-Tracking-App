import React, { useEffect, useState } from "react";
import "./UserHome.css";
import AddMedicationForm from "./AddMedicationForm";
import AddMedicationEntryForm from "./AddMedicationEntryForm";
const API_URL = process.env.REACT_APP_API_URL || "http://88.200.63.148:2004";


export default function UserHome({ user, onLogout }) {
 
  const [allMeds, setAllMeds] = useState([]);
  const [healthcareWorkers, setHealthcareWorkers] = useState([]);
  const [showForm, setShowForm] = useState(null);
  const [showView, setShowView] = useState("shelf");
   const [showSettings, setShowSettings] = useState(false);

  const [newMed, setNewMed] = useState({
    med_id: "",
    name: "",
    type: "",
    intake_instruction: "",
  });

  const [newEntry, setNewEntry] = useState({
    entry_id: "",
    med_id: "",
    purchase_date: "",
    expiration_date: "",
    prescribed_by: null,
    donation_status: 0, // 0 = have, 1 = donation
  });

  // Shelf holds medication entries categorized by status
  const [shelf, setShelf] = useState({
    have: [],
    currently: [],
    past: [],
    donation: [],
  });

  // Maps entry_id to side effects array for quick access
  const [sideEffectsMap, setSideEffectsMap] = useState({});

  // Controls which entry’s side effects list is currently visible inline
  const [sideEffectsVisibleFor, setSideEffectsVisibleFor] = useState(null);

  // New side effect input text
  const [newSideEffectText, setNewSideEffectText] = useState("");

  // Medication ID search filter for "All Medications" view
  const [searchMedId, setSearchMedId] = useState("");

  // Filtered medications based on search input (empty shows all)
  const filteredMeds = allMeds.filter((med) =>
    searchMedId === "" ? true : med.med_id.toString().includes(searchMedId)
  );

  const [remindersForEntry, setRemindersForEntry] = useState({}); // {entry_id: [reminders]}
  const [visibleRemindersEntry, setVisibleRemindersEntry] = useState(null);
  const [reminderInputs, setReminderInputs] = React.useState({
    time: "",
    note: "",
    entryId: null,
  });
  const [showReminderFormFor, setShowReminderFormFor] = React.useState(null);

  const [editName, setEditName] = useState(user.name || "");
  const [editLastname, setEditLastname] = useState(user.lastname || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [editPassword, setEditPassword] = useState(""); // optional if not changing password
  const [editRole, setEditRole] = useState(user.role || "");
  const [editLanguage, setEditLanguage] = useState(user.language_pref || "");

 const setReminder = async (item, time, note) => {
  try {
    // Get next reminder ID first
    const resNextId = await fetch(`${API_URL}/reminder/nextid`);
    if (!resNextId.ok) throw new Error("Failed to get next reminder ID");
    const { nextId } = await resNextId.json();

    // POST the reminder with rem_id, entry_id, time, note
    const res = await fetch(`${API_URL}/reminder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rem_id: nextId,
        entry_id: item.entry_id,
        time,
        note,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to set reminder");
    }

    // Update local reminder state
    setReminder((prev) => ({
      ...prev,
      [item.entry_id]: [...(prev[item.entry_id] || []), { rem_id: nextId, time, note }],
    }));

    // Move from 'have' to 'currently' if needed
    setShelf((prev) => {
      if (prev.currently.some((e) => e.entry_id === item.entry_id)) return prev;
      return {
        ...prev,
        have: prev.have.filter((e) => e.entry_id !== item.entry_id),
        currently: [...prev.currently, item],
      };
    });
   
    alert("Reminder set!"); 

  } catch (err) {
    alert("Failed to set reminder: " + err.message);
  }
};

  const handleDeleteUser = async () => {
  if (!window.confirm("Are you sure you want to DELETE your account? This action cannot be undone.")) return;

  try {
    const res = await fetch(`http://88.200.63.148:2004/user/${user.user_id}`, {
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
    password: editPassword || user.password, // keep old password if unchanged
    role: editRole,
    language_pref: editLanguage
  };

  try {
    const res = await fetch(`http://88.200.63.148:2004/user/${user.user_id}`, {
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

  // Fetch all needed data on component mount and whenever user changes
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch medications, healthcare workers, medication entries for user,
        // side effects for user, and next IDs for meds and entries
        const [medRes, hwRes, entryRes, seRes, nextMedRes, nextEntryRes] =
          await Promise.all([
            fetch("http://88.200.63.148:2004/medication"),
            fetch("http://88.200.63.148:2004/healthcareWorker"),
            fetch(`http://88.200.63.148:2004/medentry/user/${user.user_id}`),
            fetch(`http://88.200.63.148:2004/sideeffect?user_id=${user.user_id}`),
            fetch("http://88.200.63.148:2004/medication/nextid"),
            fetch("http://88.200.63.148:2004/medentry/nextid"),
          ]);
        const meds = await medRes.json();
        const hw = await hwRes.json();
        let entries = await entryRes.json();
        const sideEffects = await seRes.json();
        const nextMedId = await nextMedRes.json();
        const nextEntryId = await nextEntryRes.json();

        setAllMeds(meds);
        setHealthcareWorkers(hw);

        // Build map of entry_id to array of side effects
        const seMap = {};
        sideEffects.forEach((se) => {
          if (!seMap[se.entry_id]) seMap[se.entry_id] = [];
          seMap[se.entry_id].push(se);
        });
        setSideEffectsMap(seMap);

        // Initialize new med and new entry forms with next available IDs
        setNewMed((p) => ({
          ...p,
          med_id: nextMedId.nextId,
          name: "",
          type: "",
          intake_instruction: "",
        }));
        setNewEntry((p) => ({
          ...p,
          entry_id: nextEntryId.nextId,
          med_id: "",
          purchase_date: "",
          expiration_date: "",
          prescribed_by: null,
          donation_status: 0,
        }));

        if (!Array.isArray(entries)) entries = [];

        // Categorize entries into shelf sections
        const shelfData = { have: [], currently: [], past: [], donation: [] };

        // Current date for expiration comparison
        const today = new Date();

        entries.forEach((entry) => {
          const medInfo = meds.find((m) => m.med_id === entry.med_id);
          if (!medInfo) return; // Skip if medication data not found

          const item = {
            ...entry,
            med_name: medInfo.name,
            med_type: medInfo.type,
          };

          if (entry.donation_status === 1) {
            // Marked for donation category
            shelfData.donation.push(item);
          } else {
            // Check if expired (past category)
            const expDate = new Date(entry.expiration_date);
            if (expDate < today) {
              shelfData.past.push(item);
            } else {
              // Determine if currently using (has side effects/reminders)
              const hasReminder = (seMap[entry.entry_id] || []).length > 0;
              if (entry.user_id === user.user_id) {
                if (hasReminder) shelfData.currently.push(item);
                else shelfData.have.push(item);
              }
            }
          }
        });

        setShelf(shelfData);
      } catch (e) {
        console.error("Failed to fetch data:", e);
      }
    }
    fetchData();
  }, [user.user_id]);

  // Helper to refresh all data (called after add/delete actions)
  const refreshMedData = async () => {
    try {
      const [medRes, hwRes, entryRes, seRes, nextMedRes, nextEntryRes] =
        await Promise.all([
          fetch("http://88.200.63.148:2004/medication"),
          fetch("http://88.200.63.148:2004/healthcareWorker"),
          fetch(`http://88.200.63.148:2004/medentry?user_id=${user.user_id}`),
          fetch(`http://88.200.63.148:2004/sideeffect?user_id=${user.user_id}`),
          fetch("http://88.200.63.148:2004/medication/nextid"),
          fetch("http://88.200.63.148:2004/medentry/nextid"),
        ]);
      const meds = await medRes.json();
      const hw = await hwRes.json();
      let entries = await entryRes.json();
      const sideEffects = await seRes.json();
      const nextMedId = await nextMedRes.json();
      const nextEntryId = await nextEntryRes.json();

      setAllMeds(meds);
      setHealthcareWorkers(hw);

      const seMap = {};
      sideEffects.forEach((se) => {
        if (!seMap[se.entry_id]) seMap[se.entry_id] = [];
        seMap[se.entry_id].push(se);
      });
      setSideEffectsMap(seMap);

      setNewMed((p) => ({
        ...p,
        med_id: nextMedId.nextId,
        name: "",
        type: "",
        intake_instruction: "",
      }));
      setNewEntry((p) => ({
        ...p,
        entry_id: nextEntryId.nextId,
        med_id: "",
        purchase_date: "",
        expiration_date: "",
        prescribed_by: null,
        donation_status: 0,
      }));

      if (!Array.isArray(entries)) entries = [];

      const shelfData = { have: [], currently: [], past: [], donation: [] };
      const today = new Date();

      entries.forEach((entry) => {
        const medInfo = meds.find((m) => m.med_id === entry.med_id);
        if (!medInfo) return;

        const item = {
          ...entry,
          med_name: medInfo.name,
          med_type: medInfo.type,
        };

        if (entry.donation_status === 1) {
          shelfData.donation.push(item);
        } else {
          const expDate = new Date(entry.expiration_date);
          if (expDate < today) {
            shelfData.past.push(item);
          } else {
            const hasReminder = (seMap[entry.entry_id] || []).length > 0;
            if (entry.user_id === user.user_id) {
              if (hasReminder) shelfData.currently.push(item);
              else shelfData.have.push(item);
            }
          }
        }
      });

      setShelf(shelfData);
    } catch (e) {
      console.error("Failed to refresh data:", e);
    }
  };

  const deleteRemindersForEntry = async (entryId) => {
  try {
    // Assuming your backend has an endpoint to delete reminders by entry_id
    const res = await fetch(`http://88.200.63.148:2004/reminder/entry/${entryId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errData = await res.json();
      alert("Failed to delete reminders: " + (errData.error || res.statusText));
      return;
    }
    // Refresh data after deletion
    refreshMedData();
  } catch (error) {
    alert("Error deleting reminders: " + error.message);
  }
};


  // Deletes a medication and all related entries
  const deleteMedication = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to DELETE this medication and ALL related entries?"
      )
    )
      return;
    try {
      const res = await fetch(`http://88.200.63.148:2004/medication/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Medication deleted!");
        refreshMedData();
      } else {
        const errorText = await res.text();
        alert("Failed to delete medication: " + errorText);
      }
    } catch (err) {
      alert("Delete medication error: " + err.message);
    }
  };

  // Deletes a single medication entry
  const deleteMedEntry = async (id) => {
    if (!window.confirm("Are you sure you want to DELETE this medication entry?"))
      return;
    try {
      const res = await fetch(`http://88.200.63.148:2004/medentry/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Medication entry deleted!");
        refreshMedData();
      } else {
        const errorText = await res.text();
        alert("Failed to delete medication entry: " + errorText);
      }
    } catch (err) {
      alert("Delete medication entry error: " + err.message);
    }
  };

  const prettyDate = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  // Format as DD.MM.YYYY or like "Apr 30, 2025"
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

  // Adds new medication to backend
  const handleAddMed = async () => {
    if (!newMed.name || !newMed.type || !newMed.intake_instruction) {
      alert("Please fill all medication fields.");
      return;
    }
    try {
      const res = await fetch("http://88.200.63.148:2004/medication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMed),
      });
      if (res.ok) {
        alert("Medication added!");
        setShowForm(null);
        refreshMedData();
      } else {
        alert("Error adding medication");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Adds new medication entry for user
  const handleAddEntry = async () => {
    if (!newEntry.med_id || !newEntry.purchase_date || !newEntry.expiration_date) {
      alert("Please fill all required medication entry fields.");
      return;
    }
    try {
      console.log("Posting new entry:", { ...newEntry, user_id: user.user_id });

      const res = await fetch("http://88.200.63.148:2004/medentry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEntry, user_id: user.user_id }),
      });
      if (res.ok) {
        alert("Medication entry added!");
        setShowForm(null);
        refreshMedData();
      } else {
        const errorText = await res.text();
        alert("Error adding medication entry: " + errorText);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Drag & drop handlers to move meds between shelf categories
  const onDragStart = (e, item, sourceCategory) => {
    e.dataTransfer.setData("item", JSON.stringify(item));
    e.dataTransfer.setData("sourceCategory", sourceCategory);
  };


  const onDrop = (e, targetCategory) => {
    e.preventDefault();

    const item = JSON.parse(e.dataTransfer.getData("item"));
    const sourceCategory = e.dataTransfer.getData("sourceCategory");

    // Prevent moving from donation and past
    if (sourceCategory === "donation") {
      alert("Items in 'For Donation' cannot be moved.");
      return;
    }
    if(sourceCategory === "past"){
      alert("Items in Past cannot be moved.")
      return;
    }
    // Rules for moving from "have"
    if (sourceCategory === "have") {
      if (targetCategory !== "currently") {
        const entryId = item.entryId || item.entry_id;  // adjust according to your data

        if (entryId) {
        // Remove reminder from local state
          setReminder((prev) => {
          const copy = { ...prev };
          delete copy[entryId];
          return copy;
          });

        // Remove reminders in backend
        fetch(`http://88.200.63.148:2004/reminder/entry/${entryId}`, {
          method: "DELETE",
        }).catch((err) => {
          console.error("Failed to delete reminders on server:", err);
        });
      } else {
        console.warn("No valid entryId found on item, skipping reminder deletion");
      }
    }
  }

    if (sourceCategory === targetCategory) return;

    if(targetCategory !== "currently"){
      deleteRemindersForEntry(item.entry_id);
    }

    // Update donation_status based on category
    let newDonationStatus = targetCategory === "donation" ? 1 : 0;

    const sourceItems = [...shelf[sourceCategory]];
    const targetItems = [...shelf[targetCategory]];
    const index = sourceItems.findIndex((i) => i.entry_id === item.entry_id);
    if (index < 0) return;

    sourceItems.splice(index, 1);
    const updatedItem = { ...item, donation_status: newDonationStatus };
    targetItems.push(updatedItem);

    setShelf((prev) => ({
      ...prev,
      [sourceCategory]: sourceItems,
      [targetCategory]: targetItems,
    }));

    // Update backend entry donation_status
    fetch(`http://88.200.63.148:2004/medentry/${item.entry_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donation_status: newDonationStatus }),
    }).catch((e) => {
      alert("Failed to update entry status: " + e.message);
    });
  };

  const allowDrop = (e) => e.preventDefault();

  // Toggle side effects inline display
  const toggleSideEffects = (entry_id) => {
    setSideEffectsVisibleFor((prev) => (prev === entry_id ? null : entry_id));
    setNewSideEffectText("");
  };

  // Add new side effect for a medication entry
  const handleAddSideEffect = async (entry_id) => {
    if (!newSideEffectText.trim()) {
      alert("Please enter side effect description.");
      return;
    }
    try {
      const res = await fetch("http://88.200.63.148:2004/sideeffect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_id,
          description: newSideEffectText,
          user_id: user.user_id,
        }),
      });
      if (res.ok) {
        alert("Side effect added.");
        setSideEffectsVisibleFor(null);
        refreshMedData();
      } else {
        alert("Failed to add side effect.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="page user-home">
      {/* Header with user name and logout button */}
      <div className="user-header">
        <h1 className="title">Welcome, {user.name}</h1>

        <div className="user-header-buttons">
          <button className="button settings" onClick={() => setShowSettings((prev) => !prev)} style={{ maxWidth: "130px", padding: "10px" }}>
            Settings 
          </button>

          <button className="button logout" onClick={onLogout} style={{ maxWidth: "130px", padding: "10px" }}>
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

      {/* Top menu buttons */}
      <div className="menu">
        <button className="button primary" onClick={() => setShowForm("med")}>
          Add New Medication
        </button>
        <button className="button primary" onClick={() => setShowForm("entry")}>
          Add Medication Entry
        </button>
        <button
          className="button primary"
          onClick={() => {
            setShowForm(null);
            setShowView("shelf");
          }}
        >
          Shelf
        </button>
        <button
          className="button primary"
          onClick={() => {
            setShowForm(null);
            setShowView("allMeds");
          }}
        >
          All Medications
        </button>
      </div>

      {/* Add Medication Form */}
          {showForm === "med" && (
           <AddMedicationForm
              newMed={newMed}
              setNewMed={setNewMed}
              handleAddMed={handleAddMed}
              onCancel={() => setShowForm(null)}
            />
          )}

          {showForm === "entry" && (
            <AddMedicationEntryForm
              newEntry={newEntry}
              setNewEntry={setNewEntry}
              allMeds={allMeds}
              healthcareWorkers={healthcareWorkers}
              handleAddEntry={handleAddEntry}
              onCancel={() => setShowForm(null)}
            />
          )}

      {/* Shelf view: categorized medication entries */}
      {showForm === null && showView === "shelf" && (
        <div className="shelf-container">
          {["currently", "have", "past", "donation"].map((category) => (
            <div
              key={category}
              className={`shelf-category shelf-${category}`}
              onDrop={(e) => onDrop(e, category)}
              onDragOver={allowDrop}
            >
              <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
              {shelf[category].length === 0 && <p>No medications here.</p>}
              {shelf[category].map((item) => (
                <div key={item.entry_id} className="shelf-item">
                  <div
                    className="drag-handle"
                    draggable={category !== "donation"}
                    onDragStart={(e) => onDragStart(e, item, category)}
                  >
                    <div>
                      <strong>{item.med_name}</strong> ({item.med_type})
                    </div>
                    <div>
                      Purchased: {prettyDate(item.purchase_date)} | Expires: {prettyDate(item.expiration_date)}
                    </div>
                    <div>
                      Prescribed by:{" "}
                        {(() => {
                          const hw = healthcareWorkers.find(hw => hw.user_id.toString() === item.prescribed_by.toString());
                          return hw ? `${hw.licence_num} (${hw.specialization})` : "N/A";
                        })()}
                    </div>
                  </div>

                  <div className="item-buttons">
                    {category !== "donation" && (
                      <button
                        className="button small"
                        onClick={() => toggleSideEffects(item.entry_id)}
                      >
                      Side Effects
                      </button>
                    )}

                    {category === "have" && (
  <>
    <button
      className="button small reminder-btn"
      onClick={() => {
        setShowReminderFormFor(item.entry_id);
        setReminderInputs({ time: "", note: "", entryId: item.entry_id });
      }}
    >
      Set Reminder
    </button>

    {showReminderFormFor === item.entry_id && (
      <div className="reminder-form" style={{ marginTop: "10px" }}>
        <label>
          Time:
          <input
            type="time"
            value={reminderInputs.time}
            onChange={(e) =>
              setReminderInputs((prev) => ({ ...prev, time: e.target.value }))
            }
            className="input"
          />
        </label>
        <label>
          Note:
          <input
            type="text"
            value={reminderInputs.note}
            onChange={(e) =>
              setReminderInputs((prev) => ({ ...prev, note: e.target.value }))
            }
            placeholder="Optional note"
            className="input"
          />
        </label>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            className="button primary"
            onClick={() => {
              setReminder(item, reminderInputs.time, reminderInputs.note);
              setShowReminderFormFor(null);
            }}
            disabled={!reminderInputs.time}
          >
            Save Reminder
          </button>
          <button
            className="button cancel"
            onClick={() => setShowReminderFormFor(null)}
          >
            Cancel
          </button>
        </div>
      </div>
    )}
  </>
)}
                    <button
                      className="button small delete-btn"
                      onClick={() => deleteMedEntry(item.entry_id)}
                      title="Delete Medication Entry"
                    >
                      Delete Entry
                    </button>
                  </div>

                  {sideEffectsVisibleFor === item.entry_id && (
                    <div className="side-effects-list">
                      {(sideEffectsMap[item.entry_id] || []).length > 0 ? (
                        <ul>
                          {sideEffectsMap[item.entry_id].map((se) => (
                            <li key={se.se_id || se.description}>{se.description}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No side effects recorded yet.</p>
                      )}

                   {visibleRemindersEntry === item.entry_id && (
                  <div className="reminders-list">
                    <h4>Reminders:</h4>
                      {(remindersForEntry[item.entry_id] || []).length > 0 ? (
                      <ul>
                        {remindersForEntry[item.entry_id].map((rem) => (
                          <li key={rem.rem_id}>
                          Time: {rem.time} {rem.note && `- Note: ${rem.note}`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                  <p>No reminders set.</p>
                      )}
                    </div>
                  )}

                      <textarea
                        className="input"
                        rows={2}
                        placeholder="Add new side effect description"
                        value={newSideEffectText}
                        onChange={(e) => setNewSideEffectText(e.target.value)}
                      />
                      <div className="form-buttons">
                        <button
                          className="button primary"
                          onClick={() => handleAddSideEffect(item.entry_id)}
                        >
                          Add Side Effect
                        </button>
                        <button
                          className="button cancel"
                          onClick={() => setSideEffectsVisibleFor(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* All Medications view */}
      {showForm === null && showView === "allMeds" && (
        <div className="medications-list">
          <h2>All Medications</h2>

          {/* Search by Medication ID */}
          <input
            type="text"
            className="input search-med-id"
            placeholder="Search medication by ID"
            value={searchMedId}
            onChange={(e) => setSearchMedId(e.target.value)}
            style={{
              marginBottom: "10px",
              padding: "8px",
              fontSize: "1rem",
              width: "100%",
              maxWidth: "300px",
            }}
          />

          {filteredMeds.length === 0 && <p>No medications found.</p>}

          {filteredMeds.map((med) => (
            <div key={med.med_id} className="medication-item">
              <div>
                <strong>ID:</strong> {med.med_id} | <strong>Name:</strong> {med.name} |{" "}
                <strong>Type:</strong> {med.type}
              </div>
              <button
                className="button small delete-btn"
                onClick={() => deleteMedication(med.med_id)}
                title="Delete Medication and all its entries"
              >
                Delete Medication
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
