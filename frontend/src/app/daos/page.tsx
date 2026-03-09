'use client';

import React from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Loader2, Shield } from 'lucide-react';
import { DaoCard } from '@/components/DaoCard';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DAO {
  id: string;
  daoName: string | null;
  description: string | null;
  governorAddress: string | null;
  daoAddress: string;
  creator: string;
  createdAt: string;
}

export default function ExploreDAOs() {
  const router = useRouter();
  const { data: daos, isLoading } = useSWR<DAO[]>('/api/daos', fetcher);

  return (
    <Section className="py-12 md:py-20 animate-in fade-in duration-700 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-3">Explore DAOs</h1>
          <p className="text-gray-400 text-lg max-w-2xl">Discover and participate in decentralized autonomous organizations deployed natively on the Stellar Soroban network.</p>
        </div>
        <Button onClick={() => router.push('/#create-dao-section')}>
          Deploy New DAO
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-communityCorner-accent" size={48} />
          <p className="text-gray-400 font-mono text-sm">Querying indexer...</p>
        </div>
      )}

      {!isLoading && (!daos || daos.length === 0) && (
        <div className="glass p-16 md:p-24 rounded-3xl border border-communityCorner-border/50 text-center space-y-6">
          <div className="w-20 h-20 bg-communityCorner-primary rounded-2xl flex items-center justify-center mx-auto border border-communityCorner-border">
            <Shield className="w-10 h-10 text-gray-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">No organizations found</h3>
            <p className="text-gray-400 max-w-md mx-auto">There are currently no active DAOs deployed on this network through Community Corner Factory.</p>
          </div>
          <Button onClick={() => router.push('/#create-dao-section')} className="mt-4">
            Be the First to Deploy
          </Button>
        </div>
      )}

      {daos && daos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {daos.map((dao) => (
            <DaoCard
              key={dao.id}
              name={dao.daoName || dao.daoAddress.slice(0, 12) + '...'}
              address={dao.governorAddress || dao.daoAddress}
              creator={dao.creator}
              createdAt={dao.createdAt}
              onClick={() => router.push(`/dao/${dao.governorAddress}`)}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

