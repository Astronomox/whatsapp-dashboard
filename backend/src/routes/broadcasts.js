const express = require('express');
const Broadcast = require('../models/Broadcast');
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const whatsapp = require('../services/whatsappService');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/broadcasts - list all broadcasts
router.get('/', auth, async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(broadcasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/broadcasts - create a broadcast
router.post('/', auth, async (req, res) => {
  try {
    const broadcast = await Broadcast.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(broadcast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/broadcasts/:id/send - execute a broadcast
router.post('/:id/send', auth, async (req, res) => {
  try {
    const broadcast = await Broadcast.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!broadcast) return res.status(404).json({ error: 'Broadcast not found' });

    // Resolve recipients from labels if needed
    let recipients = [...broadcast.recipients];
    if (broadcast.targetLabels.length > 0) {
      const contacts = await Contact.find({
        createdBy: req.user._id,
        labels: { $in: broadcast.targetLabels },
        conversationStatus: 'active',
      });
      const labelPhones = contacts.map((c) => c.phone);
      recipients = [...new Set([...recipients, ...labelPhones])];
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients found' });
    }

    // Update broadcast status
    broadcast.status = 'sending';
    broadcast.stats.total = recipients.length;
    await broadcast.save();

    // Send messages (async - returns immediately, processes in background)
    res.json({ message: 'Broadcast started', total: recipients.length });

    // Process in background
    try {
      const results = await whatsapp.sendBulkMessages(
        recipients,
        broadcast.messageType,
        broadcast.messageData
      );

      // Save message records
      for (const result of results) {
        await Message.create({
          waMessageId: result.data?.messages?.[0]?.id,
          contactPhone: result.recipient,
          direction: 'outbound',
          type: broadcast.messageType,
          content: broadcast.messageData.body || broadcast.messageData.templateName || '',
          templateName: broadcast.messageData.templateName,
          status: result.status === 'sent' ? 'sent' : 'failed',
          broadcastId: broadcast._id,
          createdBy: req.user._id,
        });

        if (result.status === 'sent') broadcast.stats.sent++;
        else broadcast.stats.failed++;
      }

      broadcast.status = 'completed';
      await broadcast.save();
    } catch (err) {
      broadcast.status = 'failed';
      await broadcast.save();
      console.error('Broadcast failed:', err.message);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/broadcasts/:id - get broadcast details with stats
router.get('/:id', auth, async (req, res) => {
  try {
    const broadcast = await Broadcast.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!broadcast) return res.status(404).json({ error: 'Broadcast not found' });

    const messages = await Message.find({ broadcastId: broadcast._id });
    res.json({ broadcast, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/broadcasts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const broadcast = await Broadcast.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!broadcast) return res.status(404).json({ error: 'Broadcast not found' });
    res.json({ message: 'Broadcast deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
