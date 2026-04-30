// // import { NextResponse } from 'next/server';
// // import { loadRequestActor } from '@/lib/authHelpers';
// // import { connectDB } from '@/lib/db';
// // import Token from '@/lib/models/Token';
// // import Wallet from '@/lib/models/Wallet';
// // import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
// // import LedgerEntry from '@/lib/models/LedgerEntry';
// // import mongoose from 'mongoose';
// // import { ensurePlatformTokens } from '@/lib/walletService';

// // export const runtime = 'nodejs';

// // export async function POST(request) {
// //   let session = null;

// //   try {
// //     const auth = await loadRequestActor(request);
// //     if ('error' in auth) return auth.error;

// //     await connectDB();

// //     const { tokenSlug, usdAmount } = await request.json();

// //     if (!tokenSlug || typeof tokenSlug !== 'string') {
// //       return NextResponse.json({ ok: false, error: 'Token slug required' }, { status: 400 });
// //     }

// //     if (!usdAmount || usdAmount <= 0) {
// //       return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 });
// //     }

// //     const User = (await import('@/lib/models/User')).default;
// //     const user = await User.findById(auth.userId).lean();

// //     if (!user || user.role !== 'user') {
// //       return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
// //     }

// //     await ensurePlatformTokens();

// //     session = await mongoose.startSession();
// //     session.startTransaction();

// //     // 🔹 Token find
// //     const token = await Token.findOne({ slug: tokenSlug.toLowerCase() }).session(session);

// //     if (!token || !token.isActive) {
// //       throw new Error('Token not available');
// //     }

// //     if (!token.usdPerUnit || token.usdPerUnit <= 0) {
// //       throw new Error('Invalid token price');
// //     }

// //     // 🔹 Wallet
// //     let wallet = await Wallet.findOne({ user: auth.userId }).session(session);

// //     if (!wallet) {
// //       wallet = (await Wallet.create([{ user: auth.userId }], { session }))[0];
// //     }

// //     // 🔹 SAME TOKEN BALANCE (IMPORTANT)
// //     let balanceDoc = await WalletTokenBalance.findOne({
// //       wallet: wallet._id,
// //       token: token._id,
// //     }).session(session);

// //     if (!balanceDoc) {
// //       throw new Error('No balance found for this token');
// //     }

// //     const currentBalance = balanceDoc.balance || 0;

// //     // ❌ insufficient
// //     if (currentBalance < usdAmount) {
// //       throw new Error('Insufficient balance in this token');
// //     }

// //     // 🔹 Calculate tokens
// //     const tokenAmount = Number(
// //       (usdAmount / token.usdPerUnit).toFixed(8)
// //     );

// //     if (tokenAmount <= 0) {
// //       throw new Error('Amount too small');
// //     }

// //     // 🔥 CORE LOGIC
// //     balanceDoc.balance -= usdAmount; // USD minus
// //     balanceDoc.purchasedBalance =
// //       (balanceDoc.purchasedBalance || 0) + tokenAmount; // tokens add

// //     await balanceDoc.save({ session });

// //     // 🔹 Ledger (optional but recommended)
// // // 1️⃣ USD deduct entry
// // await LedgerEntry.create([{
// //   userId: auth.userId,
// //   type: 'transfer',
// //   token: token.symbol, // same token
// //   amount: usdAmount,
// //   direction: 'debit',
// //   note: `USD used to buy in ${token.symbol}`,
// //   balanceAfter: balanceDoc.balance,
// //   externalRef: `buy:${token.slug}`,
// // }], { session });

// // // 2️⃣ Token purchase entry
// // await LedgerEntry.create([{
// //   userId: auth.userId,
// //   type: 'transfer',
// //   token: token.symbol,
// //   amount: tokenAmount,
// //   direction: 'credit',
// //   note: `Tokens purchased in ${token.symbol}`,
// //   balanceAfter: balanceDoc.purchasedBalance,
// //   externalRef: `buy:${token.slug}`,
// // }], { session });

// //     await session.commitTransaction();
// //     await session.endSession();

// //     return NextResponse.json({
// //       ok: true,
// //       message: `Bought ${tokenAmount} ${token.symbol}`,
// //       data: {
// //         token: token.symbol,
// //         usdUsed: usdAmount,
// //         tokensReceived: tokenAmount,
// //         remainingBalance: balanceDoc.balance,
// //         purchasedTotal: balanceDoc.purchasedBalance,
// //       },
// //     });

// //   } catch (err) {
// //     if (session) {
// //       await session.abortTransaction();
// //       await session.endSession();
// //     }

// //     return NextResponse.json({
// //       ok: false,
// //       error: err.message,
// //     }, { status: 500 });
// //   }
// // }






// import { NextResponse } from 'next/server';
// import { loadRequestActor } from '@/lib/authHelpers';
// import { connectDB } from '@/lib/db';
// import Token from '@/lib/models/Token';
// import Wallet from '@/lib/models/Wallet';
// import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
// import LedgerEntry from '@/lib/models/LedgerEntry';
// import mongoose from 'mongoose';
// import { ensurePlatformTokens } from '@/lib/walletService';

// export const runtime = 'nodejs';

// export async function POST(request) {
//   let session = null;

//   try {
//     const auth = await loadRequestActor(request);
//     if ('error' in auth) return auth.error;

//     await connectDB();

//     const { tokenSlug, usdAmount } = await request.json();

//     if (!tokenSlug || typeof tokenSlug !== 'string') {
//       return NextResponse.json({ ok: false, error: 'Token slug required' }, { status: 400 });
//     }

//     if (!usdAmount || usdAmount <= 0) {
//       return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 });
//     }

//     const User = (await import('@/lib/models/User')).default;
//     const user = await User.findById(auth.userId).lean();

//     if (!user || user.role !== 'user') {
//       return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
//     }

//     await ensurePlatformTokens();

//     session = await mongoose.startSession();
//     session.startTransaction();

//     // 🔹 Token
//     const token = await Token.findOne({ slug: tokenSlug.toLowerCase() }).session(session);

//     if (!token || !token.isActive) {
//       throw new Error('Token not available');
//     }

//     if (!token.usdPerUnit || token.usdPerUnit <= 0) {
//       throw new Error('Invalid token price');
//     }

//     // 🔹 Wallet
//     let wallet = await Wallet.findOne({ user: auth.userId }).session(session);

//     if (!wallet) {
//       wallet = (await Wallet.create([{ user: auth.userId }], { session }))[0];
//     }

//     // 🔹 Balance doc
//     const balanceDoc = await WalletTokenBalance.findOne({
//       wallet: wallet._id,
//       token: token._id,
//     }).session(session);

//     console.log('Current balance doc:', balanceDoc);

//     if (!balanceDoc) {
//       throw new Error('No balance found for this token');
//     }

//     // ❌ insufficient
//     if (balanceDoc.balance < usdAmount) {
//       throw new Error('Insufficient balance in this token');
//     }

//     // 🔹 Token calculation
//     const tokenAmount = Number(
//       (usdAmount / token.usdPerUnit).toFixed(8)
//     );

//     if (tokenAmount <= 0) {
//       throw new Error('Amount too small');
//     }

//     console.log(`Buying ${tokenAmount} ${token.symbol} for ${usdAmount} USD`);

//     // 🔥 ATOMIC UPDATE (logic same, safe execution)
//     await WalletTokenBalance.updateOne(
//       {
//         wallet: wallet._id,
//         token: token._id,
//       },
//       {
//         $inc: {
//           balance: -usdAmount,
//           purchasedBalance: tokenAmount,
//         },
//       },
//       { session }
//     );

//     // 🔹 Updated values fetch
//     const updatedBalance = await WalletTokenBalance.findOne({
//       wallet: wallet._id,
//       token: token._id,
//     }).session(session);

//     // 🔹 Ledger entries (correct accounting)
//     await LedgerEntry.create(
//       [
//         {
//           userId: auth.userId,
//           type: 'transfer',
//           token: token.symbol,
//           amount: usdAmount,
//           direction: 'debit',
//           note: `USD used to buy in ${token.symbol}`,
//           balanceAfter: updatedBalance.balance,
//           externalRef: `buy:${token.slug}`,
//         },
//         {
//           userId: auth.userId,
//           type: 'transfer',
//           token: token.symbol,
//           amount: tokenAmount,
//           direction: 'credit',
//           note: `Tokens purchased in ${token.symbol}`,
//           balanceAfter: updatedBalance.purchasedBalance,
//           externalRef: `buy:${token.slug}`,
//         }
//       ],
//       { session, ordered: true } // 🔥 THIS LINE FIXES IT
//     );

//     await session.commitTransaction();
//     await session.endSession();

//     return NextResponse.json({
//       ok: true,
//       message: `Bought ${tokenAmount} ${token.symbol}`,
//       data: {
//         token: token.symbol,
//         usdUsed: usdAmount,
//         tokensReceived: tokenAmount,
//         remainingBalance: updatedBalance.balance,
//         purchasedTotal: updatedBalance.purchasedBalance,
//       },
//     });

//   } catch (err) {
//     if (session) {
//       await session.abortTransaction();
//       await session.endSession();
//     }

//     return NextResponse.json({
//       ok: false,
//       error: err.message,
//     }, { status: 500 });
//   }
// }



import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import { connectDB } from '@/lib/db';
import Token from '@/lib/models/Token';
import Wallet from '@/lib/models/Wallet';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import LedgerEntry from '@/lib/models/LedgerEntry';
import mongoose from 'mongoose';
import User from '@/lib/models/User';

export const runtime = 'nodejs';

export async function POST(request) {
  let session;

  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    await connectDB();

    const { tokenSlug, usdAmount } = await request.json();

    if (!tokenSlug || !usdAmount || usdAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    const user = await User.findById(auth.userId).lean();

    if (!user || user.role !== 'user') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // 1️⃣ Token fetch
    const token = await Token.findOne({
      slug: tokenSlug.toLowerCase()
    }).session(session);

    if (!token || !token.isActive) {
      throw new Error('Token not available');
    }

    if (!token.usdPerUnit || token.usdPerUnit <= 0) {
      throw new Error('Invalid token price');
    }

    // 2️⃣ Wallet
    let wallet = await Wallet.findOne({ user: auth.userId }).session(session);

    if (!wallet) {
      wallet = (await Wallet.create([{ user: auth.userId }], { session }))[0];
    }

    // 3️⃣ Balance doc
    const balanceDoc = await WalletTokenBalance.findOne({
      wallet: wallet._id,
      token: token._id,
    }).session(session);

    if (!balanceDoc) {
      throw new Error('Wallet token balance not found');
    }

    // ⚠️ USD is inside same balance
    const currentUsd = balanceDoc.balance || 0;

    if (currentUsd < usdAmount) {
      throw new Error('Insufficient USD balance');
    }

    // 4️⃣ Convert
    const tokenAmount = Number((usdAmount / token.usdPerUnit).toFixed(8));

    if (tokenAmount <= 0) {
      throw new Error('Invalid conversion');
    }

    console.log('Before update:', balanceDoc);

    // 5️⃣ SAFE UPDATE (IMPORTANT FIX)
    balanceDoc.balance = currentUsd - usdAmount;

    balanceDoc.purchasedBalance =
      (balanceDoc.purchasedBalance || 0) + tokenAmount;

    await balanceDoc.save({ session });

    console.log('After update:', balanceDoc);

    // 6️⃣ Ledger (safe single create)
    await LedgerEntry.create(
      [
        {
          userId: auth.userId,
          type: 'transfer',
          token: token.symbol,
          amount: usdAmount,
          direction: 'debit',
          note: `USD spent for ${token.symbol}`,
          balanceAfter: balanceDoc.balance,
        },
        {
          userId: auth.userId,
          type: 'transfer',
          token: token.symbol,
          amount: tokenAmount,
          direction: 'credit',
          note: `Token purchased`,
          balanceAfter: balanceDoc.purchasedBalance,
        }
      ],
      { session, ordered: true }
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      ok: true,
      message: 'Purchase successful',
      data: {
        token: token.symbol,
        usdUsed: usdAmount,
        tokensReceived: tokenAmount,
        balanceAfter: balanceDoc.balance,
        purchasedBalance: balanceDoc.purchasedBalance,
      },
    });

  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    return NextResponse.json({
      ok: false,
      error: err.message,
    }, { status: 500 });
  }
}