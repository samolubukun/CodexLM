"use client"

import Link from "next/link";
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header({ isLanding = false }) {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        if (!isLanding) {
            setIsScrolled(true);
            return;
        }
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLanding]);

    const handleGetStarted = () => router.push('/dashboard');

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                ? "glass-panel py-2 shadow-lg shadow-[#C9A44A]/5"
                : "bg-white/5 backdrop-blur-[2px] py-4"
                }`}
        >
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
                <motion.div
                    initial={isLanding ? { opacity: 0, x: -20 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link href="/" className="flex items-center gap-2.5">
                        <Image src="/logo.png" alt="CodexLM Logo" width={40} height={40} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                        <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                            Codex<span className="text-indigo-600">LM</span>
                        </span>
                    </Link>
                </motion.div>
                <motion.div
                    className="flex items-center gap-4"
                    initial={isLanding ? { opacity: 0, x: 20 } : false}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Button
                        onClick={handleGetStarted}
                        className="px-6 py-2.5 text-white magnetic-button rounded-full shadow-xl shadow-indigo-500/10 border-none bg-indigo-600 hover:bg-indigo-700"
                    >
                        Get Started
                    </Button>
                </motion.div>
            </div>
        </header>
    );
}
