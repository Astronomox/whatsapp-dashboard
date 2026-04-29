const mongoose = require('mongoose');

const autoReplySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    trigger: {
      type: { type: String, enum: ['keyword', 'contains', 'regex', 'default'], required: true },
      value: { type: String, default: '' },
    },
    response: {
      type: { type: String, enum: ['text', 'template', 'image'], default: 'text' },
      body: { type: String },
      templateName: { type: String },
      imageUrl: { type: String },
      caption: { type: String },
    },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 }, // higher = checked first
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

autoReplySchema.index({ isActive: 1, priority: -1 });

module.exports = mongoose.model('AutoReply', autoReplySchema);
