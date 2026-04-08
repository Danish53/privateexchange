/**
 * Creates or updates the default Super Admin user for local/dev.
 * Reads MONGODB_URI from .env.local (same as the Next app).
 *
 * Usage: npm run seed:superadmin
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

const MONGODB_URI = process.env.MONGODB_URI?.trim();
const EMAIL = 'superadmin@gmail.com';
const PASSWORD = '12345678';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    phone: { type: String, default: '' },
    country: { type: String, default: '' },
    timezone: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    emailVerified: { type: Boolean, default: false },
    verificationOtpHash: { type: String, default: null },
    verificationOtpExpires: { type: Date, default: null },
    resetPasswordOtpHash: { type: String, default: null },
    resetPasswordOtpExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function main() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing. Add it to .env.local in the project root.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 25_000 });
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  let user = await User.findOne({ email: EMAIL });
  if (!user) {
    user = new User({
      email: EMAIL,
      passwordHash,
      name: 'Super Admin',
      role: 'superadmin',
      emailVerified: true,
    });
    await user.save();
    console.log(`Created ${EMAIL} (superadmin). Password: ${PASSWORD}`);
  } else {
    user.passwordHash = passwordHash;
    user.role = 'superadmin';
    user.emailVerified = true;
    user.name = user.name || 'Super Admin';
    await user.save();
    console.log(`Updated ${EMAIL} (superadmin). Password reset to: ${PASSWORD}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
