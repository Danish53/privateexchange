import bcrypt from 'bcryptjs';

export function generateSixDigitOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

export async function compareOtp(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
