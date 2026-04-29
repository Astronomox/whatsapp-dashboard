const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    waMessageId: { type: String, index: true },
    contactPhone: { type: String, required: true },
    contactName: { type: String, default: '' },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    type: {
      type: String,
      enum: ['text', 'template', 'image', 'document', 'audio', 'video', 'location', 'reaction'],
      default: 'text',
    },
    content: { type: String, default: '' },
    templateName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending',
    },
    broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broadcast' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

messageSchema.index({ contactPhone: 1, createdAt: -1 });
messageSchema.index({ broadcastId: 1 });

module.exports = mongoose.model('Message', messageSchema);
