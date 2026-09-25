import type { Metadata, Viewport } from "next";
import { Fraunces, Raleway } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diversifica tu patrimonio en Mérida | TRES65 Inmobiliaria",
  description:
    "Conoce oportunidades inmobiliarias en Mérida seleccionadas de acuerdo con tus objetivos, horizonte de inversión y perfil. Asesoría personalizada de TRES65 Inmobiliaria.",
  openGraph: {
    title: "Diversifica tu patrimonio en Mérida",
    description:
      "Oportunidades inmobiliarias en Mérida seleccionadas según tus objetivos. TRES65 Inmobiliaria, más de 9 años en Mérida.",
    locale: "es_MX",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a4f5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX" data-scroll-behavior="smooth" className={`${fraunces.variable} ${raleway.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
