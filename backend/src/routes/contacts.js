const express = require('express');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/contacts - list all contacts (with optional label filter)
router.get('/', auth, async (req, res) => {
  try {
    const { label, search, page = 1, limit = 50 } = req.query;
    const query = { createdBy: req.user._id };

    if (label) query.labels = label;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Contact.countDocuments(query);

    res.json({ contacts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contacts - create a single contact
router.post('/', auth, async (req, res) => {
  try {
    const contact = await Contact.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(contact);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Contact with this phone number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contacts/import - bulk import contacts
router.post('/import', auth, async (req, res) => {
  try {
    const { contacts } = req.body; // array of { name, phone, labels?, notes? }

    const operations = contacts.map((c) => ({
      updateOne: {
        filter: { phone: c.phone, createdBy: req.user._id },
        update: { $set: { ...c, createdBy: req.user._id } },
        upsert: true,
      },
    }));

    const result = await Contact.bulkWrite(operations);
    res.json({
      imported: result.upsertedCount,
      updated: result.modifiedCount,
      total: contacts.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/contacts/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contacts/labels/all - get all unique labels
router.get('/labels/all', auth, async (req, res) => {
  try {
    const labels = await Contact.distinct('labels', { createdBy: req.user._id });
    res.json(labels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
