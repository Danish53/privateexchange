'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
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
  RefreshCw,
  X,
  Info,
} from 'lucide-react';
import { formatNumberSmart } from '@/lib/numberFormat';
import Panel from '@/components/user-dashboard/Panel';
import ManualCryptoDepositFlow, {
  CryptoDepositAddressPanel,
} from '@/components/user-dashboard/ManualCryptoDepositFlow';
import { useUserWallet } from '@/components/user-dashboard/useUserWallet';
import { useAuth } from '@/components/auth-context';
import { DepositRequestsTableSkeleton } from '@/components/ui/content-skeletons';
import { useToast } from '@/components/ui/toast-context';
import { cn } from '@/lib/utils';
import { getCryptoDepositTokenLabel } from '@/lib/cryptoDepositConfig';

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
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Card and bank checkout',
    status: 'Available',
    available: true,
    icon: CreditCard,
    color: 'from-violet-500 to-indigo-600',
    borderColor: 'border-violet-500',
    textColor: 'text-violet-300',
    features: ['Cards supported', 'Fast checkout'],
    minAmount: 10,
    maxAmount: 25000,
    fee: 'Platform fee applies',
  },
];

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const stripeElementOptions = {
  style: {
    base: {
      color: '#ffffff',
      fontSize: '15px',
      '::placeholder': {
        color: 'rgba(255,255,255,0.45)',
      },
    },
    invalid: {
      color: '#fda4af',
    },
  },
};

function StripeCardPaymentForm({
  clientSecret,
  cardholderName,
  setCardholderName,
  stripeInlineError,
  setStripeInlineError,
  setStripeStatusNote,
  setProcessingPayment,
  processingPayment,
  onWebhookApproved,
  toast,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleStripeConfirm = async () => {
    if (!stripe || !elements) return;
    if (!clientSecret) {
      const msg = 'Stripe payment session is not ready.';
      setStripeInlineError(msg);
      toast.error(msg, { title: 'Stripe Error' });
      return;
    }
    if (!cardholderName.trim()) {
      const msg = 'Card holder name is required.';
      setStripeInlineError(msg);
      toast.error(msg, { title: 'Stripe Error' });
      return;
    }

    setProcessingPayment(true);
    setStripeInlineError('');
    setStripeStatusNote('');

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setProcessingPayment(false);
      const msg = 'Card input is not ready.';
      setStripeInlineError(msg);
      toast.error(msg, { title: 'Stripe Error' });
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumber,
        billing_details: {
          name: cardholderName.trim(),
        },
      },
    }, { redirect: 'if_required' });

    if (error) {
      setProcessingPayment(false);
      const msg = error.message || 'Card payment failed.';
      setStripeInlineError(msg);
      toast.error(msg, { title: 'Stripe Error' });
      return;
    }

    setProcessingPayment(false);
    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      setStripeStatusNote('Payment authorized. Waiting for secure approval...');
      onWebhookApproved();
      return;
    }

    setStripeInlineError(`Payment status: ${paymentIntent?.status || 'unknown'}.`);
    toast.info(`Payment status: ${paymentIntent?.status || 'unknown'}.`, { title: 'Stripe Status' });
  };

  return (
    <>
      <div className="mt-5 space-y-3 rounded-xl border border-violet-400/20 bg-black/20 p-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-violet-200/80">Card holder name</label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Full name on card"
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-violet-200/80">Card number</label>
          <div className="rounded-lg border border-white/15 bg-black/30 px-3 py-2">
            <CardNumberElement options={stripeElementOptions} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-violet-200/80">Expiry date</label>
            <div className="rounded-lg border border-white/15 bg-black/30 px-3 py-2">
              <CardExpiryElement options={stripeElementOptions} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-violet-200/80">CVV</label>
            <div className="rounded-lg border border-white/15 bg-black/30 px-3 py-2">
              <CardCvcElement options={stripeElementOptions} />
            </div>
          </div>
        </div>
        <p className="text-xs text-violet-200/70">
          3D Secure is handled automatically by your bank during payment authentication.
        </p>
        {stripeInlineError ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {stripeInlineError}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleStripeConfirm}
        disabled={processingPayment || !stripe || !elements}
        className="mt-4 w-full rounded-xl bg-violet-600 py-4 text-lg font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processingPayment ? 'Processing secure payment...' : 'Pay with Stripe'}
      </button>
    </>
  );
}

export default function DepositPage() {
  const { token } = useAuth();
  const toast = useToast();
  const { loading, error, tokens, totalUsdFormatted } = useUserWallet();
  const [activeTokens, setActiveTokens] = useState([]);
  const [loadingActiveTokens, setLoadingActiveTokens] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('paypal');
  const [selectedToken, setSelectedToken] = useState('USD');
  const [cryptoOptions, setCryptoOptions] = useState([]);
  const [selectedCryptoId, setSelectedCryptoId] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('select'); // 'select' or 'confirm'
  const [copied, setCopied] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [depositResult, setDepositResult] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stripeClientSecret, setStripeClientSecret] = useState('');
  const [stripeDepositId, setStripeDepositId] = useState('');
  const [stripeSuccessOpen, setStripeSuccessOpen] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  const [stripeInlineError, setStripeInlineError] = useState('');
  const [stripeStatusNote, setStripeStatusNote] = useState('');

  const [myDeposits, setMyDeposits] = useState([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [depositsError, setDepositsError] = useState('');
  const [rejectionInfo, setRejectionInfo] = useState(null);

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
        const msg = json.error || 'Could not load your requests.';
        setDepositsError(msg);
        toast.error(msg, { title: 'Could Not Load Requests' });
        setMyDeposits([]);
        return;
      }
      setMyDeposits(Array.isArray(json.deposits) ? json.deposits : []);
    } catch {
      setDepositsError('Network error.');
      toast.error('Network error while loading requests.', { title: 'Could Not Load Requests' });
      setMyDeposits([]);
    } finally {
      setDepositsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadMyDeposits();
  }, [token, loadMyDeposits]);

  useEffect(() => {
    const loadCryptoConfig = async () => {
      try {
        const res = await fetch('/api/user/deposit/crypto-config');
        const json = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(json.options) && json.options.length > 0) {
          setCryptoOptions(json.options);
          setSelectedCryptoId((prev) => prev || json.options[0].id);
        }
      } catch {
        // config optional until crypto method selected
      }
    };
    loadCryptoConfig();
  }, []);

  const selectedCrypto =
    cryptoOptions.find((o) => o.id === selectedCryptoId) || cryptoOptions[0] || null;

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
      maximumFractionDigits: 2,
    }).format(n);
  }

  function toFixed2(n) {
    return formatNumberSmart(n, { maxFractionDigits: 2 });
  }

  function getDepositHistoryTokenLabel(row) {
    if (row.paymentMethod === 'crypto' && row.payCurrency && row.status !== 'completed') {
      return getCryptoDepositTokenLabel(row.payCurrency);
    }
    return row.token || '—';
  }

  function getRejectionReason(row) {
    const direct = String(row.rejectionReason || '').trim();
    if (direct) return direct;
    const note = String(row.note || '');
    const match = note.match(/^Rejected:\s*(.+)$/i);
    return match ? match[1].trim() : '';
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
      stripe: { label: 'Stripe', className: 'border-violet-500/35 bg-violet-500/[0.1] text-violet-100' },
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
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedMethodData = DEPOSIT_METHODS.find(m => m.id === selectedMethod);
  const isCryptoMethod = selectedMethod === 'crypto';
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
  const filteredDeposits = myDeposits.filter((row) => {
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && row.status === 'completed') ||
      (statusFilter === 'rejected' && row.status === 'cancelled') ||
      row.status === statusFilter;

    const methodMatch = methodFilter === 'all' || row.paymentMethod === methodFilter;
    return statusMatch && methodMatch;
  });
  const totalPages = Math.max(1, Math.ceil(filteredDeposits.length / rowsPerPage));
  const pageStart = (currentPage - 1) * rowsPerPage;
  const paginatedDeposits = filteredDeposits.slice(pageStart, pageStart + rowsPerPage);

  const waitForStripeWebhookApproval = useCallback(async () => {
    if (!token || !stripeDepositId) return;
    const maxAttempts = 12;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      try {
        const res = await fetch('/api/user/deposit?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json?.deposits) ? json.deposits : [];
        const latest = rows.find((d) => String(d.id) === String(stripeDepositId));
        if (latest?.status === 'completed') {
          setMyDeposits(rows);
          setStripeStatusNote('');
          setStripeSuccessOpen(true);
          toast.success('Stripe payment approved. USD credited to your wallet.', {
            title: 'Payment Successful',
          });
          return;
        }
        if (latest?.status === 'cancelled') {
          const msg = 'Payment was cancelled or failed. Please try again.';
          setStripeInlineError(msg);
          toast.error(msg, { title: 'Stripe Error' });
          return;
        }
      } catch {
        // ignore transient fetch issues while polling
      }
    }
    setStripeStatusNote('Payment received. Approval may take a little longer; please refresh history shortly.');
    toast.info('Payment received. Approval may take a little longer.', { title: 'Stripe Status' });
  }, [stripeDepositId, token, toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, methodFilter, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleContinue = () => {
    if (step === 'select') {
      if (isCryptoMethod) {
        if (!selectedCryptoId) {
          toast.error('Please select a cryptocurrency.', { title: 'Crypto Required' });
          return;
        }
        setStep('confirm');
        return;
      }
      if (!amount || parseFloat(amount) < selectedMethodData?.minAmount) {
        toast.error(`Please enter amount at least $${selectedMethodData?.minAmount}.`, {
          title: 'Invalid Amount',
        });
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

  const resetDepositFlow = () => {
    setStep('select');
    setAmount('');
    setDepositResult(null);
    setPaymentError('');
    setPaymentSuccess('');
    setProcessingPayment(false);
    setStripeClientSecret('');
    setStripeDepositId('');
    setStripeSuccessOpen(false);
    setStripeInlineError('');
    setStripeStatusNote('');
    setCardholderName('');
    setTransactionRef('');
    setProofFile(null);
    setProofPreview('');
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Screenshot must be 5MB or smaller.', { title: 'File Too Large' });
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const uploadProofImage = async () => {
    if (!proofFile || !token) return '';
    const formData = new FormData();
    formData.append('file', proofFile);
    const res = await fetch('/api/user/deposit/proof', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      throw new Error(json.error || 'Failed to upload payment screenshot.');
    }
    return json.url || '';
  };

  const handleCryptoDepositSubmit = async () => {
    if (!selectedCryptoId) {
      const msg = 'Please select a cryptocurrency.';
      setPaymentError(msg);
      toast.error(msg, { title: 'Payment Error' });
      return;
    }
    if (!amount || parseFloat(amount) < selectedMethodData?.minAmount) {
      const msg = `Please enter amount at least $${selectedMethodData?.minAmount}.`;
      setPaymentError(msg);
      toast.error(msg, { title: 'Invalid Amount' });
      return;
    }
    const tx = transactionRef.trim();
    if (!tx && !proofFile) {
      const msg = 'Enter transaction ID/hash or upload a payment screenshot.';
      setPaymentError(msg);
      toast.error(msg, { title: 'Proof Required' });
      return;
    }
    if (!token) {
      const msg = 'You must be logged in to make a deposit.';
      setPaymentError(msg);
      toast.error(msg, { title: 'Payment Error' });
      return;
    }

    setProcessingPayment(true);
    setPaymentError('');
    setPaymentSuccess('');

    try {
      let proofImageUrl = '';
      if (proofFile) {
        proofImageUrl = await uploadProofImage();
      }

      const response = await fetch('/api/user/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          token: 'USD',
          paymentMethod: 'crypto',
          payCurrency: selectedCryptoId,
          transactionHash: tx,
          proofImageUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Deposit request failed');
      }

      setDepositResult(data.deposit);
      toast.success(
        data.message || 'Deposit request submitted. Admin will review shortly.',
        { title: 'Request Submitted' }
      );
      loadMyDeposits();
      resetDepositFlow();
    } catch (err) {
      const msg = err.message || 'Failed to submit deposit request.';
      setPaymentError(msg);
      toast.error(msg, { title: 'Payment Error' });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      const msg = 'Please enter a valid amount.';
      setPaymentError(msg);
      toast.error(msg, { title: 'Payment Error' });
      return;
    }

    if (!token) {
      const msg = 'You must be logged in to make a deposit.';
      setPaymentError(msg);
      toast.error(msg, { title: 'Payment Error' });
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
      const successMsg = data.message || 'Deposit created successfully.';
      setPaymentSuccess(successMsg);
      loadMyDeposits();
      if (selectedMethod === 'stripe') {
        const secret = data?.deposit?.payment?.clientSecret;
        if (!secret) {
          throw new Error('Stripe client secret not received.');
        }
        setPaymentError('');
        setPaymentSuccess('');
        setStripeInlineError('');
        setStripeStatusNote('');
        setStripeClientSecret(secret);
        setStripeDepositId(data?.deposit?.id || '');
        setCardholderName('');
        setProcessingPayment(false);
        return;
      }
      if (selectedMethod === 'paypal') {
        toast.success(successMsg, { title: 'Deposit Submitted' });
        resetDepositFlow();
        return;
      }
      toast.success(successMsg, { title: 'Deposit Submitted' });
    } catch (err) {
      console.error('Deposit error:', err);
      const msg = err.message || 'Failed to process deposit. Please try again.';
      setPaymentError(msg);
      toast.error(msg, { title: 'Payment Error' });
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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

      {isCryptoMethod && (
        <Panel title="Select Cryptocurrency" subtitle="Choose the network you will send from">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {cryptoOptions.length === 0 ? (
              <p className="text-sm text-brand-subtle">Loading crypto options...</p>
            ) : (
              cryptoOptions.map((coin) => (
                <button
                  key={coin.id}
                  type="button"
                  onClick={() => setSelectedCryptoId(coin.id)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all',
                    selectedCryptoId === coin.id
                      ? 'border-2 border-amber-500 bg-amber-500/10 text-white'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  )}
                >
                  <p className="text-lg font-semibold text-white">{coin.name}</p>
                  <p className="mt-1 text-sm text-amber-200/80">{coin.network}</p>
                </button>
              ))
            )}
          </div>
          {selectedCrypto ? (
            <CryptoDepositAddressPanel
              selectedCrypto={selectedCrypto}
              copied={copied}
              onCopyAddress={handleCopy}
            />
          ) : null}
          <p className="mt-4 text-sm text-brand-subtle">
            After sending crypto, continue to enter amount and payment proof (hash or screenshot).
          </p>
        </Panel>
      )}

      {!isCryptoMethod ? (
      <Panel title="Enter Amount" subtitle="How much do you want to deposit?">
        <div className="space-y-4">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-4">
            <span className="text-2xl font-semibold text-white">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="deposit-field ml-2 flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/30 focus:outline-none focus:ring-0"
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
                      {toFixed2(tokensToReceive)} <span className="text-[0.70rem] font-semibold uppercase tracking-wide text-brand-subtle ms-1"> USD</span>
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
      ) : null}

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
          disabled={
            isCryptoMethod
              ? !selectedCryptoId
              : !amount || parseFloat(amount) < selectedMethodData?.minAmount
          }
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
      <Panel
        title={isCryptoMethod ? 'Complete crypto deposit' : 'Confirm Deposit'}
        subtitle={
          isCryptoMethod
            ? 'Enter amount and payment proof after sending crypto'
            : 'Review your transaction'
        }
      >
        <div className="space-y-6">
          {selectedMethod !== 'crypto' ? (
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
                <span className="text-xl font-bold text-white">${toFixed2(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-subtle">Fee</span>
                <span className="font-medium text-white">{selectedMethodData?.fee}</span>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-brand-subtle">You will receive</span>
                  <span className="text-xl font-bold text-brand-accent">
                    {toFixed2(tokensToReceive)} USD
                  </span>
                </div>
                {/* <p className="mt-1 text-xs text-brand-subtle">
                  Rate: $1 = {(1 / (selectedTokenData?.usdPerUnit || 1)).toFixed(4)} USD
                </p> */}
              </div>
            </div>
          </div>
          ) : null}

          {selectedMethod === 'crypto' && (
            <ManualCryptoDepositFlow
              selectedCrypto={selectedCrypto}
              amount={amount}
              setAmount={setAmount}
              selectedMethodData={selectedMethodData}
              transactionRef={transactionRef}
              setTransactionRef={setTransactionRef}
              proofPreview={proofPreview}
              onProofFileChange={handleProofFileChange}
              paymentError={paymentError}
              processingPayment={processingPayment}
              onSubmit={handleCryptoDepositSubmit}
            />
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

          {selectedMethod === 'stripe' && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-white">Stripe Payment</h4>
                  <p className="text-sm text-violet-200/80">
                    Complete your payment with a secure card form using Stripe.
                  </p>
                </div>
                <CreditCard className="h-10 w-10 text-violet-300" />
              </div>
              {/* <div className="mt-5 rounded-xl border border-violet-400/20 bg-black/20 p-4">
                <p className="text-sm text-violet-100">
                  No redirect checkout. Enter card details below and complete 3D Secure authentication when prompted.
                </p>
                <p className="mt-2 text-xs text-violet-200/70">
                  After successful payment, USD is credited automatically to your wallet.
                </p>
              </div> */}
              {!stripeClientSecret ? (
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={processingPayment}
                  className="mt-4 w-full rounded-xl bg-violet-600 py-4 text-lg font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingPayment ? 'Preparing secure card form...' : 'Complete Payment with Stripe'}
                </button>
              ) : (
                <>
                  <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                    <StripeCardPaymentForm
                      clientSecret={stripeClientSecret}
                      cardholderName={cardholderName}
                      setCardholderName={setCardholderName}
                      stripeInlineError={stripeInlineError}
                      setStripeInlineError={setStripeInlineError}
                      setStripeStatusNote={setStripeStatusNote}
                      setProcessingPayment={setProcessingPayment}
                      processingPayment={processingPayment}
                      onWebhookApproved={waitForStripeWebhookApproval}
                      toast={toast}
                    />
                  </Elements>
                  {stripeStatusNote ? (
                    <p className="mt-3 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
                      {stripeStatusNote}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          )}
        </div>
      </Panel>

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
              Add funds via PayPal, crypto (BTC / ETH / SOL), or card
            </p>
          </div>
        </div>
      </header>

      {renderStepProgress()}
      {step === 'select' && renderSelectStep()}
      {step === 'confirm' && renderConfirmStep()}

      {stripeSuccessOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-[#10151b] p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle className="h-7 w-7 text-emerald-400" />
            </div>
            <h3 className="mt-4 text-center text-xl font-semibold text-white">Payment Successful</h3>
            <p className="mt-2 text-center text-sm text-emerald-100/90">
              Stripe payment approved and webhook confirmed. USD has been credited to your wallet.
            </p>
            <p className="mt-2 text-center text-xs text-brand-subtle">
              Deposit ID: {stripeDepositId || depositResult?.id || '—'}
            </p>
            <button
              type="button"
              onClick={resetDepositFlow}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <Panel className="my-8" title="Your deposit requests" subtitle="Track your crypto and PayPal deposits by status and payment method.">
        <div className="space-y-6 ">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-brand-subtle">
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full min-w-[170px] rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-brand-accent/50"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-brand-subtle">
                  Payment Method
                </span>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full min-w-[170px] rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-brand-accent/50"
                >
                  <option value="all">All methods</option>
                  <option value="paypal">PayPal</option>
                  <option value="crypto">Crypto</option>
                  <option value="stripe">Stripe</option>
                </select>
              </label>
            </div>
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
        </div>

        {depositsLoading ? (
          <DepositRequestsTableSkeleton rows={5} />
        ) : filteredDeposits.length === 0 ? (
          <div className="rounded-2xl border border-brand-border-muted bg-[var(--brand-surface)]/40 p-8 text-center">
            <div className="mx-auto max-w-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-border-muted bg-black/30">
                <Check className="h-6 w-6 text-brand-muted" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-brand-heading">No matching deposit requests</h3>
              <p className="mt-2 text-xs text-brand-muted">
                Try changing filters or submit a new deposit request to see it here.
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
                  {paginatedDeposits.map((row) => (
                    <tr key={String(row.id)} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-4 sm:px-6">
                        <span className="font-mono text-sm font-semibold tabular-nums text-brand-heading">
                          {formatDepositAmount(row.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span className="font-mono text-xs font-semibold text-brand-accent">
                          {getDepositHistoryTokenLabel(row)}
                        </span>
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
                        <div className="flex items-center gap-2">
                          <DepositStatusBadge status={row.status} />
                          {row.status === 'cancelled' ? (
                            <button
                              type="button"
                              onClick={() =>
                                setRejectionInfo(
                                  getRejectionReason(row) ||
                                    'No rejection reason was provided.'
                                )
                              }
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-200 transition hover:border-rose-500/50 hover:bg-rose-500/20"
                              title="View rejection reason"
                              aria-label="View rejection reason"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-brand-border-muted bg-black/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="text-xs text-brand-muted">
                Showing {filteredDeposits.length === 0 ? 0 : pageStart + 1}-
                {Math.min(pageStart + rowsPerPage, filteredDeposits.length)} of {filteredDeposits.length}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-brand-accent/50"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                </select>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-2 text-xs text-brand-subtle">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

      </Panel>

      {rejectionInfo && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rejection-reason-title"
              onClick={() => setRejectionInfo(null)}
            >
              <div
                className="w-full max-w-sm rounded-2xl border border-rose-500/25 bg-[#0a0c12] p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-rose-300/80">
                      Rejected deposit
                    </p>
                    <h3
                      id="rejection-reason-title"
                      className="mt-1 text-base font-semibold text-brand-heading"
                    >
                      Rejection reason
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRejectionInfo(null)}
                    className="rounded-lg border border-white/10 p-2 text-brand-subtle hover:bg-white/5 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">
                  {rejectionInfo}
                </p>
                <button
                  type="button"
                  onClick={() => setRejectionInfo(null)}
                  className="mt-5 w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-brand-heading hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
