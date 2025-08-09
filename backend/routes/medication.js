const express = require("express");
const medication = express.Router();
const DB = require("../db/connection.js");

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Middleware to parse both JSON and URL-encoded forms
medication.use(bodyParser.json());
medication.use(urlencodedParser);
medication.use(express.json());

// Get next med_id
medication.get('/nextid', async (req, res) => {
  try {
    const maxId = await DB.getMaxMedId();
    const nextId = (maxId || 0) + 1;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// Update medication
medication.put("/:id", urlencodedParser, async (req, res) => {
  try {
    const { name, type, intake_instruction } = req.body;

    if (!name || !type || !intake_instruction) {
      return res.status(400).send("Missing fields");
    }

    await DB.updateMedication(req.params.id, { name, type, intake_instruction });
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
