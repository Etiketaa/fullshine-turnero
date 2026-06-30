import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fullshine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Fullshine Car Detailing - Tu auto, reinventado",
    template: "%s | Fullshine Car Detailing",
  },
  description:
    "Servicios premium de detailing automotriz en Bahía Blanca. Lavado, pulido, ceramic coating, descontaminación de pintura y más. Reservá tu turno online.",
  keywords: [
    "car detailing",
    "detailing automotriz",
    "lavado de autos",
    "pulido ceramic",
    "ceramic coating",
    "descontaminación de pintura",
    "lavado completo",
    "limpieza de interior",
    "Bahía Blanca",
    "Fullshine",
  ],
  authors: [{ name: "Fullshine Car Detailing" }],
  creator: "Fullshine Car Detailing",
  publisher: "Fullshine Car Detailing",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: baseUrl,
    siteName: "Fullshine Car Detailing",
    title: "Fullshine Car Detailing - Tu auto, reinventado",
    description:
      "Servicios premium de detailing automotriz. Lavado, pulido, ceramic coating y más. Reservá tu turno online.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fullshine Car Detailing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fullshine Car Detailing - Tu auto, reinventado",
    description:
      "Servicios premium de detailing automotriz. Lavado, pulido, ceramic coating y más.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${oswald.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#c81e1e" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
