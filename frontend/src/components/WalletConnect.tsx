'use client';

import React, { useState, useEffect } from 'react';
import * as freighter from '@stellar/freighter-api';
import { Wallet } from 'lucide-react';

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const allowed = await freighter.isAllowed();
    if (allowed.isAllowed) {
      const result = await freighter.getAddress();
      if (result.address && !result.error) setAddress(result.address);
    }
  };

  const connect = async () => {
    const allowed = await freighter.setAllowed();
    if (allowed.isAllowed) {
      await checkConnection();
    }
  };

  return (
    <button
      onClick={connect}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full font-medium hover:from-cyan-400 hover:to-blue-400 transition-all font-mono text-sm"
    >
      <Wallet size={16} />
      {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : 'Connect Wallet'}
    </button>
  );
}
