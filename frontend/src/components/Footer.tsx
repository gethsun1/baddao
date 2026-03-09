import React from 'react';
import Link from 'next/link';
import { Shield, Github, Twitter, Disc } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-baddao-border bg-baddao-primary/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-baddao-accent" />
              <span className="font-display font-bold text-xl text-white">BAD DAO</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Infrastructure for decentralized, autonomous organizations on the Stellar Network.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Github size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Disc size={20} /></a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-baddao-highlight transition-colors">Create DAO</Link></li>
              <li><Link href="/daos" className="hover:text-baddao-highlight transition-colors">Explore</Link></li>
              <li><a href="#" className="hover:text-baddao-highlight transition-colors">Governance</a></li>
              <li><a href="#" className="hover:text-baddao-highlight transition-colors">Treasury</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Developers</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-baddao-highlight transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-baddao-highlight transition-colors">Smart Contracts</a></li>
              <li><a href="#" className="hover:text-baddao-highlight transition-colors">GitHub Repository</a></li>
              <li><a href="#" className="hover:text-baddao-highlight transition-colors">Audit Reports</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Network</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-baddao-highlight transition-colors">Stellar Soroban</a></li>
              <li><a href="#" className="hover:text-baddao-highlight transition-colors">Testnet Explorer</a></li>
              <li><a href="#" className="hover:text-baddao-highlight transition-colors">Network Status</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-baddao-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} BAD DAO. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
