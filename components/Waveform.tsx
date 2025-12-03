
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { BarsIcon } from './icons/BarsIcon';

interface WaveformProps {
    buffer: AudioBuffer | null;
    currentTime: number;
    isPlaying: boolean;
    onSeek: (time: number) => void;
    selection?: { start: number; end: number } | null;
    onSelectionChange?: (selection: { start: number; end: number } | null) => void;
    theme: 'light' | 'dark';
}

export const Waveform: React.FC<WaveformProps> = ({ buffer, currentTime, isPlaying, onSeek, selection, onSelectionChange, theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoverX, setHoverX] = useState<number | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<number | null>(null);

    // Resize Observer to handle responsive width
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Process audio data into smoothed peaks
    const peaks = useMemo(() => {
        if (!buffer || containerWidth === 0) return null;
        
        const channels = buffer.numberOfChannels;
        const data = buffer.getChannelData(0);
        const len = data.length;
        
        // Bar density configuration
        const barWidth = 4;
        const barGap = 2;
        const totalBarWidth = barWidth + barGap;
        const barCount = Math.floor(containerWidth / totalBarWidth);
        const samplesPerBar = Math.floor(len / barCount);
        
        const calculatedPeaks = [];
        
        for (let i = 0; i < barCount; i++) {
            const start = i * samplesPerBar;
            const end = Math.min(start + samplesPerBar, len);
            let sum = 0;
            
            // RMS calculation for smoother visual
            for (let j = start; j < end; j++) {
                sum += data[j] * data[j];
            }
            const rms = Math.sqrt(sum / (end - start));
            
            // Non-linear scaling to boost quiet parts
            const val = Math.pow(rms, 0.7); 
            calculatedPeaks.push(Math.min(1, val * 1.5)); // Slight gain boost
        }
        return calculatedPeaks;
    }, [buffer, containerWidth]);

    // Draw the waveform
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !containerRef.current) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.clearRect(0, 0, width, height);

        // Empty State drawing is handled by React DOM now to allow easier icon integration
        if (!peaks || !buffer) return;

        const barWidth = 4;
        const barGap = 2;
        const totalBarWidth = barWidth + barGap;
        const centerY = height / 2;
        
        // Colors
        const primaryColorStart = theme === 'dark' ? '#8B5CF6' : '#6366F1'; // Violet/Indigo
        const primaryColorEnd = theme === 'dark' ? '#C084FC' : '#818CF8';   // Light Purple/Indigo
        const inactiveColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
        const playedColor = theme === 'dark' ? '#FFFFFF' : '#4F46E5';

        // Gradient for active waveform
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, primaryColorStart);
        gradient.addColorStop(1, primaryColorEnd);

        const progressRatio = currentTime / buffer.duration;
        const progressX = progressRatio * width;

        peaks.forEach((peak, index) => {
            const x = index * totalBarWidth;
            if (x > width) return;

            // Amplitude Height
            const barHeight = Math.max(4, peak * height * 0.8);
            const y = centerY - barHeight / 2;
            const radius = barWidth / 2;

            ctx.beginPath();
            
            // Draw smooth rounded rect manually for better browser support
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            ctx.lineTo(x + barWidth, y + barHeight - radius);
            ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight);
            ctx.lineTo(x + radius, y + barHeight);
            ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();

            // Fill Logic: Past vs Future
            if (x < progressX) {
                // Already played
                ctx.fillStyle = gradient; 
                ctx.globalAlpha = 1.0;
            } else {
                // Not played yet
                ctx.fillStyle = inactiveColor;
                ctx.globalAlpha = 1.0;
            }
            ctx.fill();
        });

        // Draw Selection
        if (selection && selection.start !== selection.end) {
            const selStartX = (selection.start / buffer.duration) * width;
            const selEndX = (selection.end / buffer.duration) * width;
            
            // Selection Background
            ctx.fillStyle = theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(99, 102, 241, 0.1)';
            ctx.fillRect(selStartX, 0, selEndX - selStartX, height);
            
            // Selection Borders
            ctx.strokeStyle = theme === 'dark' ? 'rgba(167, 139, 250, 0.5)' : 'rgba(99, 102, 241, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(selStartX, 0); ctx.lineTo(selStartX, height);
            ctx.moveTo(selEndX, 0); ctx.lineTo(selEndX, height);
            ctx.stroke();
        }

        // Draw Playhead Cursor
        if (buffer) {
            ctx.beginPath();
            ctx.moveTo(progressX, 0);
            ctx.lineTo(progressX, height);
            ctx.strokeStyle = playedColor;
            ctx.lineWidth = 2;
            ctx.shadowColor = theme === 'dark' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(79, 70, 229, 0.3)';
            ctx.shadowBlur = 4;
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Playhead Knob
            ctx.beginPath();
            ctx.arc(progressX, height - 6, 3, 0, Math.PI * 2);
            ctx.fillStyle = playedColor;
            ctx.fill();
        }

        // Hover Effect
        if (hoverX !== null && !isDragging) {
            ctx.beginPath();
            ctx.moveTo(hoverX, 0);
            ctx.lineTo(hoverX, height);
            ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

    }, [peaks, buffer, currentTime, theme, hoverX, containerWidth, selection]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!buffer || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = Math.max(0, Math.min(buffer.duration, (x / rect.width) * buffer.duration));
        
        setIsDragging(true);
        setDragStart(time);
        
        // Initially clear selection on new click
        if (onSelectionChange) onSelectionChange(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        setHoverX(x);

        if (isDragging && dragStart !== null && buffer && onSelectionChange) {
            const currentTime = Math.max(0, Math.min(buffer.duration, (x / rect.width) * buffer.duration));
            const start = Math.min(dragStart, currentTime);
            const end = Math.max(dragStart, currentTime);
            onSelectionChange({ start, end });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!buffer || !containerRef.current || !isDragging || dragStart === null) {
            setIsDragging(false);
            setDragStart(null);
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const endTime = Math.max(0, Math.min(buffer.duration, (x / rect.width) * buffer.duration));

        // If drag distance is very small, treat as click/seek
        if (Math.abs(endTime - dragStart) < 0.05) {
            onSeek(endTime);
            if (onSelectionChange) onSelectionChange(null);
        }

        setIsDragging(false);
        setDragStart(null);
    };

    const handleMouseLeave = () => {
        setHoverX(null);
        if (isDragging) {
            setIsDragging(false);
            setDragStart(null);
        }
    };

    return (
        <div 
            ref={containerRef} 
            className="w-full h-40 relative group cursor-crosshair select-none bg-[#F3F4F6] dark:bg-[#18181B] rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-500/20 shadow-inner"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
             <canvas 
                ref={canvasRef}
                className={`w-full h-full block relative z-10 ${!buffer ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
            />
            {!buffer && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    <div className="text-slate-300 dark:text-slate-600 mb-3">
                        <BarsIcon className="w-12 h-12" />
                    </div>
                    <div className="w-full max-w-[60%] border-b border-dashed border-slate-300 dark:border-slate-700 absolute top-1/2"></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600 bg-[#F3F4F6] dark:bg-[#18181B] px-3 relative mt-1">Audio Visualizer</span>
                </div>
            )}
        </div>
    );
};
