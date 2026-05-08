import Image from "next/image";

export default function Footer() {
    return (
        <footer className="pt-20 md:pt-32 pb-12 md:pb-16 px-6 border-t-8 border-black text-center bg-white">
            <div className="flex flex-col justify-center items-center gap-6 mb-12">
                <div className="p-4 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-4">
                    <Image src="/logo.png" alt="CodexLM Logo" width={80} height={80} className="w-20 h-20 object-contain" />
                </div>
                <span className="text-3xl md:text-4xl font-black tracking-tighter text-black uppercase">CodexLM</span>
            </div>
            <div className="space-y-6">
                <p className="text-black text-[10px] md:text-sm font-black uppercase tracking-[0.2em] px-4 leading-relaxed max-w-md mx-auto">© 2026 CodexLM. Empowering your knowledge journey.</p>
                <p className="text-xs md:text-sm text-black font-black uppercase tracking-widest">
                    Designed and developed by{" "}
                    <a href="https://samuelolubukun.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline decoration-4 underline-offset-4">
                        Samuel Olubukun
                    </a>
                </p>
            </div>
        </footer>
    );
}
