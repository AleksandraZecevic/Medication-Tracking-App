const express = require('express');
const user = express.Router();
const DB = require('../db/connection.js');

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Middleware to parse both JSON and URL-encoded forms
user.use(bodyParser.json());
user.use(urlencodedParser);

// get all users
user.get('/', async (req, res) => {
  try {
    const users = await DB.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//max id
user.get('/nextid', async (req, res) => {
  try {
    const maxId = await DB.getMaxUserId(); 
    const nextId = (maxId || 0) + 1;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get user by id
user.get('/:id', async (req, res) => {
  try {
    const result = await DB.getUserById(req.params.id);
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function validateUserData(data, isUpdate = false) {
  const { email, password } = data;

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return "Invalid email format";
  }

  // Password length validation (only if provided in update or required in create)
  if (!isUpdate || password) {
    if (!password || password.length < 6) {
      return "Password must be at least 6 characters long";
    }
  }

  return null;
}


// create user
user.post('/', urlencodedParser ,async (req, res) => {
  try {
     const errorMsg = validateUserData(req.body, false);
    if (errorMsg) return res.status(400).json({ error: errorMsg });

    const newUser = await DB.createUser(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update user by id
user.put('/:id', async (req, res) => {
  try {
     const errorMsg = validateUserData(req.body, true);
    if (errorMsg) return res.status(400).json({ error: errorMsg });
    
    const updated = await DB.updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete user
user.delete('/:id', async (req, res) => {
  try {
    const result = await DB.deleteUser(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = user;
