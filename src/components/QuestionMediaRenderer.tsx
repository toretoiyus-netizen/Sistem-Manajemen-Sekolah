import React, { useState } from 'react';
import {
  Video,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  ExternalLink,
  Play,
  X,
  Maximize2,
} from 'lucide-react';
import { MediaHotspot } from '../types';

interface QuestionMediaRendererProps {
  mediaTipe?: 'none' | 'gambar' | 'gambar_interaktif' | 'video';
  mediaUrl?: string;
  mediaCaption?: string;
  mediaHotspots?: MediaHotspot[];
  isEditable?: boolean;
  onAddHotspot?: (hotspot: MediaHotspot) => void;
  onDeleteHotspot?: (id: string) => void;
}

export const QuestionMediaRenderer: React.FC<QuestionMediaRendererProps> = ({
  mediaTipe,
  mediaUrl,
  mediaCaption,
  mediaHotspots = [],
  isEditable = false,
  onAddHotspot,
  onDeleteHotspot,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedHotspot, setSelectedHotspot] = useState<MediaHotspot | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // If no media or invalid type, don't render
  if (!mediaTipe || mediaTipe === 'none' || !mediaUrl) {
    return null;
  }

  // Parse YouTube or Video Embed URL
  const getEmbedUrl = (url: string): { isEmbed: boolean; src: string } => {
    try {
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get('v');
        if (v) return { isEmbed: true, src: `https://www.youtube.com/embed/${v}?rel=0` };
      }
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        if (id) return { isEmbed: true, src: `https://www.youtube.com/embed/${id}?rel=0` };
      }
      if (url.includes('youtube.com/embed/')) {
        return { isEmbed: true, src: url };
      }
      if (url.includes('drive.google.com/file/d/')) {
        const id = url.split('/d/')[1]?.split('/')[0];
        if (id) return { isEmbed: true, src: `https://drive.google.com/file/d/${id}/preview` };
      }
      return { isEmbed: false, src: url };
    } catch {
      return { isEmbed: false, src: url };
    }
  };

  const videoData = mediaTipe === 'video' ? getEmbedUrl(mediaUrl) : null;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditable || !onAddHotspot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const label = prompt('Nama/Label Titik Hotspot:', `Bagian ${mediaHotspots.length + 1}`);
    if (!label) return;
    const keterangan = prompt('Penjelasan/Keterangan saat diklik siswa:') || '';

    onAddHotspot({
      id: `hs-${Date.now()}`,
      x,
      y,
      label,
      keterangan,
    });
  };

  return (
    <div className="my-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Header Tag */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          {mediaTipe === 'video' && (
            <>
              <Video className="w-4 h-4 text-rose-500" />
              <span className="text-rose-900 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[11px]">
                Lampiran Video Pembelajaran
              </span>
            </>
          )}
          {mediaTipe === 'gambar_interaktif' && (
            <>
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                Lampiran Gambar Interaktif (Bisa Diklik & Dianotasi)
              </span>
            </>
          )}
          {mediaTipe === 'gambar' && (
            <>
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[11px]">
                Lampiran Gambar / Diagram Soal
              </span>
            </>
          )}
        </div>

        {/* Zoom Controls for Images */}
        {(mediaTipe === 'gambar' || mediaTipe === 'gambar_interaktif') && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5))}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded text-xs transition-colors"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded text-xs transition-colors"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded text-xs transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded text-xs transition-colors ml-1"
              title="Layar Penuh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Media Content Display */}
      {mediaTipe === 'video' && videoData && (
        <div className="overflow-hidden rounded-xl bg-slate-900 border border-slate-300 shadow-inner">
          {videoData.isEmbed ? (
            <div className="aspect-video w-full max-w-2xl mx-auto">
              <iframe
                src={videoData.src}
                title="Video Soal Ujian"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video w-full max-w-2xl mx-auto flex items-center justify-center bg-black">
              <video
                src={videoData.src}
                controls
                className="max-h-full max-w-full rounded"
              >
                Browser Anda tidak mendukung tag video.
              </video>
            </div>
          )}
        </div>
      )}

      {/* Interactive & Standard Image Display */}
      {(mediaTipe === 'gambar' || mediaTipe === 'gambar_interaktif') && (
        <div className="relative overflow-hidden rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center max-h-[380px]">
          <div
            onClick={handleImageClick}
            className={`relative inline-block transition-transform duration-150 origin-center ${
              isEditable ? 'cursor-crosshair' : ''
            }`}
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={mediaUrl}
              alt={mediaCaption || 'Media Soal'}
              className="max-h-[340px] w-auto object-contain select-none"
              crossOrigin="anonymous"
            />

            {/* Hotspots for Interactive Images */}
            {mediaTipe === 'gambar_interaktif' &&
              mediaHotspots.map((hs, index) => (
                <div
                  key={hs.id}
                  style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedHotspot(selectedHotspot?.id === hs.id ? null : hs);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-6 h-6 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-125 transition-transform">
                      {index + 1}
                    </div>
                  </div>

                  {/* Hotspot Label Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-6 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap opacity-90 pointer-events-none">
                    {hs.label}
                  </div>
                </div>
              ))}
          </div>

          {/* Floating Selected Hotspot Popup Card */}
          {selectedHotspot && (
            <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs bg-slate-900/95 text-white p-3 rounded-xl border border-emerald-500/50 shadow-2xl backdrop-blur-xs z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 text-xs">
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <Info className="w-3.5 h-3.5" />
                  <span>{selectedHotspot.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHotspot(null)}
                  className="text-slate-400 hover:text-white p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-slate-200 text-[11px] leading-relaxed">
                {selectedHotspot.keterangan || 'Tidak ada keterangan khusus.'}
              </p>
              {isEditable && onDeleteHotspot && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteHotspot(selectedHotspot.id);
                    setSelectedHotspot(null);
                  }}
                  className="mt-2 text-rose-300 hover:text-rose-200 text-[10px] underline font-semibold"
                >
                  Hapus Titik Anotasi Ini
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Caption & Instruction Bar */}
      {mediaCaption && (
        <p className="text-[11px] text-slate-600 italic mt-2 text-center">
          {mediaCaption}
        </p>
      )}

      {mediaTipe === 'gambar_interaktif' && !isEditable && (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded-lg border border-emerald-200 font-medium">
          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Petunjuk: Klik angka titik berkedip (hotspot) pada gambar untuk membaca keterangan bagian.</span>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={mediaUrl}
              alt={mediaCaption || 'Preview Gambar'}
              className="max-h-[80vh] w-auto object-contain rounded-xl shadow-2xl"
            />
            {mediaCaption && (
              <p className="text-white text-xs mt-3 bg-black/60 px-4 py-1.5 rounded-full">
                {mediaCaption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
