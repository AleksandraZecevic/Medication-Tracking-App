const express = require("express");
const caregiver = express.Router();
const DB = require("../db/connection.js");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

caregiver.use(bodyParser.json());
caregiver.use(urlencodedParser);

// Get all caregivers
caregiver.get("/", async (req, res) => {
  try {
    const result = await DB.getAllCaregivers();
    res.json(result);
  } catch (err) {
    res.status(500).send("Error fetching caregivers");
  }
});

// Create caregiver
caregiver.post("/", urlencodedParser, async (req, res) => {
  const { user_id, certification, care_center_name } = req.body;

  if (!user_id || isNaN(user_id)) {
    return res.status(400).send("Invalid or missing user_id");
  }

  try {
    const user = await DB.getUserById(user_id);
    if (!user) return res.status(404).send("User not found");

    await DB.createCaregiver({ user_id, certification, care_center_name });
    res.status(201).send("Caregiver inserted successfully");
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = caregiver;
