'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  Wallet,
  CreditCard,
  Banknote,
  Coins,
  Loader2,
  CheckCircle,
  Copy,
  ChevronRight,
  Shield,
  Lock,
  Globe,
  ArrowLeft,
  Check,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { useUserWallet } from '@/components/user-dashboard/useUserWallet';
import { useAuth } from '@/components/auth-context';
import { DepositRequestsTableSkeleton } from '@/components/ui/content-skeletons';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';


const DEPOSIT_METHODS = [
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Instant fiat deposits',
    status: 'Available',
    available: true,
    icon: Banknote,
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400',
    features: ['Instant processing', 'No crypto needed'],
    minAmount: 10,
    maxAmount: 10000,
    fee: '2.9% + $0.30',
  },
  {
    id: 'crypto',
    name: 'Crypto',
    description: 'On-chain deposits',
    status: 'Available',
    available: true,
    icon: Coins,
    color: 'from-amber-500 to-amber-600',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-400',
    features: ['Direct to wallet', 'Lower fees'],
    minAmount: 1,
    maxAmount: 50000,
    fee: 'Network fee only',
  },
];

export default function DepositPage() {
  const { token } = useAuth();
  const { loading, error, tokens, totalUsdFormatted } = useUserWallet();
  const [activeTokens, setActiveTokens] = useState([]);
  const [loadingActiveTokens, setLoadingActiveTokens] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('paypal');
  const [selectedToken, setSelectedToken] = useState('USD');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('select'); // 'select' or 'confirm'
  const [copied, setCopied] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [depositResult, setDepositResult] = useState(null);

  const [myDeposits, setMyDeposits] = useState([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [depositsError, setDepositsError] = useState('');

  const loadMyDeposits = useCallback(async () => {
    if (!token) {
      setMyDeposits([]);
      return;
    }
    setDepositsError('');
    setDepositsLoading(true);
    try {
      const res = await fetch('/api/user/deposit?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDepositsError(json.error || 'Could not load your requests.');
        setMyDeposits([]);
        return;
      }
      setMyDeposits(Array.isArray(json.deposits) ? json.deposits : []);
    } catch {
      setDepositsError('Network error.');
      setMyDeposits([]);
    } finally {
      setDepositsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadMyDeposits();
  }, [token, loadMyDeposits]);


  function formatDateTime(iso) {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return '—';
    }
  }

  function formatDepositAmount(n) {
    if (typeof n !== 'number' || Number.isNaN(n)) return '—';
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(n);
  }

  function DepositStatusBadge({ status }) {
    const map = {
      pending: { label: 'Pending', className: 'border-amber-500/35 bg-amber-500/[0.12] text-amber-100' },
      completed: { label: 'Approved', className: 'border-emerald-500/35 bg-emerald-500/[0.1] text-emerald-100' },
      cancelled: { label: 'Rejected', className: 'border-rose-500/35 bg-rose-500/[0.1] text-rose-100' },
    };
    const m = map[status] || { label: status, className: 'border-white/10 bg-white/5 text-brand-muted' };
    return (
      <span
        className={cn(
          'inline-flex rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.06em]',
          m.className
        )}
      >
        {m.label}
      </span>
    );
  }

  function PaymentMethodBadge({ method }) {
    const map = {
      paypal: { label: 'PayPal', className: 'border-blue-500/35 bg-blue-500/[0.1] text-blue-100' },
      crypto: { label: 'Crypto', className: 'border-purple-500/35 bg-purple-500/[0.1] text-purple-100' },
    };
    const m = map[method] || { label: method, className: 'border-white/10 bg-white/5 text-brand-muted' };
    return (
      <span
        className={cn(
          'inline-flex rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.06em]',
          m.className
        )}
      >
        {m.label}
      </span>
    );
  }

  // Fetch active tokens (we still fetch but don't use for token selection)
  useEffect(() => {
    const fetchActiveTokens = async () => {
      setLoadingActiveTokens(true);
      try {
        const res = await fetch('/api/superadmin/tokens');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setActiveTokens(data.data);
          // Don't override selectedToken - keep it as 'USD'
        }
      } catch (err) {
        console.error('Failed to fetch active tokens:', err);
      } finally {
        setLoadingActiveTokens(false);
      }
    };
    fetchActiveTokens();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedMethodData = DEPOSIT_METHODS.find(m => m.id === selectedMethod);
  // Static USD token object (always USD for deposits)
  const usdToken = {
    symbol: 'USD',
    name: 'US Dollar',
    usdPerUnit: 1,
    bar: 'bg-amber-500'
  };
  const selectedTokenData = usdToken; // Always USD

  // Calculate tokens user will receive based on usdPerUnit with precise calculation
  const calculateTokensToReceive = () => {
    if (!amount || isNaN(parseFloat(amount)) || !selectedTokenData?.usdPerUnit) return 0;
    const usdAmount = parseFloat(amount);
    const usdPerUnit = selectedTokenData.usdPerUnit;
    if (usdPerUnit <= 0) return 0;

    // Use precise calculation to avoid floating point errors
    if (usdPerUnit === 1) {
      // Exact conversion for USD token
      return usdAmount;
    }
    // Use fixed-point arithmetic for other tokens
    const precision = 1e8;
    const usdScaled = Math.round(usdAmount * precision);
    const unitScaled = Math.round(usdPerUnit * precision);
    return usdScaled / unitScaled;
  };

  const tokensToReceive = calculateTokensToReceive();

  const handleContinue = () => {
    if (step === 'select') {
      if (!amount || parseFloat(amount) < selectedMethodData?.minAmount) {
        alert(`Please enter amount at least $${selectedMethodData?.minAmount}`);
        return;
      }
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('select');
    }
  };

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setPaymentError('Please enter a valid amount.');
      return;
    }

    if (!token) {
      setPaymentError('You must be logged in to make a deposit.');
      return;
    }

    setProcessingPayment(true);
    setPaymentError('');
    setPaymentSuccess('');

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch('/api/user/deposit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: parseFloat(amount),
          token: 'USD', // Always USD for deposits
          paymentMethod: selectedMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setDepositResult(data.deposit);
      setPaymentSuccess(data.message || 'Deposit created successfully.');

      // If crypto deposit (auto‑approved), we can show immediate success
      // If PayPal deposit (pending), inform user about admin approval
      if (selectedMethod === 'crypto') {
        // Optionally refresh wallet balance
        // Could trigger a refetch of wallet data
      }
    } catch (err) {
      console.error('Deposit error:', err);
      setPaymentError(err.message || 'Failed to process deposit. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderStepProgress = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step === 'select' ? 'bg-brand-accent text-white' : 'bg-white/10 text-brand-subtle'}`}>
            <span className="font-semibold">1</span>
          </div>
          <div className="h-1 w-12 bg-white/20"></div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step === 'confirm' ? 'bg-brand-accent text-white' : 'bg-white/10 text-brand-subtle'}`}>
            <span className="font-semibold">2</span>
          </div>
        </div>
        <div className="text-sm text-brand-subtle">
          {step === 'select' ? 'Step 1 of 2' : 'Step 2 of 2'}
        </div>
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <div className={`font-medium ${step === 'select' ? 'text-white' : 'text-brand-subtle'}`}>
          Select Details
        </div>
        <div className={`font-medium ${step === 'confirm' ? 'text-white' : 'text-brand-subtle'}`}>
          Confirm & Pay
        </div>
      </div>
    </div>
  );

  const renderSelectStep = () => (
    <div className="space-y-6">
      {/* Payment Method Selection - Simplified */}
      <Panel title="Payment Method" subtitle="Choose how you want to deposit">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DEPOSIT_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethod(method.id)}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${selectedMethod === method.id
                ? `border-2 ${method.borderColor} ${method.color}/10 text-white`
                : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${method.color}/20`}>
                <method.icon className={`h-6 w-6 ${method.textColor}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{method.name}</h3>
                <p className="text-sm text-brand-subtle">{method.description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-400">
                    {method.status}
                  </span>
                  <span className="text-brand-subtle">Fee: {method.fee}</span>
                </div>
              </div>
              {selectedMethod === method.id && (
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              )}
            </button>
          ))}
        </div>
      </Panel>

      {/* Token Information - Always USD */}
      {/* <Panel title="Deposit Token" subtitle="All deposits go to USD balance">
        <div className="rounded-lg border border-brand-accent/20 bg-brand-accent/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <span className="text-lg font-bold text-amber-400">$</span>
              </div>
              <div>
                <p className="text-sm text-brand-subtle">Token</p>
                <p className="font-semibold text-white">US Dollar (USD)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-brand-subtle">Rate</p>
              <p className="font-semibold text-brand-accent">$1 = 1.0000 USD</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-brand-subtle">
            All deposits will be credited to your USD token balance. You can convert USD to other tokens later.
          </p>
        </div>
      </Panel> */}

      {/* Amount Input */}
      <Panel title="Enter Amount" subtitle="How much do you want to deposit?">
        <div className="space-y-4">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-4">
            <span className="text-2xl font-semibold text-white">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="ml-2 flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/30"
              min={selectedMethodData?.minAmount}
              max={selectedMethodData?.maxAmount}
              step="0.01"
            />
            <div className="ml-4 rounded-lg bg-white/10 px-3 py-2">
              <span className="font-medium text-white">USD</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {[50, 100, 250, 500, 1000].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value.toString())}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                ${value}
              </button>
            ))}
          </div>

          {/* Real-time Calculation */}
          {amount && selectedTokenData && !isNaN(parseFloat(amount)) && (
            <div className="rounded-lg border border-brand-accent/20 bg-brand-accent/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-brand-accent" />
                  <div>
                    <p className="text-sm text-brand-subtle">You will receive</p>
                    <p className="text-lg font-bold text-white">
                      {Math.floor(tokensToReceive)} <span className="text-[0.70rem] font-semibold uppercase tracking-wide text-brand-subtle ms-1"> USD</span>
                    </p>
                  </div>
                </div>
                {/* <div className="text-right">
                  <p className="text-sm text-brand-subtle">Price per token</p>
                  <p className="font-medium text-brand-accent">
                    ${selectedTokenData.usdPerUnit?.toFixed(4)}
                  </p>
                </div> */}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-brand-subtle">Min</p>
              <p className="font-medium text-white">${selectedMethodData?.minAmount}</p>
            </div>
            <div>
              <p className="text-brand-subtle">Max</p>
              <p className="font-medium text-white">${selectedMethodData?.maxAmount}</p>
            </div>
            <div>
              <p className="text-brand-subtle">Fee</p>
              <p className="font-medium text-white">{selectedMethodData?.fee}</p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex items-center justify-between pt-4">
        <Link
          href="/dashboard/user/wallet"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wallet
        </Link>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!amount || parseFloat(amount) < selectedMethodData?.minAmount}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-8 py-3 font-semibold text-white hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Payment
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <Panel title="Confirm Deposit" subtitle="Review your transaction">
        <div className="space-y-6">
          {/* Transaction Summary */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-lg font-semibold text-white">Transaction Details</h4>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-brand-subtle">Payment Method</span>
                <div className="flex items-center gap-2">
                  <selectedMethodData.icon className="h-4 w-4 text-brand-accent" />
                  <span className="font-medium text-white">{selectedMethodData?.name}</span>
                </div>
              </div>
              {/* <div className="flex justify-between">
                <span className="text-brand-subtle">Token</span>
                <span className="font-medium text-white">USD</span>
              </div> */}
              <div className="flex justify-between">
                <span className="text-brand-subtle">Amount</span>
                <span className="text-xl font-bold text-white">${amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-subtle">Fee</span>
                <span className="font-medium text-white">{selectedMethodData?.fee}</span>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-brand-subtle">You will receive</span>
                  <span className="text-xl font-bold text-brand-accent">
                    {tokensToReceive} USD
                  </span>
                </div>
                {/* <p className="mt-1 text-xs text-brand-subtle">
                  Rate: $1 = {(1 / (selectedTokenData?.usdPerUnit || 1)).toFixed(4)} USD
                </p> */}
              </div>
            </div>
          </div>

          {/* Payment Instructions based on method */}
          {selectedMethod === 'crypto' && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-white">Crypto Deposit</h4>
                  <p className="text-sm text-amber-200/80">Send USD to address below</p>
                </div>
                <Coins className="h-10 w-10 text-amber-400" />
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm text-amber-200/80">Deposit Address</p>
                <div className="flex items-center gap-2 rounded-lg bg-black/40 p-3">
                  <code className="flex-1 font-mono text-sm text-white break-all">
                    0x742d35Cc6634C0532925a3b844Bc9e0a3b9e7c1a
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy('0x742d35Cc6634C0532925a3b844Bc9e0a3b9e7c1a')}
                    className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Copy className="h-5 w-5 text-white" />
                    )}
                  </button>
                </div>
                <p className="mt-3 text-xs text-amber-200/60">
                  Only send USD tokens to this address. Sending other tokens may result in loss.
                </p>
              </div>
            </div>
          )}

          {selectedMethod === 'paypal' && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-white">PayPal Payment</h4>
                  <p className="text-sm text-blue-200/80">You will be redirected to PayPal</p>
                </div>
                <Banknote className="h-10 w-10 text-blue-400" />
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={processingPayment}
                  className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="inline h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Pay with PayPal'
                  )}
                </button>
                <p className="mt-3 text-center text-sm text-blue-200/80">
                  Secure payment processed by PayPal
                </p>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Payment Status Messages */}
      {paymentError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
              <span className="text-red-400">!</span>
            </div>
            <div>
              <p className="font-medium text-red-300">Payment Error</p>
              <p className="text-sm text-red-200/80">{paymentError}</p>
            </div>
          </div>
        </div>
      )}

      {paymentSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-emerald-300">Payment Successful</p>
              <p className="text-sm text-emerald-200/80">{paymentSuccess}</p>
              {depositResult && (
                <div className="mt-2 text-xs text-emerald-200/60">
                  Deposit ID: {depositResult._id} • Status: {depositResult.status}
                  {depositResult.status === 'pending' && ' (Awaiting admin approval)'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Edit
        </button>
        <div className="flex gap-3">
          <Link
            href="/dashboard/user/wallet"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white hover:bg-white/10"
          >
            <Wallet className="h-4 w-4" />
            Wallet
          </Link>
          {/* <button
            type="button"
            onClick={handlePayment}
            disabled={processingPayment}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-8 py-3 font-semibold text-white hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingPayment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Payment
                <Check className="h-4 w-4" />
              </>
            )}
          </button> */}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              Wallet
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Deposit Funds
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Add funds to your wallet via PayPal or cryptocurrency
            </p>
          </div>
        </div>
      </header>

      {renderStepProgress()}
      {step === 'select' && renderSelectStep()}
      {step === 'confirm' && renderConfirmStep()}

      {/* status lists */}
      <Panel className="my-8" title="Your deposit requests" subtitle="PayPal and other deposit submissions: pending, approved, or rejected by admin.">
        <div className="space-y-6 ">
          <button
            type="button"
            onClick={loadMyDeposits}
            disabled={depositsLoading}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-brand-border-muted bg-[var(--brand-surface)] px-3 py-2 text-sm font-medium text-brand-heading transition hover:border-brand-accent/30 hover:bg-[var(--brand-surface)]/80 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${depositsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {depositsError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.08] p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-300" />
              <div>
                <p className="font-medium text-rose-100">Could not load requests</p>
                <p className="mt-1 text-sm text-rose-200/80">{depositsError}</p>
              </div>
            </div>
          </div>
        )}

        {depositsLoading ? (
          <DepositRequestsTableSkeleton rows={5} />
        ) : myDeposits.length === 0 ? (
          <div className="rounded-2xl border border-brand-border-muted bg-[var(--brand-surface)]/40 p-8 text-center">
            <div className="mx-auto max-w-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-border-muted bg-black/30">
                <Check className="h-6 w-6 text-brand-muted" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-brand-heading">No deposit requests yet</h3>
              <p className="mt-2 text-xs text-brand-muted">
                When you submit a deposit (e.g. PayPal), it will appear here with its status.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-brand-border-muted bg-[var(--brand-surface)]/40">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-brand-border-muted bg-black/20">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:px-6">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:px-6">
                      Token
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:px-6">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:px-6">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:px-6">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="">
                  {myDeposits.map((row) => (
                    <tr key={String(row.id)} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-4 sm:px-6">
                        <span className="font-mono text-sm font-semibold tabular-nums text-brand-heading">
                          {formatDepositAmount(row.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span className="font-mono text-xs font-semibold text-brand-accent">{row.token}</span>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <PaymentMethodBadge method={row.paymentMethod} />
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span className="whitespace-nowrap text-xs text-brand-muted">
                          {formatDateTime(row.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <DepositStatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </Panel >
    </>
  );
}
