const express = require("express");
const donationCenter = express.Router();
const DB = require("../db/connection.js");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

donationCenter.use(bodyParser.json());
donationCenter.use(urlencodedParser);

// all donation centers
donationCenter.get("/", async (req, res) => {
  try {
    const result = await DB.getAllDonationCenters();
    res.json(result);
  } catch (err) {
    res.status(500).send("Error fetching donation centers");
  }
});

// Create donation center
donationCenter.post("/", urlencodedParser, async (req, res) => {
  const { user_id, center_name, address, verification_status } = req.body;

  if (!user_id || isNaN(user_id)) {
    return res.status(400).send("Invalid or missing user_id");
  }

  try {
    const user = await DB.getUserById(user_id);
    if (!user) return res.status(404).send("User not found");

    if (user.role !== "donation_center") {
      return res.status(400).send("User does not have the role 'donation_center'");
    }

    await DB.createDonationCenter({ user_id, center_name, address, verification_status });
    res.status(201).send("Donation Center inserted successfully");
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Get donation center by ID
donationCenter.get("/:id", async (req, res) => {
  try {
    const user_id = req.params.id;
    const all = await DB.getAllDonationCenters();
    const center = all.find((d) => d.user_id == user_id);

    if (!center) return res.status(404).send("Donation Center not found");
    res.json(center);
  } catch (err) {
    res.status(500).send("Error fetching donation center");
  }
});

// Update donation center
donationCenter.put("/:id", urlencodedParser, async (req, res) => {
  const { center_name, address, verification_status } = req.body;
  const user_id = parseInt(req.params.id, 10);

  try {
  
    const existing = await DB.getDonationCenterById(user_id);
    if (!existing) {
      return res.status(404).json({ error: "Donation center not found" });
    }


    const updatedData = {
      center_name: center_name !== undefined ? center_name : existing.center_name,
      address: address !== undefined ? address : existing.address,
      verification_status: verification_status !== undefined ? verification_status : existing.verification_status
    };

  
    const updated = await DB.updateDonationCenter({ user_id, ...updatedData });

    res.status(200).json({ message: "Donation center updated successfully", data: updated });

  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});


// Delete donation center
donationCenter.delete("/:id", async (req, res) => {
  try {
    await DB.deleteDonationCenter(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});


module.exports = donationCenter;
