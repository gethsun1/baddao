'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Zap, Loader2, AlertCircle, Activity, Globe, Database, Boxes, Code2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as freighter from '@stellar/freighter-api';
import { Contract, Networks, TransactionBuilder, xdr, Address, nativeToScVal, rpc as StellarRpc } from '@stellar/stellar-sdk';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Section } from '@/components/ui/Section';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { GeometricBackground } from '@/components/svg/GeometricBackground';
import { OrbitNetwork } from '@/components/svg/OrbitNetwork';

// ── Deployment Config ─────────────────────────────────────────────────────
const FACTORY_ID   = 'CDZHWBXIDBVZW6DKX5I3TEFVAD2YVN7CHK3E4REAYHUQ53IY3URGCBHO';
const FEE_MANAGER  = 'CB5T7WVG3F55CQRKCFCMVQRFYUVSHUM63EBFUFVZ2XVTA33DHFQQHQ7C';
const BADUSD       = 'CBN5FCEN5XA4WWV5YCPNOVYMSD4ZV4KPIMWV75YSJMZ3QVW6DMBTKTDQ';
const NFT_HASH     = 'ee764a727fc524bb9c48671f350881e87470483f58582f672702a33f88fb7884';
const DAO_HASH     = '5abbba540218456db6400a43613ee70ef60b2bd0b7e35f372a866c102c3e5d72';
const ESCROW_HASH  = '1818c7ced842d6a31a379a80a55212bd567a425eb953eb3c873722c0cadca1cf';
const RPC_URL      = 'https://soroban-testnet.stellar.org/';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

export default function Home() {
  const router = useRouter();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [deployedGovernor, setDeployedGovernor] = useState<string | null>(null);
  const [walletAddress, setWalletAddress]       = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    duration: '3',
    threshold: '51',
    nftPrice: '10',
  });

  useEffect(() => {
    freighter.isAllowed().then(({ isAllowed }) => {
      if (isAllowed) {
        freighter.getAddress().then(({ address }) => {
          if (address) setWalletAddress(address);
        });
      }
    });
  }, []);

  const handleDeploy = async () => {
    setError(null);
    const { address, error: addrErr } = await freighter.getAddress();
    if (addrErr || !address) {
      setError('Please connect your Freighter wallet first.');
      return;
    }

    setLoading(true);
    try {
      const server = new StellarRpc.Server(RPC_URL);
      const account = await server.getAccount(address);
      const contract = new Contract(FACTORY_ID);
      const mintPricei128 = BigInt(Math.round(parseFloat(formData.nftPrice) * 1e7));

      const operation = contract.call(
        'deploy_dao',
        Address.fromString(address).toScVal(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        xdr.ScVal.scvBytes(hexToBytes(NFT_HASH) as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        xdr.ScVal.scvBytes(hexToBytes(DAO_HASH) as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        xdr.ScVal.scvBytes(hexToBytes(ESCROW_HASH) as any),
        Address.fromString(FEE_MANAGER).toScVal(),
        Address.fromString(BADUSD).toScVal(),
        nativeToScVal(mintPricei128, { type: 'i128' }),
      );

      const tx = new TransactionBuilder(account, {
        fee: '1000000',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(operation)
        .setTimeout(300)
        .build();

      const sim = await server.simulateTransaction(tx);
      if (StellarRpc.Api.isSimulationError(sim)) {
        throw new Error(`Simulation failed: ${sim.error}`);
      }
      const preparedTx = StellarRpc.assembleTransaction(tx, sim).build();

      const { signedTxXdr, error: signErr } = await freighter.signTransaction(
        preparedTx.toXDR(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { network: 'TESTNET', networkPassphrase: Networks.TESTNET } as any,
      );
      if (signErr || !signedTxXdr) throw new Error(`Signing failed: ${signErr}`);

      const { TransactionBuilder: TB } = await import('@stellar/stellar-sdk');
      const signedTx = TB.fromXDR(signedTxXdr, Networks.TESTNET);
      const result = await server.sendTransaction(signedTx);

      if (result.status === 'ERROR') {
        throw new Error(`Submission failed: ${JSON.stringify(result.errorResult)}`);
      }

      let succeeded = false;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await server.getTransaction(result.hash);
        if (status.status === StellarRpc.Api.GetTransactionStatus.SUCCESS) {
          succeeded = true;
          break;
        }
        if (status.status === StellarRpc.Api.GetTransactionStatus.FAILED) {
          throw new Error('Transaction failed on-chain.');
        }
      }
      if (!succeeded) throw new Error('Transaction timed out.');

      const deployedAfter = Date.now() - 180_000;
      let governorAddr: string | null = null;
      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const resp = await fetch('/api/daos');
          if (resp.ok) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const daos: any[] = await resp.json();
            const ours = daos.find(d => !d.daoName && d.governorAddress && new Date(d.createdAt).getTime() > deployedAfter);
            if (ours?.governorAddress) {
              governorAddr = ours.governorAddress;
              break;
            }
          }
        } catch { /* retry */ }
      }

      if (governorAddr && formData.name.trim()) {
        try {
          await fetch(`/api/daos/${governorAddr}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ daoName: formData.name.trim() }),
          });
        } catch {}
      }

      setDeployedGovernor(governorAddr);
      setDone(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 relative overflow-hidden">
      
      {/* Background Parallax Layer */}
      <motion.div style={{ y: y1, opacity }} className="absolute inset-0 z-0 pointer-events-none">
        <GeometricBackground />
      </motion.div>

      <Section className="flex flex-col items-center justify-center pt-32 pb-16 min-h-[80vh] relative z-10 text-center md:text-left">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-baddao-accent/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-8 max-w-6xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-baddao-highlight/30 bg-baddao-highlight/10 text-baddao-highlight text-sm font-medium mb-4">
              <Zap size={16} /> Beta Launch on Soroban Testnet
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-white leading-tight">
              Build and Govern Decentralized Organizations on Stellar
            </h1>
            
            <p className="text-xl text-gray-400 font-light leading-relaxed max-w-lg mx-auto md:mx-0">
              BAD DAO Factory enables anyone to create and operate decentralized organizations on Stellar with integrated governance, treasury management, and on-chain execution.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
              <Button size="lg" onClick={() => {
                setStep(1);
                setTimeout(() => {
                  document.getElementById('create-dao-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}>
                Create a DAO
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/daos')}>
                Explore DAOs
              </Button>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="flex-1 w-full max-w-[500px]"
          >
            <OrbitNetwork />
          </motion.div>
          
        </div>
      </Section>

      {/* DAO Creation Form */}
      <AnimatePresence>
        {step > 0 && !done && (
          <motion.div 
            id="create-dao-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-3xl mx-auto overflow-hidden"
          >
            <Card className="p-8 sm:p-10">
              <div className="mb-8 border-b border-baddao-border pb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-baddao-primary border border-baddao-border flex items-center justify-center text-baddao-accent">
                  <Settings size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Initialize DAO</h2>
                  <p className="text-gray-400 text-sm">Configure your decentralized organization parameters</p>
                </div>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-6">
                <Input 
                  label="DAO Name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Creator Fund DAO"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input 
                    label="Proposal Duration (Days)" 
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  />
                  <Input 
                    label="Quorum Threshold (%)" 
                    type="number"
                    value={formData.threshold}
                    onChange={(e) => setFormData({...formData, threshold: e.target.value})}
                  />
                </div>

                <Input 
                  label="Membership NFT Mint Price (BADUSD)" 
                  type="number"
                  value={formData.nftPrice}
                  onChange={(e) => setFormData({...formData, nftPrice: e.target.value})}
                  placeholder="100"
                />

                {!walletAddress && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3 text-yellow-500 text-sm">
                    <AlertCircle size={16} /> 
                    <span>Connect your Freighter wallet to continue.</span>
                  </div>
                )}

                <Button 
                  onClick={handleDeploy}
                  disabled={loading || !walletAddress}
                  className="w-full mt-8 py-4 text-lg"
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={20}/> Deploying Contracts...</>
                  ) : (
                    <><Zap size={20} /> Deploy DAO</>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {done && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-10 text-center space-y-6 bg-baddao-card/50 border-green-500/30">
              <div className="w-20 h-20 mx-auto bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-3xl font-display font-bold text-white">Deployment Successful</h2>
              <p className="text-gray-400">Your organization is now live on the Stellar Soroban network.</p>
              
              {deployedGovernor && (
                <div className="p-4 bg-baddao-primary rounded-xl border border-baddao-border break-all">
                  <p className="text-sm text-gray-500 mb-1">Governor Address</p>
                  <p className="font-mono text-cyan-400 text-sm">{deployedGovernor}</p>
                </div>
              )}

              <div className="pt-6 flex justify-center gap-4">
                <Button onClick={() => deployedGovernor ? router.push(`/dao/${deployedGovernor}`) : router.push('/daos')}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => { setDone(false); setStep(0); setDeployedGovernor(null); }}>
                  Deploy Another
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform Capabilities */}
      <Section id="capabilities" className="py-24 border-t border-baddao-border/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Platform Capabilities</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Enterprise-grade infrastructure for managing distributed organizations.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 hover:border-baddao-accent/50 transition-colors">
            <div className="w-12 h-12 bg-baddao-accent/10 rounded-xl flex items-center justify-center text-baddao-accent mb-6">
              <Boxes size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">DAO Creation</h3>
            <p className="text-gray-400 leading-relaxed">Launch fully-featured Governor, Treasury, and NFT contracts specifically configured for your organization in seconds.</p>
          </Card>
          
          <Card className="p-8 hover:border-baddao-accent/50 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6">
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">On-Chain Governance</h3>
            <p className="text-gray-400 leading-relaxed">Trustless voting mechanism where 1 NFT equals 1 vote. Proposals are cryptographically secure and automatically enforced.</p>
          </Card>

          <Card className="p-8 hover:border-baddao-accent/50 transition-colors">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-6">
              <Database size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Treasury Escrow</h3>
            <p className="text-gray-400 leading-relaxed">Secure smart-contract escrow holds DAO funds natively on-chain. Funds can only be moved via successful governance proposals.</p>
          </Card>

          <Card className="p-8 hover:border-baddao-accent/50 transition-colors">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 mb-6">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Transparent Execution</h3>
            <p className="text-gray-400 leading-relaxed">All state changes are immutable and indexed. Execution of proposals is purely deterministic and automated.</p>
          </Card>
        </div>
      </Section>

      {/* How It Works */}
      <Section id="how-it-works" className="py-24 bg-baddao-card/30 rounded-3xl border border-baddao-border/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">A seamless lifecycle from creation to execution.</p>
        </div>

        <div className="max-w-5xl mx-auto px-4 relative">
          <div className="hidden md:block absolute top-[45px] left-[10%] right-[10%] h-0.5 bg-baddao-border z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { num: 1, title: 'Create DAO', desc: 'Deploy contracts' },
              { num: 2, title: 'Mint NFT', desc: 'Acquire voting rights' },
              { num: 3, title: 'Submit Proposal', desc: 'Draft treasury action' },
              { num: 4, title: 'Vote', desc: 'Members cast votes' },
              { num: 5, title: 'Execute', desc: 'Automated treasury payload' },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-2xl bg-baddao-primary border-2 border-baddao-border flex items-center justify-center mb-6 group-hover:border-baddao-accent transition-colors shadow-lg shadow-black/50">
                  <span className="font-display font-bold text-2xl text-white group-hover:text-baddao-accent transition-colors">{step.num}</span>
                </div>
                <h4 className="font-bold text-white mb-2">{step.title}</h4>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Developer Section */}
      <Section className="py-24">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-baddao-primary to-baddao-card border border-baddao-border rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
            <Code2 size={200} className="text-baddao-accent" />
          </div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">Open & Transparent</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Built natively on Stellar Soroban with an open-source smart contract architecture. Verify our contracts, audit the backend relayer, or contribute to the ecosystem on GitHub.
            </p>
            <div className="pt-4 flex justify-center">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <Code2 size={20} /> View on GitHub
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
