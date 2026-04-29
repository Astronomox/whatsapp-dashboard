const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    messageType: {
      type: String,
      enum: ['text', 'template', 'image'],
      required: true,
    },
    messageData: {
      body: String,
      templateName: String,
      languageCode: { type: String, default: 'en_US' },
      components: [mongoose.Schema.Types.Mixed],
      imageUrl: String,
      caption: String,
    },
    recipients: [{ type: String }], // phone numbers
    targetLabels: [{ type: String }], // or send to contacts with these labels
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'completed', 'failed'],
      default: 'draft',
    },
    scheduledAt: { type: Date },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Broadcast', broadcastSchema);
