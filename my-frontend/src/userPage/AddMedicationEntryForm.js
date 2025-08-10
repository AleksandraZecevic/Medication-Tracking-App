// components/UserHome/AddMedicationEntryForm.js
import React from "react";

export default function AddMedicationEntryForm({
  newEntry,
  setNewEntry,
  allMeds,
  healthcareWorkers,
  handleAddEntry,
  onCancel,
}) {
  return (
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
              {med.med_id} - {med.name}
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
          onChange={(e) =>
            setNewEntry((prev) => ({ ...prev, purchase_date: e.target.value }))
          }
        />
      </label>

      <label>
        Expiration Date:
        <input
          className="input"
          type="date"
          value={newEntry.expiration_date}
          onChange={(e) =>
            setNewEntry((prev) => ({ ...prev, expiration_date: e.target.value }))
          }
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
            <option key={hw.user_id} value={hw.user_id}>
              {hw.user_id} - {hw.licence_num} ({hw.specialization})
            </option>
          ))}
        </select>
      </label>

      <div className="form-buttons">
        <button className="button primary" onClick={handleAddEntry}>
          Save Entry
        </button>
        <button className="button cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
