'use client';

import { useState, useEffect } from 'react';
import { Coins, Calculator, Wallet, Loader2, CheckCircle, ArrowRight, Minus, Plus } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { useUserWallet } from '@/components/user-dashboard/useUserWallet';
import { useAuth } from '@/components/auth-context';

// Helper function for token initials (similar to TokenBalanceList)
function tokenInitials(symbol) {
  const s = String(symbol || '').replace(/\s/g, '');
  if (s.length <= 3) return s.toUpperCase();
  return s.slice(0, 3).toUpperCase();
}

// Static bar colors mapping (fallback if not in token data)
const BAR_COLORS = {
  '759': 'bg-amber-500',
  'cristalino': 'bg-sky-400',
  'anejo': 'bg-orange-500',
  'raffle': 'bg-violet-500',
  'susu': 'bg-emerald-500',
};

export default function BuyCryptoPage() {
  const { token, ready } = useAuth();
  const { tokens: walletTokens, loading, reload: refreshWallet, totalUsdFormatted } = useUserWallet();
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [usdAmount, setUsdAmount] = useState('');
  const [calculatedTokens, setCalculatedTokens] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [usdBalance, setUsdBalance] = useState(0);
  const [selectedTokenBalance, setSelectedTokenBalance] = useState(0);
  const [loadingTokens, setLoadingTokens] = useState(true);

  // Load crypto tokens from API (dynamic from database)
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoadingTokens(true);
        const response = await fetch('/api/superadmin/tokens');
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          // Filter out USD token (slug '759') since you can't buy USD with USD
          // Also filter only active tokens
          const cryptoTokens = data.data
            .filter(t => t.isActive === true)
            .map(token => ({
              ...token,
              _id: token._id || token.slug,
              bar: token.bar || BAR_COLORS[token.slug] || 'bg-slate-500',
            }));

          setTokens(cryptoTokens);

          // Select first non-USD token by default
          if (cryptoTokens.length > 0) {
            // Fallback to first token (should not happen unless only USD token exists)
            setSelectedToken(cryptoTokens[0]);
          }
        } else {
          console.error('Failed to fetch tokens:', data);
          setTokens([]);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setTokens([]);
      } finally {
        setLoadingTokens(false);
      }
    };

    fetchTokens();
  }, []);



  // Calculate tokens when USD amount or selected token changes
  useEffect(() => {
    if (!selectedToken || !usdAmount || isNaN(parseFloat(usdAmount))) {
      setCalculatedTokens(0);
      return;
    }

    const amount = parseFloat(usdAmount);
    if (amount <= 0 || selectedToken.usdPerUnit <= 0) {
      setCalculatedTokens(0);
      return;
    }

    const tokens = amount / selectedToken.usdPerUnit;
    setCalculatedTokens(tokens);
  }, [usdAmount, selectedToken]);

  // Extract USD balance from wallet tokens
  useEffect(() => {
    if (!walletTokens || walletTokens.length === 0) {
      setUsdBalance(0);
      return;
    }

    // Find USD token (slug '759')
    const usdToken = walletTokens.find(t => t.slug === '759');
    if (!usdToken) {
      setUsdBalance(0);
      return;
    }

    // Parse formatted balance string (e.g., "1,234.56") to number
    const balanceStr = String(usdToken.balance).replace(/,/g, '');
    const balanceNum = parseFloat(balanceStr);
    setUsdBalance(isNaN(balanceNum) ? 0 : balanceNum);
  }, [walletTokens]);

  // Extract selected token balance from wallet tokens
  useEffect(() => {
    if (!selectedToken || !walletTokens || walletTokens.length === 0) {
      setSelectedTokenBalance(0);
      return;
    }

    // Find the selected token in wallet tokens
    const tokenInWallet = walletTokens.find(t => t.slug === selectedToken.slug);
    if (!tokenInWallet) {
      setSelectedTokenBalance(0);
      return;
    }

    // Parse formatted balance string (e.g., "1,234.56") to number
    const balanceStr = String(tokenInWallet.balance).replace(/,/g, '');
    const balanceNum = parseFloat(balanceStr);
    setSelectedTokenBalance(isNaN(balanceNum) ? 0 : balanceNum);
  }, [selectedToken, walletTokens]);

  const handleBuy = async () => {
    if (!selectedToken || !usdAmount || !token) {
      setMessage({ type: 'error', text: 'Please select a token and enter USD amount.' });
      return;
    }

    const amount = parseFloat(usdAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid USD amount greater than 0.' });
      return;
    }

    if (amount > totalUsdFormatted.replace(/[$,]/g, '')) {
      setMessage({
        type: 'error',
        text: `Insufficient USD balance to buy ${selectedToken.symbol}. You have $${totalUsdFormatted.replace(/[$,]/g, '')} USD available.`
      });
      return;
    }

    setProcessing(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tokenSlug: selectedToken.slug,
          usdAmount: amount,
        }),
      });

      // Check if response is OK before parsing JSON
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);

        console.error('API error response:', errorData);

        throw new Error(
          errorData?.error || res.statusText || 'Unknown error'
        );
      }

      const data = await res.json();

      if (data.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'Purchase successful!'
        });

        // Reset form
        setUsdAmount('');
        setCalculatedTokens(0);

        // Refresh wallet balance immediately
        refreshWallet();

        // Show transaction details
        if (data.transaction) {
          console.log('Transaction details:', data.transaction);
        }
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to process purchase.'
        });
      }
    } catch (error) {
      console.error('Buy error:', error);
      setMessage({
        type: 'error',
        text: `Error: ${error.message || 'Network error. Please try again.'}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTokens = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <header className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              Trading
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem] flex items-center gap-3">
              <Coins className="w-7 h-7" />
              Buy Tokens
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Use your USD balance to buy platform tokens at fixed exchange rates
            </p>
          </div>

          {/* USD Balance Card */}
          <div className="rounded-xl border border-white/[0.06] bg-black/[0.18] px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              Available Balance
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-brand-heading sm:text-[2.25rem] sm:leading-none">
              {loading ? (
                <span className="inline-flex items-center gap-2 text-brand-muted">
                  <Loader2 className="h-7 w-7 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
                </span>
              ) : (
                totalUsdFormatted
              )}
            </p>
            <p className="mt-0.5 text-xs text-brand-muted">
              USD · Ready to spend
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Buy form */}
        <div className="lg:col-span-2">
          <Panel>
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-brand-heading mb-6">
                  Purchase Details
                </h2>

                {/* Token selection */}
                <div className="space-y-6">
                  <div>
                    <div className="mb-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                        Select Token to Buy
                      </p>
                      <p className="mt-1 text-sm text-brand-muted">
                        Choose which token you want to purchase
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {loadingTokens ? (
                        // Loading skeleton
                        Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-black/20 animate-pulse"
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-gray-700">
                                <div className="h-full w-full bg-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                                  <div className="h-3 bg-gray-600 rounded w-1/3"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : tokens.length > 0 ? (
                        tokens.map((token) => {
                          const isSelected = selectedToken?._id === token._id;

                          return (
                            <button
                              key={token._id}
                              type="button"
                              onClick={() => setSelectedToken(token)}
                              className={`p-4 rounded-xl border transition-all duration-200
                                 ${isSelected
                                  ? 'border-white/30 bg-gradient-to-br from-white/10 to-black/30 shadow-lg shadow-black/20 ring-2 ring-white/20'
                                  : 'border-white/10 bg-gradient-to-br from-white/5 to-black/20 hover:border-white/20 hover:bg-white/10'
                                } cursor-pointer`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Token avatar with color */}
                                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-white/10 to-black/40">
                                  <span
                                    className={`absolute inset-0 opacity-30 ${token.bar}`}
                                    aria-hidden
                                  />
                                  <span className="relative z-[1] text-sm font-bold tracking-tight text-white">
                                    {tokenInitials(token.symbol)}
                                  </span>
                                </div>

                                <div className="flex-1 text-left">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold text-white">
                                        {token.symbol}
                                      </div>
                                      <div className="text-xs text-gray-300">
                                        {token.name}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    )}
                                  </div>

                                  <div className="mt-2 flex items-center justify-between">
                                    <div className="text-xs text-gray-400">
                                      Price
                                    </div>
                                    <div className="text-sm font-medium text-white">
                                      ${token.usdPerUnit.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-3 text-center py-8 text-brand-muted">
                          No tokens available for purchase.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* USD amount input */}
                  <div>
                    <div className="mb-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                        USD Amount to Spend
                      </p>
                      <p className="mt-1 text-sm text-brand-muted">
                        Enter how much USD you want to convert
                      </p>
                      <p className="mt-1 text-xs text-brand-subtle">
                        USD will be deducted from your USD balance (759 token)
                      </p>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-brand-subtle">$</span>
                      </div>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={usdAmount}
                        onChange={(e) => setUsdAmount(e.target.value)}
                        className="pl-8 block w-full rounded-xl border border-white/[0.1] bg-white/[0.05] py-3.5 px-4 text-brand-heading placeholder:text-brand-muted focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 focus:outline-none"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className="text-brand-subtle text-sm font-medium">USD</span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-brand-muted">Available USD balance:</span>
                        <span className="font-semibold tabular-nums text-brand-heading">
                          {loading ? (
                            <span className="inline-flex items-center gap-2 text-brand-muted">
                              <Loader2 className="h-4 w-4 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
                            </span>
                          ) : (
                            `${totalUsdFormatted}`
                          )}
                        </span>
                      </div>
                      {selectedToken && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-brand-muted">Your {selectedToken.symbol} balance:</span>
                          <span className="font-semibold tabular-nums text-brand-heading">
                            {formatTokens(selectedTokenBalance)} {selectedToken.symbol}
                          </span>
                        </div>
                      )}
                      <div className="pt-1">
                        <p className="text-xs text-brand-subtle">
                          <span className="text-amber-400">Note:</span> You need sufficient USD balance to buy any token. The button will be enabled when your USD amount is within your available USD balance.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Calculation display */}
                  {calculatedTokens > 0 && selectedToken && (
                    <div className="rounded-xl border border-white/[0.06] bg-black/[0.18] p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent/10">
                            <Calculator className="h-5 w-5 text-brand-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-heading">
                              Transaction Summary
                            </p>
                            <p className="text-xs text-brand-muted">
                              USD deducted, tokens added to your wallet
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold tabular-nums text-brand-heading">
                            {formatTokens(calculatedTokens)} {selectedToken.symbol}
                          </div>
                          <div className="text-sm text-brand-muted">
                            for {formatCurrency(parseFloat(usdAmount) || 0)} USD
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/[0.05] text-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                              <Minus className="h-3 w-3 text-red-400" />
                            </div>
                            <span className="text-brand-muted">USD deducted from</span>
                            <span className="font-medium text-brand-heading">USD Balance</span>
                          </div>
                          <span className="font-semibold text-red-300">
                            -{formatCurrency(parseFloat(usdAmount) || 0)} USD
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                              <Plus className="h-3 w-3 text-green-400" />
                            </div>
                            <span className="text-brand-muted">Tokens added to</span>
                            <span className="font-medium text-brand-heading">{selectedToken.symbol} Balance</span>
                          </div>
                          <span className="font-semibold text-green-300">
                            +{formatTokens(calculatedTokens)} {selectedToken.symbol}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                          <span className="text-brand-muted">Exchange rate</span>
                          <span className="font-semibold text-brand-heading">
                            1 {selectedToken.symbol} = ${selectedToken.usdPerUnit.toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buy button */}
                  <div>
                    <button
                      onClick={handleBuy}
                      disabled={processing || !selectedToken || !usdAmount || parseFloat(usdAmount) <= 0 || parseFloat(usdAmount) > totalUsdFormatted.replace(/[$,]/g, '')}
                      className="group w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-gradient-to-r from-brand-accent to-brand-accent/80 hover:from-brand-accent/90 hover:to-brand-accent/70 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/30"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Processing Purchase...</span>
                        </>
                      ) : (
                        <>
                          <Coins className="h-5 w-5" />
                          <span>Buy {selectedToken ? selectedToken.symbol : 'Tokens'}</span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Message display */}
                  {message.text && (
                    <div className={`rounded-xl border p-4 ${message.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                      }`}>
                      <div className="flex items-start gap-3">
                        {message.type === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
                        ) : (
                          <div className="h-5 w-5 text-red-400 mt-0.5">!</div>
                        )}
                        <div className="text-sm">
                          <div className={`font-medium ${message.type === 'success' ? 'text-emerald-300' : 'text-red-300'
                            }`}>
                            {message.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right column: Info panel */}
        <div className="space-y-6">
          <Panel>
            <h3 className="text-lg font-semibold text-brand-heading mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand-accent" />
              Your USD Balance
            </h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-brand-card border border-brand-border rounded-lg">
                <div className="text-3xl font-bold text-brand-heading">
                  {loading ? (
                    <span className="inline-flex items-center gap-2 text-brand-muted">
                      <Loader2 className="h-7 w-7 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
                    </span>
                  ) : (
                    totalUsdFormatted
                  )}
                </div>
                <div className="text-sm text-brand-subtle mt-1">
                  Available for token purchases
                </div>
              </div>

              <div className="text-sm text-brand-muted">
                <p className="mb-2">
                  Use your USD balance to buy platform tokens at fixed exchange rates.
                </p>
                <ul className="space-y-1 list-disc list-inside text-brand-subtle">
                  <li>Select a token from the list</li>
                  <li>Enter USD amount to spend</li>
                  <li>Tokens are calculated automatically</li>
                  <li>Transaction is processed instantly</li>
                  <li>Balance updates immediately</li>
                </ul>
              </div>
            </div>
          </Panel>

          <Panel>
            <h3 className="text-lg font-semibold text-brand-heading mb-4">
              How It Works
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-accent">1</span>
                </div>
                <div>
                  <div className="font-medium text-brand-heading">Select Token</div>
                  <div className="text-sm text-brand-subtle">
                    Choose which platform token you want to buy
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-accent">2</span>
                </div>
                <div>
                  <div className="font-medium text-brand-heading">Enter Amount</div>
                  <div className="text-sm text-brand-subtle">
                    Specify how much USD you want to spend
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-accent">3</span>
                </div>
                <div>
                  <div className="font-medium text-brand-heading">Confirm Purchase</div>
                  <div className="text-sm text-brand-subtle">
                    Review the token amount and confirm transaction
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-accent">4</span>
                </div>
                <div>
                  <div className="font-medium text-brand-heading">Receive Tokens</div>
                  <div className="text-sm text-brand-subtle">
                    Tokens are added to your wallet instantly
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}