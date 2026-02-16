import { Inter, Space_Grotesk } from "next/font/google";

import TopNav from "./components/TopNav";
import "./globals.css";

const uiFont = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata = {
  title: "Technolaza Studio",
  description:
    "Unified media conversion workspace — convert images, PDFs, audio, and video in seconds.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${uiFont.variable} ${displayFont.variable}`}>
      <body>
        <TopNav />
        <div className="app-root">{children}</div>
      </body>
    </html>
  );
}
