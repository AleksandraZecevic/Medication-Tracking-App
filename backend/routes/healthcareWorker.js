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

// get healthcare worker by id
healthcareWorker.get("/:id", async (req, res) => {
  try {
    const user_id = req.params.id;
    const all = await DB.getAllHealthCareWorkers();
    const worker = all.find((w) => w.user_id == user_id);

    if (!worker) return res.status(404).send("Healthcare worker not found");
    res.json(worker);
  } catch (err) {
    res.status(500).send("Error fetching healthcare worker");
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

    const hcw = await DB.getHealthCareWorkerById(user_id);
    if(hcw) return res.status(404).send("Helathcare Worker with this id already exists");

    if (user.role !== "healthcare_worker") {
      return res.status(400).send("User does not have the role 'healthcare_worker'");
    }

    // Check if licence_num already exists
    const existing = await DB.healthcareWorkerLicenceExists(licence_num);

    if (existing) {
      return res.status(409).send("Licence number already exists");
    }

    // Proceed with insertion
    await DB.createHealthcareWorker({ user_id, licence_num, specialization, institution });
    res.status(201).send("Healthcare Worker inserted successfully");
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// update healthcareworker
healthcareWorker.put("/:id", urlencodedParser, async (req, res) => {
  const { licence_num, specialization, institution } = req.body;
  const userId = req.params.id;

  try {
    // 1. Fetch current record
    const existing = await DB.getHealthCareWorkerById(userId);

    if (!existing) {
      return res.status(404).json({ error: "Healthcare worker not found" });
    }

    // 2. Merge existing with incoming data, prioritizing new values
    const updatedData = {
      licence_num: licence_num !== undefined ? licence_num : existing.licence_num,
      specialization: specialization !== undefined ? specialization : existing.specialization,
      institution: institution !== undefined ? institution : existing.institution,
    };

    // 3. If licence_num is changing, check for duplicates
    if (licence_num && licence_num !== existing.licence_num) {
      const exists = await DB.healthcareWorkerLicenceExists(licence_num, userId);
      if (exists) {
        return res.status(409).json({ error: "Licence number is already used by another healthcare worker" });
      }
    }

    // 4. Proceed with update
    const updated = await DB.updateHealthcareWorker(userId, updatedData);

    res.status(200).json({ message: "Healthcare Worker updated successfully", data: updated });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});



// delete healthcare worker
healthcareWorker.delete("/:id", async (req, res) => {
  try {
    await DB.deleteHealthcareWorker(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = healthcareWorker;
