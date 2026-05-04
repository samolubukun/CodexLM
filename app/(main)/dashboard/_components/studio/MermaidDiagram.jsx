import { useRef, useState, useEffect } from 'react'
import mermaid from 'mermaid'
import { Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"

export function MermaidDiagram({ chart }) {
    const ref = useRef(null);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);
    const [isRendering, setIsRendering] = useState(true);

    useEffect(() => {
        if (chart) {
            setIsRendering(true);
            const renderDiagram = async () => {
                try {
                    mermaid.initialize({ 
                        startOnLoad: false, 
                        theme: 'base',
                        themeVariables: {
                            primaryColor: '#4f46e5',
                            primaryTextColor: '#ffffff',
                            primaryBorderColor: '#4338ca',
                            lineColor: '#312e81', // Much darker indigo for lines
                            secondaryColor: '#f5f3ff',
                            tertiaryColor: '#ffffff',
                            edgeLabelBackground: '#ffffff', // Force white background for labels
                            nodeBorder: '#4f46e5',
                            clusterBkg: '#f8fafc',
                            clusterBorder: '#cbd5e1',
                            fontSize: '13px',
                            fontWeight: '700',
                            fontFamily: 'Inter, system-ui, sans-serif'
                        },
                        flowchart: {
                            htmlLabels: true,
                            curve: 'basis',
                            edgeAmount: 2 // Make lines slightly bolder
                        },
                        securityLevel: 'loose'
                    });
                    
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, chart);
                    setSvg(svg);
                    setError(null);
                } catch (err) {
                    console.error("Mermaid render error:", err);
                    setError(err.message || "Failed to render diagram. Please try generating again.");
                } finally {
                    setIsRendering(false);
                }
            };
            
            // Defer execution by 300ms to allow the UI/modal to animate in smoothly without dropping frames
            const timer = setTimeout(() => {
                renderDiagram();
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [chart]);

    if (error) {
        return (
            <div className="p-8 bg-red-50 dark:bg-red-950/20 rounded-[2rem] border border-red-100 dark:border-red-900/50 text-center">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
        );
    }

    if (isRendering) {
        return (
            <div className="flex flex-col justify-center items-center p-0 bg-white dark:bg-slate-50 rounded-[2.5rem] border border-border shadow-sm h-[500px] w-full relative group">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Rendering Visualization...</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center p-0 bg-white dark:bg-slate-50 rounded-[2.5rem] border border-border shadow-sm overflow-hidden h-[500px] w-full relative group touch-none">
            <style dangerouslySetInnerHTML={{ __html: `
                .mermaid-svg-container .edgePath path {
                    stroke-width: 2.5px !important;
                    stroke: #312e81 !important;
                }
                .mermaid-svg-container .edgeLabel {
                    color: #1e293b !important;
                    font-weight: 800 !important;
                    padding: 4px !important;
                    background-color: white !important;
                    border-radius: 4px !important;
                }
                .mermaid-svg-container .node rect, 
                .mermaid-svg-container .node polygon, 
                .mermaid-svg-container .node circle,
                .mermaid-svg-container .node path {
                    stroke-width: 2px !important;
                }
                .mermaid-svg-container .node .label {
                    padding: 12px 20px !important;
                    display: block !important;
                }
                .mermaid-svg-container foreignObject {
                    overflow: visible !important;
                }
                .mermaid-svg-container .cluster rect {
                    stroke-width: 1px !important;
                    stroke: #e2e8f0 !important;
                    fill: #f8fafc !important;
                }
                .mermaid-svg-container .cluster .label {
                    transform: translateY(-20px) !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.15em !important;
                    font-size: 11px !important;
                    color: #475569 !important;
                }
            `}} />
            
            <TransformWrapper
                initialScale={1.35}
                minScale={0.1}
                maxScale={4}
                centerOnInit={true}
                limitToBounds={false}
                wheel={{ step: 0.1, activationKeys: ["Control"] }}
                pinch={{ disabled: false }}
                doubleClick={{ disabled: true }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-full backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                onClick={() => zoomOut()}
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                onClick={() => resetTransform()}
                                title="Reset View"
                            >
                                <Maximize className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                onClick={() => zoomIn()}
                                title="Zoom In"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                        </div>
                        <TransformComponent wrapperClass="!w-full !h-full flex items-center justify-center cursor-grab active:cursor-grabbing" contentClass="w-full h-full flex items-center justify-center">
                            <div 
                                className="w-full h-full flex justify-center items-center mermaid-svg-container p-10 pointer-events-none"
                                dangerouslySetInnerHTML={{ __html: svg }}
                            />
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}
