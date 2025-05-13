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

    await DB.createDonationCenter({ user_id, center_name, address, verification_status });
    res.status(201).send("Donation Center inserted successfully");
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = donationCenter;
