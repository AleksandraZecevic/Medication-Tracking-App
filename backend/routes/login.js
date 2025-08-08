const express = require('express');
const log = express.Router();
const DB = require('../db/connection.js');

log.use(express.json());

log.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await DB.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.password !== password) return res.status(401).json({ error: 'Invalid email or password' });

    // Don't send password back
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = log;
