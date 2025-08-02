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

    if (user.role !== "caregiver") {
      return res.status(400).send("User does not have the role 'caregiver'");
    }

    await DB.createCaregiver({ user_id, certification, care_center_name });
    res.status(201).send("Caregiver inserted successfully");
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Get caregiver by ID
caregiver.get("/:id", async (req, res) => {
  try {
    const user_id = req.params.id;
    const all = await DB.getAllCaregivers();
    const found = all.find((c) => c.user_id == user_id);

    if (!found) return res.status(404).send("Caregiver not found");
    res.json(found);
  } catch (err) {
    res.status(500).send("Error fetching caregiver");
  }
});

// Update caregiver
caregiver.put("/:id", urlencodedParser, async (req, res) => {
  const { certification, care_center_name } = req.body;

  try {
    await DB.updateCaregiver(req.params.id, {
      certification,
      care_center_name,
    });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Delete caregiver
caregiver.delete("/:id", async (req, res) => {
  try {
    await DB.deleteCaregiver(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});


module.exports = caregiver;
