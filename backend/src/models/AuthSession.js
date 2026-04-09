const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true, index: true },
    deviceName: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    lastActiveAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

authSessionSchema.index({ userId: 1, revokedAt: 1 });

module.exports = mongoose.model('AuthSession', authSessionSchema);
