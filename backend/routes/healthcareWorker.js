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

    if (user.role !== "healthcare_worker") {
      return res.status(400).send("User does not have the role 'healthcare_worker'");
    }

    // Check if licence_num already exists
    const existing = await new Promise((resolve, reject) => {
      DB.db.query(
        'SELECT * FROM `HealthCare Worker` WHERE licence_num = ?',
        [licence_num],
        (err, results) => {
          if (err) return reject(err);
          resolve(results.length > 0);
        }
      );
    });

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

  try {
    await DB.updateHealthcareWorker(req.params.id, {
      licence_num,
      specialization,
      institution,
    });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
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
