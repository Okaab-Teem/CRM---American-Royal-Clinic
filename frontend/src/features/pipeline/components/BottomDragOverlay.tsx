import { useState } from "react";
import { Award, XCircle } from "lucide-react";

interface BottomDragOverlayProps {
  isVisible: boolean;
  onDropWon: () => void;
  onDropLost: () => void;
}

export function BottomDragOverlay({
  isVisible,
  onDropWon,
  onDropLost,
}: BottomDragOverlayProps) {
  const [isWonHovered, setIsWonHovered] = useState(false);
  const [isLostHovered, setIsLostHovered] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 mx-auto max-w-xl z-50 flex gap-4 p-3 bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-700 text-white animate-in slide-in-from-bottom duration-200">
      {/* Left Target: Mark as Closed Won */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!isWonHovered) setIsWonHovered(true);
        }}
        onDragLeave={() => setIsWonHovered(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsWonHovered(false);
          onDropWon();
        }}
        className={`flex-1 flex items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-4 transition-all duration-150 cursor-pointer ${
          isWonHovered
            ? "border-emerald-500 bg-emerald-600/30 text-emerald-300 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            : "border-emerald-500/50 bg-emerald-950/30 text-emerald-400 hover:border-emerald-500"
        }`}
      >
        <Award className="h-6 w-6 stroke-[2.2] text-emerald-400" />
        <div className="text-left">
          <div className="text-xs font-bold uppercase tracking-wider">
            Mark as Closed Won
          </div>
          <div className="text-[10px] text-emerald-300/80">
            Drop here to log deal won
          </div>
        </div>
      </div>

      {/* Right Target: Mark as Closed Lost */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!isLostHovered) setIsLostHovered(true);
        }}
        onDragLeave={() => setIsLostHovered(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsLostHovered(false);
          onDropLost();
        }}
        className={`flex-1 flex items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-4 transition-all duration-150 cursor-pointer ${
          isLostHovered
            ? "border-rose-500 bg-rose-600/30 text-rose-300 scale-[1.02] shadow-[0_0_20px_rgba(244,63,94,0.3)]"
            : "border-rose-500/50 bg-rose-950/30 text-rose-400 hover:border-rose-500"
        }`}
      >
        <XCircle className="h-6 w-6 stroke-[2.2] text-rose-400" />
        <div className="text-left">
          <div className="text-xs font-bold uppercase tracking-wider">
            Mark as Closed Lost
          </div>
          <div className="text-[10px] text-rose-300/80">
            Drop here to archive as lost
          </div>
        </div>
      </div>
    </div>
  );
}
