import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Scale, 
  Flame, 
  Timer, 
  Thermometer, 
  Sparkles, 
  QrCode, 
  Printer, 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Wheat, 
  Droplets,
  Calendar,
  Layers,
  Camera,
  Users,
  Smile,
  Heart,
  Smartphone,
  Check,
  RotateCcw,
  Image as ImageIcon,
  Eye,
  Sliders,
  Download,
  Copy,
  FileText,
  FileSpreadsheet,
  Share2
} from 'lucide-react';
import { Recipe, BakeryPhoto, WorkGroup } from '../types/bakery';
import { calculateHydration, scaleIngredientsByYield, formatGrams } from '../utils/bakerMath';
import { addPhotoToRecipe } from '../utils/storage';

interface RecipeDetailViewProps {
  recipe: Recipe;
  groups: WorkGroup[];
  onBack: () => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onOpenQR: (recipe: Recipe) => void;
  onOpenPhotoEditor: (photo: BakeryPhoto, recipe: Recipe) => void;
  onUploadPhotos: (recipeId: string, files: FileList) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({
  recipe,
  groups,
  onBack,
  onEditRecipe,
  onDeleteRecipe,
  onOpenQR,
  onOpenPhotoEditor,
  onUploadPhotos,
}) => {
  const [activeTab, setActiveTab] = useState<'formula' | 'generate_sheet' | 'mobile_upload' | 'photos'>('formula');
  
  // Interactive scaling state
  const [scalePieces, setScalePieces] = useState<number>(recipe.targetYieldPieces);
  const [scalePieceWeight, setScalePieceWeight] = useState<number>(recipe.pieceWeightGrams);

  // Technical sheet generator state
  const [sheetScaleFlourKg, setSheetScaleFlourKg] = useState<number>(1);
  const [sheetStudent, setSheetStudent] = useState<string>(recipe.studentAuthor || 'Alumno de 1º');
  const [sheetBrigade, setSheetBrigade] = useState<string>(recipe.groupName || 'Brigada 1 • Obrador');
  const [sheetDate, setSheetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sheetTeacher, setSheetTeacher] = useState<string>('Prof. de Taller de Panadería');
  const [sheetRoomTemp, setSheetRoomTemp] = useState<number>(22);
  const [sheetFlourTemp, setSheetFlourTemp] = useState<number>(21);
  const [sheetFriction, setSheetFriction] = useState<number>(9);
  const [sheetNotes, setSheetNotes] = useState<string>('');

  // Mobile photo capture state
  const [mobilePhotoPreview, setMobilePhotoPreview] = useState<string | null>(null);
  const [mobilePhotoType, setMobilePhotoType] = useState<BakeryPhoto['type']>('corteza');
  const [mobilePhotoLabel, setMobilePhotoLabel] = useState<string>('Foto de taller tomada con el móvil');
  const [mobilePhotoTemp, setMobilePhotoTemp] = useState<number>(recipe.processSteps.targetDoughTempC);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<'original' | 'dorado' | 'miga' | 'taller'>('dorado');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showTdmHelp, setShowTdmHelp] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const scaledData = scaleIngredientsByYield(
    recipe.ingredients,
    scalePieces,
    scalePieceWeight
  );

  const currentHydration = calculateHydration(recipe.ingredients);
  const assignedGroup = groups.find(g => g.id === recipe.groupId);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadPhotos(recipe.id, e.target.files);
    }
  };

  const handleMobileFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setMobilePhotoPreview(dataUrl);
        setMobilePhotoLabel(`Foto de ${recipe.title} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be chosen again
    e.target.value = '';
  };

  const handleSaveMobilePhoto = (openEditorAfter: boolean = false) => {
    if (!mobilePhotoPreview) return;

    let appliedFilterName: string | undefined = undefined;
    if (selectedQuickFilter === 'dorado') appliedFilterName = 'Dorado Crujiente';
    else if (selectedQuickFilter === 'miga') appliedFilterName = 'Miga Luminosa';
    else if (selectedQuickFilter === 'taller') appliedFilterName = 'Neutralizar Luces';

    const newPhoto: BakeryPhoto = {
      id: `mobile-p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      url: mobilePhotoPreview,
      originalUrl: mobilePhotoPreview,
      label: mobilePhotoLabel.trim() || `Foto Móvil de ${recipe.title}`,
      type: mobilePhotoType,
      date: new Date().toISOString().split('T')[0],
      appliedFilter: appliedFilterName,
      metadataBadge: {
        recipeTitle: recipe.title,
        studentOrGroup: assignedGroup?.name || recipe.studentAuthor,
        doughTemp: mobilePhotoTemp,
        hydration: currentHydration,
        capturedWithMobile: true,
        stage: mobilePhotoType,
      },
    };

    addPhotoToRecipe(recipe.id, newPhoto);
    setToastMessage('✅ ¡Foto capturada desde el móvil guardada en la receta con éxito!');
    setTimeout(() => setToastMessage(null), 4000);

    const savedPhoto = newPhoto;
    setMobilePhotoPreview(null);

    if (openEditorAfter) {
      onOpenPhotoEditor(savedPhoto, recipe);
    }
  };

  const baseFlourGramsForSheet = Math.max(100, Math.round(sheetScaleFlourKg * 1000));
  const sheetScaledIngredients = recipe.ingredients.map(ing => ({
    ...ing,
    scaledGrams: Math.round((baseFlourGramsForSheet * ing.percentage) / 100),
  }));
  const sheetTotalDoughWeight = sheetScaledIngredients.reduce((s, i) => s + i.scaledGrams, 0);
  const sheetEstimatedPieces = Math.max(1, Math.round(sheetTotalDoughWeight / (recipe.pieceWeightGrams || 250)));
  const sheetCalculatedWaterTemp = Math.round((recipe.processSteps.targetDoughTempC * 3) - (sheetRoomTemp + sheetFlourTemp + sheetFriction));

  const handlePrint = () => {
    setActiveTab('generate_sheet');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleExportJson = () => {
    const exportData = {
      tipo_documento: 'FICHA TÉCNICA NORMALIZADA DE OBRADOR',
      titulo: recipe.title,
      categoria: recipe.category,
      nivel: recipe.courseLevel,
      dificultad: recipe.difficulty,
      datos_practica: {
        alumno: sheetStudent,
        brigada: sheetBrigade,
        fecha: sheetDate,
        profesor: sheetTeacher,
        harina_base_kg: sheetScaleFlourKg,
        tdm_objetivo_c: recipe.processSteps.targetDoughTempC,
        temperatura_obrador_c: sheetRoomTemp,
        temperatura_harina_c: sheetFlourTemp,
        friccion_amasadora_c: sheetFriction,
        temperatura_calculada_agua_c: sheetCalculatedWaterTemp,
      },
      especificaciones_harina: recipe.flourSpecs,
      porcentajes_panadero_e_ingredientes: sheetScaledIngredients.map(ing => ({
        ingrediente: ing.name,
        tipo: ing.type,
        porcentaje_panadero: `${ing.percentage}%`,
        peso_base_g: ing.grams,
        peso_escalado_g: ing.scaledGrams,
      })),
      rendimiento: {
        peso_total_masa_g: sheetTotalDoughWeight,
        piezas_estimadas: sheetEstimatedPieces,
        peso_pieza_g: recipe.pieceWeightGrams,
        hidratacion_porcentaje: `${currentHydration}%`,
      },
      proceso_elaboracion: recipe.processSteps,
      observaciones_taller: sheetNotes,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ficha_Tecnica_${recipe.title.replace(/\s+/g, '_')}_${sheetDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('✅ ¡Ficha técnica exportada en formato JSON descargada!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopySheetText = () => {
    let text = `=========================================\n`;
    text += `ESCUELA DE PANADERÍA Y PASTELERÍA\n`;
    text += `FICHA TÉCNICA DE PRODUCCIÓN EN OBRADOR\n`;
    text += `=========================================\n\n`;
    text += `ELABORACIÓN: ${recipe.title}\n`;
    text += `CATEGORÍA: ${recipe.category.replace(/_/g, ' ').toUpperCase()}\n`;
    text += `ALUMNO / BRIGADA: ${sheetStudent} (${sheetBrigade})\n`;
    text += `FECHA: ${sheetDate} | EVALUADOR: ${sheetTeacher}\n\n`;
    text += `--- CONTROL TDM Y TEMPERATURAS ---\n`;
    text += `TDM Requerida: ${recipe.processSteps.targetDoughTempC}°C\n`;
    text += `Tª Obrador: ${sheetRoomTemp}°C | Tª Harina: ${sheetFlourTemp}°C | Fricción: ${sheetFriction}°C\n`;
    text += `Tª AGUA CALCULADA: ${sheetCalculatedWaterTemp}°C\n\n`;
    text += `--- FÓRMULA Y PORCENTAJE PANADERO (${sheetScaleFlourKg} kg Harina) ---\n`;
    sheetScaledIngredients.forEach(i => {
      text += `- ${i.name.padEnd(30, ' ')} : ${String(i.percentage).padStart(5, ' ')}% -> ${String(i.scaledGrams).padStart(6, ' ')} g\n`;
    });
    text += `TOTAL MASA: ${sheetTotalDoughWeight} g | ${sheetEstimatedPieces} piezas de aprox ${recipe.pieceWeightGrams} g (Hidratación: ${currentHydration}%)\n\n`;
    text += `--- PROTOCOLO DE ELABORACIÓN ---\n`;
    text += `1. Amasado: ${recipe.processSteps.kneadingSlowMins} min lento + ${recipe.processSteps.kneadingFastMins} min rápido (TDM ${recipe.processSteps.targetDoughTempC}°C)\n`;
    if (recipe.processSteps.autolysisMins) text += `   Autólisis previa: ${recipe.processSteps.autolysisMins} min\n`;
    text += `2. Bloque: ${recipe.processSteps.bulkFermentationMins} min con ${recipe.processSteps.bulkFolds} pliegue(s)\n`;
    text += `3. División y Reposo: piezas de ${recipe.processSteps.divisionWeightGrams} g con ${recipe.processSteps.preformRestMins} min de reposo\n`;
    text += `4. Apresto / 2ª Fermentación: ${recipe.processSteps.finalFermentationMins} min a ${recipe.processSteps.finalFermentationTempC}°C\n`;
    text += `5. Greñado: ${recipe.processSteps.scoringType}\n`;
    text += `6. Horno: ${recipe.processSteps.bakingTempC}°C durante ${recipe.processSteps.bakingTimeMins} min (Vapor: ${recipe.processSteps.steamSeconds}s, Tiro: ${recipe.processSteps.ovenDeckVentilationMins} min)\n`;
    if (recipe.processSteps.detailedNotes) text += `Notas: ${recipe.processSteps.detailedNotes}\n`;
    text += `\n=========================================`;

    navigator.clipboard.writeText(text);
    setToastMessage('📋 ¡Ficha técnica copiada al portapapeles con éxito!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-amber-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-700 hover:text-stone-900 text-xs font-bold px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-amber-600" />
          <span>Volver al Recetario</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenQR(recipe)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            Descargar Código QR
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-amber-50 text-stone-700 font-bold text-xs border border-amber-300 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            Imprimir Ficha
          </button>

          <button
            onClick={() => onEditRecipe(recipe)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-amber-50 text-stone-700 font-bold text-xs border border-amber-300 transition-colors shadow-xs cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-amber-600" />
            Editar
          </button>

          <button
            onClick={() => {
              if (confirm(`¿Estás seguro de eliminar la receta "${recipe.title}"?`)) {
                onDeleteRecipe(recipe.id);
              }
            }}
            className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
            title="Eliminar receta"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Recipe Banner / Header Card */}
      <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3.5 py-1 rounded-full bg-amber-500 text-white font-black uppercase tracking-wider shadow-xs">
                {recipe.category.replace('_', ' ').toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                ⭐ {recipe.difficulty}
              </span>
              {assignedGroup && (
                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-900 font-bold border border-orange-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-orange-700" />
                  {assignedGroup.name}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight font-display">
              {recipe.title}
            </h1>

            <p className="text-sm text-stone-600 max-w-2xl leading-relaxed font-normal">
              {recipe.description}
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-stone-500 pt-2 font-medium">
              <span>✍️ Autor: <strong className="text-stone-800">{recipe.studentAuthor}</strong></span>
              <span>•</span>
              <span>📅 Fecha: {recipe.createdAt}</span>
              <span>•</span>
              <span>🎓 {recipe.courseLevel}</span>
            </div>
          </div>

          {/* Quick Technical Badges */}
          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col justify-between shadow-xs">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <Droplets className="w-4 h-4 text-sky-500" /> Hidratación
              </span>
              <div className="text-3xl font-black text-amber-700 font-mono mt-1">
                {currentHydration}%
              </div>
              <span className="text-[10px] text-stone-500 font-medium">Agua / Harina base</span>
            </div>

            <div 
              onClick={() => setShowTdmHelp(!showTdmHelp)}
              className="p-4 bg-amber-50/80 hover:bg-amber-100/70 border border-amber-200 hover:border-amber-400 rounded-2xl flex flex-col justify-between shadow-xs cursor-pointer transition-all group relative"
              title="Haz clic para ver la explicación técnica de la TDM"
            >
              <span className="text-xs font-bold text-amber-900 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-4 h-4 text-amber-600" /> TDM Óptima
                </span>
                <span className="text-[10px] bg-amber-200 group-hover:bg-amber-500 group-hover:text-white text-amber-900 px-1.5 py-0.2 rounded-full font-black transition-colors">
                  ?
                </span>
              </span>
              <div className="text-3xl font-black text-amber-700 font-mono mt-1">
                {recipe.processSteps.targetDoughTempC}°C
              </div>
              <span className="text-[10px] text-stone-500 font-medium flex items-center justify-between">
                <span>Tª masa en amasadora</span>
                <span className="text-amber-700 font-bold underline">¿Para qué sirve?</span>
              </span>
            </div>

            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col justify-between shadow-xs">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <Wheat className="w-4 h-4 text-amber-600" /> Harina
              </span>
              <div className="text-xl font-black text-stone-800 font-mono mt-1 truncate">
                {recipe.flourSpecs.strengthW || 'W 200'}
              </div>
              <span className="text-[10px] text-stone-500 font-medium">P/L: {recipe.flourSpecs.plRatio || '0.5'}</span>
            </div>

            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col justify-between shadow-xs">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <Flame className="w-4 h-4 text-red-500" /> Horno Suela
              </span>
              <div className="text-xl font-black text-stone-800 font-mono mt-1">
                {recipe.processSteps.bakingTempC}°C
              </div>
              <span className="text-[10px] text-stone-500 font-medium">{recipe.processSteps.bakingTimeMins} min de cocción</span>
            </div>
          </div>
        </div>

        {/* TDM Educational Helper Popup */}
        {showTdmHelp && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-stone-800 space-y-2 animate-in fade-in shadow-xs">
            <div className="flex items-center justify-between font-black text-amber-950 text-sm">
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-600" />
                ¿Para qué sirve la TDM ({recipe.processSteps.targetDoughTempC}°C) en esta receta?
              </span>
              <button 
                onClick={() => setShowTdmHelp(false)} 
                className="text-stone-400 hover:text-stone-800 text-base font-bold px-1.5 py-0.5 rounded-lg hover:bg-amber-200/60 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="leading-relaxed">
              <strong>TDM (Temperatura Deseada de la Masa):</strong> Es la temperatura ideal (en este caso <strong>{recipe.processSteps.targetDoughTempC}°C</strong>) a la que debe salir la masa de la amasadora para que la fermentación arranque de manera uniforme sin sobrecalentar el gluten ni aletargar la levadura.
            </p>
            <p className="leading-relaxed">
              Como la temperatura ambiente del obrador y la de la harina del saco ya son fijas, <strong>el AGUA es el único ingrediente que el panadero puede regular</strong>. Se calcula con la fórmula:
            </p>
            <div className="p-2.5 bg-white rounded-xl border border-amber-200 font-mono text-[11px] text-amber-950">
              Tª Agua = (TDM × 3) - (Tª Ambiente + Tª Harina + Fricción Amasadora)
            </div>
          </div>
        )}

        {/* Student Photo Status / Slot Section */}
        {recipe.photos.length === 0 ? (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 border-2 border-dashed border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-200/80 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 shadow-inner">
                <Camera className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <span className="font-black text-amber-950 block text-xs sm:text-sm flex items-center gap-1.5">
                  <span>📸 Fotografía de la elaboración</span>
                </span>
                <p className="text-[11px] text-stone-600 font-medium">
                  Fotografía de la elaboración en el taller para evaluar la greña, color y corteza.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mobile_upload');
                  setTimeout(() => cameraInputRef.current?.click(), 100);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer text-xs transition-all active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Cámara Móvil</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mobile_upload');
                  setTimeout(() => galleryInputRef.current?.click(), 100);
                }}
                className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer text-xs transition-all active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                <span>Galería Móvil</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                {recipe.photos.slice(0, 3).map((p, idx) => (
                  <img
                    key={p.id || idx}
                    src={p.url}
                    alt={p.label}
                    className="inline-block h-10 w-10 rounded-xl object-cover ring-2 ring-white shadow-xs"
                  />
                ))}
              </div>
              <div>
                <span className="font-extrabold text-stone-900 block text-xs">
                  📸 {recipe.photos.length} {recipe.photos.length === 1 ? 'Foto real guardada' : 'Fotos reales guardadas'}
                </span>
                <p className="text-[11px] text-stone-500">
                  Última actualización: {recipe.photos[0]?.date || 'Hoy'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-stone-800 border border-amber-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Ver Galería
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mobile_upload');
                  setTimeout(() => cameraInputRef.current?.click(), 100);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-xl shadow-xs text-xs flex items-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-3 h-3" />
                <span>Añadir Otra Foto</span>
              </button>
            </div>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex border-b border-amber-200 mt-8 -mb-6 -mx-6 sm:-mx-8 px-4 sm:px-8 bg-amber-50/60 overflow-x-auto gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('formula')}
            className={`py-4 px-4 sm:px-5 text-xs font-black border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'formula'
                ? 'border-amber-500 text-amber-900 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>🌾</span>
            <span>Fórmula & Porcentaje</span>
          </button>

          <button
            onClick={() => setActiveTab('generate_sheet')}
            className={`py-4 px-4 sm:px-5 text-xs font-black border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'generate_sheet'
                ? 'border-amber-500 text-amber-900 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>Generar Ficha Técnica</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
              🖨️ Imprimir / Exportar
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mobile_upload')}
            className={`py-4 px-4 sm:px-5 text-xs font-black border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'mobile_upload'
                ? 'border-amber-500 text-amber-900 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-orange-500" />
            <span>Adjuntar Foto Móvil</span>
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] shadow-xs">
              📸 Cámara
            </span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`py-4 px-4 sm:px-5 text-xs font-black border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'photos'
                ? 'border-amber-500 text-amber-900 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>📸</span>
            <span>Fotos Reales & Filtros ({recipe.photos.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Formula & Baker's Percentage */}
      {activeTab === 'formula' && (
        <div className="space-y-6">
          
          {/* Mobile Direct Upload Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
                📱
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                  <span>¿Estás en el obrador elaborando esta fórmula?</span>
                </h4>
                <p className="text-xs text-amber-100 font-medium">
                  Adjunta una foto real de tu masa, greñado o miga directamente desde tu teléfono móvil
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('mobile_upload');
                  setTimeout(() => cameraInputRef.current?.click(), 100);
                }}
                className="px-4 py-2 rounded-2xl bg-stone-900 hover:bg-black text-amber-300 hover:text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Tomar Foto con Cámara</span>
              </button>

              <button
                onClick={() => setActiveTab('mobile_upload')}
                className="px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border border-white/30"
              >
                <Smartphone className="w-4 h-4" />
                <span>Pestaña Móvil</span>
              </button>
            </div>
          </div>
          
          {/* Scaler Interactive Bar */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 text-xl font-black">
                ⚖️
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  Escalador Dinámico para la Báscula de Taller
                </h3>
                <p className="text-xs text-stone-600 font-medium">
                  Indica cuántas piezas necesitas elaborar y la app recalcula los gramos exactos
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-amber-200 text-xs shadow-xs font-bold">
                <span className="text-stone-600">Piezas:</span>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={scalePieces}
                  onChange={e => setScalePieces(Math.max(1, Number(e.target.value)))}
                  className="w-14 bg-amber-100/80 text-center font-extrabold text-amber-900 font-mono rounded-lg px-2 py-1 outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-amber-200 text-xs shadow-xs font-bold">
                <span className="text-stone-600">Peso/pieza:</span>
                <input
                  type="number"
                  step="10"
                  min="20"
                  value={scalePieceWeight}
                  onChange={e => setScalePieceWeight(Math.max(20, Number(e.target.value)))}
                  className="w-16 bg-amber-100/80 text-center font-extrabold text-amber-900 font-mono rounded-lg px-2 py-1 outline-none text-sm"
                />
                <span className="text-stone-500">g</span>
              </div>

              <div className="px-4 py-2 bg-amber-500 text-white font-mono text-xs font-black rounded-2xl shadow-sm">
                Masa Total: {formatGrams(scaledData.totalDoughGrams)}
              </div>
            </div>
          </div>

          {/* Baker's Percentages Table */}
          <div className="bg-white border-2 border-amber-200 rounded-3xl overflow-hidden shadow-md">
            <div className="px-6 py-4 border-b border-amber-200 bg-amber-50/70 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <span>🌾</span> Tabla de Pesaje (% Porcentaje Panadero)
              </h3>
              <span className="text-xs text-stone-600 font-bold">
                Harina Base: <strong className="text-amber-800 font-mono text-sm">{formatGrams(scaledData.flourGrams)}</strong> (100%)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-amber-200 bg-amber-50/40 text-stone-600 uppercase tracking-wider text-[11px] font-black">
                    <th className="py-3.5 px-6">Ingrediente</th>
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4 text-right">% Panadero</th>
                    <th className="py-3.5 px-6 text-right">Peso a Pesar en Obrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 text-stone-700">
                  {scaledData.ingredients.map(ing => (
                    <tr key={ing.id} className="hover:bg-amber-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-stone-900 flex items-center gap-2">
                        {ing.isFlourBase && <span className="text-amber-500">★</span>}
                        {ing.name}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 capitalize">
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {ing.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-amber-700 text-sm">
                        {ing.percentage}%
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-black text-stone-900 text-base">
                        {formatGrams(ing.grams)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-100/70 font-black border-t-2 border-amber-300">
                    <td className="py-4 px-6 text-amber-950 font-extrabold text-sm">PESO TOTAL DE LA MASA</td>
                    <td className="py-4 px-4 text-stone-600">100% Harina + Adiciones</td>
                    <td className="py-4 px-4 text-right font-mono text-amber-950 text-sm">
                      {scaledData.ingredients.reduce((s, i) => s + i.percentage, 0).toFixed(1)}%
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-amber-800 text-lg">
                      {formatGrams(scaledData.totalDoughGrams)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Process Timeline & Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Kneading & Fermentation Card */}
            <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 space-y-4 shadow-md">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2 border-b border-amber-100 pb-3">
                <span className="text-xl">⏱️</span> Amasado y Tiempos de Fermentación
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-amber-50">
                  <span className="text-stone-500 font-medium">Autólisis inicial:</span>
                  <span className="font-bold text-stone-800">
                    {recipe.processSteps.autolysisMins ? `${recipe.processSteps.autolysisMins} minutos` : 'No requiere'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-amber-50">
                  <span className="text-stone-500 font-medium">Tiempos de amasado:</span>
                  <span className="font-bold text-stone-800">
                    {recipe.processSteps.kneadingSlowMins} min lento + {recipe.processSteps.kneadingFastMins} min rápido
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-amber-50">
                  <span className="text-stone-500 font-medium">TDM Deseada (Temperatura):</span>
                  <span className="font-mono font-black text-amber-700 text-sm bg-amber-100 px-2 py-0.5 rounded-lg">
                    {recipe.processSteps.targetDoughTempC} °C
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-amber-50">
                  <span className="text-stone-500 font-medium">1ª Fermentación (Bloque):</span>
                  <span className="font-bold text-stone-800">
                    {recipe.processSteps.bulkFermentationMins} min ({recipe.processSteps.bulkFolds} pliegues)
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-amber-50">
                  <span className="text-stone-500 font-medium">Reposo tras división:</span>
                  <span className="font-bold text-stone-800">
                    {recipe.processSteps.preformRestMins} min en bola
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-stone-500 font-medium">2ª Fermentación (Apresto):</span>
                  <span className="font-bold text-stone-800">
                    {recipe.processSteps.finalFermentationMins} min a {recipe.processSteps.finalFermentationTempC}°C
                  </span>
                </div>
              </div>
            </div>

            {/* Scoring & Baking Card */}
            <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 space-y-4 shadow-md">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2 border-b border-amber-100 pb-3">
                <span className="text-xl">🔥</span> Greñado y Horno de Suela
              </h3>

              <div className="space-y-3 text-xs">
                <div className="py-2 border-b border-amber-50">
                  <span className="text-stone-500 font-medium block mb-1">Tipo de Greñado / Corte:</span>
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 font-bold">
                    🔪 {recipe.processSteps.scoringType}
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-amber-50">
                  <span className="text-stone-500 font-medium">Temperatura de Cocción:</span>
                  <span className="font-mono font-black text-red-600 text-sm bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                    {recipe.processSteps.bakingTempC} °C
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-amber-50">
                  <span className="text-stone-500 font-medium">Tiempo de horneado:</span>
                  <span className="font-bold text-stone-800">
                    {recipe.processSteps.bakingTimeMins} minutos
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-amber-50">
                  <span className="text-stone-500 font-medium">Inyección de Vapor inicial:</span>
                  <span className="font-bold text-stone-800">
                    {recipe.processSteps.steamSeconds} segundos
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-stone-500 font-medium">Apertura de Tiro final:</span>
                  <span className="font-bold text-stone-800">
                    Últimos {recipe.processSteps.ovenDeckVentilationMins} min para corteza crujiente
                  </span>
                </div>
              </div>

              {recipe.processSteps.detailedNotes && (
                <div className="mt-4 p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-stone-700 leading-relaxed">
                  <strong className="text-amber-900 block mb-1 font-extrabold">💡 Consejos del Profesor de Obrador:</strong>
                  {recipe.processSteps.detailedNotes}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Mobile Photo Attachment Center */}
      {activeTab === 'mobile_upload' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Toast feedback notification */}
          {toastMessage && (
            <div className="p-4 rounded-3xl bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-white hover:text-emerald-100 text-xs font-bold underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Hidden Mobile Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleMobileFileSelect}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleMobileFileSelect}
            className="hidden"
          />

          {/* Mobile Attachment Top Header */}
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 rounded-full bg-orange-100 text-orange-950 font-black text-xs border border-orange-300 flex items-center gap-1.5 shadow-xs">
                    <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                    <span>Móvil & Taller 1º Curso</span>
                  </span>
                  <span className="text-xs text-stone-500 font-bold">
                    Fórmula: <strong className="text-stone-800">{recipe.title}</strong>
                  </span>
                </div>

                <div className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                  {recipe.photos.length} foto{recipe.photos.length !== 1 ? 's' : ''} en la ficha
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-display flex items-center gap-2.5">
                  <span>📱</span> Adjuntar Fotografía desde el Teléfono Móvil
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed mt-1">
                  Usa la cámara de tu smartphone para fotografiar cada fase de tu elaboración (amasado, fermentación en bloque, greñado y pieza horneada) y clasifícala al instante.
                </p>
              </div>

              {/* Two Big Mobile Trigger Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Option 1: Mobile Camera Direct */}
                <div 
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-5 sm:p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-3xl shadow-lg shadow-amber-500/25 cursor-pointer transition-all transform hover:-translate-y-1 group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                      📸
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-black/20 text-white text-[10px] font-black uppercase tracking-wider">
                      Cámara Trasera
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-black text-white">
                      Tomar Foto con Cámara Móvil
                    </h3>
                    <p className="text-xs text-amber-100 font-medium mt-1 leading-relaxed">
                      Abre la cámara de tu teléfono móvil de inmediato para capturar la bandeja o el corte de miga.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mt-4 w-full py-2.5 bg-stone-950/80 hover:bg-black text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-colors pointer-events-none"
                  >
                    <Camera className="w-4 h-4 text-amber-300" />
                    <span>Disparar Cámara Móvil</span>
                  </button>
                </div>

                {/* Option 2: Mobile Photo Gallery */}
                <div 
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-5 sm:p-6 bg-white hover:bg-amber-50/60 border-2 border-amber-200 hover:border-amber-400 rounded-3xl shadow-md cursor-pointer transition-all transform hover:-translate-y-1 group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                      🖼️
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                      Carrete / Galería
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-black text-stone-900 group-hover:text-amber-700 transition-colors">
                      Elegir del Álbum del Móvil
                    </h3>
                    <p className="text-xs text-stone-600 font-medium mt-1 leading-relaxed">
                      Elige fotos ya capturadas con tu móvil durante la práctica de hoy o de días anteriores.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mt-4 w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-colors pointer-events-none border border-amber-300"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    <span>Abrir Galería de Fotos</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Active Mobile Photo Preview & Tagging Studio */}
          {mobilePhotoPreview && (
            <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="text-lg font-black text-stone-900">
                    ✨ Nueva Fotografía Capturada para Guardar
                  </h3>
                </div>

                <button
                  onClick={() => setMobilePhotoPreview(null)}
                  className="text-xs text-stone-500 hover:text-stone-800 font-bold underline cursor-pointer"
                >
                  Descartar / Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Image Preview with Selected Quick Filter */}
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 border-2 border-amber-200 shadow-inner">
                    <img
                      src={mobilePhotoPreview}
                      alt="Foto tomada con móvil"
                      className="w-full h-full object-cover transition-all duration-300"
                      style={{
                        filter: 
                          selectedQuickFilter === 'dorado'
                            ? 'sepia(0.2) contrast(1.15) brightness(1.05) saturate(1.1)'
                            : selectedQuickFilter === 'miga'
                            ? 'contrast(1.25) brightness(1.05) saturate(1.05)'
                            : selectedQuickFilter === 'taller'
                            ? 'hue-rotate(-8deg) saturate(1.15) contrast(1.1)'
                            : 'none',
                      }}
                    />

                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-300 text-[10px] font-black flex items-center gap-1.5 shadow-md border border-white/20">
                      <Smartphone className="w-3 h-3 text-orange-400" />
                      <span>Cámara de Móvil</span>
                    </div>

                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[11px] text-white bg-black/60 backdrop-blur-md p-2 rounded-xl">
                      <span className="font-bold capitalize">{mobilePhotoType}</span>
                      <span className="font-mono text-amber-300">Tª {mobilePhotoTemp}°C</span>
                    </div>
                  </div>

                  {/* Quick Filters Selector */}
                  <div>
                    <label className="text-xs font-extrabold text-stone-700 block mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Filtro de Obrador Rápido:
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { id: 'original', label: 'Neutro Taller', icon: '📷' },
                        { id: 'dorado', label: 'Dorado Crujiente', icon: '🥖' },
                        { id: 'miga', label: 'Miga Clara', icon: '🍞' },
                        { id: 'taller', label: 'Neutralizar Luz', icon: '💡' },
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedQuickFilter(f.id as any)}
                          className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer text-[11px] ${
                            selectedQuickFilter === f.id
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-black'
                              : 'bg-amber-50/80 hover:bg-amber-100 text-stone-700 border-amber-200'
                          }`}
                        >
                          <span>{f.icon}</span>
                          <span>{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tagging & Notes Form */}
                <div className="space-y-4 flex flex-col justify-between">
                  
                  {/* Phase of baking selector */}
                  <div>
                    <label className="text-xs font-extrabold text-stone-700 block mb-1.5">
                      ¿Qué fase de la elaboración muestra esta fotografía?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { type: 'corteza', label: 'Corteza y Suela', icon: '🥖' },
                        { type: 'miga', label: 'Alveolos / Miga', icon: '🍞' },
                        { type: 'greñado', label: 'Greñado / Corte', icon: '🔪' },
                        { type: 'proceso', label: 'Amasado / Ferment.', icon: '🥣' },
                        { type: 'final', label: 'Pieza Terminada', icon: '🥐' },
                      ].map(stage => (
                        <button
                          key={stage.type}
                          type="button"
                          onClick={() => setMobilePhotoType(stage.type as any)}
                          className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            mobilePhotoType === stage.type
                              ? 'bg-amber-100 border-amber-400 text-amber-950 font-black shadow-xs ring-2 ring-amber-400/50'
                              : 'bg-white hover:bg-amber-50 text-stone-700 border-amber-200'
                          }`}
                        >
                          <span className="text-base">{stage.icon}</span>
                          <span className="text-[11px] font-bold mt-1">{stage.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Caption & Observations */}
                  <div>
                    <label className="text-xs font-extrabold text-stone-700 block mb-1">
                      Pie de foto / Detalle técnico:
                    </label>
                    <input
                      type="text"
                      value={mobilePhotoLabel}
                      onChange={e => setMobilePhotoLabel(e.target.value)}
                      placeholder="Ej: Greña abierta a 45° con buena pestaña, alveolado irregular..."
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-2xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  {/* Dough Temp */}
                  <div>
                    <label className="text-xs font-extrabold text-stone-700 block mb-1">
                      Tª de la Masa en este instante (°C):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        value={mobilePhotoTemp}
                        onChange={e => setMobilePhotoTemp(Number(e.target.value))}
                        className="w-24 bg-amber-50/50 border border-amber-300 rounded-2xl px-3 py-2 text-xs font-mono font-bold text-stone-900 outline-none"
                      />
                      <span className="text-xs text-stone-500 font-medium">°C registrados con el termómetro de pincho</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() => handleSaveMobilePhoto(false)}
                      className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/30 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Guardar en esta Fórmula</span>
                    </button>

                    <button
                      onClick={() => handleSaveMobilePhoto(true)}
                      className="py-3 px-4 rounded-2xl bg-stone-900 hover:bg-black text-amber-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Guardar y Editar en Laboratorio</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* Gallery of photos already in this recipe */}
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <span>📸</span> Fotografías Registradas en esta Fórmula ({recipe.photos.length})
              </h3>
              <span className="text-xs text-stone-500 font-medium">
                Toca cualquier foto para ampliarla o editarla
              </span>
            </div>

            {recipe.photos.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="text-4xl">📱</div>
                <h4 className="text-sm font-bold text-stone-700">Aún no has adjuntado ninguna foto</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Pulsa en &quot;Tomar Foto con Cámara Móvil&quot; para registrar tu primera masa o pan horneado.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {recipe.photos.map(photo => (
                  <div
                    key={photo.id}
                    className="bg-amber-50/50 border border-amber-200 hover:border-amber-400 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative"
                  >
                    <div className="relative aspect-[4/3] bg-stone-900 overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />

                      {photo.metadataBadge?.capturedWithMobile && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-orange-600/90 text-white text-[9px] font-black flex items-center gap-1 shadow-sm">
                          <Smartphone className="w-2.5 h-2.5" />
                          <span>Móvil</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => onOpenPhotoEditor(photo, recipe)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-md cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          Editar
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1 text-xs">
                      <div className="font-bold text-stone-800 truncate text-[11px]">
                        {photo.label}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-500">
                        <span className="capitalize font-semibold text-amber-800">{photo.type}</span>
                        <span>{photo.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 3: Real Photos & Photo Lab */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <span>📸</span> Fotografías Reales de tus Elaboraciones
              </h3>
              <p className="text-xs text-stone-500">
                Sube fotos de tus panes y bollería tomadas con el teléfono y mejóralas con los filtros de obrador
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('mobile_upload');
                  setTimeout(() => cameraInputRef.current?.click(), 100);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/25 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>📸 Foto Móvil / Cámara</span>
              </button>

              <label className="px-4 py-2.5 bg-white hover:bg-amber-50 text-stone-700 font-bold text-xs rounded-2xl border border-amber-300 flex items-center gap-2 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Subir Archivo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {recipe.photos.length === 0 ? (
            <div className="bg-gradient-to-b from-amber-50/60 to-orange-50/40 border-2 border-dashed border-amber-300 rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-sm">
              <div className="w-20 h-20 rounded-3xl bg-amber-200/80 border-2 border-amber-400 text-amber-800 flex items-center justify-center mx-auto text-4xl shadow-inner">
                📷
              </div>
              <div>
                <h4 className="text-lg font-black text-amber-950 font-display">
                  Fotografía de la Elaboración
                </h4>
                <p className="text-xs text-stone-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Aún no has insertado fotos de esta elaboración. Usa la cámara de tu teléfono móvil o sube imágenes de la práctica de taller (amasado, greñado en suela, alveolado de la miga).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mobile_upload');
                    setTimeout(() => cameraInputRef.current?.click(), 100);
                  }}
                  className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md shadow-amber-500/30 transition-all cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Tomar Foto con Cámara Móvil</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mobile_upload');
                    setTimeout(() => galleryInputRef.current?.click(), 100);
                  }}
                  className="px-5 py-3 bg-white hover:bg-amber-100 text-amber-950 font-extrabold text-xs rounded-2xl border border-amber-300 shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <ImageIcon className="w-4 h-4 text-amber-700" />
                  <span>Elegir de Galería Móvil</span>
                </button>

                <label className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-2xl border border-stone-300 flex items-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-stone-600" />
                  <span>Subir Archivo de PC</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipe.photos.map(photo => (
                <div
                  key={photo.id}
                  className="bg-white border-2 border-amber-100 hover:border-amber-400 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col group"
                >
                  <div className="relative aspect-[4/3] bg-amber-50 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {photo.appliedFilter && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-amber-900 text-[10px] font-black flex items-center gap-1 shadow-md border border-amber-200">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {photo.appliedFilter}
                      </div>
                    )}

                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-stone-900/80 text-white text-[10px] font-mono">
                      {photo.date}
                    </div>

                    <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <button
                        onClick={() => onOpenPhotoEditor(photo, recipe)}
                        className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                        Abrir Laboratorio Fotográfico
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-extrabold text-xs text-stone-900 line-clamp-1">{photo.label}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                        <span className="capitalize font-bold text-amber-800">{photo.type}</span>
                        {photo.metadataBadge?.doughTemp && (
                          <>
                            <span>•</span>
                            <span>Tª {photo.metadataBadge.doughTemp}°C</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                      <button
                        onClick={() => onOpenPhotoEditor(photo, recipe)}
                        className="text-xs text-amber-600 hover:text-amber-700 font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Mejorar con Filtros
                      </button>

                      <a
                        href={photo.url}
                        download={`panapp_${photo.id}.jpg`}
                        className="text-[11px] text-stone-500 hover:text-stone-800 font-medium transition-colors"
                      >
                        Descargar
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Tab 2: Technical Sheet Generator & Export/Print */}
      {activeTab === 'generate_sheet' && (
        <div className="space-y-6">
          
          {/* Top Control Toolbar (no-print) */}
          <div className="no-print bg-white border-2 border-amber-200 rounded-3xl p-6 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs mb-1.5 border border-emerald-300">
                  <span>📄 Generador de Fichas de Fabricación</span>
                </div>
                <h3 className="text-xl font-black text-stone-900 font-display flex items-center gap-2">
                  Ficha Técnica de Obrador: Imprimir y Exportar 🖨️✨
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Escala la cantidad de harina, ajusta las condiciones de tu taller y obtén un documento normalizado listo para imprimir en A4 o guardar en PDF.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ficha (A4)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  title="Abre el cuadro de diálogo para guardar como archivo PDF"
                  className="px-3.5 py-2.5 bg-stone-900 hover:bg-black text-amber-300 hover:text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Exportar a PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySheetText}
                  className="px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar texto técnico para informes o tareas"
                >
                  <Copy className="w-4 h-4 text-amber-700" />
                  <span>Copiar Texto</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Descargar datos en formato JSON"
                >
                  <FileSpreadsheet className="w-4 h-4 text-stone-600" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Config Grid: Scale & Workshop Variables */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              
              {/* 1. Flour Scale Selection */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                <span className="font-extrabold text-amber-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-600" />
                    Escala de Harina Base:
                  </span>
                  <span className="text-[11px] font-mono text-amber-700 font-bold">
                    {sheetScaleFlourKg} kg ({baseFlourGramsForSheet} g)
                  </span>
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 5, 10, 25].map(kg => (
                    <button
                      key={kg}
                      type="button"
                      onClick={() => setSheetScaleFlourKg(kg)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        sheetScaleFlourKg === kg
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white hover:bg-amber-100 text-stone-700 border border-amber-200'
                      }`}
                    >
                      {kg} kg {kg === 25 ? '🌾' : ''}
                    </button>
                  ))}
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <label className="text-[11px] text-stone-500">Otro (kg):</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={sheetScaleFlourKg}
                    onChange={e => setSheetScaleFlourKg(Math.max(0.1, Number(e.target.value) || 1))}
                    className="w-20 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-center"
                  />
                  <span className="text-[11px] text-stone-400">
                    ≈ {sheetEstimatedPieces} piezas
                  </span>
                </div>
              </div>

              {/* 2. TDM and Workshop Temperatures */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-600" />
                  Temperaturas de Obrador (°C):
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-500 block font-medium">Tª Sala:</label>
                    <input
                      type="number"
                      value={sheetRoomTemp}
                      onChange={e => setSheetRoomTemp(Number(e.target.value) || 20)}
                      className="w-full px-1.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block font-medium">Tª Harina:</label>
                    <input
                      type="number"
                      value={sheetFlourTemp}
                      onChange={e => setSheetFlourTemp(Number(e.target.value) || 20)}
                      className="w-full px-1.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block font-medium">Fricción:</label>
                    <input
                      type="number"
                      value={sheetFriction}
                      onChange={e => setSheetFriction(Number(e.target.value) || 9)}
                      className="w-full px-1.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-center"
                    />
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl border border-amber-200 text-[11px] text-amber-900 font-bold flex items-center justify-between">
                  <span>Tª Agua calculada:</span>
                  <span className="font-mono text-sm font-black text-amber-700">{sheetCalculatedWaterTemp}°C</span>
                </div>
              </div>

              {/* 3. Student & Brigade Info */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-600" />
                  Datos de la Práctica:
                </span>

                <div>
                  <label className="text-[10px] text-stone-500 block">Alumno / Brigada:</label>
                  <input
                    type="text"
                    value={sheetStudent}
                    onChange={e => setSheetStudent(e.target.value)}
                    placeholder="Nombre del alumno"
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 block">Mesa / Brigada:</label>
                  <input
                    type="text"
                    value={sheetBrigade}
                    onChange={e => setSheetBrigade(e.target.value)}
                    placeholder="Brigada 1"
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              {/* 4. Date and Teacher */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  Fecha y Docente:
                </span>

                <div>
                  <label className="text-[10px] text-stone-500 block">Fecha de Horneado:</label>
                  <input
                    type="date"
                    value={sheetDate}
                    onChange={e => setSheetDate(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 block">Profesor Evaluador:</label>
                  <input
                    type="text"
                    value={sheetTeacher}
                    onChange={e => setSheetTeacher(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* THE PRINTABLE TECHNICAL SHEET (A4 DOSSIER) */}
          <div 
            id="printable-bakery-sheet"
            className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-stone-900 space-y-6 max-w-5xl mx-auto"
          >
            
            {/* Header: Official Vocational Training Banner */}
            <div className="border-b-2 border-stone-900 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-900 flex items-center justify-center text-3xl font-black shadow-sm shrink-0 border border-stone-900">
                    🥖
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest text-amber-800 block">
                      DEPARTAMENTO DE HOSTELERÍA Y TURISMO • FORMACIÓN PROFESIONAL
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-stone-950 font-display">
                      FICHA TÉCNICA DE PRODUCCIÓN EN OBRADOR
                    </h2>
                    <span className="text-xs font-semibold text-stone-600">
                      Ciclo Formativo de Grado Medio: Panadería, Repostería y Confitería
                    </span>
                  </div>
                </div>

                <div className="text-right sm:text-right shrink-0 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-stone-100 border border-stone-800 font-black block sm:inline-block">
                    CÓDIGO: FTC-{recipe.id.toUpperCase()}
                  </span>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Emisión: {sheetDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Identification Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-300 text-xs">
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase block">Elaboración:</span>
                <strong className="text-stone-950 text-sm font-display block leading-tight">{recipe.title}</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase block">Familia:</span>
                <strong className="text-amber-900 font-bold block">{recipe.category.replace(/_/g, ' ').toUpperCase()}</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase block">Alumno(s) / Brigada:</span>
                <span className="text-stone-900 font-bold block truncate">{sheetStudent} ({sheetBrigade})</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase block">Profesor Evaluador:</span>
                <span className="text-stone-900 font-bold block">{sheetTeacher}</span>
              </div>
            </div>

            {/* Technical Summary Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-300 text-center">
                <span className="text-[10px] text-stone-600 font-bold uppercase block">Harina Base:</span>
                <strong className="text-base font-black font-mono text-stone-950">{sheetScaleFlourKg} kg</strong>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-300 text-center">
                <span className="text-[10px] text-stone-600 font-bold uppercase block">Hidratación:</span>
                <strong className="text-base font-black font-mono text-amber-800">{currentHydration}%</strong>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-300 text-center">
                <span className="text-[10px] text-stone-600 font-bold uppercase block">Peso Total Masa:</span>
                <strong className="text-base font-black font-mono text-stone-950">{(sheetTotalDoughWeight / 1000).toFixed(2)} kg</strong>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-300 text-center">
                <span className="text-[10px] text-stone-600 font-bold uppercase block">Rendimiento:</span>
                <strong className="text-base font-black font-mono text-stone-950">{sheetEstimatedPieces} piezas</strong>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-300 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-stone-600 font-bold uppercase block">Harina W / P-L:</span>
                <strong className="text-sm font-black font-mono text-stone-950">{recipe.flourSpecs.strengthW || 'W200'}</strong>
              </div>
            </div>

            {/* TDM Mathematical Control Box */}
            <div className="p-4 bg-amber-50/80 rounded-2xl border-2 border-amber-300 text-xs space-y-2 page-break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
                <span className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-700" />
                  CONTROL DE TEMPERATURA DESEADA DE LA MASA (TDM)
                </span>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-200 text-amber-950">
                  TDM OBJETIVO: {recipe.processSteps.targetDoughTempC}°C
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                <div>
                  <p className="text-stone-700 font-medium leading-relaxed">
                    <strong>Fórmula del Agua:</strong> Tª Agua = (TDM × 3) - (Tª Ambiente + Tª Harina + Fricción)
                  </p>
                  <p className="font-mono text-stone-800 mt-1">
                    Cálculo: ({recipe.processSteps.targetDoughTempC} × 3) - ({sheetRoomTemp}°C + {sheetFlourTemp}°C + {sheetFriction}°C)
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-amber-300 flex items-center justify-between">
                  <span className="font-bold text-amber-950">Temperatura a regular en el Agua:</span>
                  <span className="font-mono text-lg font-black text-amber-800">{sheetCalculatedWaterTemp}°C</span>
                </div>
              </div>
            </div>

            {/* Formulation Table (Baker's %) */}
            <div className="space-y-2 page-break-inside-avoid">
              <h4 className="font-black text-stone-950 text-sm flex items-center justify-between">
                <span>1. FÓRMULA MAESTRA CON PORCENTAJE PANADERO (%)</span>
                <span className="text-xs font-medium text-stone-500">
                  Base calculada para {sheetScaleFlourKg} kg de harina
                </span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-stone-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-900 text-white font-mono text-[11px]">
                      <th className="py-2.5 px-3 border border-stone-800">#</th>
                      <th className="py-2.5 px-3 border border-stone-800">Ingrediente</th>
                      <th className="py-2.5 px-3 border border-stone-800">Tipo</th>
                      <th className="py-2.5 px-3 border border-stone-800 text-right">% Panadero</th>
                      <th className="py-2.5 px-3 border border-stone-800 text-right">Fórmula Base (1 kg)</th>
                      <th className="py-2.5 px-3 border border-stone-800 text-right font-black bg-stone-800">
                        Tanda Taller ({sheetScaleFlourKg} kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {sheetScaledIngredients.map((ing, idx) => (
                      <tr key={ing.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                        <td className="py-2 px-3 font-mono text-stone-400 border border-stone-200">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-stone-900 border border-stone-200">
                          {ing.name}
                          {ing.isFlourBase && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                              Harina 100%
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 capitalize text-stone-500 border border-stone-200">{ing.type}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-800 border border-stone-200">
                          {ing.percentage}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-stone-600 border border-stone-200">
                          {ing.grams} g
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-stone-950 border border-stone-200 bg-amber-50/50">
                          {ing.scaledGrams >= 1000 ? `${(ing.scaledGrams / 1000).toFixed(2)} kg` : `${ing.scaledGrams} g`}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-stone-100 font-bold border-t-2 border-stone-800 text-stone-950">
                      <td colSpan={3} className="py-2.5 px-3 uppercase text-[11px] font-black border border-stone-300">
                        Total Masa en Amasadora:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-900 border border-stone-300">
                        {sheetScaledIngredients.reduce((s, i) => s + i.percentage, 0).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border border-stone-300">
                        {recipe.ingredients.reduce((s, i) => s + i.grams, 0)} g
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-amber-950 text-sm bg-amber-100 border border-stone-300">
                        {(sheetTotalDoughWeight / 1000).toFixed(2)} kg ({sheetTotalDoughWeight} g)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Protocol & Process Steps Sequence */}
            <div className="space-y-2 page-break-inside-avoid">
              <h4 className="font-black text-stone-950 text-sm">
                2. PROTOCOLO Y PARÁMETROS DE FABRICACIÓN EN TALLER
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* Phase 1: Amasado */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-950">
                    <span>A) Amasado y Formación de Gluten</span>
                    <span className="font-mono text-amber-800">TDM: {recipe.processSteps.targetDoughTempC}°C</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-0.5 text-[11px]">
                    <li>Velocidad 1 (mezclado lento): <strong>{recipe.processSteps.kneadingSlowMins} minutos</strong>.</li>
                    <li>Velocidad 2 (desarrollo rápido): <strong>{recipe.processSteps.kneadingFastMins} minutos</strong>.</li>
                    {recipe.processSteps.autolysisMins ? (
                      <li>Autólisis de harina + agua previa: <strong>{recipe.processSteps.autolysisMins} minutos</strong>.</li>
                    ) : null}
                  </ul>
                </div>

                {/* Phase 2: Fermentación Bloque */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-950">
                    <span>B) Fermentación en Bloque (1ª Fermentación)</span>
                    <span className="font-mono text-stone-600">{recipe.processSteps.bulkFermentationMins} min</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-0.5 text-[11px]">
                    <li>Reposo en cubeta enharinada: <strong>{recipe.processSteps.bulkFermentationMins} minutos</strong>.</li>
                    <li>Número de pliegues (folds) para dar fuerza: <strong>{recipe.processSteps.bulkFolds} pliegue(s)</strong>.</li>
                  </ul>
                </div>

                {/* Phase 3: División y Preformado */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-950">
                    <span>C) División, Pesaje y Reposo en Bola</span>
                    <span className="font-mono text-stone-600">Pieza: {recipe.processSteps.divisionWeightGrams} g</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-0.5 text-[11px]">
                    <li>Corte en divisora/pesaje: <strong>{recipe.processSteps.divisionWeightGrams} g por porción</strong>.</li>
                    <li>Boleado suave y reposo en mesa: <strong>{recipe.processSteps.preformRestMins} minutos</strong>.</li>
                  </ul>
                </div>

                {/* Phase 4: Formado y Fermentación Final */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-950">
                    <span>D) Formado y Fermentación Final (Apresto)</span>
                    <span className="font-mono text-stone-600">{recipe.processSteps.finalFermentationMins} min</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-0.5 text-[11px]">
                    <li>Tiempo de fermentación en cámara/tela: <strong>{recipe.processSteps.finalFermentationMins} minutos</strong>.</li>
                    <li>Temperatura de cámara de fermentación: <strong>{recipe.processSteps.finalFermentationTempC}°C</strong>.</li>
                  </ul>
                </div>

                {/* Phase 5: Greñado */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-950">
                    <span>E) Greñado / Corte y Pintado</span>
                    <span className="font-mono text-amber-800">Cuchilla 45°</span>
                  </div>
                  <p className="text-[11px] text-stone-700">
                    Técnica: <strong>{recipe.processSteps.scoringType}</strong>. Cargar rápidamente sin desgasificar.
                  </p>
                </div>

                {/* Phase 6: Horno */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-950">
                    <span>F) Cocción en Horno de Suela Refractaria</span>
                    <span className="font-mono text-red-700 font-bold">{recipe.processSteps.bakingTempC}°C</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-0.5 text-[11px]">
                    <li>Temperatura: <strong>{recipe.processSteps.bakingTempC}°C</strong> durante <strong>{recipe.processSteps.bakingTimeMins} min</strong>.</li>
                    <li>Golpe de vapor al entrar: <strong>{recipe.processSteps.steamSeconds} segundos</strong>.</li>
                    <li>Apertura de tiro / ventilación: <strong>{recipe.processSteps.ovenDeckVentilationMins} minutos</strong> finales.</li>
                  </ul>
                </div>

              </div>

              {recipe.processSteps.detailedNotes && (
                <div className="p-3 bg-stone-100 rounded-xl border border-stone-300 text-xs">
                  <strong className="text-stone-900 block font-bold">Instrucciones y Claves del Obrador:</strong>
                  <p className="text-stone-700 mt-0.5 leading-relaxed">{recipe.processSteps.detailedNotes}</p>
                </div>
              )}
            </div>

            {/* Photographic documentation */}
            <div className="space-y-2 page-break-inside-avoid">
              <h4 className="font-black text-stone-950 text-sm">
                3. REGISTRO FOTOGRÁFICO DE LA ELABORACIÓN
              </h4>

              {recipe.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {recipe.photos.slice(0, 3).map((p, i) => (
                    <div key={p.id || i} className="border border-stone-400 rounded-xl overflow-hidden bg-stone-50 p-1.5 text-center">
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-stone-200">
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-stone-800 block mt-1 truncate">
                        {p.label} ({p.date})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-stone-400 rounded-2xl p-6 text-center bg-stone-50/50 space-y-1">
                  <span className="text-2xl block">📸</span>
                  <span className="text-xs font-bold text-stone-800 block">
                    Fotografía de la Elaboración en Obrador
                  </span>
                  <p className="text-[10px] text-stone-500 max-w-md mx-auto">
                    Pega aquí la foto tomada con el móvil durante la clase para evaluar el desarrollo de la greña, color de corteza y alveolado de la miga.
                  </p>
                </div>
              )}
            </div>

            {/* Official Signatures & Rubric Block */}
            <div className="border-t-2 border-stone-900 pt-5 space-y-3 page-break-inside-avoid">
              <h4 className="font-black text-stone-950 text-sm uppercase">
                4. RÚBRICA Y VISTO BUENO DEL OBRADOR
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] p-3 bg-stone-50 rounded-xl border border-stone-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded text-stone-900" />
                  <span>Greña / Volumen</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded text-stone-900" />
                  <span>Crujido Corteza</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded text-stone-900" />
                  <span>Miga y Alveolos</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded text-stone-900" />
                  <span>Sabor y Fermentación</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded text-stone-900" />
                  <span>Limpieza y BPM</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 text-xs">
                <div className="border border-stone-400 rounded-xl p-4 text-center h-28 flex flex-col justify-between">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">
                    Firma del Alumno / Jefe de Brigada:
                  </span>
                  <div className="border-b border-stone-300 w-3/4 mx-auto" />
                  <span className="text-[11px] font-semibold text-stone-700">{sheetStudent}</span>
                </div>

                <div className="border border-stone-400 rounded-xl p-4 text-center h-28 flex flex-col justify-between">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">
                    Firma del Profesor / Maestro de Taller:
                  </span>
                  <div className="border-b border-stone-300 w-3/4 mx-auto" />
                  <span className="text-[11px] font-semibold text-stone-700">{sheetTeacher}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
