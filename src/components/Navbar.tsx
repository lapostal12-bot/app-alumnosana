import React, { useState } from 'react';
import { 
  Wheat, 
  BookOpen, 
  Calendar, 
  Camera, 
  Users, 
  QrCode, 
  Calculator, 
  ChevronDown, 
  Sparkles,
  Menu,
  X,
  Cake,
  Heart
} from 'lucide-react';
import { WorkGroup } from '../types/bakery';

export type ActiveTab = 'home' | 'recipes' | 'photolab' | 'groups' | 'qrhub';

interface NavbarProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  groups: WorkGroup[];
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
  studentName: string;
  onOpenCalculator: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  groups,
  activeGroupId,
  onSelectGroup,
  studentName,
  onOpenCalculator,
  onResetData,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-sm text-stone-800">
      
      {/* Cheerful top ticker / welcome bar */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-[11px] font-semibold py-1 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
        <span>🥐 Taller de Panadería & Bollería 1º</span>
        <span>•</span>
        <span className="hidden sm:inline">¡Harina, fermentación, fuego y pasión!</span>
        <span>•</span>
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
          Ciclo Formativo Oficial
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('home')}
            title="Ir al Inicio"
            className="flex items-center cursor-pointer group select-none shrink-0"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 text-stone-900 flex items-center justify-center font-black shadow-md shadow-amber-500/30 group-hover:scale-105 group-hover:rotate-2 transition-all">
              <span className="text-2xl drop-shadow-sm">🥖</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-amber-50/80 p-1.5 rounded-2xl border border-amber-200/60 shadow-xs">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <span>🏠</span>
              <span>Inicio</span>
            </button>

            <button
              onClick={() => handleNavClick('recipes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'recipes'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <span>🥖</span>
              <span>Recetario & Bollería</span>
            </button>

            <button
              onClick={() => handleNavClick('photolab')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'photolab'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <span>📸</span>
              <span>Laboratorio Fotográfico</span>
            </button>

            <button
              onClick={() => handleNavClick('groups')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'groups'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <span>👥</span>
              <span>Brigadas de Mesa</span>
            </button>

            <button
              onClick={() => handleNavClick('qrhub')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'qrhub'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <span>📲</span>
              <span>Descargar por QR</span>
            </button>

            <button
              onClick={onOpenCalculator}
              title="Calculadora de TDM y Porcentaje Panadero"
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 shadow-xs"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-700" />
              <span>Calculadora</span>
            </button>
          </nav>

          {/* Mobile Hamburger toggle (only visible on small screens) */}
          <div className="flex items-center gap-2 shrink-0 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-amber-50 text-stone-700 hover:text-stone-950 border border-amber-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-amber-100 space-y-2 animate-in slide-in-from-top-4 duration-200 bg-amber-50/70 p-3 rounded-2xl mb-3 shadow-md">
            <button
              onClick={() => handleNavClick('home')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                currentTab === 'home' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-700 bg-white hover:bg-amber-100'
              }`}
            >
              <span>🏠</span>
              <span>Inicio</span>
            </button>

            <button
              onClick={() => handleNavClick('recipes')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                currentTab === 'recipes' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-700 bg-white hover:bg-amber-100'
              }`}
            >
              <span>🥖</span>
              <span>Recetario & Bollería</span>
            </button>

            <button
              onClick={() => handleNavClick('photolab')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                currentTab === 'photolab' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-700 bg-white hover:bg-amber-100'
              }`}
            >
              <span>📸</span>
              <span>Laboratorio de Fotos & Filtros</span>
            </button>

            <button
              onClick={() => handleNavClick('groups')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                currentTab === 'groups' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-700 bg-white hover:bg-amber-100'
              }`}
            >
              <span>👥</span>
              <span>Brigadas y Mesas</span>
            </button>

            <button
              onClick={() => handleNavClick('qrhub')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                currentTab === 'qrhub' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-700 bg-white hover:bg-amber-100'
              }`}
            >
              <span>📲</span>
              <span>Descargar por QR</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCalculator();
              }}
              className="w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 shadow-xs cursor-pointer"
            >
              <span>🧮</span>
              <span>Calculadora de Obrador (TDM)</span>
            </button>

            <div className="pt-2 border-t border-amber-200/80 space-y-1">
              <label className="text-[11px] font-bold text-amber-900 block px-1">
                Tu Brigada de Obrador Activa:
              </label>
              <select
                value={activeGroupId}
                onChange={e => onSelectGroup(e.target.value)}
                className="w-full bg-white border border-amber-200 text-stone-800 text-xs font-bold rounded-xl p-2.5"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
