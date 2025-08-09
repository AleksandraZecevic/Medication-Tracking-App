const express = require("express");
const medEntry = express.Router();
const DB = require("../db/connection.js");

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Middleware to parse JSON and URL-encoded forms
medEntry.use(bodyParser.json());
medEntry.use(urlencodedParser);

// Get next entry_id
medEntry.get('/nextid', async (req, res) => {
  try {
    const maxId = await DB.getMaxEntryId();
    const nextId = (maxId || 0) + 1;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


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

// update 
medEntry.put("/:id", urlencodedParser, async (req, res) => {
  try {
    const updateData = {};

    // Only include fields if they were sent in the request
    if (req.body.user_id !== undefined) updateData.user_id = Number(req.body.user_id);
    if (req.body.med_id !== undefined) updateData.med_id = Number(req.body.med_id);
    if (req.body.purchase_date !== undefined) updateData.purchase_date = req.body.purchase_date;
    if (req.body.expiration_date !== undefined) updateData.expiration_date = req.body.expiration_date;
    if (req.body.prescribed_by !== undefined) updateData.prescribed_by = Number(req.body.prescribed_by);
    if (req.body.donation_status !== undefined) updateData.donation_status = req.body.donation_status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).send("No valid fields provided for update");
    }

    const updated = await DB.updateMedEntry(req.params.id, updateData);
    res.status(200).json({ message: "Medication Entry updated", data: updated });
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
