import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Sparkles, 
  Upload, 
  Download, 
  Sliders, 
  RotateCw, 
  Eye, 
  Check, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Smartphone, 
  Wheat, 
  Maximize2,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { Recipe, BakeryPhoto } from '../types/bakery';
import { updatePhotoInRecipe, addPhotoToRecipe } from '../utils/storage';
import { 
  BAKERY_PRESETS, 
  BakeryPresetFilter, 
  FilterAdjustment, 
  applyFiltersToCanvas 
} from '../utils/photoFilters';

interface PhotoLabViewProps {
  recipes: Recipe[];
  onOpenPhotoEditor: (photo: BakeryPhoto, recipe: Recipe) => void;
  onUploadNewPhoto: (recipeId: string, files: FileList) => void;
}

/**
 * Editor desplegable para mejorar una fotografía de la receta
 */
interface InlinePhotoEditorProps {
  photo: BakeryPhoto;
  recipe: Recipe;
  onClose: () => void;
  onSaveSuccess: (updatedPhoto: BakeryPhoto) => void;
  onOpenFullscreen: () => void;
}

const InlinePhotoEditor: React.FC<InlinePhotoEditorProps> = ({
  photo,
  recipe,
  onClose,
  onSaveSuccess,
  onOpenFullscreen,
}) => {
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
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Cargar imagen
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.originalUrl || photo.url;
    img.onload = () => {
      originalImageRef.current = img;
      renderCanvas();
    };
  }, [photo]);

  // Re-renderizar al cambiar ajustes
  useEffect(() => {
    if (originalImageRef.current) {
      renderCanvas();
    }
  }, [adjustments, rotation, showOriginal]);

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

  const resetAdjustments = () => {
    setSelectedPreset('original');
    setAdjustments({ brightness: 0, contrast: 0, warmth: 0, saturation: 0, clarity: 0, vignette: 0 });
    setRotation(0);
  };

  const rotatePhoto = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    // Redimensionar para renderizado rápido
    const maxDim = 800;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    if (rotation % 180 !== 0) {
      canvas.width = height;
      canvas.height = width;
    } else {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (rotation === 90) {
      ctx.translate(canvas.width, 0);
      ctx.rotate((90 * Math.PI) / 180);
    } else if (rotation === 180) {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate((180 * Math.PI) / 180);
    } else if (rotation === 270) {
      ctx.translate(0, canvas.height);
      ctx.rotate((270 * Math.PI) / 180);
    }

    ctx.drawImage(img, 0, 0, width, height);
    ctx.restore();

    if (!showOriginal) {
      applyFiltersToCanvas(ctx, canvas.width, canvas.height, adjustments);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newUrl = canvas.toDataURL('image/jpeg', 0.92);
    const updatedPhoto: BakeryPhoto = {
      ...photo,
      url: newUrl,
      originalUrl: photo.originalUrl || photo.url,
      appliedFilter: selectedPreset === 'original' ? undefined : selectedPreset,
      filterParams: adjustments,
    };

    updatePhotoInRecipe(recipe.id, updatedPhoto);
    setIsSaved(true);
    onSaveSuccess(updatedPhoto);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.download = `foto_${recipe.title.toLowerCase().replace(/\s+/g, '_')}.jpg`;
    a.click();
  };

  return (
    <div className="bg-gradient-to-b from-amber-50/90 to-amber-100/50 border-2 border-amber-300 rounded-3xl p-5 sm:p-7 mt-4 space-y-6 animate-in slide-in-from-top-4 duration-300 shadow-xl">
      
      {/* Cabecera del desplegable */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center text-xl shadow-md">
            🎨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black uppercase">
                Editor Desplegable
              </span>
              <span className="text-xs font-bold text-amber-800 line-clamp-1">
                {recipe.title}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-stone-900 font-display">
              Mejorar Fotografía de Obrador
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-stone-700 hover:text-stone-950 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Abrir en pantalla completa con herramientas avanzadas"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Pantalla Completa</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-amber-200 text-stone-500 hover:text-stone-900 border border-amber-200 transition-colors cursor-pointer"
            title="Cerrar editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cuerpo del editor desplegable: Visualizador y Controles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Vista previa de la fotografía */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center gap-3">
          <div className="relative w-full max-w-md aspect-square bg-stone-900 rounded-2xl overflow-hidden shadow-lg border-2 border-amber-200 flex items-center justify-center group">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain"
            />

            {showOriginal && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-sm text-white text-xs font-bold">
                Mostrando Foto Original
              </div>
            )}

            {isSaved && (
              <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex items-center justify-center gap-2 text-white font-extrabold text-sm animate-in fade-in">
                <Check className="w-6 h-6 text-emerald-400" />
                <span>¡Imagen mejorada y guardada en la receta!</span>
              </div>
            )}
          </div>

          {/* Botones de control rápido sobre imagen */}
          <div className="flex items-center gap-2 w-full max-w-md justify-between text-xs">
            <button
              type="button"
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-amber-100 border border-amber-200 font-bold text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer select-none active:bg-amber-200 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Mantener para ver original</span>
            </button>

            <button
              type="button"
              onClick={rotatePhoto}
              className="py-2 px-3 rounded-xl bg-white hover:bg-amber-100 border border-amber-200 font-bold text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Girar 90 grados"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-600" />
              <span>Rotar 90°</span>
            </button>

            <button
              type="button"
              onClick={resetAdjustments}
              className="py-2 px-3 rounded-xl bg-white hover:bg-amber-100 border border-amber-200 font-bold text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Restablecer ajustes"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Columna Derecha: Filtros para panadería y controles deslizantes */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-5">
          
          {/* 1. Filtros Rápidos de Obrador */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Filtros Especiales para Pan y Bollería:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BAKERY_PRESETS.map(preset => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-md font-bold'
                        : 'bg-white hover:bg-amber-50 border-amber-200/90 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-lg mb-1">
                      <span>{preset.icon}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-stone-950" />}
                    </div>
                    <span className="text-xs font-extrabold line-clamp-1">
                      {preset.name}
                    </span>
                    <span className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-amber-950 font-medium' : 'text-stone-500'}`}>
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Ajustes Manuales Deslizables */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5 tracking-wide">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Ajuste Fino de Iluminación y Tono:</span>
              </span>
              <button
                type="button"
                onClick={resetAdjustments}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
              >
                Valores por defecto
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              
              {/* Brillo */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>☀️ Brillo</span>
                  <span className="text-stone-400 font-mono">{adjustments.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={adjustments.brightness}
                  onChange={e => handleSliderChange('brightness', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Contraste */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>🌓 Contraste</span>
                  <span className="text-stone-400 font-mono">{adjustments.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={adjustments.contrast}
                  onChange={e => handleSliderChange('contrast', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Calidez / Dorado */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>🥖 Dorado / Calidez</span>
                  <span className="text-stone-400 font-mono">{adjustments.warmth}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={adjustments.warmth}
                  onChange={e => handleSliderChange('warmth', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Saturación */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>🎨 Saturación</span>
                  <span className="text-stone-400 font-mono">{adjustments.saturation}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={adjustments.saturation}
                  onChange={e => handleSliderChange('saturation', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Nitidez */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>🔍 Nitidez / Alveolo</span>
                  <span className="text-stone-400 font-mono">{adjustments.clarity}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={adjustments.clarity}
                  onChange={e => handleSliderChange('clarity', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

            </div>
          </div>

          {/* 3. Botones de Acción */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 min-w-[200px] py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Foto Mejorada</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="py-3 px-4 rounded-2xl bg-white hover:bg-amber-50 text-stone-800 font-bold text-sm border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Descargar imagen en tu ordenador o teléfono"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>Descargar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export const PhotoLabView: React.FC<PhotoLabViewProps> = ({
  recipes,
  onOpenPhotoEditor,
  onUploadNewPhoto,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Estado para la foto actualmente desplegada en el editor: { photoId, recipeId }
  const [activeEditingTarget, setActiveEditingTarget] = useState<{
    photoId: string;
    recipeId: string;
  } | null>(null);

  // File input refs for uploading photos per recipe
  const fileInputRefs = useRef<{ [recipeId: string]: HTMLInputElement | null }>({});

  const handleTogglePhotoEditor = (photo: BakeryPhoto, recipe: Recipe) => {
    if (activeEditingTarget?.photoId === photo.id && activeEditingTarget?.recipeId === recipe.id) {
      // Si ya está abierta, cerrarla
      setActiveEditingTarget(null);
    } else {
      setActiveEditingTarget({
        photoId: photo.id,
        recipeId: recipe.id,
      });
    }
  };

  const handleUploadClick = (recipeId: string) => {
    fileInputRefs.current[recipeId]?.click();
  };

  const handleFileChange = (recipeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadNewPhoto(recipeId, e.target.files);
      e.target.value = '';
    }
  };

  // Filtrado de recetas
  const filteredRecipes = recipes.filter(recipe => {
    if (selectedCategory !== 'all' && recipe.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = recipe.title.toLowerCase().includes(q);
      const matchGroup = recipe.groupName?.toLowerCase().includes(q);
      const matchAuthor = recipe.studentAuthor?.toLowerCase().includes(q);
      if (!matchTitle && !matchGroup && !matchAuthor) return false;
    }
    return true;
  });

  const totalPhotosCount = recipes.reduce((acc, r) => acc + (r.photos?.length || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Cabecera limpia y profesional del Laboratorio */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-amber-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display uppercase tracking-tight flex items-center gap-2.5">
            <span>📷</span>
            <span>Laboratorio Fotográfico</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Listado de elaboraciones de obrador. Pincha sobre cualquier fotografía para abrir el editor desplegable y mejorar el dorado, la miga o la iluminación.
          </p>
        </div>

        {/* Buscador de recetas */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por receta o brigada..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-amber-200 rounded-2xl text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs"
            />
            <Search className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
          </div>

          <span className="px-3.5 py-2 rounded-2xl bg-amber-100 text-amber-950 font-black text-xs border border-amber-300 shrink-0 shadow-xs">
            {totalPhotosCount} {totalPhotosCount === 1 ? 'Foto' : 'Fotos'}
          </span>
        </div>
      </div>

      {/* Selector de Categorías (Pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'Todas las Recetas', icon: '📋' },
          { id: 'pan', label: 'Pan', icon: '🥖' },
          { id: 'pan_rustico', label: 'Pan Rústico & MM', icon: '🌾' },
          { id: 'bolleria', label: 'Bollería', icon: '🧁' },
          { id: 'bolleria_hojaldrada', label: 'Bollería Hojaldrada', icon: '🥐' },
          { id: 'bolleria_especial', label: 'Bollería Especial', icon: '⭐' },
          { id: 'pasteleria_basica', label: 'Pastelería', icon: '🍰' },
        ].map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white hover:bg-amber-100/70 text-stone-700 border border-amber-200/80'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Listado de recetas */}
      <div className="space-y-4">
        {filteredRecipes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-amber-200 rounded-3xl p-12 text-center space-y-3">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-bold text-stone-800 font-display">
              No se encontraron recetas
            </h3>
            <p className="text-xs text-stone-500">
              Prueba con otro término de búsqueda o selecciona otra categoría.
            </p>
          </div>
        ) : (
          filteredRecipes.map(recipe => {
            const hasPhotos = recipe.photos && recipe.photos.length > 0;
            const activePhoto = hasPhotos 
              ? recipe.photos.find(p => p.id === activeEditingTarget?.photoId && recipe.id === activeEditingTarget?.recipeId)
              : null;

            return (
              <div
                key={recipe.id}
                className="bg-white border-2 border-amber-200/90 rounded-3xl p-4 sm:p-6 shadow-md transition-all space-y-4 hover:border-amber-400"
              >
                {/* Inputs ocultos para subida de fotos por receta */}
                <input
                  ref={el => { fileInputRefs.current[recipe.id] = el; }}
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileChange(recipe.id, e)}
                  className="hidden"
                />

                {/* Cabecera de la receta en el listado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-200">
                        {recipe.category.replace('_', ' ')}
                      </span>
                      {recipe.groupName && (
                        <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                          <span>👥</span> {recipe.groupName}
                        </span>
                      )}
                      {recipe.studentAuthor && (
                        <span className="text-xs text-stone-400">
                          • {recipe.studentAuthor}
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-lg sm:text-xl font-black text-stone-900 font-display tracking-tight">
                      {recipe.title}
                    </h2>
                  </div>

                  {/* Acciones de la receta */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUploadClick(recipe.id)}
                      className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs flex items-center gap-1.5 transition-colors border border-amber-300 shadow-2xs cursor-pointer"
                      title="Tomar o subir foto para esta receta"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-700" />
                      <span>Subir Foto</span>
                    </button>
                    
                    <span className="px-3 py-2 rounded-xl bg-stone-100 text-stone-600 font-mono font-bold text-xs">
                      {recipe.photos?.length || 0} {recipe.photos?.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  </div>
                </div>

                {/* Galería de fotografías de la receta */}
                {hasPhotos ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                      <span>📸 Fotografías registradas (haz clic en una para desplegar el editor):</span>
                      <span className="text-[11px] text-amber-700 font-bold">
                        {activePhoto ? '▼ Editor desplegado' : 'Pincha para editar'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {recipe.photos.map(photo => {
                        const isSelected = activeEditingTarget?.photoId === photo.id && activeEditingTarget?.recipeId === recipe.id;

                        return (
                          <div
                            key={photo.id}
                            onClick={() => handleTogglePhotoEditor(photo, recipe)}
                            className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all border-2 ${
                              isSelected
                                ? 'border-amber-500 ring-4 ring-amber-400/30 scale-102 shadow-lg'
                                : 'border-amber-200 hover:border-amber-400 shadow-xs hover:shadow-md'
                            }`}
                          >
                            <img
                              src={photo.url}
                              alt={photo.label || recipe.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Badge con el filtro aplicado */}
                            {photo.appliedFilter && (
                              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-stone-900/80 text-amber-300 text-[9px] font-black flex items-center gap-1 backdrop-blur-xs">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span className="line-clamp-1">{photo.appliedFilter}</span>
                              </div>
                            )}

                            {/* Overlay informativo al pasar el cursor */}
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white">
                              <span className="text-[10px] font-black line-clamp-1">
                                {photo.label || 'Foto de taller'}
                              </span>
                              <span className="text-[9px] text-amber-300 font-bold flex items-center gap-0.5">
                                <span>🎨</span>
                                <span>{isSelected ? 'Cerrar editor' : 'Desplegar editor'}</span>
                              </span>
                            </div>

                            {/* Indicador de edición activa */}
                            {isSelected && (
                              <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-xs shadow-md">
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/60 border border-dashed border-amber-300 rounded-2xl p-4 text-center space-y-2">
                    <p className="text-xs text-stone-600 font-medium">
                      Esta receta aún no tiene fotos adjuntas de los alumnos.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleUploadClick(recipe.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs cursor-pointer transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tomar o Subir Foto con el Móvil</span>
                    </button>
                  </div>
                )}

                {/* DESPLEGABLE CON EL EDITOR DE FOTOS PARA LA RECETA */}
                {activePhoto && (
                  <InlinePhotoEditor
                    photo={activePhoto}
                    recipe={recipe}
                    onClose={() => setActiveEditingTarget(null)}
                    onSaveSuccess={() => {
                      // Se mantiene abierto para permitir más retoques si se desea
                    }}
                    onOpenFullscreen={() => onOpenPhotoEditor(activePhoto, recipe)}
                  />
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
