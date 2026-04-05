/**
 * Root Layout — EcoTrack Web
 * Providers: React Query, Auth Context
 * Mobile-first. Font: Inter (Google Fonts via CSS).
 */

import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "EcoTrack — Gestão Inteligente de Resíduos",
    template: "%s | EcoTrack",
  },
  description:
    "Plataforma SaaS B2B para gestão de resíduos. Agende coletas, emita Manifestos MTR e acompanhe seu impacto ambiental.",
  keywords: [
    "gestão de resíduos",
    "manifesto MTR",
    "coleta de resíduos",
    "CONAMA",
    "sustentabilidade",
    "LGPD",
  ],
  authors: [{ name: "EcoTrack" }],
  robots: { index: false, follow: false }, // SaaS privado
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16A34A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
