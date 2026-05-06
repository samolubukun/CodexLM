import Link from "next/link";
import Image from "next/image";
import { Instagram, Twitter } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="footer bg-white border-t border-gray-100 py-16 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                <div className="flex flex-col items-center md:items-start gap-4">
                    <Link href="/" className="flex flex-col items-center md:items-start gap-4">
                        <Image src="/logo.png" alt="CodexLM Logo" width={96} height={96} className="w-24 h-24 object-contain" />
                        <span className="text-2xl font-black tracking-tighter text-slate-900">
                            Codex<span className="text-indigo-600">LM</span>
                        </span>
                    </Link>
                    <span className="text-gray-400 text-sm font-medium">
                        © {new Date().getFullYear()} CodexLM AI Research
                    </span>
                </div>

                <div className="flex gap-12 text-gray-400 font-medium">
                    <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</Link>
                    <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms</Link>
                </div>

                <div className="flex gap-6">
                    <Link
                        href="#"
                        className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all"
                    >
                        <Instagram className="w-6 h-6" />
                    </Link>
                    <Link
                        href="#"
                        className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all"
                    >
                        <Twitter className="w-6 h-6" />
                    </Link>
                </div>
            </div>
            <div className="max-w-4xl mx-auto text-center mt-12 pt-12 border-t border-gray-50">
                <p className="text-xs text-gray-300 font-medium uppercase tracking-[0.2em]">Next-Gen AI Research: Powered by CodexLM</p>
                <p className="text-[10px] text-gray-400 mt-4 font-medium">
                    Designed and developed by{" "}
                    <a href="https://samuelolubukun.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 transition-colors">
                        Samuel Olubukun
                    </a>
                </p>
            </div>
        </footer>
    );
}
