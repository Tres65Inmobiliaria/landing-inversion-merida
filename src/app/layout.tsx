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
    "Especialistas en propiedades de Mérida, Yucatán. Más de 9 años en el mercado inmobiliario.",
  openGraph: {
    title: "Diversifica tu patrimonio en Mérida",
    description: "Especialistas en propiedades de Mérida, Yucatán. Más de 9 años en el mercado inmobiliario.",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "https://tres65inmobiliaria.github.io/landing-inversion-merida/thumbnail-damara-traconis-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Damara Traconis, asesora de TRES65 Inmobiliaria en Mérida",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    description: "Especialistas en propiedades de Mérida, Yucatán. Más de 9 años en el mercado inmobiliario.",
    images: [
      "https://tres65inmobiliaria.github.io/landing-inversion-merida/thumbnail-damara-traconis-1200x630.png",
    ],
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
