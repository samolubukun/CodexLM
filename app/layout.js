import { Geist, Geist_Mono } from "next/font/google";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import "./globals.css";
import Provider from "./provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CodexLM | The Agentic AI Research Platform",
  description: "Upload sources, chat with deep context, and generate professional assets using Gemini 3.1 and RAG.",
  icons: {
    icon: "/logowhite.png",
    shortcut: "/logowhite.png",
    apple: "/logowhite.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      ><StackProvider app={stackServerApp}><StackTheme>
        <Provider>
          {children}
          <Toaster />
        </Provider>
      </StackTheme></StackProvider></body>
    </html>
  );
}
