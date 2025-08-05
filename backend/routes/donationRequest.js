const express = require("express");
const donationRequest = express.Router();
const DB = require("../db/connection.js");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

donationRequest.use(bodyParser.json());
donationRequest.use(urlencodedParser);


// Get all
donationRequest.get("/", async (req, res) => {
  try {
    const data = await DB.getAllDonationRequests();
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get one
donationRequest.get("/:id", async (req, res) => {
  try {
    const dreq = await DB.getDonationRequestById(req.params.id);
    if (!dreq) return res.status(404).send("Not found");
    res.json(dreq);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Create
donationRequest.post("/", async (req, res) => {
  const { dreq_id, entry_id, center_id, status } = req.body;

  if (!dreq_id || !entry_id || !center_id || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await DB.createDonationRequest({ dreq_id, entry_id, center_id, status });
    res.status(201).json({ message: "Donation request created", data: result });
  } catch (err) {
    console.error("CREATE ERROR:", err.message || err);
    res.status(500).json({ error: err.message });
  }
});


// Update
donationRequest.put("/:id", async (req, res) => {
  try {
    const result = await DB.updateDonationRequest(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete
donationRequest.delete("/:id", async (req, res) => {
  try {
    const result = await DB.deleteDonationRequest(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = donationRequest;
