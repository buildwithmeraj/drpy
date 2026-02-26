import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ThemeProvider from "@/providers/ThemeProvider";
import AuthProvider from "@/providers/AuthProvider";
import { Toaster } from "react-hot-toast";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "DRPY",
  description: `${process.env.NEXT_PUBLIC_SITE_NAME || "DRPY"} - temporary file sharing with privacy-first controls.`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen overflow-x-hidden`}
      >
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main className="container mx-auto mt-18 px-4 mb-6 lg:mb-4 flex-1">
              {children}
            </main>
            <Toaster position="top-center" reverseOrder={false} />
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
