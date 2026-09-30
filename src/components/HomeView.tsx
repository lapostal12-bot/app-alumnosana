import React from 'react';
import { 
  BookOpen, 
  Camera, 
  Users, 
  QrCode, 
  Printer, 
  Plus, 
  ArrowRight, 
  Sparkles, 
  Flame, 
  Wheat, 
  Scale, 
  Smartphone,
  Download,
  FileText,
  Calculator
} from 'lucide-react';
import { Recipe, WorkGroup } from '../types/bakery';
import { ActiveTab } from './Navbar';

interface HomeViewProps {
  recipes: Recipe[];
  groups: WorkGroup[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenCreateRecipe: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onOpenAppQR: () => void;
  onOpenCalculator: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  recipes,
  groups,
  onNavigate,
  onOpenCreateRecipe,
  onSelectRecipe,
  onOpenAppQR,
  onOpenCalculator,
}) => {
  const totalPhotos = recipes.reduce((acc, r) => acc + (r.photos?.length || 0), 0);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 animate-in fade-in duration-300">
      
      {/* 1. HERO ONLY TITLE (EN GRANDE) */}
      <div className="text-center pt-6 sm:pt-12 pb-4 space-y-3 sm:space-y-4 max-w-5xl mx-auto px-4">
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-stone-900 font-display uppercase leading-[1.08] select-none">
          CUADERNO DE PANADERÍA Y BOLLERÍA
        </h1>
        <p className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-widest text-amber-600 uppercase font-display select-none">
          RECETAS • FOTOS • GRUPOS
        </p>

        {/* QR exclusivo en el inicio */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={onOpenAppQR}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs sm:text-sm border-2 border-amber-300 shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <QrCode className="w-5 h-5 text-amber-700" />
            <span>Abrir o Descargar en Móvil por QR</span>
          </button>
        </div>
      </div>

      {/* 2. RECUADROS EN GRANDE DE LAS SECCIONES MÁS IMPORTANTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* RECUADRO 1: RECETARIO Y FÓRMULAS MAESTRAS */}
        <div 
          onClick={() => onNavigate('recipes')}
          className="bg-white border-3 border-amber-200 hover:border-amber-500 rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 flex flex-col justify-between group cursor-pointer transform hover:-translate-y-1.5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-8xl">
            🥖
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500 text-stone-950 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform">
                🥖
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs sm:text-sm font-black uppercase tracking-wide border border-amber-300">
                {recipes.length} Fórmulas
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight group-hover:text-amber-600 transition-colors">
                RECETAS Y FÓRMULAS
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
                Accede a las fórmulas de panes rústicos, masa madre y bollería. Con cálculo automático de porcentaje panadero, hidratación exacta y control de TDM.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-bold text-stone-700">
                🥖 Rústicos & MM
              </span>
              <span className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-bold text-stone-700">
                🥐 Bollería Hojaldrada
              </span>
              <span className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-bold text-stone-700">
                ⚖️ Baker %
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-amber-100 mt-6 flex items-center justify-between font-black text-amber-700 group-hover:text-amber-600 text-sm sm:text-base">
            <span>ENTRAR AL RECETARIO</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center transition-all">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* RECUADRO 2: LABORATORIO FOTOGRÁFICO */}
        <div 
          onClick={() => onNavigate('photolab')}
          className="bg-white border-3 border-amber-200 hover:border-orange-500 rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 flex flex-col justify-between group cursor-pointer transform hover:-translate-y-1.5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-8xl">
            📸
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-orange-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform">
                📸
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-900 text-xs sm:text-sm font-black uppercase tracking-wide border border-orange-300">
                {totalPhotos} Fotos Reales
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight group-hover:text-orange-600 transition-colors">
                FOTOS & LABORATORIO
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
                Captura fotos reales desde tu teléfono móvil. Aplica filtros especializados para corregir la luz del obrador y resaltar el dorado de corteza o el alveolo de la miga.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-bold text-stone-700">
                ✨ Filtros Obrador
              </span>
              <span className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-bold text-stone-700">
                📱 Subida Móvil
              </span>
              <span className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-bold text-stone-700">
                🥖 Corteza & Miga
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-orange-100 mt-6 flex items-center justify-between font-black text-orange-700 group-hover:text-orange-600 text-sm sm:text-base">
            <span>ABRIR LABORATORIO FOTOGRÁFICO</span>
            <div className="w-10 h-10 rounded-2xl bg-orange-100 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-all">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* RECUADRO 3: BRIGADAS Y GRUPOS DE TRABAJO */}
        <div 
          onClick={() => onNavigate('groups')}
          className="bg-white border-3 border-amber-200 hover:border-purple-500 rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col justify-between group cursor-pointer transform hover:-translate-y-1.5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-8xl">
            👥
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-purple-600 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform">
                👥
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs sm:text-sm font-black uppercase tracking-wide border border-purple-300">
                {groups.length} Brigadas
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight group-hover:text-purple-600 transition-colors">
                GRUPOS Y BRIGADAS
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
                Organización de mesas de trabajo y brigadas de alumnos. Asigna las masas del día, jefes de partida y gestiona la producción en equipo durante el taller.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-bold text-stone-700">
                🥣 Mesas de Trabajo
              </span>
              <span className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-bold text-stone-700">
                👨‍🍳 Alumnos de 1º
              </span>
              <span className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-bold text-stone-700">
                📋 Asignación de Panes
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-purple-100 mt-6 flex items-center justify-between font-black text-purple-700 group-hover:text-purple-600 text-sm sm:text-base">
            <span>GESTIONAR BRIGADAS</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* RECUADRO 4: CALCULADORA DE TDM Y PORCENTAJE PANADERO */}
        <div 
          onClick={onOpenCalculator}
          className="bg-white border-3 border-amber-300 hover:border-amber-600 rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 flex flex-col justify-between group cursor-pointer transform hover:-translate-y-1.5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-8xl">
            🧮
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500 text-stone-950 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform">
                🧮
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-950 text-xs sm:text-sm font-black uppercase tracking-wide border border-amber-300">
                TDM & % Panadero
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight group-hover:text-amber-700 transition-colors">
                CALCULADORA DE OBRADOR
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
                Calcula la temperatura de base y TDM (temperatura deseada de masa), la temperatura exacta del agua para amasar según fricción y el porcentaje del panadero.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-amber-50 text-amber-900 rounded-xl text-xs font-bold border border-amber-200">
                🌡️ TDM de Masa
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-900 rounded-xl text-xs font-bold border border-amber-200">
                💧 Temperatura de Agua
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-900 rounded-xl text-xs font-bold border border-amber-200">
                ⚖️ Baker %
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-amber-200 mt-6 flex items-center justify-between font-black text-amber-800 group-hover:text-amber-700 text-sm sm:text-base">
            <span>ABRIR CALCULADORA TDM</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 group-hover:bg-amber-500 group-hover:text-stone-950 flex items-center justify-center transition-all">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* RECUADRO: NUEVA FICHA / ESCANEO DE RECETA */}
        <div 
          onClick={onOpenCreateRecipe}
          className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 border-3 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:shadow-amber-600/30 text-white transition-all duration-300 flex flex-col justify-between group cursor-pointer transform hover:-translate-y-1.5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none text-8xl">
            ✨
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white text-stone-900 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform">
                ➕
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs sm:text-sm font-black uppercase tracking-wide border border-white/40">
                Nuevo
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
                AÑADIR NUEVA RECETA
              </h2>
              <p className="text-sm sm:text-base text-amber-50 leading-relaxed font-medium">
                Crea una nueva fórmula maestra con ingredientes en porcentaje panadero o escanea una receta física desde el libro o cuaderno de clase.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold text-white border border-white/20">
                📸 Escaneo con Cámara
              </span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold text-white border border-white/20">
                ✍️ Formulario Manual
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-white/20 mt-6 flex items-center justify-between font-black text-white text-sm sm:text-base">
            <span>CREAR FICHA DE OBRADOR</span>
            <div className="w-10 h-10 rounded-2xl bg-white text-stone-900 group-hover:scale-110 flex items-center justify-center transition-all shadow-md">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
