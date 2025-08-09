import React, { useEffect, useState } from "react";
import "./UserHome.css";

export default function UserHome({ user, onLogout }) {
  const [allMeds, setAllMeds] = useState([]);
  const [healthcareWorkers, setHealthcareWorkers] = useState([]);

  const [showForm, setShowForm] = useState(null); // "med", "entry", or null

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

  const [shelf, setShelf] = useState({
    have: [],
    currently: [],
    past: [],
    donation: [],
  });

  const [sideEffectsMap, setSideEffectsMap] = useState({}); // entry_id => side effects array
  const [sideEffectsVisibleFor, setSideEffectsVisibleFor] = useState(null);
  const [newSideEffectText, setNewSideEffectText] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [medRes, hwRes, entryRes, seRes, nextMedRes, nextEntryRes] = await Promise.all([
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

        // Build map of entry_id → side effects list
        const seMap = {};
        sideEffects.forEach((se) => {
          if (!seMap[se.entry_id]) seMap[se.entry_id] = [];
          seMap[se.entry_id].push(se);
        });
        setSideEffectsMap(seMap);

        setNewMed((p) => ({ ...p, med_id: nextMedId.nextId, name: "", type: "", intake_instruction: "" }));
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

        // Sort entries into shelf categories
        const shelfData = { have: [], currently: [], past: [], donation: [] };

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
            const hasReminder = (seMap[entry.entry_id] || []).length > 0;
            if (entry.user_id === user.user_id) {
              if (hasReminder) shelfData.currently.push(item);
              else shelfData.have.push(item);
            }
          }
        });

        setShelf(shelfData);
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, [user.user_id]);

  // Add Medication handler
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

  // Add Medication Entry handler
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

  // Refresh all data from backend after changes
  const refreshMedData = async () => {
    try {
      const [medRes, hwRes, entryRes, seRes, nextMedRes, nextEntryRes] = await Promise.all([
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

      setNewMed((p) => ({ ...p, med_id: nextMedId.nextId, name: "", type: "", intake_instruction: "" }));
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
          const hasReminder = (seMap[entry.entry_id] || []).length > 0;
          if (entry.user_id === user.user_id) {
            if (hasReminder) shelfData.currently.push(item);
            else shelfData.have.push(item);
          }
        }
      });

      setShelf(shelfData);
    } catch (e) {
      console.error(e);
    }
  };

  // Drag & Drop logic
  const onDragStart = (e, item, sourceCategory) => {
    e.dataTransfer.setData("item", JSON.stringify(item));
    e.dataTransfer.setData("sourceCategory", sourceCategory);
  };

  const onDrop = (e, targetCategory) => {
    e.preventDefault();

    const item = JSON.parse(e.dataTransfer.getData("item"));
    const sourceCategory = e.dataTransfer.getData("sourceCategory");

    if (sourceCategory === "donation") {
      alert("Items in 'For Donation' cannot be moved.");
      return;
    }
    if (sourceCategory === "have") {
      if (targetCategory !== "currently" && targetCategory !== "donation") {
        alert("Can only move 'Have' items to 'Currently Using' or 'For Donation'.");
        return;
      }
    }
    if (sourceCategory === targetCategory) return;

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

    fetch(`http://88.200.63.148:2004/medentry/${item.entry_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donation_status: newDonationStatus }),
    }).catch((e) => {
      alert("Failed to update entry status: " + e.message);
    });
  };

  const allowDrop = (e) => e.preventDefault();

  // Toggle Side Effects display inline
  const toggleSideEffects = (entry_id) => {
    setSideEffectsVisibleFor((prev) => (prev === entry_id ? null : entry_id));
    setNewSideEffectText("");
  };

  // Add new side effect
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

  // Toggle Reminder - moves item from "have" to "currently" by adding a dummy side effect for demonstration
  // You can replace with your real reminder logic
  const toggleReminder = async (item) => {
    // Here we simulate setting a reminder by adding a dummy side effect
    try {
      const res = await fetch("http://88.200.63.148:2004/sideeffect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_id: item.entry_id,
          description: "Reminder set",
          user_id: user.user_id,
        }),
      });
      if (res.ok) {
        alert("Reminder set! Item moved to Currently Using.");
        refreshMedData();
      } else {
        alert("Failed to set reminder.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="page user-home">
      <div className="user-header">
        <h1 className="title">Welcome, {user.name}</h1>
        <button className="button logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="menu">
        <button className="button primary" onClick={() => setShowForm("med")}>
          Add New Medication
        </button>
        <button className="button primary" onClick={() => setShowForm("entry")}>
          Add Medication Entry
        </button>
        <button className="button primary" onClick={() => setShowForm(null)}>
          Shelf
        </button>
      </div>

      {/* Add Medication Form */}
      {showForm === "med" && (
        <div className="form-container">
          <h3>Add New Medication</h3>
          <p>
            <strong>Medication ID:</strong> {newMed.med_id || "Loading..."}
          </p>
          <input
            className="input"
            type="text"
            placeholder="Name"
            value={newMed.name}
            onChange={(e) => setNewMed((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="input"
            type="text"
            placeholder="Type"
            value={newMed.type}
            onChange={(e) => setNewMed((prev) => ({ ...prev, type: e.target.value }))}
          />
          <textarea
            className="input"
            placeholder="Intake Instruction"
            rows={3}
            value={newMed.intake_instruction}
            onChange={(e) => setNewMed((prev) => ({ ...prev, intake_instruction: e.target.value }))}
          />
          <div className="form-buttons">
            <button className="button primary" onClick={handleAddMed}>
              Save
            </button>
            <button className="button cancel" onClick={() => setShowForm(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Medication Entry Form */}
      {showForm === "entry" && (
        <div className="form-container">
          <h3>Add Medication Entry</h3>
          <p>
            <strong>Entry ID:</strong> {newEntry.entry_id || "Loading..."}
          </p>

          <label>
            Medication:
            <select
              className="input"
              value={newEntry.med_id}
              onChange={(e) =>
                setNewEntry((prev) => ({
                  ...prev,
                  med_id: Number(e.target.value),
                }))
              }
            >
              <option value="">Select Medication</option>
              {allMeds.map((med) => (
                <option key={med.med_id} value={med.med_id}>
                  {med.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Purchase Date:
            <input
              className="input"
              type="date"
              value={newEntry.purchase_date}
              onChange={(e) => setNewEntry((prev) => ({ ...prev, purchase_date: e.target.value }))}
            />
          </label>

          <label>
            Expiration Date:
            <input
              className="input"
              type="date"
              value={newEntry.expiration_date}
              onChange={(e) => setNewEntry((prev) => ({ ...prev, expiration_date: e.target.value }))}
            />
          </label>

          <label>
            Prescribed By:
            <select
              className="input"
              value={newEntry.prescribed_by || ""}
              onChange={(e) =>
                setNewEntry((prev) => ({
                  ...prev,
                  prescribed_by: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            >
              <option value="">Select Healthcare Worker</option>
              {healthcareWorkers.map((hw) => (
                <option key={hw.hw_id} value={hw.hw_id}>
                  {hw.name} {hw.lastname}
                </option>
              ))}
            </select>
          </label>

          <div className="form-buttons">
            <button className="button primary" onClick={handleAddEntry}>
              Save Entry
            </button>
            <button className="button cancel" onClick={() => setShowForm(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Shelf */}
      {showForm === null && (
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
                  {/* Drag handle only on info */}
                  <div
                    className="drag-handle"
                    draggable={category !== "donation"}
                    onDragStart={(e) => onDragStart(e, item, category)}
                  >
                    <div>
                      <strong>{item.med_name}</strong> ({item.med_type})
                    </div>
                    <div>
                      Purchased: {item.purchase_date} | Expires: {item.expiration_date}
                    </div>
                    <div>
                          Prescribed by:{" "}
                            {healthcareWorkers.find(hw => hw.hw_id === item.prescribed_by)
                            ? healthcareWorkers.find(hw => hw.hw_id === item.prescribed_by).name + " " + healthcareWorkers.find(hw => hw.hw_id === item.prescribed_by).lastname
                            : "N/A"}
                    </div>
                  </div>

                  <div className="item-buttons">
                    <button
                      className="button small"
                      onClick={() => toggleSideEffects(item.entry_id)}
                    >
                      Side Effects
                    </button>

                    {category === "have" && (
                      <button
                        className="button small reminder-btn"
                        onClick={() => toggleReminder(item)}
                      >
                        Set Reminder
                      </button>
                    )}
                  </div>

                  {/* Inline side effects */}
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
    </div>
  );
}
