import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface DaoCardProps {
  name: string;
  address: string;
  creator: string;
  createdAt: string;
  onClick?: () => void;
}

export function DaoCard({ name, address, creator, createdAt, onClick }: DaoCardProps) {
  return (
    <Card 
      onClick={onClick}
      className="p-6 cursor-pointer group hover:border-baddao-accent/40 hover:shadow-[0_0_20px_rgba(47,107,255,0.05)] transition-all"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-baddao-accent/20 to-blue-600/20 border border-baddao-accent/20 flex items-center justify-center">
          <Shield size={24} className="text-baddao-highlight group-hover:text-white transition-colors" />
        </div>
        <ArrowRight size={20} className="text-gray-600 group-hover:text-cyan-400 transition-transform group-hover:translate-x-1" />
      </div>

      <h3 className="font-display font-bold text-xl mb-1 text-white truncate">{name}</h3>
      <p className="font-mono text-xs text-gray-500 mb-6 truncate">{address}</p>

      <div className="border-t border-baddao-border/50 pt-4 flex justify-between text-sm items-end">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Creator</p>
          <p className="font-mono text-xs truncate max-w-[120px] text-gray-300">
            {creator ? `${creator.slice(0, 4)}...${creator.slice(-4)}` : 'Unknown'}
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-xs text-gray-500">Deployed</p>
          <p className="text-xs text-gray-300">{new Date(createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </Card>
  );
}
