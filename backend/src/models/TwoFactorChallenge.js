const mongoose = require('mongoose');

const twoFactorChallengeSchema = new mongoose.Schema(
  {
    challengeHash: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true, index: true },
    sessionId: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TwoFactorChallenge', twoFactorChallengeSchema);
