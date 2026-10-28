import React, { useRef, useState, useEffect } from 'react';
import { Edit3, Eraser, RotateCcw, Trash2, X, Minimize2, Maximize2 } from 'lucide-react';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#2563eb'); // default blue
  const [lineWidth, setLineWidth] = useState(3);
  const [isMinimized, setIsMinimized] = useState(false);
  const historyRef = useRef<ImageData[]>([]);

  useEffect(() => {
    if (!isOpen || isMinimized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set high resolution for crisp drawing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Save initial blank state
      historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    }
  }, [isOpen, isMinimized]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = lineWidth;
    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 18;
    } else {
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Save history for undo (keep max 15 steps)
      const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current.push(state);
      if (historyRef.current.length > 15) {
        historyRef.current.shift();
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    historyRef.current.pop(); // Remove current
    const previous = historyRef.current[historyRef.current.length - 1];
    if (previous) {
      ctx.putImageData(previous, 0, 0);
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-xl hover:bg-indigo-700 transition cursor-pointer font-medium"
      >
        <Edit3 className="w-5 h-5" />
        <span>展開草稿計算紙</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 sm:w-[480px] h-[360px] bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Scratchpad Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Edit3 className="w-4 h-4 text-yellow-300" />
          <span>數學直式與圖形計算紙 (草稿板)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded text-white transition cursor-pointer"
            title="縮小"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded text-white transition cursor-pointer"
            title="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTool('pen')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 font-medium transition cursor-pointer ${
              tool === 'pen' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            鉛筆
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 font-medium transition cursor-pointer ${
              tool === 'eraser' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            橡皮擦
          </button>

          {/* Color picks */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
              {['#2563eb', '#dc2626', '#16a34a', '#1e293b'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-4 h-4 rounded-full border transition cursor-pointer ${
                    color === c ? 'scale-125 ring-2 ring-indigo-400' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition cursor-pointer"
            title="復原上一步"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            className="px-2 py-0.5 text-rose-600 hover:bg-rose-50 rounded flex items-center gap-1 font-medium transition cursor-pointer"
            title="全部清空"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="flex-1 relative bg-white bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />
        <div className="absolute bottom-1 right-2 pointer-events-none text-[10px] text-slate-400 select-none">
          可直接手寫計算、畫線或列式
        </div>
      </div>
    </div>
  );
};
