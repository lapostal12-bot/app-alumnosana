import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Calculator
} from 'lucide-react';
import { Recipe, WorkGroup } from '../types/bakery';
import { RecipeCard } from './RecipeCard';
import { calculateHydration } from '../utils/bakerMath';
import { normalizeRecipeCategory } from '../utils/storage';

interface RecipeListViewProps {
  recipes: Recipe[];
  groups: WorkGroup[];
  activeGroupId: string;
  onSelectRecipe: (recipe: Recipe) => void;
  onOpenCreateRecipe: () => void;
  onOpenQR: (recipe: Recipe) => void;
}

export const CATEGORIES_CONFIG = [
  { 
    id: 'pan', 
    label: 'PAN', 
    icon: '🥖', 
    description: 'Barras tradicionales, baguettes, pan candeal, molletes y chapatas comunes',
    borderColor: 'border-amber-300 hover:border-amber-500',
    iconBg: 'bg-amber-100 text-amber-800',
  },
  { 
    id: 'pan_rustico_masa_madre', 
    label: 'PAN RÚSTICO Y CON MASA MADRE', 
    icon: '🌾', 
    description: 'Hogazas rústicas de piedra, centeno, espelta y fermentación con masa madre natural',
    borderColor: 'border-stone-300 hover:border-amber-600',
    iconBg: 'bg-stone-200 text-stone-800',
  },
  { 
    id: 'bolleria', 
    label: 'BOLLERÍA', 
    icon: '🧁', 
    description: 'Brioche tradicional, bollos suizos, panes de leche y masas fermentadas dulces',
    borderColor: 'border-pink-300 hover:border-pink-500',
    iconBg: 'bg-pink-100 text-pink-800',
  },
  { 
    id: 'bolleria_hojaldrada', 
    label: 'BOLLERÍA HOJALDRADA', 
    icon: '🥐', 
    description: 'Croissants artesanos de mantequilla, napolitanas de chocolate y cañas hojaldradas',
    borderColor: 'border-orange-300 hover:border-orange-500',
    iconBg: 'bg-orange-100 text-orange-800',
  },
  { 
    id: 'bolleria_especial', 
    label: 'BOLLERÍA ESPECIAL', 
    icon: '⭐', 
    description: 'Ensaimadas mallorquinas, roscón de reyes, panettone y especialidades de fiesta',
    borderColor: 'border-yellow-300 hover:border-yellow-500',
    iconBg: 'bg-yellow-100 text-yellow-800',
  },
  { 
    id: 'pasteleria_basica', 
    label: 'PASTELERÍA BÁSICA', 
    icon: '🍰', 
    description: 'Masas quebradas sablée, tartaletas de frutas, pasta choux y bizcochos de taller',
    borderColor: 'border-purple-300 hover:border-purple-500',
    iconBg: 'bg-purple-100 text-purple-800',
  },
];

export const RecipeListView: React.FC<RecipeListViewProps> = ({
  recipes,
  groups,
  activeGroupId,
  onSelectRecipe,
  onOpenCreateRecipe,
  onOpenQR,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'hydration'>('date');

  const activeCategoryObj = CATEGORIES_CONFIG.find(c => c.id === selectedCategory);

  const filtered = recipes.filter(r => {
    if (!selectedCategory) return false;
    const cat = normalizeRecipeCategory(r.category);
    if (cat !== selectedCategory) return false;
    if (selectedGroupFilter !== 'all' && r.groupId !== selectedGroupFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchFlour = r.flourSpecs?.type?.toLowerCase().includes(q);
      const matchIng = r.ingredients?.some(i => i.name.toLowerCase().includes(q));
      if (!matchTitle && !matchFlour && !matchIng) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'hydration') {
      return calculateHydration(b.ingredients) - calculateHydration(a.ingredients);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="space-y-6">
      
      {/* Top clean header without orange banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-amber-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display uppercase tracking-tight">
            RECETARIO Y BOLLERÍA
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            {selectedCategory && activeCategoryObj ? (
              <span className="flex items-center gap-1.5 text-amber-800 font-bold">
                <span>{activeCategoryObj.icon}</span>
                <span>Sección: {activeCategoryObj.label}</span>
                <span className="text-stone-400 font-normal">•</span>
                <span className="text-stone-600 font-normal">{sorted.length} receta{sorted.length !== 1 ? 's' : ''} disponible{sorted.length !== 1 ? 's' : ''}</span>
              </span>
            ) : (
              'Elige una sección para abrir sus recetas y fichas técnicas de obrador'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 text-stone-700 hover:text-stone-950 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-amber-600" />
              <span>Ver todas las secciones</span>
            </button>
          )}

          <button
            onClick={onOpenCreateRecipe}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Nueva Receta</span>
          </button>
        </div>
      </div>

      {/* Recuadros de las secciones */}
      {!selectedCategory ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES_CONFIG.map(cat => {
              const count = recipes.filter(r => normalizeRecipeCategory(r.category) === cat.id).length;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`bg-white border-2 ${cat.borderColor} rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group cursor-pointer transform hover:-translate-y-1 relative overflow-hidden`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-2xl ${cat.iconBg} flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform`}>
                        {cat.icon}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-950 text-xs font-black uppercase tracking-wide border border-amber-200">
                        {count} {count === 1 ? 'Receta' : 'Recetas'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-display tracking-tight group-hover:text-amber-700 transition-colors">
                        {cat.label}
                      </h2>
                      <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-amber-100 mt-5 flex items-center justify-between font-black text-amber-700 group-hover:text-amber-600 text-xs sm:text-sm">
                    <span>ENTRAR EN ESTA SECCIÓN</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-100 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center transition-all">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* If category selected: Compact section switcher + filters + recipe cards */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* 6 Section selector bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-amber-200/80 shadow-md">
            <div className="text-[11px] font-black text-amber-950 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
              <span>Secciones de Elaboración:</span>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-amber-700 hover:text-amber-950 font-bold underline cursor-pointer text-xs"
              >
                ← Mostrar todas en grande
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {CATEGORIES_CONFIG.map(cat => {
                const isSelected = selectedCategory === cat.id;
                const count = recipes.filter(r => normalizeRecipeCategory(r.category) === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 scale-102 ring-2 ring-amber-400'
                        : 'bg-amber-50/70 hover:bg-amber-100 text-stone-800 border border-amber-200'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-extrabold text-[11px] uppercase leading-tight line-clamp-1">
                      {cat.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/30 text-white' : 'bg-amber-200/70 text-amber-950'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-amber-100 text-xs">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar pan, harina (ej. W240), chocolate o masa madre..."
                  className="w-full pl-9 pr-4 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-stone-800 placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all shadow-inner"
                />
                <Search className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedGroupFilter}
                  onChange={e => setSelectedGroupFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-stone-700 text-xs font-semibold cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="all">Todas las brigadas</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-stone-700 text-xs font-semibold cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="date">✨ Más recientes</option>
                  <option value="title">🔤 Nombre alfabético</option>
                  <option value="hydration">💧 Mayor hidratación</option>
                </select>
              </div>
            </div>
          </div>

          {/* Recipe Cards List */}
          {sorted.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-amber-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-3xl shadow-inner">
                {activeCategoryObj?.icon || '🥖'}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-display">
                No hay recetas en {activeCategoryObj?.label || 'esta sección'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Sé el primero en añadir una fórmula de taller para esta sección de elaboración.
              </p>
              <button
                onClick={onOpenCreateRecipe}
                className="mt-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl inline-flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Crear Ficha en {activeCategoryObj?.label || 'esta sección'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sorted.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={onSelectRecipe}
                  onOpenQR={onOpenQR}
                />
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
