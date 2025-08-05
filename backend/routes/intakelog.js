const express = require("express");
const intakeLog = express.Router();
const DB = require("../db/connection.js");

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

intakeLog.use(bodyParser.json());
intakeLog.use(urlencodedParser);

// GET all
intakeLog.get("/", async (req, res) => {
  try {
    const result = await DB.getAllIntakeLogs();
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET one
intakeLog.get("/:id", async (req, res) => {
  try {
    const log = await DB.getIntakeLogById(req.params.id);
    if (!log) return res.status(404).send("Log not found");
    res.json(log);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// CREATE
intakeLog.post("/", async (req, res) => {
  const { log_id, entry_id, timestamp } = req.body;

  if (!log_id || !entry_id || !timestamp) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const created = await DB.createIntakeLog({ log_id, entry_id, timestamp });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// UPDATE (partial) - do i need it
intakeLog.put("/:id", async (req, res) => {
  try {
    const updated = await DB.updateIntakeLog(req.params.id, req.body);
    res.json({ message: "Updated successfully", data: updated });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE
intakeLog.delete("/:id", async (req, res) => {
  try {
    const result = await DB.deleteIntakeLog(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = intakeLog;
