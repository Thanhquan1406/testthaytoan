const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
    requestedIp: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

passwordResetTokenSchema.index({ userId: 1, usedAt: 1 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
