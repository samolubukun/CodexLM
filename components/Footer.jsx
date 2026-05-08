import Image from "next/image";

export default function Footer() {
    return (
        <footer className="pt-16 md:pt-20 pb-8 md:pb-10 px-6 border-t border-slate-900 text-center bg-slate-950">
            <div className="flex flex-col justify-center items-center gap-4 mb-10">
                <Image src="/logo.png" alt="CodexLM Logo" width={80} height={80} className="w-20 h-20 object-contain opacity-80" />
                <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-300">CodexLM</span>
            </div>
            <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] px-4 leading-relaxed">© 2026 CodexLM. Empowering your knowledge journey.</p>
            <p className="text-[11px] text-slate-400 mt-6 font-medium">
                Designed and developed by{" "}
                <a href="https://samuelolubukun.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold">
                    Samuel Olubukun
                </a>
            </p>
        </footer>
    );
}
