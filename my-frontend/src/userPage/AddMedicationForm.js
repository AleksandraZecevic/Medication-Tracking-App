import React from "react";

export default function AddMedicationForm({ newMed, setNewMed, handleAddMed, onCancel }) {
  return (
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
        onChange={(e) =>
          setNewMed((prev) => ({ ...prev, name: e.target.value }))
        }
      />
      <input
        className="input"
        type="text"
        placeholder="Type"
        value={newMed.type}
        onChange={(e) =>
          setNewMed((prev) => ({ ...prev, type: e.target.value }))
        }
      />
      <textarea
        className="input"
        placeholder="Intake Instruction"
        rows={3}
        value={newMed.intake_instruction}
        onChange={(e) =>
          setNewMed((prev) => ({ ...prev, intake_instruction: e.target.value }))
        }
      />
      <div className="form-buttons">
        <button className="button primary" onClick={handleAddMed}>
          Save
        </button>
        <button className="button cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
