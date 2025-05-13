const express = require("express");
const healthcareWorker = express.Router();
const DB = require("../db/connection.js");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

healthcareWorker.use(bodyParser.json());
healthcareWorker.use(urlencodedParser);

// Get all healthcare workers
healthcareWorker.get("/", async (req, res) => {
  try {
    const result = await DB.getAllHealthCareWorkers();
    res.json(result);
  } catch (err) {
    res.status(500).send("Error fetching healthcare workers");
  }
});

// Create healthcare worker
healthcareWorker.post("/", urlencodedParser, async (req, res) => {
  const { user_id, licence_num, specialization, institution } = req.body;

  if (!user_id || isNaN(user_id)) {
    return res.status(400).send("Invalid or missing user_id");
  }

  try {
    const user = await DB.getUserById(user_id);
    if (!user) return res.status(404).send("User not found");

    await DB.createHealthcareWorker({ user_id, licence_num, specialization, institution });
    res.status(201).send("Healthcare Worker inserted successfully");
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = healthcareWorker;
