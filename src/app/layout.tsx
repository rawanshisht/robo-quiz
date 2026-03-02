import type { Metadata } from "next";
import { Bebas_Neue, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * DISPLAY / TITLE — AIR FORCE substitute
 * Replace with next/font/local pointing to air-force.woff2 when available:
 *   import localFont from "next/font/local";
 *   const display = localFont({ src: "../../public/fonts/air-force.woff2", variable: "--font-bebas" });
 */
const display = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/**
 * UI / BODY — Myriad Pro substitute (Source Sans 3, same typographer)
 * Replace with next/font/local pointing to myriad-pro-*.woff2 when available.
 * CSS variable kept as --font-syne for component compatibility.
 */
const ui = Source_Sans_3({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

/**
 * CODE / MONO — JetBrains Mono (exact font specified in design guide)
 * CSS variable kept as --font-fira for component compatibility.
 */
const mono = JetBrains_Mono({
  variable: "--font-fira",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RoboQuiz",
  description: "Live quiz platform for learning centers",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${ui.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
