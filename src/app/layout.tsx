import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Poppins } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Movie Explorer App',
  description: 'Movie Explorer web application made by AryaFMDev',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body
        className={`${poppins.className} antialiased min-h-screen flex flex-col bg-black`}
      >
        <Header /> {/* always display*/}
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
