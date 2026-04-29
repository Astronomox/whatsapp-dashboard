const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/messages - get messages (optionally filtered by phone)
router.get('/', auth, async (req, res) => {
  try {
    const { phone, page = 1, limit = 50 } = req.query;
    const query = {};

    if (phone) query.contactPhone = phone;

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Message.countDocuments(query);

    res.json({ messages, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/conversations - get unique conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$contactPhone',
          contactName: { $first: '$contactName' },
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          direction: { $first: '$direction' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$direction', 'inbound'] }, { $ne: ['$status', 'read'] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/stats - dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const [totalSent, totalReceived, sentToday, sentThisWeek] = await Promise.all([
      Message.countDocuments({ direction: 'outbound' }),
      Message.countDocuments({ direction: 'inbound' }),
      Message.countDocuments({ direction: 'outbound', createdAt: { $gte: today } }),
      Message.countDocuments({ direction: 'outbound', createdAt: { $gte: thisWeek } }),
    ]);

    res.json({ totalSent, totalReceived, sentToday, sentThisWeek });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
