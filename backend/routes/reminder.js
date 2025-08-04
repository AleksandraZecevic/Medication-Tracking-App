const express = require("express");
const reminder = express.Router();
const DB = require("../db/connection.js");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

reminder.use(bodyParser.json());
reminder.use(urlencodedParser);

// GET all reminders
reminder.get("/", async (req, res) => {
  try {
    const all = await DB.getAllReminders();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create reminder
reminder.post("/", async (req, res) => {
  const { rem_id, entry_id, time, note } = req.body;
  if (!rem_id || !entry_id || !time) {
    return res.status(400).json({ error: "rem_id, entry_id, and time are required" });
  }

  try {
    const created = await DB.createReminder({ rem_id, entry_id, time, note });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reminder by ID
reminder.get('/:id', async (req, res) => {
  const rem_id = parseInt(req.params.id, 10);

  try {
    const reminder = await DB.getReminderById(rem_id);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.status(200).json(reminder);
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// DELETE reminder by ID
reminder.delete("/:id", async (req, res) => {
  try {
    const deleted = await DB.deleteReminder(req.params.id);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update reminder
reminder.put('/:id', urlencodedParser, async (req, res) => {
  const rem_id = parseInt(req.params.id, 10);
  const { entry_id, time, note } = req.body;

  try {
    const existing = await DB.getReminderById(rem_id);
    if (!existing) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updatedData = {
      entry_id: entry_id !== undefined ? entry_id : existing.entry_id,
      time: time !== undefined ? time : existing.time,
      note: note !== undefined ? note : existing.note,
    };

    const updated = await DB.updateReminder(rem_id, updatedData);
    res.status(200).json({ message: 'Reminder updated successfully', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

module.exports = reminder;