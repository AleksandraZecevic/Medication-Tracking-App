const express = require("express");
const medication = express.Router();
const DB = require("../db/connection.js");

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Middleware to parse both JSON and URL-encoded forms
medication.use(bodyParser.json());
medication.use(urlencodedParser);

// Get all medications
medication.get("/", async (req, res) => {
  try {
    const result = await DB.allMedication();
    res.json(result);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// Get single medication
medication.get("/:id", async (req, res) => {
  try {
    const result = await DB.getMedicationById(req.params.id);
    if (!result || result.length === 0) {
      return res.status(404).send("Medication not found");
    }
    res.json(result);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// Create medication
medication.post("/", urlencodedParser, async (req, res) => {
  try {
   const { med_id, name, type, intake_instruction } = req.body;

    if (med_id === undefined || med_id === null || isNaN(Number(med_id)) || !Number.isInteger(Number(med_id))) {
      return res.status(400).send("med_id must be a valid integer");
    }

    if (!name || !type || !intake_instruction) {
      return res.status(400).send("Missing fields");
    }

    await DB.createMedication({ med_id: Number(med_id), name, type, intake_instruction });
      res.status(201).send("Medication inserted successfully");
    } catch (err) {
      console.error("INSERT ERROR:", err);
      res.sendStatus(500);
    }
});

/*
dataPool.createMedication = (medication) => {
  const { med_id, name, type, intake_instruction } = medication;

  return new Promise((resolve, reject) => {
    // Check if med_id is provided and it's a valid integer
    if (isNaN(med_id) || med_id <= 0) {
      return reject(new Error("med_id must be a valid positive integer"));
    }

    db.query(
      'INSERT INTO Medication (med_id, name, type, intake_instruction) VALUES (?, ?, ?, ?)',
      [med_id, name, type, intake_instruction],
      (err, res) => {
        if (err) return reject(err);
        resolve({ id: med_id, name, type, intake_instruction });
      }
    );
  });
};
*/

// Update medication
medication.put("/:id", async (req, res) => {
  try {
    await DB.updateMedication(req.params.id, req.body);
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// Delete medication
medication.delete("/:id", async (req, res) => {
  try {
    await DB.deleteMedication(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

module.exports = medication;
