import { Fraunces, Space_Grotesk } from 'next/font/google';
import './globals.css';

const uiFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-ui',
});

const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata = {
  title: 'Technolaza Studio',
  description: 'Unified media conversion workspace',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${uiFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
