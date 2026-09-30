import React, { useState, useRef } from 'react';
import { 
  X, 
  Smartphone, 
  Sparkles, 
  FileText, 
  Camera, 
  Upload, 
  Check, 
  Loader2, 
  Wheat, 
  Flame, 
  Timer, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Recipe, RecipeCategory, WorkGroup } from '../types/bakery';

interface NewRecipeChooserModalProps {
  groups: WorkGroup[];
  activeGroupId: string;
  studentName: string;
  onClose: () => void;
  onOpenManualForm: (prefillRecipe?: Partial<Recipe>) => void;
  onRecipeCreatedDirectly: (recipe: Recipe) => void;
}

export const NewRecipeChooserModal: React.FC<NewRecipeChooserModalProps> = ({
  groups,
  activeGroupId,
  studentName,
  onClose,
  onOpenManualForm,
  onRecipeCreatedDirectly,
}) => {
  const [selectedMode, setSelectedMode] = useState<'chooser' | 'mobile_scan' | 'ai_generate'>('chooser');

  // Mobile scan state
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [scannedImageMime, setScannedImageMime] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanTitle, setScanTitle] = useState<string>('');
  const [scanCategory, setScanCategory] = useState<RecipeCategory>('pan_rustico_masa_madre');
  const [scanError, setScanError] = useState<string | null>(null);
  const mobileCamRef = useRef<HTMLInputElement>(null);
  const mobileGalleryRef = useRef<HTMLInputElement>(null);

  // AI generate state
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiCategory, setAiCategory] = useState<RecipeCategory>('pan_rustico_masa_madre');
  const [aiDifficulty, setAiDifficulty] = useState<'Básico 1º' | 'Intermedio 1º' | 'Avanzado 1º'>('Básico 1º');
  const [aiNotes, setAiNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Handle photo selection from mobile
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannedImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setScannedImage(dataUrl);
        setScanTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Ficha fotografiada en taller');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // AI Scan API Call
  const handleRunAiScan = async () => {
    if (!scannedImage) return;
    setIsScanning(true);
    setScanError(null);

    try {
      const res = await fetch('/api/ai/scan-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: scannedImage,
          mimeType: scannedImageMime,
        }),
      });

      const data = await res.json();
      if (data.recipe) {
        // Open manual form pre-filled with the extracted recipe and attach the photo
        const recipeWithPhoto: Partial<Recipe> = {
          ...data.recipe,
          photos: [
            {
              id: `scan-photo-${Date.now()}`,
              url: scannedImage,
              originalUrl: scannedImage,
              label: 'Fotografía de la ficha / pizarra de taller',
              type: 'proceso',
              date: new Date().toISOString().split('T')[0],
              metadataBadge: {
                recipeTitle: data.recipe.title,
                studentOrGroup: studentName,
                capturedWithMobile: true,
              },
            },
          ],
        };
        onOpenManualForm(recipeWithPhoto);
      } else {
        throw new Error(data.error || 'No se pudo interpretar la ficha');
      }
    } catch (err: any) {
      console.error(err);
      setScanError('No se pudo extraer el texto de la imagen automáticamente. Puedes guardarla directamente como ficha fotográfica.');
    } finally {
      setIsScanning(false);
    }
  };

  // Save directly as photographic recipe card
  const handleSavePhotoRecipeDirect = () => {
    if (!scannedImage) return;

    const selectedGroup = groups.find(g => g.id === activeGroupId);

    const newRecipe: Recipe = {
      id: `receta-foto-${Date.now()}`,
      title: scanTitle.trim() || 'Ficha Fotografiada de Obrador',
      category: scanCategory,
      difficulty: 'Básico 1º',
      description: 'Ficha técnica fotografiada directamente con el teléfono móvil en el taller de panadería.',
      courseLevel: '1º CFGM Panadería y Repostería',
      studentAuthor: studentName,
      groupId: activeGroupId,
      groupName: selectedGroup?.name,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      flourBaseWeightGrams: 1000,
      targetYieldPieces: 4,
      pieceWeightGrams: 250,
      flourSpecs: {
        type: 'Harina Panadera',
        strengthW: 'W 200',
        plRatio: '0.5',
      },
      ingredients: [
        { id: `ing-${Date.now()}-1`, name: 'Harina Base', percentage: 100, grams: 1000, isFlourBase: true, type: 'harina' },
        { id: `ing-${Date.now()}-2`, name: 'Agua', percentage: 65, grams: 650, type: 'agua' },
        { id: `ing-${Date.now()}-3`, name: 'Sal', percentage: 2, grams: 20, type: 'sal' },
        { id: `ing-${Date.now()}-4`, name: 'Levadura', percentage: 2, grams: 20, type: 'levadura' },
      ],
      processSteps: {
        kneadingSlowMins: 5,
        kneadingFastMins: 4,
        targetDoughTempC: 24,
        bulkFermentationMins: 60,
        bulkFolds: 1,
        divisionWeightGrams: 250,
        preformRestMins: 15,
        finalFermentationMins: 60,
        finalFermentationTempC: 24,
        scoringType: 'Ver ficha fotografiada',
        bakingTempC: 220,
        bakingTimeMins: 30,
        steamSeconds: 6,
        ovenDeckVentilationMins: 4,
        detailedNotes: 'Fórmula fotografiada con smartphone desde el taller escolar.',
      },
      photos: [
        {
          id: `p-scan-${Date.now()}`,
          url: scannedImage,
          originalUrl: scannedImage,
          label: 'Ficha de obrador adjuntada desde el móvil',
          type: 'proceso',
          date: new Date().toISOString().split('T')[0],
          metadataBadge: {
            recipeTitle: scanTitle,
            studentOrGroup: studentName,
            capturedWithMobile: true,
          },
        },
      ],
      observations: [],
    };

    onRecipeCreatedDirectly(newRecipe);
  };

  // AI Recipe Generation Call
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          category: aiCategory,
          difficulty: aiDifficulty,
          notes: aiNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.recipe) {
        onOpenManualForm(data.recipe);
      } else {
        throw new Error(data.error || 'Error al generar la receta');
      }
    } catch (err: any) {
      console.error(err);
      setAiError('Hubo una incidencia al contactar con la IA de obrador. Inténtalo de nuevo o redacta la fórmula manualmente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const PROMPT_SUGGESTIONS = [
    { title: '🥖 Baguette Tradicional Francesa', cat: 'pan_comun', desc: 'Con poolish y 70% hidratación' },
    { title: '🥐 Croissant de Mantequilla', cat: 'hojaldrados', desc: 'Hojaldre fermentado con 3 pliegues' },
    { title: '🍞 Brioche Nanterre', cat: 'enriquecidas', desc: 'Masa enriquecida al 45% mantequilla' },
    { title: '🌾 Hogaza de Masa Madre y Centeno', cat: 'masa_madre', desc: 'Fermentación en frío 24h' },
    { title: '🧁 Bollos Suizos con Azúcar Perlado', cat: 'bolleria', desc: 'Bollería tierna de obrador' },
    { title: '🌻 Chapata Italiana al 80%', cat: 'pan_comun', desc: 'Alta hidratación y biga' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border-2 border-amber-300 rounded-3xl shadow-2xl overflow-hidden text-stone-800 animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 font-display">
                Añadir Nueva Ficha de Obrador 🥖✨
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Cuaderno de Panadería y Bollería • 1º Curso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-amber-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* Main 3 Options Chooser */}
          {selectedMode === 'chooser' && (
            <div className="space-y-4">
              <div className="text-center max-w-md mx-auto space-y-1 mb-6">
                <h4 className="text-lg font-black text-stone-900">
                  ¿Cómo quieres registrar esta nueva ficha?
                </h4>
                <p className="text-xs text-stone-500">
                  Elige el método que mejor se adapte a tu trabajo en el obrador hoy
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Option 1: Mobile Attachment */}
                <div
                  onClick={() => setSelectedMode('mobile_scan')}
                  className="p-5 bg-white hover:bg-amber-50/80 border-2 border-amber-200 hover:border-amber-400 rounded-3xl shadow-md cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      📱
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-950 font-black text-[10px] uppercase">
                        Desde Móvil
                      </span>
                      <h5 className="text-sm font-black text-stone-900 mt-1">
                        Adjuntar desde el Móvil
                      </h5>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Fotografía la pizarra del profesor o tus apuntes y extráela o guárdala directamente.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs font-bold text-orange-600">
                    <span>Usar Cámara Móvil</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Option 2: AI Assistant Creation */}
                <div
                  onClick={() => setSelectedMode('ai_generate')}
                  className="p-5 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-3xl shadow-lg shadow-amber-500/25 cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      ✨
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-black/20 text-white font-black text-[10px] uppercase">
                        Inteligencia Artificial
                      </span>
                      <h5 className="text-sm font-black text-white mt-1">
                        Crear Ficha con IA
                      </h5>
                      <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                        Escribe qué pan o bollo quieres elaborar y la IA calculará la fórmula técnica con porcentaje panadero.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-amber-100">
                    <span>Generar con IA</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Option 3: Manual Form Fill */}
                <div
                  onClick={() => onOpenManualForm()}
                  className="p-5 bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-amber-400 rounded-3xl shadow-md cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      ✍️
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-black text-[10px] uppercase">
                        Manual
                      </span>
                      <h5 className="text-sm font-black text-stone-900 mt-1">
                        Rellenar Manualmente
                      </h5>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Introduce paso a paso tus ingredientes, porcentajes de pesaje y tiempos de horno a tu ritmo.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-700">
                    <span>Abrir Formulario</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Option 1 Sub-View: Mobile Attachment & Scan */}
          {selectedMode === 'mobile_scan' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Hidden Inputs */}
              <input
                ref={mobileCamRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <input
                ref={mobileGalleryRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedMode('chooser')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  ← Volver a opciones
                </button>
                <span className="text-xs font-mono font-bold text-stone-500">
                  Captura con Smartphone
                </span>
              </div>

              {!scannedImage ? (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h4 className="text-base font-black text-stone-900">
                      Fotografía la ficha o pizarra con tu teléfono
                    </h4>
                    <p className="text-xs text-stone-500">
                      Puedes disparar la cámara trasera directamente o elegir una foto de tu galería
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div
                      onClick={() => mobileCamRef.current?.click()}
                      className="p-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-3xl cursor-pointer text-center space-y-3 hover:from-amber-600 hover:to-orange-600 transition-all shadow-md group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-3xl group-hover:scale-110 transition-transform">
                        📸
                      </div>
                      <div>
                        <h5 className="text-base font-black">Tomar Foto con Cámara</h5>
                        <p className="text-xs text-amber-100 mt-1">Abre la cámara del móvil al instante</p>
                      </div>
                    </div>

                    <div
                      onClick={() => mobileGalleryRef.current?.click()}
                      className="p-6 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-3xl cursor-pointer text-center space-y-3 transition-all shadow-xs group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center mx-auto text-3xl group-hover:scale-110 transition-transform">
                        🖼️
                      </div>
                      <div>
                        <h5 className="text-base font-black text-stone-900">Elegir del Carrete</h5>
                        <p className="text-xs text-stone-600 mt-1">Selecciona una imagen guardada</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {scanError && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{scanError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Preview Image */}
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 border-2 border-amber-200">
                      <img src={scannedImage} alt="Ficha fotografiada" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setScannedImage(null)}
                        className="absolute top-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-bold rounded-lg backdrop-blur-sm"
                      >
                        Cambiar Foto
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="space-y-3 flex flex-col justify-between">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Título de la Elaboración:
                        </label>
                        <input
                          type="text"
                          value={scanTitle}
                          onChange={e => setScanTitle(e.target.value)}
                          placeholder="Ej: Barra de Pan Rústico"
                          className="w-full bg-amber-50/50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Familia / Categoría:
                        </label>
                        <select
                          value={scanCategory}
                          onChange={e => setScanCategory(e.target.value as any)}
                          className="w-full bg-amber-50/50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                        >
                          <option value="pan">🥖 Pan</option>
                          <option value="pan_rustico_masa_madre">🌾 Pan rústico y con masa madre</option>
                          <option value="bolleria">🧁 Bollería</option>
                          <option value="bolleria_hojaldrada">🥐 Bollería hojaldrada</option>
                          <option value="bolleria_especial">⭐ Bollería especial</option>
                          <option value="pasteleria_basica">🍰 Pastelería básica</option>
                        </select>
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          onClick={handleRunAiScan}
                          disabled={isScanning}
                          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isScanning ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Analizando ficha con IA...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Escanear y Extraer con IA</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleSavePhotoRecipeDirect}
                          disabled={isScanning}
                          className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-amber-50 border border-amber-300 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-amber-600" />
                          <span>Guardar Foto Directamente en Ficha</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Option 2 Sub-View: AI Recipe Generation */}
          {selectedMode === 'ai_generate' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedMode('chooser')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  ← Volver a opciones
                </button>
                <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Asistente IA de Panadería 1º
                </span>
              </div>

              {aiError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-extrabold text-stone-800 block mb-1">
                    ¿Qué pan o bollería quieres que la IA formule?
                  </label>
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ej: Pan rústico de masa madre con 72% de hidratación y semillas de sésamo..."
                    className="w-full bg-amber-50/60 border border-amber-300 rounded-2xl px-4 py-2.5 text-xs text-stone-900 font-medium outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Suggestions Pills */}
                <div>
                  <span className="text-[11px] font-bold text-stone-500 block mb-1">
                    Sugerencias habituales de 1º curso:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PROMPT_SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAiPrompt(s.title);
                          setAiCategory(s.cat as any);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-700 border border-amber-200 text-[11px] font-medium transition-colors text-left"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-extrabold text-stone-700 block mb-1">
                      Familia / Categoría:
                    </label>
                    <select
                      value={aiCategory}
                      onChange={e => setAiCategory(e.target.value as any)}
                      className="w-full bg-amber-50/60 border border-amber-300 rounded-2xl px-3 py-2 text-xs font-bold text-stone-800"
                    >
                      <option value="pan">🥖 Pan</option>
                      <option value="pan_rustico_masa_madre">🌾 Pan rústico y con masa madre</option>
                      <option value="bolleria">🧁 Bollería</option>
                      <option value="bolleria_hojaldrada">🥐 Bollería hojaldrada</option>
                      <option value="bolleria_especial">⭐ Bollería especial</option>
                      <option value="pasteleria_basica">🍰 Pastelería básica</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-stone-700 block mb-1">
                      Nivel del Curso:
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={e => setAiDifficulty(e.target.value as any)}
                      className="w-full bg-amber-50/60 border border-amber-300 rounded-2xl px-3 py-2 text-xs font-bold text-stone-800"
                    >
                      <option value="Básico 1º">⭐ Básico 1º</option>
                      <option value="Intermedio 1º">⭐⭐ Intermedio 1º</option>
                      <option value="Avanzado 1º">⭐⭐⭐ Avanzado 1º</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-700 block mb-1">
                    Indicaciones especiales para el profesor / IA (opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={aiNotes}
                    onChange={e => setAiNotes(e.target.value)}
                    placeholder="Ej: Amasado en espiral, fermentación en bloque de 2 horas a 24°C, cocción con solera fuerte..."
                    className="w-full bg-amber-50/60 border border-amber-300 rounded-2xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Formulando porcentajes panaderos y TDM con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generar Ficha Panadera con IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
