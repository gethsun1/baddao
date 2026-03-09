'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { LayoutDashboard, FileText, Users, Coins, Settings, ExternalLink } from 'lucide-react';
import { Stat } from '@/components/ui/Stat';
import { Button } from '@/components/ui/Button';
import { ProposalCard } from '@/components/ProposalCard';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DaoDashboard({ params }: { params: { address: string } }) {
  const { address } = params;
  
  const { data: dao }          = useSWR(`/api/daos/${address}`, fetcher);
  const { data: members }      = useSWR(`/api/daos/${address}/members`, fetcher);
  const { data: transactions } = useSWR(`/api/daos/${address}/transactions`, fetcher);
  const { data: proposals }    = useSWR(`/api/daos/${address}/proposals`, fetcher);

  const [activeTab, setActiveTab] = useState('overview');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treasuryBalance = transactions?.reduce((acc: number, t: any) => acc + (Number(t.amount)/1e7), 0) || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeProposals = proposals?.filter((p: any) => p.status === 'ACTIVE').length || 0;
  const memberCount = members?.length || 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'proposals', label: 'Proposals', icon: <FileText size={18} /> },
    { id: 'members', label: 'Members', icon: <Users size={18} /> },
    { id: 'treasury', label: 'Treasury', icon: <Coins size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 pt-8 pb-20 min-h-[calc(100vh-80px)] animate-in fade-in duration-700">
      
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 shrink-0 space-y-6">
        <div className="glass p-6 rounded-2xl border border-baddao-border text-center md:text-left">
          <h2 className="font-display font-bold text-xl text-white mb-2">{dao?.daoName || 'DAO'}</h2>
          <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer text-xs font-mono">
            {address.slice(0, 10)}...{address.slice(-6)}
            <ExternalLink size={12} />
          </div>
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-medium",
                activeTab === tab.id
                  ? "bg-baddao-accent/10 border border-baddao-accent/30 text-baddao-highlight"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="hidden md:block">
          <Button className="w-full">Join DAO</Button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 space-y-8 min-w-0">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold text-white capitalize">{activeTab}</h1>
          {activeTab === 'proposals' && (
            <Button size="sm">+ New Proposal</Button>
          )}
        </div>

        {/* Content Area */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Stat label="Treasury Balance" value={`${treasuryBalance} USDC`} icon={<Coins />} />
              <Stat label="Total Members" value={memberCount} icon={<Users />} />
              <Stat label="Active Proposals" value={activeProposals} icon={<FileText />} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Recent Proposals</h3>
                <button 
                  onClick={() => setActiveTab('proposals')}
                  className="text-sm text-gray-400 hover:text-baddao-highlight transition-colors"
                >
                  View All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!proposals?.length ? (
                  <div className="col-span-1 md:col-span-2 glass p-8 rounded-2xl text-center text-gray-500 border border-baddao-border/50">
                    No proposals yet.
                  </div>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  proposals.slice(0, 4).map((prop: any) => (
                    <ProposalCard
                      key={prop.id}
                      title={prop.title || `Proposal ${prop.id}`}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      status={prop.status.toLowerCase() as any}
                      forVotes={prop.forVotes || 0}
                      againstVotes={prop.againstVotes || 0}
                      timeRemaining="3 days left"
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {!proposals?.length ? (
              <div className="glass p-16 rounded-3xl text-center text-gray-500 border border-baddao-border/50">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p>No proposals available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {proposals.map((prop: any) => (
                  <ProposalCard
                    key={prop.id}
                    title={prop.title || `Proposal ${prop.id}`}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    status={prop.status.toLowerCase() as any}
                    forVotes={prop.forVotes || 0}
                    againstVotes={prop.againstVotes || 0}
                    timeRemaining="3 days left"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Placeholders for other tabs */}
        {(activeTab === 'members' || activeTab === 'treasury' || activeTab === 'settings') && (
          <div className="glass p-16 rounded-3xl border border-baddao-border/50 flex flex-col items-center justify-center text-gray-500 animate-in slide-in-from-bottom-4 duration-500 h-[400px]">
            <Settings size={48} className="mb-4 opacity-20" />
            <p className="font-mono text-sm uppercase tracking-wider">Module Coming Soon</p>
          </div>
        )}

      </main>
    </div>
  );
}

