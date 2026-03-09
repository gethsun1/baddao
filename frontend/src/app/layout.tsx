import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "Community Corner Factory",
  description: "Deploy your Decentralized Autonomous Organization on Soroban.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans text-gray-200 bg-communityCorner-primary antialiased`}>
        <Navigation />
        <main className="pt-24 pb-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
