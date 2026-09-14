import mongoose from 'mongoose';

const externalPlatformLinkSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  platformId: { type: String, required: true, index: true },
  platformName: { type: String, required: true },
  category: { type: String, required: true },
  isConnected: { type: Boolean, default: false },
  lastSynced: { type: Date, default: null },
  holdingsValue: { type: Number, default: 0 },
  apiKeyMasked: { type: String, default: null },
  syncStatus: { type: String, enum: ['IDLE', 'SYNCING', 'SUCCESS', 'FAILED'], default: 'IDLE' },
  holdingsData: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

externalPlatformLinkSchema.index({ userId: 1, platformId: 1 }, { unique: true });

export default mongoose.models.ExternalPlatformLink || mongoose.model('ExternalPlatformLink', externalPlatformLinkSchema);
