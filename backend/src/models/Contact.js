const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    labels: [{ type: String, trim: true }],
    notes: { type: String, default: '' },
    lastMessageAt: { type: Date },
    conversationStatus: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Index for fast lookups
contactSchema.index({ phone: 1, createdBy: 1 }, { unique: true });
contactSchema.index({ labels: 1 });

module.exports = mongoose.model('Contact', contactSchema);
