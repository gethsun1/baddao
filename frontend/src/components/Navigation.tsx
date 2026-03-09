import React from 'react';
import Link from 'next/link';
import { WalletConnect } from './WalletConnect';
import Image from 'next/image';
import baddologo from '../app/baddologo.jpg';

export default function Navigation() {
  return (
    <nav className="fixed top-0 w-full glass z-50 border-b border-baddao-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <Image 
                src={baddologo} 
                alt="BAD DAO" 
                className="w-8 h-8 rounded-full border-2 border-red-500 m-1 object-cover"
                unoptimized
              />
              <span className="font-display font-bold text-2xl tracking-tight text-white group-hover:text-gray-200 transition-colors">
                BAD DAO
              </span>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link href="/daos" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Explore DAOs</Link>
              <Link href="/#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">How it Works</Link>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Documentation</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">GitHub</a>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="hidden md:flex px-4 py-2 text-sm font-semibold text-baddao-primary bg-white rounded-full hover:bg-gray-100 transition-colors"
            >
              Create DAO
            </Link>
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
}
