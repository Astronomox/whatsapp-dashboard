const express = require('express');
const AutoReply = require('../models/AutoReply');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const whatsapp = require('../services/whatsappService');
const auth = require('../middleware/auth');

const router = express.Router();

// ═══════════════════════════════════════
// AUTO-REPLY CRUD
// ═══════════════════════════════════════

// GET /api/autoreplies
router.get('/', auth, async (req, res) => {
  try {
    const rules = await AutoReply.find({ createdBy: req.user._id }).sort({ priority: -1 });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/autoreplies
router.post('/', auth, async (req, res) => {
  try {
    const rule = await AutoReply.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/autoreplies/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const rule = await AutoReply.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/autoreplies/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const rule = await AutoReply.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json({ message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════
// WEBHOOK - Receives incoming WhatsApp messages
// ═══════════════════════════════════════

// GET /api/webhook - Verification endpoint (Meta requires this)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden');
});

// POST /api/webhook - Receive incoming messages
router.post('/webhook', async (req, res) => {
  // Always return 200 immediately (Meta requires this)
  res.status(200).send('OK');

  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') return;

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;

        // Handle status updates (sent, delivered, read)
        if (value.statuses) {
          for (const status of value.statuses) {
            await Message.findOneAndUpdate(
              { waMessageId: status.id },
              { status: status.status }
            );
          }
        }

        // Handle incoming messages
        if (value.messages) {
          for (const msg of value.messages) {
            const senderPhone = msg.from;
            const senderName =
              value.contacts?.find((c) => c.wa_id === senderPhone)?.profile?.name || '';

            // Save inbound message
            const inboundMessage = await Message.create({
              waMessageId: msg.id,
              contactPhone: senderPhone,
              contactName: senderName,
              direction: 'inbound',
              type: msg.type || 'text',
              content: msg.text?.body || msg.caption || `[${msg.type}]`,
              status: 'delivered',
            });

            // Mark as read
            try {
              await whatsapp.markAsRead(msg.id);
            } catch (e) {
              // Non-critical, continue
            }

            // Auto-reply logic
            if (msg.type === 'text' && msg.text?.body) {
              await processAutoReply(senderPhone, msg.text.body);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error.message);
  }
});

// ─── Auto-reply matching engine ───
async function processAutoReply(senderPhone, messageText) {
  const rules = await AutoReply.find({ isActive: true }).sort({ priority: -1 });
  const lowerText = messageText.toLowerCase();

  for (const rule of rules) {
    let matched = false;

    switch (rule.trigger.type) {
      case 'keyword':
        matched = lowerText === rule.trigger.value.toLowerCase();
        break;
      case 'contains':
        matched = lowerText.includes(rule.trigger.value.toLowerCase());
        break;
      case 'regex':
        try {
          matched = new RegExp(rule.trigger.value, 'i').test(messageText);
        } catch (e) {
          console.error('Invalid regex in auto-reply rule:', rule._id);
        }
        break;
      case 'default':
        matched = true; // catches everything not matched above
        break;
    }

    if (matched) {
      try {
        let result;
        switch (rule.response.type) {
          case 'text':
            result = await whatsapp.sendTextMessage(senderPhone, rule.response.body);
            break;
          case 'template':
            result = await whatsapp.sendTemplateMessage(senderPhone, rule.response.templateName);
            break;
          case 'image':
            result = await whatsapp.sendImageMessage(
              senderPhone,
              rule.response.imageUrl,
              rule.response.caption
            );
            break;
        }

        // Save outbound auto-reply message
        await Message.create({
          waMessageId: result?.messages?.[0]?.id,
          contactPhone: senderPhone,
          direction: 'outbound',
          type: rule.response.type,
          content: rule.response.body || rule.response.templateName || '',
          status: 'sent',
        });
      } catch (error) {
        console.error('Auto-reply send failed:', error.message);
      }

      break; // Stop after first match
    }
  }
}

module.exports = router;
