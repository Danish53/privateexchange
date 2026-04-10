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

/**
 * New member or admin: email + password set by superadmin (recipient should change password after first login).
 * @param {'user'|'admin'} role
 */
export async function sendProvisionedCredentials(email, password, name, loginUrl, role) {
  const transport = getTransport();
  const isAdmin = role === 'admin';
  const subject = isAdmin
    ? 'Your 759 Private Exchange admin account'
    : 'Your 759 Private Exchange member account';
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const accountLine = isAdmin
    ? 'An administrator account has been created for you on 759 Private Exchange.'
    : 'A member account has been created for you on 759 Private Exchange.';
  const text =
    `${greeting}\n\n` +
    `${accountLine}\n\n` +
    `Sign-in page:\n${loginUrl}\n\n` +
    `Email (login):\n${email}\n\n` +
    `Temporary password:\n${password}\n\n` +
    `Please sign in and change your password from your profile as soon as possible.\n\n` +
    `If you did not expect this email, contact your platform administrator.\n`;

  if (!transport) {
    console.info(
      '[email] SMTP not configured. Provisioned credentials for',
      email,
      role,
      '(password not logged)'
    );
    return { sent: false, logged: true };
  }

  await transport.sendMail({ from: FROM, to: email, subject, text });
  return { sent: true };
}

/** Wrapper for admin-only wording; same transport as sendProvisionedCredentials. */
export async function sendNewAdminCredentials(email, password, name, loginUrl) {
  return sendProvisionedCredentials(email, password, name, loginUrl, 'admin');
}
