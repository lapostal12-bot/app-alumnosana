import React, { useRef, useState } from 'react';
import { 
  Scale, 
  Droplets, 
  Thermometer, 
  Camera, 
  Calendar, 
  QrCode, 
  Sparkles, 
  Users, 
  ChevronRight, 
  Flame,
  Smartphone,
  Check,
  Image as ImageIcon,
  UploadCloud
} from 'lucide-react';
import { Recipe, RecipeCategory, BakeryPhoto } from '../types/bakery';
import { calculateHydration } from '../utils/bakerMath';
import { addPhotoToRecipe } from '../utils/storage';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onOpenQR: (recipe: Recipe) => void;
}

const CATEGORY_DATA: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  pan: { label: 'Pan', icon: '🥖', bg: 'bg-amber-100', text: 'text-amber-900' },
  pan_rustico_masa_madre: { label: 'Pan rústico y con masa madre', icon: '🌾', bg: 'bg-stone-200', text: 'text-stone-900' },
  bolleria: { label: 'Bollería', icon: '🧁', bg: 'bg-pink-100', text: 'text-pink-900' },
  bolleria_hojaldrada: { label: 'Bollería hojaldrada', icon: '🥐', bg: 'bg-orange-100', text: 'text-orange-900' },
  bolleria_especial: { label: 'Bollería especial', icon: '⭐', bg: 'bg-yellow-100', text: 'text-yellow-950' },
  pasteleria_basica: { label: 'Pastelería básica', icon: '🍰', bg: 'bg-purple-100', text: 'text-purple-900' },
  // Fallbacks
  pan_masa_madre_rusticos: { label: 'Pan rústico y con masa madre', icon: '🌾', bg: 'bg-stone-200', text: 'text-stone-900' },
  bolleria_especial_pasteleria: { label: 'Pastelería básica', icon: '🍰', bg: 'bg-purple-100', text: 'text-purple-900' },
  pan_comun: { label: 'Pan', icon: '🥖', bg: 'bg-amber-100', text: 'text-amber-900' },
  masa_madre: { label: 'Pan rústico y con masa madre', icon: '🌾', bg: 'bg-stone-200', text: 'text-stone-900' },
  enriquecidas: { label: 'Bollería', icon: '🧁', bg: 'bg-pink-100', text: 'text-pink-900' },
  hojaldrados: { label: 'Bollería hojaldrada', icon: '🥐', bg: 'bg-orange-100', text: 'text-orange-900' },
  especiales: { label: 'Bollería especial', icon: '⭐', bg: 'bg-yellow-100', text: 'text-yellow-950' },
};

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
  onOpenQR,
}) => {
  const hydration = calculateHydration(recipe.ingredients);
  const studentPhoto = recipe.photos && recipe.photos.length > 0 ? recipe.photos[0] : null;
  const cat = CATEGORY_DATA[recipe.category] || { label: recipe.category, icon: '🥖', bg: 'bg-amber-100', text: 'text-amber-900' };

  const mobileCamInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [photoSavedToast, setPhotoSavedToast] = useState(false);

  const handleMobilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const newPhoto: BakeryPhoto = {
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          url: dataUrl,
          originalUrl: dataUrl,
          label: `Foto de ${recipe.title} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          type: 'corteza',
          date: new Date().toISOString().split('T')[0],
          metadataBadge: {
            recipeTitle: recipe.title,
            studentOrGroup: recipe.studentAuthor,
            doughTemp: recipe.processSteps.targetDoughTempC,
            capturedWithMobile: true,
          },
        };
        addPhotoToRecipe(recipe.id, newPhoto);
        setPhotoSavedToast(true);
        setTimeout(() => setPhotoSavedToast(false), 3000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white border-2 border-amber-100 hover:border-amber-400 rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col group transform hover:-translate-y-1">
      
      {/* Hidden File Inputs for Photo Insertion */}
      <input
        ref={mobileCamInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleMobilePhoto}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleMobilePhoto}
        className="hidden"
      />

      {/* Top Image or Student Photo Slot */}
      {studentPhoto ? (
        <div 
          onClick={() => onSelect(recipe)}
          className="relative aspect-[16/10] bg-amber-50 overflow-hidden cursor-pointer"
        >
          <img
            src={studentPhoto.url}
            alt={studentPhoto.label || recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />

          {/* Top Floating Chips */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            <span className={`px-3 py-1 rounded-full ${cat.bg} ${cat.text} text-xs font-extrabold uppercase tracking-wide border border-white/60 shadow-md flex items-center gap-1.5`}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-white font-extrabold text-[10px] shadow-sm flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Foto Guardada</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenQR(recipe);
                }}
                title="Descargar código QR de esta receta"
                className="p-2 rounded-full bg-white/90 hover:bg-amber-500 text-stone-700 hover:text-white border border-amber-200 pointer-events-auto shadow-md transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom image overlay metrics */}
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-xl bg-stone-950/80 backdrop-blur-sm font-mono font-bold text-amber-300 text-xs border border-white/20 flex items-center gap-1 shadow-sm">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                {hydration}% hidr.
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-stone-950/80 backdrop-blur-sm font-mono text-white text-xs border border-white/20 flex items-center gap-1 shadow-sm">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                {recipe.processSteps.targetDoughTempC}°C
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold bg-stone-950/70 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10">
              <span className="flex items-center gap-1 text-amber-300">
                <Camera className="w-3.5 h-3.5" /> {recipe.photos.length}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-orange-300">
                <Calendar className="w-3.5 h-3.5" /> {recipe.observations.length}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Designated Photo Slot / Dropzone */
        <div 
          onClick={() => onSelect(recipe)}
          className="relative aspect-[16/10] bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/60 border-b-2 border-dashed border-amber-300 p-4 flex flex-col justify-between cursor-pointer select-none group-hover:bg-amber-100/40 transition-colors"
        >
          {/* Top Floating Chips */}
          <div className="flex items-center justify-between">
            <span className={`px-2.5 py-0.5 rounded-full ${cat.bg} ${cat.text} text-[11px] font-extrabold uppercase tracking-wide border border-amber-200/80 shadow-xs flex items-center gap-1`}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenQR(recipe);
                }}
                title="Descargar código QR de esta receta"
                className="p-1.5 rounded-full bg-white/90 hover:bg-amber-500 text-stone-700 hover:text-white border border-amber-200 shadow-xs transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Central Callout for Photo */}
          <div className="text-center my-auto px-2 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-200/70 border-2 border-amber-400/80 text-amber-800 flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-amber-700" />
            </div>

            {/* Quick Action Buttons inside the Slot */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  mobileCamInputRef.current?.click();
                }}
                className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-[10px] rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Smartphone className="w-3 h-3" />
                <span>Cámara móvil</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  galleryInputRef.current?.click();
                }}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <ImageIcon className="w-3 h-3 text-amber-700" />
                <span>Galería</span>
              </button>
            </div>
          </div>

          {/* Bottom Slot Metrics */}
          <div className="flex items-center justify-between text-[11px] text-stone-600 font-bold pt-1 border-t border-amber-200/60">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-sky-700">
                <Droplets className="w-3 h-3 text-sky-500" /> {hydration}% hidr.
              </span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-amber-800">
                <Thermometer className="w-3 h-3 text-amber-600" /> {recipe.processSteps.targetDoughTempC}°C
              </span>
            </div>
            <span className="text-[10px] text-amber-700 font-medium italic">
              0 fotos registradas
            </span>
          </div>
        </div>
      )}

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div>
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold mb-1.5">
            <span className="bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              🎓 {recipe.difficulty}
            </span>
            {recipe.groupName && (
              <span className="truncate max-w-[150px] text-stone-500 font-medium">
                {recipe.groupName}
              </span>
            )}
          </div>

          <h3 
            onClick={() => onSelect(recipe)}
            className="text-lg font-bold text-stone-900 group-hover:text-amber-600 transition-colors line-clamp-1 cursor-pointer font-display"
          >
            {recipe.title}
          </h3>

          <p className="text-xs text-stone-600 line-clamp-2 mt-1.5 leading-relaxed font-normal">
            {recipe.description}
          </p>
        </div>

        {/* Flour specs mini summary */}
        <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
          <span className="text-stone-700 font-medium truncate max-w-[180px] flex items-center gap-1">
            <span>🌾</span> {recipe.flourSpecs.type}
          </span>
          <span className="font-mono font-extrabold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-300/80 shrink-0">
            {recipe.flourSpecs.strengthW || 'W200'}
          </span>
        </div>

        {/* Floating Toast when photo is captured */}
        {photoSavedToast && (
          <div className="p-2 bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl text-center shadow-md flex items-center justify-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>¡Foto de obrador añadida a la fórmula!</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-1.5 sm:gap-2">
          <button
            onClick={() => onSelect(recipe)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm shadow-amber-500/30 transition-all cursor-pointer"
          >
            <span>Ver Ficha</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Quick Mobile Camera Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              mobileCamInputRef.current?.click();
            }}
            title="Adjuntar foto de esta fórmula desde la cámara móvil"
            className="p-2.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-950 font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1 border border-orange-200"
          >
            <Smartphone className="w-4 h-4 text-orange-600" />
            <span className="text-[11px] font-bold">Foto</span>
          </button>

          <button
            onClick={() => onOpenQR(recipe)}
            title="Ver código QR para compartir en obrador"
            className="p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
