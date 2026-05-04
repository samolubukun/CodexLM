import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

export function AudioVisualizer({ src }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    // Generate static bar heights for a consistent look
    const bars = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        height: 25 + Math.abs(Math.sin(i * 0.8) * 45) + Math.random() * 5
    }));

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleMouseDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        
        const seek = (clientX) => {
            if (!audioRef.current || !duration) return;
            const x = clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            const newTime = percentage * duration;
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        };

        seek(e.clientX);

        const onMouseMove = (moveEvent) => {
            seek(moveEvent.clientX);
        };
        
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', () => setIsPlaying(false));
        
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', () => setIsPlaying(false));
        };
    }, []);

    const progress = duration ? (currentTime / duration) : 0;

    return (
        <div className="w-full flex flex-col items-center gap-6 py-2">
            <audio ref={audioRef} src={src} preload="metadata" />
            
            {/* Waveform Visualization */}
            <div 
                className="flex items-end gap-[3px] h-24 w-full justify-center px-4 overflow-hidden cursor-pointer group/wave select-none"
                onMouseDown={handleMouseDown}
            >
                {bars.map((bar, i) => {
                    const isActive = i / bars.length <= progress;
                    return (
                        <div 
                            key={bar.id}
                            className={`w-[4px] rounded-full transition-all duration-500 ease-out group-hover/wave:opacity-80 ${
                                isActive 
                                    ? 'bg-gradient-to-t from-purple-500 via-indigo-400 to-blue-300 shadow-[0_0_15px_rgba(129,140,248,0.6)]' 
                                    : 'bg-white/10'
                            }`}
                            style={{ 
                                height: `${bar.height}%`,
                                transform: isActive && isPlaying ? `scaleY(${1.05 + Math.random() * 0.15})` : 'scaleY(1)'
                            }}
                        />
                    );
                })}
            </div>

            {/* Play Button */}
            <button 
                onClick={togglePlay}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all active:scale-95 cursor-pointer group"
            >
                {isPlaying ? (
                    <Pause className="w-10 h-10 text-slate-900 fill-slate-900" />
                ) : (
                    <Play className="w-10 h-10 text-slate-900 fill-slate-900 ml-1" />
                )}
            </button>

            {/* Timestamps */}
            <div className="flex items-center gap-3 text-[12px] font-black text-white/40 tracking-[0.2em] tabular-nums bg-white/5 px-4 py-1.5 rounded-full">
                <span className={currentTime > 0 ? "text-white/80" : ""}>{formatTime(currentTime)}</span>
                <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
}
