const express = require("express");
const medEntry = express.Router();
const DB = require("../db/connection.js");

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Middleware to parse JSON and URL-encoded forms
medEntry.use(bodyParser.json());
medEntry.use(urlencodedParser);

// Get all medication entries
medEntry.get("/", async (req, res) => {
  try {
    const result = await DB.allMediEntry();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Get a single medication entry by ID
medEntry.get("/:id", async (req, res) => {
  try {
    const result = await DB.getMediEntryById(req.params.id);
    if (!result) {
      return res.status(404).send("Medication Entry not found");
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Create a medication entry
medEntry.post("/", urlencodedParser, async (req, res) => {
  try {
    const {
      entry_id,
      user_id,
      med_id,
      purchase_date,
      expiration_date,
      prescribed_by,
      donation_status
    } = req.body;

    if (
      !entry_id ||
      !user_id ||
      !med_id ||
      !purchase_date ||
      !expiration_date ||
      !prescribed_by
    ) {
      return res.status(400).send("Missing required fields");
    }

    await DB.createMedEntry({
      entry_id: Number(entry_id),
      user_id: Number(user_id),
      med_id: Number(med_id),
      purchase_date,
      expiration_date,
      prescribed_by: Number(prescribed_by),
      donation_status
    });

    res.status(201).send("Medication Entry inserted successfully");
  } catch (err) {
    console.error("INSERT ERROR:", err.message);
    res.status(500).send(err.message);
  }
});

// Update a medication entry
medEntry.put("/:id", urlencodedParser, async (req, res) => {
  try {
    const {
      user_id,
      med_id,
      purchase_date,
      expiration_date,
      prescribed_by,
      donation_status
    } = req.body;

    if (!user_id || !med_id || !prescribed_by) {
      return res.status(400).send("Missing required fields");
    }

    await DB.updateMedEntry(req.params.id, {
      user_id: Number(user_id),
      med_id: Number(med_id),
      purchase_date,
      expiration_date,
      prescribed_by: Number(prescribed_by),
      donation_status
    });

    res.sendStatus(204);
  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).send(err.message);
  }
});

// Delete a medication entry
medEntry.delete("/:id", async (req, res) => {
  try {
    await DB.deleteMedEntry(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    res.status(500).send(err.message);
  }
});

module.exports = medEntry;
