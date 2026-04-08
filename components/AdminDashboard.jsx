'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  Activity,
  Coins,
  Gift,
  CreditCard,
  BarChart3,
  Settings,
  TrendingUp,
  DollarSign,
  UserPlus,
  Eye,
  Shield,
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'tokens', label: 'Tokens', icon: Coins },
    { id: 'drawings', label: 'Drawings', icon: Gift },
    { id: 'membership', label: 'Membership', icon: Shield },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'kpi', label: 'KPI Tracker', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const stats = [
    { label: 'Total Users', value: '2,547', change: '+12%', positive: true },
    { label: 'Active Today', value: '342', change: '+8%', positive: true },
    { label: 'Total Revenue', value: '$45,230', change: '+23%', positive: true },
    { label: 'Transactions', value: '12,847', change: '+15%', positive: true },
  ];

  const kpis = {
    realTime: [
      { label: 'Exchange Volume (24h)', value: '$125,450', change: '+5.2%' },
      { label: 'Active Users', value: '342', change: '+8.1%' },
      { label: 'Transaction Count', value: '1,847', change: '+12.3%' },
      { label: 'Avg Transaction Value', value: '$67.89', change: '-2.1%' },
    ],
    financial: [
      { label: 'Total Revenue', value: '$45,230', change: '+23%' },
      { label: 'Fee Revenue', value: '$2,340', change: '+18%' },
      { label: 'Deposit/Withdrawal Ratio', value: '1.45', change: '-5%' },
      { label: 'Token Circulation', value: '89%', change: '+2%' },
    ],
    engagement: [
      { label: 'New Registrations', value: '156', change: '+24%' },
      { label: 'Retention Rate', value: '87%', change: '+3%' },
      { label: 'VIP Conversion', value: '12%', change: '+8%' },
      { label: 'Participation Rate', value: '73%', change: '+5%' },
    ],
    operational: [
      { label: 'System Uptime', value: '99.9%', change: '0%' },
      { label: 'Avg Processing Time', value: '0.3s', change: '-15%' },
      { label: 'Deposit Approval', value: '2.1min', change: '-20%' },
      { label: 'Support Resolution', value: '94%', change: '+2%' },
    ],
  };

  const recentTransactions = [
    { user: 'john@example.com', type: 'deposit', amount: '$500', token: '759', time: '2 min ago' },
    { user: 'sarah@example.com', type: 'transfer', amount: '-50', token: 'Raffle', time: '5 min ago' },
    { user: 'mike@example.com', type: 'withdrawal', amount: '-$200', token: '759', time: '12 min ago' },
    { user: 'emma@example.com', type: 'deposit', amount: '$1,000', token: 'Cristalino', time: '18 min ago' },
  ];

  const pendingDeposits = [
    { user: 'alex@example.com', amount: '$250', method: 'PayPal', time: '5 min ago' },
    { user: 'lisa@example.com', amount: '$500', method: 'Crypto', time: '12 min ago' },
  ];

  const users = [
    { email: 'john@example.com', status: 'active', vip: true, balance: '$2,450', joined: '2026-01-15' },
    { email: 'sarah@example.com', status: 'active', vip: false, balance: '$890', joined: '2026-02-20' },
    { email: 'mike@example.com', status: 'active', vip: true, balance: '$5,230', joined: '2025-12-10' },
    { email: 'emma@example.com', status: 'suspended', vip: false, balance: '$120', joined: '2026-03-01' },
  ];

  const tokens = [
    { name: '759', symbol: '759', supply: '1,000,000', value: '$1.00', holders: 2340 },
    { name: 'Cristalino', symbol: 'CRS', supply: '500,000', value: '$1.00', holders: 1890 },
    { name: 'Añejo', symbol: 'ANJ', supply: '250,000', value: '$1.00', holders: 1450 },
    { name: 'Raffle', symbol: 'RFL', supply: '100,000', value: '$1.00', holders: 2100 },
    { name: 'Susu', symbol: 'SUS', supply: '75,000', value: '$1.00', holders: 980 },
  ];

  const drawings = [
    { name: 'Weekly Draw', status: 'active', entries: 150, prize: '1,000 759', date: '2026-04-05' },
    { name: 'Special Draw', status: 'active', entries: 89, prize: '500 Cristalino', date: '2026-04-01' },
    { name: 'Mega Draw', status: 'completed', entries: 340, prize: '5,000 759', date: '2026-03-25' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">759</span>
                </div>
                <span className="text-xl font-bold text-white">Admin Panel</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                {user.role === 'superadmin' ? 'Super Admin' : 'Admin'} - {user.email}
              </span>
              <Link
                href="/"
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 sticky top-24">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-slate-400 text-sm">{stat.label}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${stat.positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {stat.change}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Charts placeholder and recent activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                    <div className="space-y-3">
                      {recentTransactions.map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.type === 'deposit' ? 'bg-emerald-500/20' : tx.type === 'withdrawal' ? 'bg-red-500/20' : 'bg-slate-700'
                            }`}>
                              {tx.type === 'deposit' ? (
                                <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                              ) : tx.type === 'withdrawal' ? (
                                <ArrowUpRight className="w-5 h-5 text-red-400" />
                              ) : (
                                <Activity className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-white text-sm">{tx.user}</p>
                              <p className="text-xs text-slate-400">{tx.token} - {tx.time}</p>
                            </div>
                          </div>
                          <span className={`font-medium ${tx.amount.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>
                            {tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Pending Deposits</h3>
                    <div className="space-y-3">
                      {pendingDeposits.map((deposit, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                              <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm">{deposit.user}</p>
                              <p className="text-xs text-slate-400">{deposit.method} - {deposit.time}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">User Management</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400">
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">VIP</th>
                        <th className="pb-3">Balance</th>
                        <th className="pb-3">Joined</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {users.map((u, i) => (
                        <tr key={i} className="border-b border-slate-700/50">
                          <td className="py-4 text-white">{u.email}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-4">
                            {u.vip ? (
                              <Zap className="w-5 h-5 text-amber-400" />
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-4 text-white">{u.balance}</td>
                          <td className="py-4 text-slate-400">{u.joined}</td>
                          <td className="py-4">
                            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                              <Eye className="w-4 h-4 text-slate-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Wallets Tab */}
            {activeTab === 'wallets' && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Wallet Management</h3>
                <div className="space-y-4">
                  {users.slice(0, 3).map((u, i) => (
                    <div key={i} className="p-4 bg-slate-900/50 rounded-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-medium text-white">{u.email}</p>
                          <p className="text-sm text-slate-400">Current Balance: {u.balance}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30">
                          Credit Account
                        </button>
                        <button className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                          Debit Account
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Transaction Ledger</h3>
                <div className="space-y-3">
                  {recentTransactions.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'deposit' ? 'bg-emerald-500/20' : 'bg-slate-700'
                        }`}>
                          {tx.type === 'deposit' ? (
                            <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white">{tx.user}</p>
                          <p className="text-xs text-slate-400">{tx.token} - {tx.time}</p>
                        </div>
                      </div>
                      <span className={`font-medium ${tx.amount.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tokens Tab */}
            {activeTab === 'tokens' && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Token Management</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400">
                    <Coins className="w-4 h-4" />
                    Create Token
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tokens.map((token) => (
                    <div key={token.symbol} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                          <Coins className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{token.name}</p>
                          <p className="text-xs text-slate-400">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Supply</span>
                          <span className="text-white">{token.supply}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Value</span>
                          <span className="text-white">{token.value}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Holders</span>
                          <span className="text-white">{token.holders}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drawings Tab */}
            {activeTab === 'drawings' && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Drawing Management</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400">
                    <Gift className="w-4 h-4" />
                    Create Drawing
                  </button>
                </div>
                <div className="space-y-4">
                  {drawings.map((draw, i) => (
                    <div key={i} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold text-white">{draw.name}</p>
                          <p className="text-sm text-slate-400">Draw Date: {draw.date}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          draw.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {draw.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-slate-400">Prize</p>
                          <p className="font-medium text-white">{draw.prize}</p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-slate-400">Entries</p>
                          <p className="font-medium text-white">{draw.entries}</p>
                        </div>
                      </div>
                      {draw.status === 'active' && (
                        <button className="w-full py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30">
                          Close Drawing
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Membership Tab */}
            {activeTab === 'membership' && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Membership Control</h3>
                <div className="space-y-6">
                  <div className="p-4 bg-slate-900/50 rounded-xl">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">VIP Thresholds</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Minimum Token Value</label>
                        <input
                          type="text"
                          defaultValue="$500 - $1000"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Payment Management</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {['PayPal', 'Stripe', 'Crypto'].map((method) => (
                    <div key={method} className="p-4 bg-slate-900/50 rounded-xl text-center">
                      <p className="font-medium text-white">{method}</p>
                      <p className="text-xs text-emerald-400">Active</p>
                    </div>
                  ))}
                </div>
                <h4 className="text-sm font-medium text-slate-400 mb-4">Pending Approvals</h4>
                <div className="space-y-3">
                  {pendingDeposits.map((deposit, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                      <div>
                        <p className="text-white">{deposit.user}</p>
                        <p className="text-sm text-slate-400">{deposit.method} - {deposit.amount}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400">
                          Approve
                        </button>
                        <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KPI Tracker Tab */}
            {activeTab === 'kpi' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">KPI Tracker</h2>

                {/* Real-time Metrics */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Real-time Metrics
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.realTime.map((kpi, i) => (
                      <div key={i} className="p-4 bg-slate-900/50 rounded-xl">
                        <p className="text-sm text-slate-400 mb-1">{kpi.label}</p>
                        <p className="text-2xl font-bold text-white">{kpi.value}</p>
                        <p className={`text-xs ${kpi.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {kpi.change}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial KPIs */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Financial KPIs
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.financial.map((kpi, i) => (
                      <div key={i} className="p-4 bg-slate-900/50 rounded-xl">
                        <p className="text-sm text-slate-400 mb-1">{kpi.label}</p>
                        <p className="text-2xl font-bold text-white">{kpi.value}</p>
                        <p className={`text-xs ${kpi.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {kpi.change}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Engagement */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    User Engagement
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.engagement.map((kpi, i) => (
                      <div key={i} className="p-4 bg-slate-900/50 rounded-xl">
                        <p className="text-sm text-slate-400 mb-1">{kpi.label}</p>
                        <p className="text-2xl font-bold text-white">{kpi.value}</p>
                        <p className={`text-xs ${kpi.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {kpi.change}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational KPIs */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Operational KPIs
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.operational.map((kpi, i) => (
                      <div key={i} className="p-4 bg-slate-900/50 rounded-xl">
                        <p className="text-sm text-slate-400 mb-1">{kpi.label}</p>
                        <p className="text-2xl font-bold text-white">{kpi.value}</p>
                        <p className={`text-xs ${kpi.change.startsWith('-') ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {kpi.change}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">System Settings</h3>
                <div className="space-y-6">
                  <div className="p-4 bg-slate-900/50 rounded-xl">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Transfer Fee</label>
                    <input
                      type="text"
                      defaultValue="$0.50"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl">
                    <label className="block text-sm font-medium text-slate-400 mb-2">VIP Threshold (Min)</label>
                    <input
                      type="text"
                      defaultValue="$500"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl">
                    <label className="block text-sm font-medium text-slate-400 mb-2">VIP Threshold (Max)</label>
                    <input
                      type="text"
                      defaultValue="$1000"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <button className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-400">
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
