import { Kanit } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { rubik } from "@/font";
import Header from "./_component/Header";
import Footer from "./_component/Footer";
import { ReduxProvider } from "@/ReduxProvider";

const kanit = Kanit({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-kanit',
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const NDLogos = localFont({
  src: "./fonts/ND_Logos.ttf",
  variable: "--font-nd-logos",
  weight: "100 900",
});


const BankGothic = localFont({
  src: "./fonts/BankGothic.ttf",
  variable: "--font-bank-gothic",
  weight: "100 900",
});

export const metadata = {
  title: "Kaal Tools",
  description: "Products",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} ${kanit.variable} ${NDLogos.variable} ${BankGothic.variable} bg-white text-[#060809] antialiased`}
      >
        <Header />
        <ReduxProvider>{children}</ReduxProvider>
        <Footer />
      </body>
    </html>
  );
}