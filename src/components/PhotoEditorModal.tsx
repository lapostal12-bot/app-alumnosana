import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  RotateCw, 
  FlipHorizontal, 
  Sparkles, 
  Download, 
  Check, 
  Sliders, 
  Stamp, 
  Layers, 
  Eye, 
  Maximize2,
  Undo
} from 'lucide-react';
import { BakeryPhoto } from '../types/bakery';
import { 
  BAKERY_PRESETS, 
  BakeryPresetFilter, 
  FilterAdjustment, 
  applyFiltersToCanvas 
} from '../utils/photoFilters';

interface PhotoEditorModalProps {
  photo: BakeryPhoto;
  recipeTitle?: string;
  groupName?: string;
  onClose: () => void;
  onSave: (updatedPhoto: BakeryPhoto) => void;
}

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
  photo,
  recipeTitle = 'Elaboración de Taller',
  groupName = '1º Panadería',
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'adjust' | 'tools'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<string>(photo.appliedFilter || 'original');
  const [adjustments, setAdjustments] = useState<FilterAdjustment>(
    photo.filterParams || {
      brightness: 0,
      contrast: 0,
      warmth: 0,
      saturation: 0,
      clarity: 0,
      vignette: 0,
    }
  );
  
  const [rotation, setRotation] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [includeStamp, setIncludeStamp] = useState<boolean>(true);
  const [stampText, setStampText] = useState<string>(
    `🥖 1º OBRADOR • ${groupName} • ${photo.metadataBadge?.doughTemp ? `Tª ${photo.metadataBadge.doughTemp}°C` : new Date().toLocaleDateString('es-ES')}`
  );
  const [aspectRatio, setAspectRatio] = useState<'original' | '1:1' | '4:3' | '16:9'>('original');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Cargar imagen base
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.originalUrl || photo.url;
    img.onload = () => {
      originalImageRef.current = img;
      renderImage();
    };
  }, [photo]);

  // Re-renderizar cuando cambian parámetros
  useEffect(() => {
    if (originalImageRef.current) {
      renderImage();
    }
  }, [adjustments, rotation, isFlipped, includeStamp, stampText, aspectRatio, showOriginal]);

  const selectPreset = (preset: BakeryPresetFilter) => {
    setSelectedPreset(preset.id);
    setAdjustments({ ...preset.adjustments });
  };

  const handleSliderChange = (key: keyof FilterAdjustment, value: number) => {
    setSelectedPreset('custom');
    setAdjustments(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetAll = () => {
    setSelectedPreset('original');
    setAdjustments({ brightness: 0, contrast: 0, warmth: 0, saturation: 0, clarity: 0, vignette: 0 });
    setRotation(0);
    setIsFlipped(false);
  };

  const renderImage = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    setIsRendering(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calcular dimensiones según aspecto y rotación
    let srcW = img.naturalWidth || img.width;
    let srcH = img.naturalHeight || img.height;

    // Limitar resolución máxima para rendimiento fluido
    const maxDim = 1200;
    if (srcW > maxDim || srcH > maxDim) {
      if (srcW > srcH) {
        srcH = Math.round((srcH * maxDim) / srcW);
        srcW = maxDim;
      } else {
        srcW = Math.round((srcW * maxDim) / srcH);
        srcH = maxDim;
      }
    }

    // Dimensiones de corte por aspect ratio si aplica
    let cropW = srcW;
    let cropH = srcH;
    let cropX = 0;
    let cropY = 0;

    if (aspectRatio === '1:1') {
      const minDim = Math.min(srcW, srcH);
      cropW = minDim;
      cropH = minDim;
      cropX = (srcW - minDim) / 2;
      cropY = (srcH - minDim) / 2;
    } else if (aspectRatio === '4:3') {
      const targetRatio = 4 / 3;
      if (srcW / srcH > targetRatio) {
        cropW = Math.round(srcH * targetRatio);
        cropH = srcH;
        cropX = (srcW - cropW) / 2;
      } else {
        cropW = srcW;
        cropH = Math.round(srcW / targetRatio);
        cropY = (srcH - cropH) / 2;
      }
    } else if (aspectRatio === '16:9') {
      const targetRatio = 16 / 9;
      if (srcW / srcH > targetRatio) {
        cropW = Math.round(srcH * targetRatio);
        cropH = srcH;
        cropX = (srcW - cropW) / 2;
      } else {
        cropW = srcW;
        cropH = Math.round(srcW / targetRatio);
        cropY = (srcH - cropH) / 2;
      }
    }

    const isRotated90 = (rotation / 90) % 2 !== 0;
    canvas.width = isRotated90 ? cropH : cropW;
    canvas.height = isRotated90 ? cropW : cropH;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Transformaciones geométricas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    if (isFlipped) {
      ctx.scale(-1, 1);
    }

    // Dibujar imagen recortada
    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropW,
      cropH,
      -cropW / 2,
      -cropH / 2,
      cropW,
      cropH
    );
    ctx.restore();

    // Si el usuario mantiene presionado "Ver Original", no aplicamos filtros
    if (!showOriginal) {
      applyFiltersToCanvas(
        ctx,
        canvas.width,
        canvas.height,
        adjustments,
        includeStamp ? stampText : undefined
      );
    }

    setIsRendering(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const updated: BakeryPhoto = {
      ...photo,
      url: dataUrl,
      originalUrl: photo.originalUrl || photo.url,
      appliedFilter: selectedPreset !== 'original' ? selectedPreset : undefined,
      filterParams: adjustments,
      date: new Date().toISOString().split('T')[0],
      metadataBadge: {
        recipeTitle: recipeTitle,
        studentOrGroup: groupName,
        doughTemp: photo.metadataBadge?.doughTemp || 24.0,
      },
    };

    onSave(updated);
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `panaderia_${recipeTitle.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 flex items-center justify-center font-bold text-xl shadow-md">
              🎨
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2 font-display">
                Laboratorio Fotográfico de Pan & Bollería
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  🥖 1º Taller
                </span>
              </h2>
              <p className="text-xs text-stone-300">
                Filtros específicos para dorado de corteza, hojaldre y nitidez de alveolos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadImage}
              title="Descargar fotografía a tu móvil o equipo"
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Descargar Foto</span>
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Guardar en Receta
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Canvas Area & Controls */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Canvas Display Viewport (7 or 8 cols) */}
          <div className="lg:col-span-8 bg-stone-950/90 flex flex-col items-center justify-center p-4 sm:p-6 relative select-none overflow-hidden min-h-[320px]">
            
            {/* Canvas wrapper */}
            <div className="relative max-w-full max-h-[58vh] flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-stone-800/80 bg-stone-900/50">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[56vh] object-contain block transition-transform duration-100"
              />
              {isRendering && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs text-amber-200">
                  Procesando píxeles...
                </div>
              )}
            </div>

            {/* Bottom floating helper: Hold for Original */}
            <div className="mt-4 flex items-center gap-3 z-10">
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all ${
                  showOriginal 
                    ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-lg shadow-amber-500/30' 
                    : 'bg-stone-900/90 text-stone-300 border-stone-700 hover:bg-stone-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Mantén presionado para ver Foto Original
              </button>

              <button
                onClick={resetAll}
                className="px-3 py-1.5 rounded-full bg-stone-900/90 text-stone-400 hover:text-stone-200 border border-stone-700 hover:bg-stone-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Undo className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            </div>
          </div>

          {/* Controls Sidebar (4 or 5 cols) */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-stone-800 bg-stone-900/95 flex flex-col h-full max-h-[550px] lg:max-h-none overflow-y-auto">
            
            {/* Tabs */}
            <div className="flex border-b border-stone-800 bg-stone-950/40 p-1">
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'presets'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Filtros Obrador
              </button>

              <button
                onClick={() => setActiveTab('adjust')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'adjust'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Ajustes Manuales
              </button>

              <button
                onClick={() => setActiveTab('tools')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'tools'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Herramientas
              </button>
            </div>

            {/* Tab 1: Presets */}
            {activeTab === 'presets' && (
              <div className="p-4 space-y-2.5">
                <div className="text-xs text-stone-400 font-medium pb-1">
                  Filtros optimizados para fotografía gastronómica de pan y bollería:
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {BAKERY_PRESETS.map(preset => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => selectPreset(preset)}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
                            : 'bg-stone-800/40 border-stone-800 hover:bg-stone-800/80 hover:border-stone-700'
                        }`}
                      >
                        <span className="text-2xl p-1.5 bg-stone-900 rounded-lg border border-stone-700/60">
                          {preset.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-stone-100">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="text-amber-400 text-xs font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Activo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5 leading-snug">
                            {preset.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Manual Adjustments */}
            {activeTab === 'adjust' && (
              <div className="p-4 space-y-4">
                <div className="text-xs text-stone-400 font-medium">
                  Graduación precisa de parámetros de iluminación y textura:
                </div>

                {/* Calidez de Horno */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-medium flex items-center gap-1">
                      🔥 Calidez de Horno (Dorado)
                    </span>
                    <span className="text-amber-400 font-mono">{adjustments.warmth}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="60"
                    value={adjustments.warmth}
                    onChange={e => handleSliderChange('warmth', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>Frío / Neutro</span>
                    <span>Tostado Intenso</span>
                  </div>
                </div>

                {/* Nitidez & Alveolado */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-medium flex items-center gap-1">
                      🥖 Nitidez / Definición de Miga
                    </span>
                    <span className="text-amber-400 font-mono">{adjustments.clarity}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={adjustments.clarity}
                    onChange={e => handleSliderChange('clarity', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>Suave</span>
                    <span>Definición Extrema</span>
                  </div>
                </div>

                {/* Brillo */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-medium">☀️ Brillo</span>
                    <span className="text-amber-400 font-mono">{adjustments.brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={adjustments.brightness}
                    onChange={e => handleSliderChange('brightness', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Contraste */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-medium">🌓 Contraste</span>
                    <span className="text-amber-400 font-mono">{adjustments.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="60"
                    value={adjustments.contrast}
                    onChange={e => handleSliderChange('contrast', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Saturación */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-medium">🎨 Saturación</span>
                    <span className="text-amber-400 font-mono">{adjustments.saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="60"
                    value={adjustments.saturation}
                    onChange={e => handleSliderChange('saturation', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Viñeteado */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-medium">🌑 Viñeta Rústica de Bordes</span>
                    <span className="text-amber-400 font-mono">{adjustments.vignette}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={adjustments.vignette}
                    onChange={e => handleSliderChange('vignette', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Tools & Stamp */}
            {activeTab === 'tools' && (
              <div className="p-4 space-y-4">
                {/* Geometría */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-stone-300 block">
                    Orientación y Giro
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRotation(r => (r + 90) % 360)}
                      className="flex-1 py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Girar 90° ({rotation}°)
                    </button>
                    <button
                      onClick={() => setIsFlipped(f => !f)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        isFlipped 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                      }`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      Espejo
                    </button>
                  </div>
                </div>

                {/* Proporción / Aspect Ratio */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-stone-300 block">
                    Proporción de Encuadre
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'original', label: 'Libre' },
                      { id: '1:1', label: '1:1 (Cuadrado)' },
                      { id: '4:3', label: '4:3 (Taller)' },
                      { id: '16:9', label: '16:9' },
                    ].map(aspect => (
                      <button
                        key={aspect.id}
                        onClick={() => setAspectRatio(aspect.id as any)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
                          aspectRatio === aspect.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                            : 'bg-stone-800/60 text-stone-400 border-stone-800 hover:bg-stone-800'
                        }`}
                      >
                        {aspect.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sello Técnico Académico */}
                <div className="pt-2 border-t border-stone-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5 cursor-pointer">
                      <Stamp className="w-3.5 h-3.5 text-amber-400" />
                      Sello Técnico de Obrador
                    </label>
                    <input
                      type="checkbox"
                      checked={includeStamp}
                      onChange={e => setIncludeStamp(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                  
                  {includeStamp && (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={stampText}
                        onChange={e => setStampText(e.target.value)}
                        placeholder="Texto del sello..."
                        className="w-full px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                      />
                      <p className="text-[10px] text-stone-400">
                        Se estampará discretamente en la esquina inferior con tipografía técnica para tu bitácora de evaluación.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Footer Summary in sidebar */}
            <div className="mt-auto p-4 border-t border-stone-800 bg-stone-950/60 text-xs text-stone-400">
              <div className="flex justify-between items-center mb-1">
                <span>Filtro activo:</span>
                <span className="text-amber-400 font-medium">
                  {selectedPreset === 'custom' ? 'Personalizado' : BAKERY_PRESETS.find(p => p.id === selectedPreset)?.name}
                </span>
              </div>
              <div className="text-[11px] text-stone-500">
                Resolución optimizada para cuaderno escolar y fichas técnicas.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
