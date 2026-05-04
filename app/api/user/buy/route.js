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

    // 🔹 Validation
    if (!tokenSlug || typeof tokenSlug !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Token slug required' },
        { status: 400 }
      );
    }

    if (!usdAmount || typeof usdAmount !== 'number' || usdAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Invalid USD amount' },
        { status: 400 }
      );
    }

    // 🔹 User check
    const user = await User.findById(auth.userId).lean();
    if (!user || user.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 🔥 Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // 🔹 Find USD token (slug 'usd')
    const usdToken = await Token.findOne({
      slug: 'usd',
    }).session(session);

    if (!usdToken || !usdToken.isActive) {
      throw new Error('USD token not available');
    }

    // 🔹 Find selected token to buy
    const token = await Token.findOne({
      slug: tokenSlug.toLowerCase(),
    }).session(session);

    if (!token || !token.isActive) {
      throw new Error('Token not available');
    }

    if (!token.usdPerUnit || token.usdPerUnit <= 0) {
      throw new Error('Invalid token price');
    }

    // 🔹 Wallet
    let wallet = await Wallet.findOne({ user: auth.userId }).session(session);

    if (!wallet) {
      wallet = (await Wallet.create([{ user: auth.userId }], { session }))[0];
    }

    // 🔹 Find USD token balance (to deduct from)
    let usdBalanceDoc = await WalletTokenBalance.findOne({
      wallet: wallet._id,
      token: usdToken._id,
    }).session(session);

    if (!usdBalanceDoc) {
      throw new Error('USD wallet balance not found');
    }

    const currentUsdBalance = usdBalanceDoc.balance || 0;

    // ❌ insufficient USD balance
    if (currentUsdBalance < usdAmount) {
      throw new Error(`Insufficient USD balance. You have $${currentUsdBalance.toFixed(2)} USD available.`);
    }

    // 🔹 Find selected token balance (to add purchasedBalance)
    let tokenBalanceDoc = await WalletTokenBalance.findOne({
      wallet: wallet._id,
      token: token._id,
    }).session(session);

    if (!tokenBalanceDoc) {
      // Create token balance if doesn't exist
      tokenBalanceDoc = (await WalletTokenBalance.create([{
        wallet: wallet._id,
        token: token._id,
        balance: 0,
        // purchasedBalance: 0,
      }], { session }))[0];
    }

    // 🧠 FIX: old docs may not have purchasedBalance
    if (typeof tokenBalanceDoc.balance !== 'number') {
      tokenBalanceDoc.balance = 0;
    }

    // 🔹 Calculate tokens to receive
    const tokenAmount = Number(
      (usdAmount / token.usdPerUnit).toFixed(8)
    );

    if (tokenAmount <= 0) {
      throw new Error('Amount too small');
    }

    // 🔥 UPDATE USD balance (deduct)
    usdBalanceDoc.balance = currentUsdBalance - usdAmount;
    await usdBalanceDoc.save({ session });

    // 🔥 UPDATE token balance (add)
    tokenBalanceDoc.balance += tokenAmount;
    tokenBalanceDoc.markModified('balance');
    await tokenBalanceDoc.save({ session });

    // 🔹 Single ledger entry for conversion (as requested by user)
    await LedgerEntry.create(
      [{
        userId: auth.userId,
        type: 'transfer',
        token: token.symbol,
        amount: tokenAmount,
        direction: 'credit',
        note: `Converted $${usdAmount.toFixed(2)} USD to ${tokenAmount.toFixed(8)} ${token.symbol}`,
        balanceAfter: tokenBalanceDoc.balance,
        externalRef: `buy:${token.slug}`,
      }],
      { session }
    );

    // ✅ Commit
    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      ok: true,
      message: `${tokenAmount} ${token.symbol} Buy successful!`,
      data: {
        token: token.symbol,
        usdUsed: usdAmount,
        tokensReceived: tokenAmount,
        remainingUsdBalance: usdBalanceDoc.balance,
        totalTokenBalance: tokenBalanceDoc.balance,
      },
    });

  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    console.error('BUY ERROR:', err);

    return NextResponse.json(
      {
        ok: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}