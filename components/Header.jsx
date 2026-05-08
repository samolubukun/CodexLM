"use client"

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';

export default function Header() {
    const router = useRouter();
    const handleGetStarted = () => router.push('/dashboard');

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center border-b-4 border-black bg-white">
            <div className="flex items-center gap-2 md:gap-2.5">
                <Image src="/logo.png" alt="CodexLM Logo" width={32} height={32} className="w-7 h-7 md:w-9 md:h-9 object-contain" />
                <span className="text-lg md:text-xl font-black tracking-tighter text-slate-900">
                    Codex<span className="text-indigo-600">LM</span>
                </span>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
                <Button 
                    onClick={handleGetStarted}
                    size="sm"
                    className="neo-button rounded-none px-4 md:px-8 bg-indigo-500 text-white hover:bg-indigo-600 shadow-none text-xs md:text-sm h-10 md:h-12"
                >
                    Login
                </Button>
            </div>
        </nav>
    );
}
