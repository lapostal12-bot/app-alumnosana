import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Scale, 
  Flame, 
  Timer, 
  Wheat, 
  Sparkles, 
  Layers, 
  Thermometer,
  Smartphone,
  Camera,
  Upload,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { Recipe, RecipeCategory, Ingredient, IngredientType, WorkGroup, BakeryPhoto } from '../types/bakery';
import { calculateHydration } from '../utils/bakerMath';
import { normalizeRecipeCategory } from '../utils/storage';

interface RecipeModalProps {
  recipe?: Recipe | Partial<Recipe> | null;
  groups: WorkGroup[];
  activeGroupId: string;
  studentName: string;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  recipe,
  groups,
  activeGroupId,
  studentName,
  onClose,
  onSave,
}) => {
  const isEditing = !!recipe && !!recipe.id && !recipe.id.startsWith('temp-');

  // Recipe general state
  const [title, setTitle] = useState<string>(recipe?.title || '');
  const [category, setCategory] = useState<RecipeCategory>(
    recipe?.category ? normalizeRecipeCategory(recipe.category) : 'pan_rustico_masa_madre'
  );
  const [description, setDescription] = useState<string>(recipe?.description || '');
  const [difficulty, setDifficulty] = useState<'Básico 1º' | 'Intermedio 1º' | 'Avanzado 1º'>(
    recipe?.difficulty || 'Básico 1º'
  );
  const [groupId, setGroupId] = useState<string>(recipe?.groupId || activeGroupId);
  const [studentAuthor, setStudentAuthor] = useState<string>(recipe?.studentAuthor || studentName);
  
  // Flour specs & Yield
  const [flourBaseWeightGrams, setFlourBaseWeightGrams] = useState<number>(recipe?.flourBaseWeightGrams || 1000);
  const [targetYieldPieces, setTargetYieldPieces] = useState<number>(recipe?.targetYieldPieces || 4);
  const [pieceWeightGrams, setPieceWeightGrams] = useState<number>(recipe?.pieceWeightGrams || 250);
  const [flourType, setFlourType] = useState<string>(recipe?.flourSpecs?.type || 'Harina Panadera W180-200');
  const [strengthW, setStrengthW] = useState<string>(recipe?.flourSpecs?.strengthW || 'W 200');
  const [plRatio, setPlRatio] = useState<string>(recipe?.flourSpecs?.plRatio || '0.5');

  // Ingredients state
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients || [
      { id: 'i-1', name: 'Harina Panadera Base', percentage: 100, grams: 1000, isFlourBase: true, type: 'harina' },
      { id: 'i-2', name: 'Agua fría de taller', percentage: 65, grams: 650, type: 'agua' },
      { id: 'i-3', name: 'Sal marina fina', percentage: 1.8, grams: 18, type: 'sal' },
      { id: 'i-4', name: 'Levadura fresca prensada', percentage: 1.5, grams: 15, type: 'levadura' },
    ]
  );

  // Process steps state
  const [kneadingSlow, setKneadingSlow] = useState<number>(recipe?.processSteps?.kneadingSlowMins || 4);
  const [kneadingFast, setKneadingFast] = useState<number>(recipe?.processSteps?.kneadingFastMins || 5);
  const [targetDoughTemp, setTargetDoughTemp] = useState<number>(recipe?.processSteps?.targetDoughTempC || 24);
  const [autolysis, setAutolysis] = useState<number>(recipe?.processSteps?.autolysisMins || 0);
  const [bulkFermentation, setBulkFermentation] = useState<number>(recipe?.processSteps?.bulkFermentationMins || 60);
  const [bulkFolds, setBulkFolds] = useState<number>(recipe?.processSteps?.bulkFolds || 1);
  const [preformRest, setPreformRest] = useState<number>(recipe?.processSteps?.preformRestMins || 15);
  const [finalFermentation, setFinalFermentation] = useState<number>(recipe?.processSteps?.finalFermentationMins || 60);
  const [finalFermentationTemp, setFinalFermentationTemp] = useState<number>(recipe?.processSteps?.finalFermentationTempC || 24);
  const [scoringType, setScoringType] = useState<string>(recipe?.processSteps?.scoringType || 'Corte longitudinal a 45°');
  const [bakingTemp, setBakingTemp] = useState<number>(recipe?.processSteps?.bakingTempC || 230);
  const [bakingTime, setBakingTime] = useState<number>(recipe?.processSteps?.bakingTimeMins || 25);
  const [steamSeconds, setSteamSeconds] = useState<number>(recipe?.processSteps?.steamSeconds || 8);
  const [ovenVentMins, setOvenVentMins] = useState<number>(recipe?.processSteps?.ovenDeckVentilationMins || 5);
  const [detailedNotes, setDetailedNotes] = useState<string>(recipe?.processSteps?.detailedNotes || '');

  // Photos state for this recipe
  const [attachedPhotos, setAttachedPhotos] = useState<BakeryPhoto[]>(() => 
    (recipe?.photos || []).filter(p => !p.url?.includes('images.unsplash.com'))
  );
  const [modalPhotoLabel, setModalPhotoLabel] = useState<string>('');
  const [modalPhotoType, setModalPhotoType] = useState<BakeryPhoto['type']>('corteza');
  const modalCameraInputRef = useRef<HTMLInputElement>(null);
  const modalGalleryInputRef = useRef<HTMLInputElement>(null);

  // Tabs inside modal
  const [formTab, setFormTab] = useState<'formula' | 'process' | 'mobile_photo'>('formula');

  // Recalculate grams when base flour or percentage changes
  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...ingredients];
    const ing = { ...updated[index], [field]: value };

    if (field === 'percentage') {
      const pct = Number(value) || 0;
      ing.grams = Math.round((flourBaseWeightGrams * pct) / 100);
    } else if (field === 'grams') {
      const g = Number(value) || 0;
      if (flourBaseWeightGrams > 0) {
        ing.percentage = Number(((g / flourBaseWeightGrams) * 100).toFixed(1));
      }
    }

    updated[index] = ing;
    setIngredients(updated);
  };

  const addIngredient = () => {
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: 'Nuevo ingrediente',
      percentage: 2,
      grams: Math.round((flourBaseWeightGrams * 2) / 100),
      type: 'otro',
    };
    setIngredients([...ingredients, newIng]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleBaseFlourChange = (newFlour: number) => {
    setFlourBaseWeightGrams(newFlour);
    setIngredients(prev =>
      prev.map(ing => ({
        ...ing,
        grams: Math.round((newFlour * ing.percentage) / 100),
      }))
    );
  };

  const handleModalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          const newPhoto: BakeryPhoto = {
            id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            url: result,
            originalUrl: result,
            label: modalPhotoLabel.trim() || `${file.name.replace(/\.[^/.]+$/, '')} (Móvil)`,
            type: modalPhotoType,
            date: new Date().toISOString().split('T')[0],
            metadataBadge: {
              recipeTitle: title.trim() || 'Receta',
              studentOrGroup: studentAuthor || 'Alumno',
              doughTemp: targetDoughTemp,
              capturedWithMobile: true,
              stage: modalPhotoType,
            },
          };
          setAttachedPhotos(prev => [newPhoto, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachedPhoto = (id: string) => {
    setAttachedPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedGroup = groups.find(g => g.id === groupId);

    const savedRecipe: Recipe = {
      id: recipe?.id || `receta-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim() || 'Ficha técnica de panadería 1º curso.',
      courseLevel: '1º CFGM Panadería y Repostería',
      difficulty,
      studentAuthor: studentAuthor.trim() || 'Alumno',
      groupId,
      groupName: selectedGroup?.name,
      createdAt: recipe?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      flourBaseWeightGrams,
      targetYieldPieces,
      pieceWeightGrams,
      flourSpecs: {
        type: flourType,
        strengthW,
        plRatio,
      },
      ingredients,
      processSteps: {
        kneadingSlowMins: kneadingSlow,
        kneadingFastMins: kneadingFast,
        targetDoughTempC: targetDoughTemp,
        autolysisMins: autolysis,
        bulkFermentationMins: bulkFermentation,
        bulkFolds,
        divisionWeightGrams: pieceWeightGrams,
        preformRestMins: preformRest,
        finalFermentationMins: finalFermentation,
        finalFermentationTempC: finalFermentationTemp,
        scoringType,
        bakingTempC: bakingTemp,
        bakingTimeMins: bakingTime,
        steamSeconds,
        ovenDeckVentilationMins: ovenVentMins,
        detailedNotes,
      },
      photos: attachedPhotos,
      observations: recipe?.observations || [],
    };

    onSave(savedRecipe);
  };

  const currentHydration = calculateHydration(ingredients);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border-2 border-amber-300 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-stone-800 animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900 font-display">
                {isEditing ? 'Editar Ficha Técnica de Obrador' : 'Nueva Receta de Panadería o Bollería 🥖🥐'}
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                1º Curso • Fórmulas con Porcentaje Panadero y Parámetros de Fermentación
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

        {/* Tab switch */}
        <div className="flex border-b border-amber-100 bg-amber-50/40 p-1.5 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFormTab('formula')}
            className={`flex-1 py-2 px-3 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              formTab === 'formula'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>1. Fórmula Panadera</span>
          </button>
          <button
            type="button"
            onClick={() => setFormTab('process')}
            className={`flex-1 py-2 px-3 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              formTab === 'process'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>2. Proceso y Tiempos</span>
          </button>
          <button
            type="button"
            onClick={() => setFormTab('mobile_photo')}
            className={`flex-1 py-2 px-3 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              formTab === 'mobile_photo'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-orange-500" />
            <span>3. Adjuntar Foto Móvil</span>
            {attachedPhotos.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-900 font-mono text-[10px] font-black">
                {attachedPhotos.length}
              </span>
            )}
          </button>
        </div>

        {/* Form Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {formTab === 'formula' && (
            <div className="space-y-5">
              
              {/* General Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-extrabold text-stone-800 block mb-1">
                    Nombre del Pan o Elaboración de Bollería *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Barra Gallega de Alta Hidratación o Croissant Francés"
                    className="w-full px-3.5 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-800 block mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as RecipeCategory)}
                    className="w-full px-3.5 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="pan">🥖 Pan</option>
                    <option value="pan_rustico_masa_madre">🌾 Pan rústico y con masa madre</option>
                    <option value="bolleria">🧁 Bollería</option>
                    <option value="bolleria_hojaldrada">🥐 Bollería hojaldrada</option>
                    <option value="bolleria_especial">⭐ Bollería especial</option>
                    <option value="pasteleria_basica">🍰 Pastelería básica</option>
                  </select>
                </div>
              </div>

              {/* Group assignment and author */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-stone-800 block mb-1">
                    Brigada de Trabajo (Mesa)
                  </label>
                  <select
                    value={groupId}
                    onChange={e => setGroupId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-800 block mb-1">
                    Alumno / Autor de la Ficha
                  </label>
                  <input
                    type="text"
                    value={studentAuthor}
                    onChange={e => setStudentAuthor(e.target.value)}
                    className="w-full px-3.5 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-800 block mb-1">
                    Nivel Pedagógico
                  </label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="Básico 1º">Básico 1º (Iniciación)</option>
                    <option value="Intermedio 1º">Intermedio 1º (Taller Ordinario)</option>
                    <option value="Avanzado 1º">Avanzado 1º (Especialidad)</option>
                  </select>
                </div>
              </div>

              {/* Flour and Yield Specs */}
              <div className="p-5 bg-amber-50/80 rounded-3xl border border-amber-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Wheat className="w-4 h-4 text-amber-600" /> Harina y Rendimiento de Masa
                  </span>
                  <div className="text-xs px-3 py-1 rounded-full bg-amber-500 text-white font-mono font-black shadow-xs">
                    💧 Hidratación: {currentHydration}%
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Tipo de Harina</label>
                    <input
                      type="text"
                      value={flourType}
                      onChange={e => setFlourType(e.target.value)}
                      placeholder="Ej. Harina Panadera W190"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-stone-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Fuerza W</label>
                    <input
                      type="text"
                      value={strengthW}
                      onChange={e => setStrengthW(e.target.value)}
                      placeholder="Ej. W220"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-stone-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Relación P/L</label>
                    <input
                      type="text"
                      value={plRatio}
                      onChange={e => setPlRatio(e.target.value)}
                      placeholder="Ej. 0.5 - 0.6"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-stone-900 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-amber-200/80">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Harina Base (100%)</label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl px-2 py-1.5">
                      <input
                        type="number"
                        step="50"
                        value={flourBaseWeightGrams}
                        onChange={e => handleBaseFlourChange(Number(e.target.value))}
                        className="w-full bg-transparent text-amber-800 font-mono font-black outline-none"
                      />
                      <span className="text-stone-500 font-bold text-xs ml-1">g</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Piezas a elaborar</label>
                    <input
                      type="number"
                      min="1"
                      value={targetYieldPieces}
                      onChange={e => setTargetYieldPieces(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-stone-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Peso por pieza</label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl px-2 py-1.5">
                      <input
                        type="number"
                        value={pieceWeightGrams}
                        onChange={e => setPieceWeightGrams(Number(e.target.value))}
                        className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                      />
                      <span className="text-stone-500 font-bold text-xs ml-1">g</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ingredients Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Fórmula Panadera (% Baker's Percentage y Gramos)
                  </span>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Añadir Ingrediente
                  </button>
                </div>

                <div className="border-2 border-amber-200 rounded-3xl overflow-hidden bg-white shadow-xs">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-amber-50/80 text-[11px] font-black text-amber-950 uppercase border-b border-amber-200">
                    <div className="col-span-4">Ingrediente</div>
                    <div className="col-span-3">Tipo</div>
                    <div className="col-span-2 text-right">% Panadero</div>
                    <div className="col-span-2 text-right">Peso (g)</div>
                    <div className="col-span-1 text-center"></div>
                  </div>

                  <div className="divide-y divide-amber-100">
                    {ingredients.map((ing, idx) => (
                      <div key={ing.id} className="grid grid-cols-12 gap-2 px-4 py-2 items-center text-xs">
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={ing.name}
                            onChange={e => updateIngredient(idx, 'name', e.target.value)}
                            className="w-full bg-amber-50/50 border border-amber-200 rounded-lg px-2.5 py-1 text-stone-900 text-xs font-bold"
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            value={ing.type}
                            onChange={e => updateIngredient(idx, 'type', e.target.value as IngredientType)}
                            className="w-full bg-amber-50/50 border border-amber-200 rounded-lg px-2 py-1 text-stone-800 text-xs font-medium cursor-pointer"
                          >
                            <option value="harina">Harina</option>
                            <option value="agua">Agua / Leche / Huevo</option>
                            <option value="sal">Sal</option>
                            <option value="levadura">Levadura fresca</option>
                            <option value="masa_madre">Masa Madre / Biga</option>
                            <option value="grasa">Mantequilla / Manteca / Aceite</option>
                            <option value="azucar">Azúcar / Miel</option>
                            <option value="mejora">Mejora / Malta / Azahar</option>
                            <option value="semillas">Semillas / Frutos</option>
                            <option value="otro">Chocolate / Otro</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center justify-end bg-amber-50/50 border border-amber-200 rounded-lg px-2 py-1">
                            <input
                              type="number"
                              step="0.1"
                              value={ing.percentage}
                              onChange={e => updateIngredient(idx, 'percentage', Number(e.target.value))}
                              className="w-14 bg-transparent text-right font-mono text-amber-800 font-extrabold outline-none text-xs"
                            />
                            <span className="text-stone-500 font-bold text-[10px] ml-1">%</span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center justify-end bg-amber-50/50 border border-amber-200 rounded-lg px-2 py-1">
                            <input
                              type="number"
                              step="1"
                              value={ing.grams}
                              onChange={e => updateIngredient(idx, 'grams', Number(e.target.value))}
                              className="w-16 bg-transparent text-right font-mono text-stone-900 font-black outline-none text-xs"
                            />
                            <span className="text-stone-500 font-bold text-[10px] ml-1">g</span>
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeIngredient(idx)}
                            disabled={ingredients.length <= 1}
                            className="p-1 text-stone-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-extrabold text-stone-800 block mb-1">
                  Descripción o Notas de la Fórmula
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Notas sobre el tipo de pan, maridaje, trucos de horneado..."
                  className="w-full px-3.5 py-2 bg-amber-50/50 border border-amber-200 rounded-2xl text-xs text-stone-900 font-medium"
                />
              </div>

            </div>
          )}

          {formTab === 'process' && (
            <div className="space-y-5">
              
              {/* Amasado y TDM */}
              <div className="p-5 bg-amber-50/80 rounded-3xl border border-amber-200 space-y-3">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-600" /> Amasado y Temperatura Deseada (TDM)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Tª Masa Deseada (TDM)</label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl px-2.5 py-2">
                      <input
                        type="number"
                        step="0.5"
                        value={targetDoughTemp}
                        onChange={e => setTargetDoughTemp(Number(e.target.value))}
                        className="w-full bg-transparent text-amber-800 font-mono font-black outline-none"
                      />
                      <span className="text-stone-500 font-bold text-xs ml-1">°C</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Autólisis (minutos)</label>
                    <input
                      type="number"
                      value={autolysis}
                      onChange={e => setAutolysis(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl font-mono text-stone-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Amasado Lento (min)</label>
                    <input
                      type="number"
                      value={kneadingSlow}
                      onChange={e => setKneadingSlow(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl font-mono text-stone-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Amasado Rápido (min)</label>
                    <input
                      type="number"
                      value={kneadingFast}
                      onChange={e => setKneadingFast(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl font-mono text-stone-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Fermentación y Formado */}
              <div className="p-5 bg-amber-50/80 rounded-3xl border border-amber-200 space-y-3">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-amber-600" /> Fermentaciones y Manipulación
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">1ª Fermentación (Bloque)</label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl px-2.5 py-2">
                      <input
                        type="number"
                        value={bulkFermentation}
                        onChange={e => setBulkFermentation(Number(e.target.value))}
                        className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                      />
                      <span className="text-stone-500 font-bold text-xs ml-1">min</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Pliegues en Bloque</label>
                    <input
                      type="number"
                      value={bulkFolds}
                      onChange={e => setBulkFolds(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl font-mono text-stone-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Reposo preformado</label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl px-2.5 py-2">
                      <input
                        type="number"
                        value={preformRest}
                        onChange={e => setPreformRest(Number(e.target.value))}
                        className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                      />
                      <span className="text-stone-500 font-bold text-xs ml-1">min</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">2ª Fermentación (Apresto)</label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl px-2.5 py-2">
                      <input
                        type="number"
                        value={finalFermentation}
                        onChange={e => setFinalFermentation(Number(e.target.value))}
                        className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                      />
                      <span className="text-stone-500 font-bold text-xs ml-1">min</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200 text-xs">
                  <label className="text-stone-800 font-bold block mb-1">
                    Tipo de Greñado / Corte / Enrollado
                  </label>
                  <input
                    type="text"
                    value={scoringType}
                    onChange={e => setScoringType(e.target.value)}
                    placeholder="Ej. Corte longitudinal a 45° o Enrollado en triángulo de croissant"
                    className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-stone-900 font-bold"
                  />
                </div>
              </div>

              {/* Horneado y Cocción */}
              <div className="p-5 bg-amber-50/80 rounded-3xl border border-amber-200 space-y-3">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" /> Parámetros del Horno
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Tª del Horno</label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl px-2.5 py-2">
                      <input
                        type="number"
                        value={bakingTemp}
                        onChange={e => setBakingTemp(Number(e.target.value))}
                        className="w-full bg-transparent text-red-600 font-mono font-black outline-none"
                      />
                      <span className="text-stone-500 font-bold text-xs ml-1">°C</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Tiempo de Horno</label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl px-2.5 py-2">
                      <input
                        type="number"
                        value={bakingTime}
                        onChange={e => setBakingTime(Number(e.target.value))}
                        className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                      />
                      <span className="text-stone-500 font-bold text-xs ml-1">min</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Golpe de Vapor</label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl px-2.5 py-2">
                      <input
                        type="number"
                        value={steamSeconds}
                        onChange={e => setSteamSeconds(Number(e.target.value))}
                        className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                      />
                      <span className="text-stone-500 font-bold text-xs ml-1">seg</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Apertura Tiro Final</label>
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl px-2.5 py-2">
                      <input
                        type="number"
                        value={ovenVentMins}
                        onChange={e => setOvenVentMins(Number(e.target.value))}
                        className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                      />
                      <span className="text-stone-500 font-bold text-xs ml-1">min</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200 text-xs">
                  <label className="text-stone-800 font-bold block mb-1">
                    Instrucciones de Cocción y Trucos
                  </label>
                  <textarea
                    rows={2}
                    value={detailedNotes}
                    onChange={e => setDetailedNotes(e.target.value)}
                    placeholder="Ej. Cargar con pala sobre solera precalentada. Bajar temperatura a los 15 minutos para evitar tostado excesivo..."
                    className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-stone-800"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Adjuntar Foto Móvil */}
          {formTab === 'mobile_photo' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Hidden Inputs */}
              <input
                ref={modalCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleModalPhotoUpload}
                className="hidden"
              />
              <input
                ref={modalGalleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleModalPhotoUpload}
                className="hidden"
              />

              {/* Mobile Photo Banner */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 text-white shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    📱
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Adjuntar Fotografías con el Móvil a esta Fórmula
                    </h3>
                    <p className="text-xs text-amber-100 font-medium">
                      Toma fotos de tu masa, piezas greñadas o productos recién horneados para guardarlas en la ficha técnica
                    </p>
                  </div>
                </div>
              </div>

              {/* Two Trigger Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => modalCameraInputRef.current?.click()}
                  className="p-5 bg-white border-2 border-dashed border-amber-400 hover:border-amber-600 hover:bg-amber-50 rounded-3xl cursor-pointer text-center space-y-2 transition-all group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform">
                    📸
                  </div>
                  <h4 className="text-sm font-extrabold text-stone-900">
                    Tomar Foto con Cámara Móvil
                  </h4>
                  <p className="text-xs text-stone-500">
                    Abre la cámara del teléfono móvil al instante para fotografiar la bandeja o la miga
                  </p>
                  <span className="inline-block mt-2 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-extrabold text-xs shadow-xs">
                    Disparar Cámara
                  </span>
                </div>

                <div
                  onClick={() => modalGalleryInputRef.current?.click()}
                  className="p-5 bg-white border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50 rounded-3xl cursor-pointer text-center space-y-2 transition-all group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform">
                    🖼️
                  </div>
                  <h4 className="text-sm font-extrabold text-stone-900">
                    Elegir de Galería / Archivos
                  </h4>
                  <p className="text-xs text-stone-500">
                    Selecciona una o varias imágenes almacenadas en la memoria de tu móvil
                  </p>
                  <span className="inline-block mt-2 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300">
                    Abrir Álbum
                  </span>
                </div>
              </div>

              {/* Photo settings for upcoming uploads */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 text-xs">
                <div className="font-extrabold text-stone-800 flex items-center gap-1.5">
                  <span>⚙️</span> Parámetros de la Foto a Adjuntar:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">
                      Fase de la foto:
                    </label>
                    <select
                      value={modalPhotoType}
                      onChange={e => setModalPhotoType(e.target.value as any)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-stone-800 font-medium"
                    >
                      <option value="corteza">🥖 Corteza y Greñado</option>
                      <option value="miga">🍞 Miga y Alveolado</option>
                      <option value="greñado">🔪 Greñado antes del Horno</option>
                      <option value="proceso">🥣 Amasado y Fermentación</option>
                      <option value="final">🥐 Pieza Terminada</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-700 font-bold block mb-1">
                      Pie de foto / Detalle (opcional):
                    </label>
                    <input
                      type="text"
                      value={modalPhotoLabel}
                      onChange={e => setModalPhotoLabel(e.target.value)}
                      placeholder="Ej: Prueba de velo tras 10 min de amasado"
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-stone-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Already attached photos grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-stone-900">
                    Fotos Adjuntas a esta Ficha ({attachedPhotos.length}):
                  </span>
                  <span className="text-stone-500 font-medium">
                    Se guardarán junto con la fórmula
                  </span>
                </div>

                {attachedPhotos.length === 0 ? (
                  <div className="text-center py-8 bg-amber-50/40 rounded-2xl border border-dashed border-amber-200 text-xs text-stone-500">
                    📷 No hay fotos adjuntadas todavía. Dispara con la cámara del móvil o elige de la galería.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {attachedPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs relative group flex flex-col"
                      >
                        <div className="relative aspect-[4/3] bg-stone-900 overflow-hidden">
                          <img
                            src={photo.url}
                            alt={photo.label}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachedPhoto(photo.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                            title="Eliminar foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2 text-[11px] flex-1 flex flex-col justify-between">
                          <div className="font-bold text-stone-800 truncate">
                            {photo.label}
                          </div>
                          <span className="capitalize text-[10px] text-amber-800 font-semibold">
                            {photo.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Footer action bar */}
          <div className="flex items-center justify-between pt-4 border-t border-amber-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Guardar Cambios' : 'Guardar Ficha en Recetario'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
