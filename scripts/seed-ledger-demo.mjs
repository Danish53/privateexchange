/**
 * Inserts sample ledger rows for UI testing (optional).
 * Requires MONGODB_URI in .env.local and at least one active member user.
 *
 * Usage: npm run seed:ledger
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env.local');
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error('MONGODB_URI missing (.env.local)');
  process.exit(1);
}

const LedgerEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: ['deposit', 'withdrawal', 'transfer', 'fee', 'admin_credit', 'admin_debit'],
    },
    token: { type: String, required: true, trim: true, uppercase: true },
    amount: { type: Number, required: true, min: 0 },
    direction: { type: String, required: true, enum: ['credit', 'debit'] },
    counterpartyUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    externalRef: { type: String, default: '' },
    note: { type: String, default: '' },
    balanceAfter: { type: Number, default: null },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    email: String,
    role: String,
    deletedAt: Date,
  },
  { collection: 'users' }
);

async function main() {
  await mongoose.connect(uri);
  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const LedgerEntry =
    mongoose.models.LedgerEntry || mongoose.model('LedgerEntry', LedgerEntrySchema);

  const member = await User.findOne({ role: 'user', deletedAt: null }).sort({ createdAt: 1 });
  if (!member) {
    console.error('No active member user found. Create a normal user first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const count = await LedgerEntry.countDocuments({});
  if (count > 0) {
    console.log('Ledger already has entries. Skipping (delete collection to re-seed).');
    await mongoose.disconnect();
    return;
  }

  const uid = member._id;
  await LedgerEntry.insertMany([
    {
      userId: uid,
      type: 'deposit',
      token: '759',
      amount: 100,
      direction: 'credit',
      externalRef: 'demo-paypal-001',
      note: 'Sample deposit',
    },
    {
      userId: uid,
      type: 'fee',
      token: '759',
      amount: 0.5,
      direction: 'debit',
      note: 'Transfer fee (demo)',
    },
    {
      userId: uid,
      type: 'admin_credit',
      token: 'CRISTALINO',
      amount: 25,
      direction: 'credit',
      note: 'Manual adjustment — demo',
    },
  ]);

  console.log('Inserted 3 demo ledger lines for', member.email);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
