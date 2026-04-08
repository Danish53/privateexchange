import nodemailer from 'nodemailer';

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM = process.env.SMTP_FROM || 'noreply@759exchange.local';

export async function sendVerificationOtp(email, otp, name) {
  const transport = getTransport();
  const subject = 'Your 759 Private Exchange verification code';
  const text = `Hello${name ? ` ${name}` : ''},\n\nYour verification code is: ${otp}\n\nIt expires in 10 minutes.\n\nIf you did not request this, ignore this email.\n`;

  if (!transport) {
    console.info('[email] SMTP not configured. Verification OTP for', email, ':', otp);
    return { sent: false, logged: true };
  }

  await transport.sendMail({ from: FROM, to: email, subject, text });
  return { sent: true };
}

export async function sendPasswordResetOtp(email, otp, name) {
  const transport = getTransport();
  const subject = 'Your 759 Private Exchange password reset code';
  const text = `Hello${name ? ` ${name}` : ''},\n\nYour password reset code is: ${otp}\n\nIt expires in 15 minutes.\n\nIf you did not request this, ignore this email.\n`;

  if (!transport) {
    console.info('[email] SMTP not configured. Reset OTP for', email, ':', otp);
    return { sent: false, logged: true };
  }

  await transport.sendMail({ from: FROM, to: email, subject, text });
  return { sent: true };
}
