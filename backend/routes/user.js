const express = require('express');
const user = express.Router();
const DB = require('../db/connection.js');

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Middleware to parse both JSON and URL-encoded forms
medication.use(bodyParser.json());
medication.use(urlencodedParser);

user.get('/', async (req, res) => {
  try {
    const users = await DB.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

user.get('/:id', async (req, res) => {
  try {
    const result = await DB.getUserById(req.params.id);
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

user.post('/', urlencodedParser ,async (req, res) => {
  try {
    const newUser = await DB.createUser(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

user.put('/:id', async (req, res) => {
  try {
    const updated = await DB.updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

user.delete('/:id', async (req, res) => {
  try {
    const result = await DB.deleteUser(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = user;
