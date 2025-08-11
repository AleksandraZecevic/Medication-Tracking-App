const express = require("express");
const sideEffect = express.Router();
const DB = require("../db/connection.js");

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });


sideEffect.use(bodyParser.json());
sideEffect.use(urlencodedParser);

// Get next se_id
sideEffect.get('/nextid', async (req, res) => {
  try {
    const maxId = await DB.getMaxSEId();
    const nextId = (maxId || 0) + 1;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET all side effects
sideEffect.get("/", async (req, res) => {
  try {
    const results = await DB.allSideEffects();
    res.json(results);
  } catch (err) {
    console.error("GET ALL ERROR:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

// GET side effect by ID
sideEffect.get("/:id", async (req, res) => {
  try {
    const result = await DB.getSideEffectById(req.params.id);
    if (!result) {
      return res.status(404).send("Side effect not found");
    }
    res.json(result);
  } catch (err) {
    console.error("GET BY ID ERROR:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

// GET side effect by entry ID
sideEffect.get("/entry_id/:id", async (req, res) => {
  try {
    const result = await DB.getSideEffectByEntryId(req.params.id);
    if (!result) {
      return res.status(404).send("Side effect not found");
    }
    res.json(result);
  } catch (err) {
    console.error("GET BY ID ERROR:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

// POST new side effect
sideEffect.post("/", urlencodedParser, async (req, res) => {
  try {
    const { entry_id, description } = req.body;

    if (!entry_id || !description) {
      return res.status(400).send("Missing required fields: entry_id and description");
    }

    // Get next se_id from DB helper
    const maxId = await DB.getMaxSEId();
    const nextId = (maxId || 0) + 1;

    const newSideEffect = await DB.createSideEffect({
      se_id: nextId,
      entry_id: Number(entry_id),
      description,
    });

    res.status(201).json({
      message: "Side effect created successfully",
      data: newSideEffect,
    });
  } catch (err) {
    console.error("CREATE ERROR:", err.message);
    res.status(500).send(err.message);
  }
});


// PUT (partial update) side effect
sideEffect.put("/:id", urlencodedParser, async (req, res) => {
  try {
    const se_id = parseInt(req.params.id, 10);
    const { entry_id, description } = req.body;

    const updated = await DB.updateSideEffect(se_id, {
      ...(entry_id !== undefined && { entry_id: Number(entry_id) }),
      ...(description !== undefined && { description })
    });

    res.status(200).json({
      message: "Side effect updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).send(err.message);
  }
});

// DELETE side effect
sideEffect.delete("/:id", async (req, res) => {
  try {
    const result = await DB.deleteSideEffect(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    res.status(500).send(err.message);
  }
});



module.exports = sideEffect;
