/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowDownUp, 
  Wallet, 
  CheckCircle2, 
  Copy, 
  ChevronDown, 
  Info,
  ArrowRight,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Zap,
  MessageSquare,
  X,
  Send,
  Search,
  History,
  Clock,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Toaster, toast } from 'sonner';
import { ASSETS, ADMIN_ADDRESSES, generateTxId } from './constants';
import { Asset, SwapData, AppStep, Transaction } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [step, setStep] = useState<AppStep>('swap');
  const [fromAsset, setFromAsset] = useState<Asset>(ASSETS[0]);
  const [toAsset, setToAsset] = useState<Asset>(ASSETS[2]);
  const [fromNetwork, setFromNetwork] = useState<string>(ASSETS[0].networks[0]);
  const [toNetwork, setToNetwork] = useState<string>(ASSETS[2].networks[0]);
  const [fromAmount, setFromAmount] = useState<string>('0.1');
  const [toAmount, setToAmount] = useState<string>('');
  const [receivingAddress, setReceivingAddress] = useState<string>('');
  const [txId, setTxId] = useState<string>('');
  const [isAssetModalOpen, setIsAssetModalOpen] = useState<'from' | 'to' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Update networks when assets change
  useEffect(() => {
    setFromNetwork(fromAsset.networks[0]);
  }, [fromAsset]);

  useEffect(() => {
    setToNetwork(toAsset.networks[0]);
  }, [toAsset]);

  // Support Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatName, setChatName] = useState('');
  const [chatEmail, setChatEmail] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatSuccess, setChatSuccess] = useState(false);

  // Calculate toAmount based on mock prices
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const valueInUsd = parseFloat(fromAmount) * fromAsset.price;
      const calculatedToAmount = valueInUsd / toAsset.price;
      setToAmount(calculatedToAmount.toFixed(6));
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromAsset, toAsset]);

  const handleSwapInit = () => {
    const newTxId = generateTxId();
    setTxId(newTxId);
    
    const newTransaction: Transaction = {
      txId: newTxId,
      fromAsset: fromAsset.symbol,
      toAsset: toAsset.symbol,
      fromAmount,
      toAmount,
      receivingAddress,
      fromNetwork,
      toNetwork,
      status: 'pending',
      timestamp: Date.now()
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setStep('deposit');
    toast.info('Transaction initiated. Please complete the deposit.');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/swap/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txId,
          fromAsset: fromAsset.symbol,
          toAsset: toAsset.symbol,
          fromAmount,
          toAmount,
          receivingAddress,
          fromNetwork,
          toNetwork
        }),
      });
      
      if (response.ok) {
        setStep('pending');
        toast.success('Payment submitted successfully! Verifying...');
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingChat(true);
    try {
      const response = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: chatName, email: chatEmail, message: chatMessage }),
      });
      if (response.ok) {
        setChatSuccess(true);
        setChatMessage('');
        setTimeout(() => setChatSuccess(false), 5000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSendingChat(false);
    }
  };

  const filteredAssets = useMemo(() => {
    return ASSETS.filter(a => 
      a.name.toLowerCase().includes(assetSearch.toLowerCase()) || 
      a.symbol.toLowerCase().includes(assetSearch.toLowerCase())
    );
  }, [assetSearch]);

  const AssetSelector = ({ type }: { type: 'from' | 'to' }) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={() => {
        setIsAssetModalOpen(null);
        setAssetSearch('');
      }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-lg glass-dark rounded-[2rem] overflow-hidden shadow-2xl border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold tracking-tight">Select Asset</h3>
            <button onClick={() => {
              setIsAssetModalOpen(null);
              setAssetSearch('');
            }} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={20} className="text-white/40 hover:text-white" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              autoFocus
              type="text"
              placeholder="Search by name or symbol..."
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-crypto-gold/50 transition-all"
            />
          </div>
        </div>
        <div className="p-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {filteredAssets.length > 0 ? (
            <div className="grid grid-cols-1 gap-1">
              {filteredAssets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => {
                    if (type === 'from') setFromAsset(asset);
                    else setToAsset(asset);
                    setIsAssetModalOpen(null);
                    setAssetSearch('');
                  }}
                  className="w-full p-4 flex items-center gap-4 hover:bg-white/5 rounded-2xl transition-all group text-left"
                >
                  <div className="relative">
                    <img src={asset.icon} alt={asset.symbol} className="w-10 h-10 rounded-full bg-white/5 p-1" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 rounded-full border border-white/10 group-hover:border-crypto-gold/30 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg leading-tight group-hover:text-crypto-gold transition-colors">{asset.symbol}</div>
                    <div className="text-sm text-white/40">{asset.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-medium">${asset.price.toLocaleString()}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-white/20 italic">No assets found matching your search</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  const TransactionDetailsModal = ({ tx }: { tx: Transaction }) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={() => setSelectedTx(null)}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-lg glass-dark rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-white/10 bg-crypto-gold/5">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-crypto-gold/20 rounded-xl text-crypto-gold">
                <History size={20} />
              </div>
              <h3 className="text-xl font-black tracking-tight">Transaction Details</h3>
            </div>
            <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={20} className="text-white/40 hover:text-white" />
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              "px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border",
              tx.status === 'pending' && "bg-crypto-gold/10 text-crypto-gold border-crypto-gold/20",
              tx.status === 'completed' && "bg-green-500/10 text-green-500 border-green-500/20",
              tx.status === 'failed' && "bg-red-500/10 text-red-500 border-red-500/20"
            )}>
              {tx.status}
            </div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Order ID: {tx.txId}</p>
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 glass rounded-2xl border border-white/5 space-y-1">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">From</p>
              <p className="font-black text-lg">{tx.fromAmount} {tx.fromAsset}</p>
              <p className="text-[10px] font-bold text-crypto-gold uppercase tracking-widest">{tx.fromNetwork}</p>
            </div>
            <div className="p-5 glass rounded-2xl border border-white/5 space-y-1 text-right">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">To</p>
              <p className="font-black text-lg">{tx.toAmount} {tx.toAsset}</p>
              <p className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest">{tx.toNetwork}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Receiving Address</p>
            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs break-all text-white/60 leading-relaxed group relative">
              {tx.receivingAddress}
              <button 
                onClick={() => handleCopy(tx.receivingAddress)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:text-crypto-gold transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Date</p>
              <p className="text-xs font-bold text-white/60">{new Date(tx.timestamp).toLocaleDateString()}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Time</p>
              <p className="text-xs font-bold text-white/60">{new Date(tx.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white/[0.02] border-t border-white/5">
          <button 
            onClick={() => setSelectedTx(null)}
            className="w-full py-4 glass rounded-2xl font-black text-sm tracking-widest hover:bg-white/10 transition-all border border-white/10 uppercase"
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-midnight selection:bg-crypto-gold/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-40 bg-midnight/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-crypto-gold rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(243,186,47,0.3)] group-hover:scale-110 transition-transform">
            <Zap className="text-midnight fill-midnight" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic group-hover:text-crypto-gold transition-colors">DeepSpace</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-white/40">
            <button onClick={() => setStep('swap')} className={cn("hover:text-crypto-gold transition-colors tracking-widest uppercase", step === 'swap' && "text-crypto-gold")}>EXCHANGE</button>
            <button onClick={() => setStep('history')} className={cn("hover:text-crypto-gold transition-colors tracking-widest uppercase flex items-center gap-2", step === 'history' && "text-crypto-gold")}>
              <History size={16} />
              HISTORY
            </button>
            <a href="#" className="hover:text-crypto-gold transition-colors tracking-widest">SUPPORT</a>
          </div>
          <button className="px-6 py-3 glass rounded-full text-sm font-black hover:bg-white/10 transition-all flex items-center gap-2 border border-white/10 hover:border-crypto-gold/50">
            <Wallet size={18} className="text-crypto-gold" />
            CONNECT
          </button>
        </div>
      </header>

      {/* Main Content with padding to avoid footer clash */}
      <main className="w-full max-w-xl relative pt-24 pb-32">
        <AnimatePresence mode="wait">
          {step === 'swap' && (
            <motion.div
              key="swap"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-dark p-8 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-crypto-gold/5 blur-[120px] -mr-40 -mt-40 rounded-full" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-neon-cyan/5 blur-[120px] -ml-40 -mb-40 rounded-full" />
              
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-1">Swap</h2>
                  <p className="text-white/40 text-sm font-medium">Fast, secure manual exchange</p>
                </div>
                <div className="p-3 glass rounded-2xl text-crypto-gold shadow-lg shadow-crypto-gold/10">
                  <ShieldCheck size={24} />
                </div>
              </div>

              {/* From Input */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/30 px-2">
                  <span>Pay with</span>
                  <span>Balance: 0.00</span>
                </div>
                <div className="p-8 bg-white/[0.03] rounded-[2rem] border border-white/5 flex flex-col gap-4 focus-within:border-crypto-gold/30 focus-within:bg-white/[0.05] transition-all group">
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="bg-transparent text-4xl font-black w-full outline-none placeholder:text-white/5"
                      placeholder="0.0"
                    />
                    <button 
                      onClick={() => setIsAssetModalOpen('from')}
                      className="flex items-center gap-3 p-2.5 px-5 glass rounded-2xl hover:bg-white/10 transition-all shrink-0 border border-white/10 group-hover:border-crypto-gold/30"
                    >
                      <img src={fromAsset.icon} alt={fromAsset.symbol} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      <span className="font-black text-lg">{fromAsset.symbol}</span>
                      <ChevronDown size={18} className="text-white/40" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Network:</span>
                    <select 
                      value={fromNetwork}
                      onChange={(e) => setFromNetwork(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-bold text-white/60 outline-none hover:border-crypto-gold/30 transition-all cursor-pointer"
                    >
                      {fromAsset.networks.map(net => (
                        <option key={net} value={net} className="bg-midnight">{net}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Swap Icon */}
              <div className="flex justify-center -my-8 relative z-10">
                <button 
                  onClick={() => {
                    const temp = fromAsset;
                    setFromAsset(toAsset);
                    setToAsset(temp);
                  }}
                  className="p-5 glass rounded-[1.5rem] text-crypto-gold hover:rotate-180 transition-all duration-700 shadow-2xl border border-white/10 hover:border-crypto-gold/50 group"
                >
                  <ArrowDownUp size={28} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* To Input */}
              <div className="space-y-3 mb-10">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/30 px-2">
                  <span>Receive</span>
                  <span>Est. Value: ${ (parseFloat(toAmount) * toAsset.price).toLocaleString() }</span>
                </div>
                <div className="p-8 bg-white/[0.03] rounded-[2rem] border border-white/5 flex flex-col gap-4 group">
                  <div className="flex items-center gap-4">
                    <input 
                      type="text" 
                      value={toAmount}
                      readOnly
                      className="bg-transparent text-4xl font-black w-full outline-none text-white/60"
                      placeholder="0.0"
                    />
                    <button 
                      onClick={() => setIsAssetModalOpen('to')}
                      className="flex items-center gap-3 p-2.5 px-5 glass rounded-2xl hover:bg-white/10 transition-all shrink-0 border border-white/10 group-hover:border-neon-cyan/30"
                    >
                      <img src={toAsset.icon} alt={toAsset.symbol} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      <span className="font-black text-lg">{toAsset.symbol}</span>
                      <ChevronDown size={18} className="text-white/40" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Network:</span>
                    <select 
                      value={toNetwork}
                      onChange={(e) => setToNetwork(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-bold text-white/60 outline-none hover:border-neon-cyan/30 transition-all cursor-pointer"
                    >
                      {toAsset.networks.map(net => (
                        <option key={net} value={net} className="bg-midnight">{net}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4 mb-10 p-6 glass rounded-[2rem] text-sm border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-white/30 font-bold uppercase tracking-tighter flex items-center gap-1.5">Price Impact <Info size={14} /></span>
                  <span className="text-green-400 font-black">&lt; 0.01%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/30 font-bold uppercase tracking-tighter flex items-center gap-1.5">Estimated Fee <Info size={14} /></span>
                  <span className="font-black">$2.45</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-white/30 font-bold uppercase tracking-tighter">Exchange Rate</span>
                  <span className="font-mono font-bold text-white/60">1 {fromAsset.symbol} = {(fromAsset.price / toAsset.price).toFixed(4)} {toAsset.symbol}</span>
                </div>
              </div>

              <button 
                onClick={handleSwapInit}
                disabled={!fromAmount || parseFloat(fromAmount) <= 0}
                className="w-full py-7 bg-crypto-gold text-midnight font-black text-2xl rounded-[2rem] hover:shadow-[0_0_50px_rgba(243,186,47,0.3)] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
              >
                SWAP NOW
                <ArrowRight size={28} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 'deposit' && (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-dark p-10 rounded-[3rem] shadow-2xl border border-white/5"
            >
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setStep('swap')} className="p-3 glass rounded-2xl text-white/40 hover:text-white transition-colors">
                  <ArrowRight className="rotate-180" size={24} />
                </button>
                <h2 className="text-3xl font-black tracking-tight">Deposit</h2>
              </div>

              <div className="space-y-8">
                {/* Receiving Address Input */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/30 px-2">Your Receiving {toAsset.symbol} Address</label>
                  <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center gap-4 focus-within:border-neon-cyan/50 transition-all">
                    <Wallet className="text-neon-cyan" size={24} />
                    <input 
                      type="text" 
                      value={receivingAddress}
                      onChange={(e) => setReceivingAddress(e.target.value)}
                      className="bg-transparent w-full outline-none font-mono text-sm tracking-tight"
                      placeholder={`Paste your ${toAsset.symbol} address here`}
                    />
                  </div>
                </div>

                {/* Admin Deposit Info */}
                <div className="p-8 glass rounded-[2.5rem] space-y-8 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-crypto-gold/5 blur-[60px] -mr-20 -mt-20 rounded-full" />
                  
                  <div className="flex flex-col items-center gap-6">
                    <div className="p-5 bg-white rounded-[2rem] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                      <QRCodeSVG 
                        value={ADMIN_ADDRESSES[fromAsset.symbol] || 'Address not available'} 
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Send exactly</p>
                      <p className="text-4xl font-black text-crypto-gold tracking-tight">{fromAmount} {fromAsset.symbol}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/30">Deposit Address ({fromAsset.symbol} - {fromNetwork})</label>
                    <div className="flex items-center gap-3">
                      <div className="p-5 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs break-all flex-1 text-white/60 leading-relaxed">
                        {ADMIN_ADDRESSES[fromAsset.symbol] || 'Manual address required - Contact Support'}
                      </div>
                      <button 
                        onClick={() => handleCopy(ADMIN_ADDRESSES[fromAsset.symbol] || '')}
                        className="p-5 glass rounded-2xl text-crypto-gold hover:bg-white/10 transition-all shrink-0 border border-white/10"
                      >
                        {copied ? <CheckCircle2 size={24} className="text-green-400" /> : <Copy size={24} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 glass rounded-2xl flex gap-4 items-start border border-white/5 bg-white/[0.02]">
                  <div className="p-2 bg-crypto-gold/10 rounded-xl text-crypto-gold shrink-0">
                    <Info size={20} />
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">
                    Please double-check the network and address. 
                    Manual verification typically takes <strong>10-60 minutes</strong> after blockchain confirmation.
                  </p>
                </div>

                <button 
                  onClick={handleSubmitPayment}
                  disabled={!receivingAddress || isSubmitting}
                  className="w-full py-6 bg-neon-cyan text-midnight font-black text-xl rounded-[2rem] hover:shadow-[0_0_40px_rgba(0,243,255,0.3)] transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : (
                    <>
                      I HAVE SENT THE PAYMENT
                      <Zap size={24} className="fill-midnight" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-dark p-12 rounded-[3.5rem] shadow-2xl text-center space-y-10 border border-white/5"
            >
              <div className="relative inline-block">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="w-40 h-40 rounded-full border-2 border-dashed border-crypto-gold/20"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-crypto-gold/10 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(243,186,47,0.1)]">
                    <Loader2 className="text-crypto-gold animate-spin" size={48} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tight">Verifying...</h2>
                <p className="text-white/30 font-bold uppercase tracking-widest text-xs">Order ID: <span className="text-white">{txId}</span></p>
              </div>

              <div className="p-8 glass rounded-[2.5rem] text-left space-y-5 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/30 font-bold uppercase tracking-tighter text-sm">Status</span>
                  <span className="px-4 py-1.5 bg-crypto-gold/10 text-crypto-gold text-xs font-black rounded-full border border-crypto-gold/20 tracking-widest">PENDING</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/30 font-bold uppercase tracking-tighter text-sm">Swap Pair</span>
                  <span className="font-black text-lg">{fromAmount} {fromAsset.symbol} ({fromNetwork}) &rarr; {toAmount} {toAsset.symbol} ({toNetwork})</span>
                </div>
                <div className="pt-6 border-t border-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Receiving Address</p>
                  <p className="font-mono text-xs break-all bg-black/40 p-4 rounded-2xl text-white/60 border border-white/5 leading-relaxed">{receivingAddress}</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-white/40 leading-relaxed font-medium px-4">
                  Our team is currently verifying your deposit on the blockchain. 
                  Once confirmed, your swapped funds will be dispatched immediately.
                </p>
                <div className="flex justify-center">
                  <button className="flex items-center gap-2 text-sm font-black text-crypto-gold hover:text-white transition-colors tracking-widest uppercase">
                    View Transaction <ExternalLink size={16} />
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setStep('swap')}
                className="w-full py-5 glass rounded-2xl font-black text-sm tracking-widest hover:bg-white/10 transition-all border border-white/10"
              >
                BACK TO DASHBOARD
              </button>
            </motion.div>
          )}

          {step === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-dark p-10 rounded-[3rem] shadow-2xl border border-white/5"
            >
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setStep('swap')} className="p-3 glass rounded-2xl text-white/40 hover:text-white transition-colors">
                  <ArrowRight className="rotate-180" size={24} />
                </button>
                <h2 className="text-3xl font-black tracking-tight">Transaction History</h2>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div key={tx.txId} className="p-6 glass rounded-3xl border border-white/5 space-y-4 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Order ID</p>
                          <p className="font-mono text-xs text-white/60">{tx.txId}</p>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border",
                          tx.status === 'pending' && "bg-crypto-gold/10 text-crypto-gold border-crypto-gold/20",
                          tx.status === 'completed' && "bg-green-500/10 text-green-500 border-green-500/20",
                          tx.status === 'failed' && "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {tx.status}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg">{tx.fromAmount} {tx.fromAsset}</span>
                          <span className="text-white/20 text-[10px] font-bold uppercase">{tx.fromNetwork}</span>
                        </div>
                        <ArrowRight size={16} className="text-white/20" />
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-white/20 text-[10px] font-bold uppercase">{tx.toNetwork}</span>
                          <span className="font-black text-lg">{tx.toAmount} {tx.toAsset}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-white/20">
                          <Clock size={14} />
                          <span className="text-[10px] font-bold">{new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedTx(tx);
                          }}
                          className="text-[10px] font-black text-crypto-gold hover:text-white transition-colors uppercase tracking-widest"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                      <AlertCircle size={32} />
                    </div>
                    <p className="text-white/20 font-bold uppercase tracking-widest text-sm italic">No transactions found</p>
                    <button 
                      onClick={() => setStep('swap')}
                      className="px-6 py-3 glass rounded-xl text-xs font-black text-crypto-gold hover:bg-white/10 transition-all border border-white/10"
                    >
                      START SWAPPING
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Support Chat Bubble */}
      <div className="fixed bottom-24 right-8 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 right-0 w-[350px] glass-dark rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="p-6 bg-crypto-gold text-midnight flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-midnight/10 rounded-full flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm leading-tight">Live Support</h3>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Typically replies in 15m</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-midnight/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {chatSuccess ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="text-green-500" size={32} />
                    </div>
                    <p className="font-bold text-white/80">Message Sent! We'll get back to you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendSupport} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1">Name</label>
                      <input 
                        required
                        type="text" 
                        value={chatName}
                        onChange={(e) => setChatName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-crypto-gold/50 transition-all"
                        placeholder="Your Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1">Email</label>
                      <input 
                        required
                        type="email" 
                        value={chatEmail}
                        onChange={(e) => setChatEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-crypto-gold/50 transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1">Message</label>
                      <textarea 
                        required
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-crypto-gold/50 transition-all min-h-[100px] resize-none"
                        placeholder="How can we help?"
                      />
                    </div>
                    <button 
                      disabled={isSendingChat}
                      className="w-full py-4 bg-crypto-gold text-midnight font-black text-sm rounded-xl hover:shadow-lg hover:shadow-crypto-gold/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isSendingChat ? <Loader2 className="animate-spin" size={18} /> : (
                        <>
                          SEND MESSAGE
                          <Send size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-16 h-16 bg-crypto-gold text-midnight rounded-full shadow-[0_0_30px_rgba(243,186,47,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative z-50"
        >
          {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
          {!isChatOpen && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-neon-cyan rounded-full border-2 border-midnight animate-bounce" />
          )}
        </button>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row justify-between items-center gap-6 text-white/20 text-[10px] font-black tracking-widest z-40 bg-midnight/80 backdrop-blur-md border-t border-white/5">
        <div className="flex items-center gap-8">
          <span>&copy; 2026 DEEPSPACE SWAP</span>
          <a href="#" className="hover:text-white transition-colors">TERMS OF SERVICE</a>
          <a href="#" className="hover:text-white transition-colors">PRIVACY POLICY</a>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-green-500/60">SYSTEMS ONLINE</span>
          </div>
          <span className="opacity-20">|</span>
          <div className="flex items-center gap-2">
            <span className="opacity-50">LOCATION:</span>
            <span className="text-white/40">EUROPE (WEST)</span>
          </div>
          <span className="opacity-20">|</span>
          <span className="flex items-center gap-2">NETWORK: <span className="text-white/40">MAINNET</span></span>
        </div>
      </footer>

      {/* Asset Modals */}
      <AnimatePresence>
        {isAssetModalOpen && <AssetSelector type={isAssetModalOpen} />}
        {selectedTx && <TransactionDetailsModal tx={selectedTx} />}
      </AnimatePresence>

      <Toaster position="top-right" theme="dark" closeButton richColors />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(243, 186, 47, 0.3);
        }
      `}</style>
    </div>
  );
}
