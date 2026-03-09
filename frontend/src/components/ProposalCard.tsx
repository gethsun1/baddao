import React from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ProposalCardProps {
  title: string;
  status: 'active' | 'executed' | 'defeated' | 'pending';
  forVotes: number;
  againstVotes: number;
  timeRemaining: string;
  onClick?: () => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({ title, status, forVotes, againstVotes, timeRemaining }) => {
  const totalVotes = forVotes + againstVotes;
  const forPercentage = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;
  
  const getStatusVariant = () => {
    switch(status) {
      case 'active': return 'info';
      case 'executed': return 'success';
      case 'defeated': return 'error';
      default: return 'neutral';
    }
  };

  return (
    <Card variant="metallic" hoverEffect className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-lg text-white line-clamp-2 pr-4">{title}</h4>
        <Badge variant={getStatusVariant()}>{status}</Badge>
      </div>
      
      <div className="space-y-4 mt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">For</span>
            <span className="font-mono font-medium text-white">{forVotes.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-baddao-primary rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-baddao-highlight" 
              initial={{ width: 0 }}
              whileInView={{ width: `${forPercentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Against</span>
            <span className="font-mono font-medium text-white">{againstVotes.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-baddao-primary rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#FF3C00]" 
              initial={{ width: 0 }}
              whileInView={{ width: `${againstPercentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
      
      <div className="border-t border-baddao-border/50 mt-4 pt-3 flex items-center gap-2 text-xs text-gray-500">
        <Clock size={14} />
        <span>{timeRemaining}</span>
      </div>
    </Card>
  );
}
