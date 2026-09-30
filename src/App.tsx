/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Upload, X } from 'lucide-react';
import { 
  Recipe, 
  WorkGroup, 
  BakeryPhoto 
} from './types/bakery';
import { 
  getStoredRecipes, 
  saveStoredRecipes, 
  getStoredGroups, 
  saveStoredGroups, 
  getActiveGroupId, 
  setActiveGroupId, 
  getStudentName, 
  setStudentName,
  upsertRecipe, 
  deleteRecipe, 
  addPhotoToRecipe, 
  updatePhotoInRecipe, 
  resetToDefaults
} from './utils/storage';

import { Navbar, ActiveTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { RecipeListView } from './components/RecipeListView';
import { RecipeDetailView } from './components/RecipeDetailView';
import { PhotoLabView } from './components/PhotoLabView';
import { WorkGroupsView } from './components/WorkGroupsView';
import { QRHubView } from './components/QRHubView';

import { RecipeModal } from './components/RecipeModal';
import { PhotoEditorModal } from './components/PhotoEditorModal';
import { QRModal } from './components/QRModal';
import { BakerCalculatorModal } from './components/BakerCalculatorModal';
import { NewRecipeChooserModal } from './components/NewRecipeChooserModal';

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>(getStoredRecipes());
  const [groups, setGroups] = useState<WorkGroup[]>(getStoredGroups());
  const [activeGroupId, setActiveGroup] = useState<string>(getActiveGroupId());
  const [studentName, setStudent] = useState<string>(getStudentName());
  
  // Navigation
  const [currentTab, setCurrentTab] = useState<ActiveTab>('home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Modals state
  const [isChooserModalOpen, setIsChooserModalOpen] = useState<boolean>(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | Partial<Recipe> | null>(null);

  const [activePhotoEditing, setActivePhotoEditing] = useState<{
    photo: BakeryPhoto;
    recipe: Recipe;
  } | null>(null);

  const [qrModalConfig, setQrModalConfig] = useState<{
    isOpen: boolean;
    mode: 'app' | 'recipe' | 'group';
    recipe?: Recipe;
    group?: WorkGroup;
  }>({
    isOpen: false,
    mode: 'app',
  });

  const [showCalculator, setShowCalculator] = useState<boolean>(false);

  // Aviso cuando un QR apunta a una receta/brigada que no está en este dispositivo
  const [deepLinkWarning, setDeepLinkWarning] = useState<string | null>(null);

  // Sync with URL query parameters for QR deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recipeIdParam = params.get('recipeId');
    const groupIdParam = params.get('groupId');

    if (recipeIdParam) {
      const found = recipes.find(r => r.id === recipeIdParam);
      if (found) {
        setSelectedRecipe(found);
        setCurrentTab('recipes');
      } else {
        setDeepLinkWarning(
          'La receta de este código QR no está guardada en este dispositivo.'
        );
      }
    } else if (groupIdParam) {
      const foundGrp = groups.find(g => g.id === groupIdParam);
      if (foundGrp) {
        setActiveGroup(foundGrp.id);
        setCurrentTab('groups');
      } else {
        setDeepLinkWarning(
          'La brigada de este código QR no está guardada en este dispositivo.'
        );
      }
    }
  }, []);

  // Listen to storage sync events
  useEffect(() => {
    const handleRecipesChange = (e: any) => {
      setRecipes(e.detail);
      // Keep selectedRecipe in sync
      if (selectedRecipe) {
        const updated = e.detail.find((r: Recipe) => r.id === selectedRecipe.id);
        if (updated) setSelectedRecipe(updated);
      }
    };
    const handleGroupsChange = (e: any) => setGroups(e.detail);
    const handleActiveGroupChange = (e: any) => setActiveGroup(e.detail);

    window.addEventListener('panapp_recipes_changed', handleRecipesChange);
    window.addEventListener('panapp_groups_changed', handleGroupsChange);
    window.addEventListener('panapp_active_group_changed', handleActiveGroupChange);

    return () => {
      window.removeEventListener('panapp_recipes_changed', handleRecipesChange);
      window.removeEventListener('panapp_groups_changed', handleGroupsChange);
      window.removeEventListener('panapp_active_group_changed', handleActiveGroupChange);
    };
  }, [selectedRecipe]);

  // Group selection
  const handleSelectGroup = (id: string) => {
    setActiveGroup(id);
    setActiveGroupId(id);
  };

  // Recipe actions
  const handleOpenManualFromChooser = (prefill?: Partial<Recipe>) => {
    setIsChooserModalOpen(false);
    setRecipeToEdit(prefill || null);
    setIsRecipeModalOpen(true);
  };

  const handleRecipeCreatedDirectly = (newRecipe: Recipe) => {
    setIsChooserModalOpen(false);
    handleSaveRecipe(newRecipe);
    setSelectedRecipe(newRecipe);
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    const updated = upsertRecipe(recipe);
    setRecipes(updated);
    if (selectedRecipe && selectedRecipe.id === recipe.id) {
      setSelectedRecipe(recipe);
    }
    setIsRecipeModalOpen(false);
    setRecipeToEdit(null);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    const updated = deleteRecipe(recipeId);
    setRecipes(updated);
    setSelectedRecipe(null);
  };

  // Photo actions
  const handleOpenPhotoEditor = (photo: BakeryPhoto, recipe: Recipe) => {
    setActivePhotoEditing({ photo, recipe });
  };

  const handleSaveEditedPhoto = (updatedPhoto: BakeryPhoto) => {
    if (!activePhotoEditing) return;
    const { recipe } = activePhotoEditing;
    const updated = updatePhotoInRecipe(recipe.id, updatedPhoto);
    setRecipes(updated);
    if (selectedRecipe && selectedRecipe.id === recipe.id) {
      const found = updated.find(r => r.id === recipe.id);
      if (found) setSelectedRecipe(found);
    }
    setActivePhotoEditing(null);
  };

  const handleUploadPhotos = (recipeId: string, files: FileList) => {
    const targetRecipe = recipes.find(r => r.id === recipeId);
    if (!targetRecipe) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          const newPhoto: BakeryPhoto = {
            id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            url: result,
            originalUrl: result,
            label: `${file.name.replace(/\.[^/.]+$/, '')} (Obrador)`,
            type: 'final',
            date: new Date().toISOString().split('T')[0],
            metadataBadge: {
              recipeTitle: targetRecipe.title,
              studentOrGroup: studentName,
              doughTemp: targetRecipe.processSteps.targetDoughTempC,
            },
          };
          addPhotoToRecipe(recipeId, newPhoto);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // QR Modal triggers
  const handleOpenAppQR = () => {
    setQrModalConfig({
      isOpen: true,
      mode: 'app',
    });
  };

  const handleOpenRecipeQR = (recipe: Recipe) => {
    setQrModalConfig({
      isOpen: true,
      mode: 'recipe',
      recipe,
    });
  };

  const handleOpenGroupQR = (group: WorkGroup) => {
    setQrModalConfig({
      isOpen: true,
      mode: 'group',
      group,
    });
  };

  // Reset to initial course sample data
  const handleResetData = () => {
    if (confirm('¿Restaurar las recetas y brigadas oficiales de muestra de 1º de Panadería?')) {
      resetToDefaults();
      setRecipes(getStoredRecipes());
      setGroups(getStoredGroups());
      setSelectedRecipe(null);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/40 text-stone-800 flex flex-col font-sans selection:bg-amber-400 selection:text-stone-900 flour-pattern">
      
      {/* App Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setSelectedRecipe(null);
        }}
        groups={groups}
        activeGroupId={activeGroupId}
        onSelectGroup={handleSelectGroup}
        studentName={studentName}
        onOpenCalculator={() => setShowCalculator(true)}
        onResetData={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Aviso de código QR que apunta a contenido ausente en este dispositivo */}
        {deepLinkWarning && (
          <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-md flex items-start gap-3 no-print animate-in fade-in">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="font-extrabold text-sm text-stone-900 font-display">
                {deepLinkWarning}
              </p>
              <p className="text-xs text-stone-600 leading-snug">
                Cada cuaderno guarda su recetario en el navegador donde se creó, así que un código QR
                por sí solo no copia las recetas de un móvil a otro. Pide a tu compañero o a tu profesor
                que descargue su copia de seguridad <strong>.JSON</strong> y impórtala aquí.
              </p>

              <button
                onClick={() => {
                  setCurrentTab('qrhub');
                  setSelectedRecipe(null);
                  setDeepLinkWarning(null);
                }}
                className="mt-1 py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-500/25 transition-colors cursor-pointer active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ir a importar copia de seguridad</span>
              </button>
            </div>

            <button
              onClick={() => setDeepLinkWarning(null)}
              title="Cerrar aviso"
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* If a recipe detail is open */}
        {selectedRecipe ? (
          <RecipeDetailView
            recipe={selectedRecipe}
            groups={groups}
            onBack={() => setSelectedRecipe(null)}
            onEditRecipe={(r) => {
              setRecipeToEdit(r);
              setIsRecipeModalOpen(true);
            }}
            onDeleteRecipe={handleDeleteRecipe}
            onOpenQR={handleOpenRecipeQR}
            onOpenPhotoEditor={handleOpenPhotoEditor}
            onUploadPhotos={handleUploadPhotos}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeView
                recipes={recipes}
                groups={groups}
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenCreateRecipe={() => {
                  setIsChooserModalOpen(true);
                }}
                onSelectRecipe={(r) => setSelectedRecipe(r)}
                onOpenAppQR={handleOpenAppQR}
                onOpenCalculator={() => setShowCalculator(true)}
              />
            )}

            {currentTab === 'recipes' && (
              <RecipeListView
                recipes={recipes}
                groups={groups}
                activeGroupId={activeGroupId}
                onSelectRecipe={(r) => setSelectedRecipe(r)}
                onOpenCreateRecipe={() => {
                  setIsChooserModalOpen(true);
                }}
                onOpenQR={handleOpenRecipeQR}
              />
            )}

            {currentTab === 'photolab' && (
              <PhotoLabView
                recipes={recipes}
                onOpenPhotoEditor={handleOpenPhotoEditor}
                onUploadNewPhoto={handleUploadPhotos}
              />
            )}

            {currentTab === 'groups' && (
              <WorkGroupsView
                groups={groups}
                recipes={recipes}
                activeGroupId={activeGroupId}
                onSelectActiveGroup={handleSelectGroup}
                onUpdateGroups={(updated) => {
                  setGroups(updated);
                  saveStoredGroups(updated);
                }}
                onOpenQR={handleOpenGroupQR}
                onSelectRecipe={(r) => setSelectedRecipe(r)}
              />
            )}

            {currentTab === 'qrhub' && (
              <QRHubView
                recipes={recipes}
                groups={groups}
                onImportSuccess={() => {
                  setRecipes(getStoredRecipes());
                  setGroups(getStoredGroups());
                }}
              />
            )}
          </>
        )}

      </main>

      {/* Cheerful Bakery Footer */}
      <footer className="border-t border-amber-200/80 bg-white py-8 text-center text-xs text-stone-600 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥐</span>
            <span className="font-extrabold text-stone-900 font-display text-sm">PanApp 1º</span>
            <span>• Cuaderno de Obrador para Alumnos de Panadería, Bollería y Repostería</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-amber-800">
            <button
              onClick={handleOpenAppQR}
              className="hover:text-amber-600 transition-colors flex items-center gap-1.5 cursor-pointer bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs"
            >
              <span>📲</span> QR para Teléfonos Móviles
            </button>
            <span>•</span>
            <button
              onClick={handleResetData}
              className="hover:text-stone-900 transition-colors cursor-pointer"
              title="Restaurar recetas y brigadas oficiales de muestra"
            >
              🔄 Recetas Iniciales de Muestra
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 0. New Recipe Creation Chooser Modal */}
      {isChooserModalOpen && (
        <NewRecipeChooserModal
          groups={groups}
          activeGroupId={activeGroupId}
          studentName={studentName}
          onClose={() => setIsChooserModalOpen(false)}
          onOpenManualForm={handleOpenManualFromChooser}
          onRecipeCreatedDirectly={handleRecipeCreatedDirectly}
        />
      )}

      {/* 1. Recipe Create / Edit Modal */}
      {isRecipeModalOpen && (
        <RecipeModal
          recipe={recipeToEdit}
          groups={groups}
          activeGroupId={activeGroupId}
          studentName={studentName}
          onClose={() => {
            setIsRecipeModalOpen(false);
            setRecipeToEdit(null);
          }}
          onSave={handleSaveRecipe}
        />
      )}

      {/* 3. Photo Editor Laboratory Modal */}
      {activePhotoEditing && (
        <PhotoEditorModal
          photo={activePhotoEditing.photo}
          recipeTitle={activePhotoEditing.recipe.title}
          groupName={activePhotoEditing.recipe.groupName || '1º Panadería'}
          onClose={() => setActivePhotoEditing(null)}
          onSave={handleSaveEditedPhoto}
        />
      )}

      {/* 4. QR Code Download Modal */}
      {qrModalConfig.isOpen && (
        <QRModal
          initialMode={qrModalConfig.mode}
          recipe={qrModalConfig.recipe}
          group={qrModalConfig.group}
          onClose={() => setQrModalConfig(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* 5. Baker Math / TDM Calculator Modal */}
      {showCalculator && (
        <BakerCalculatorModal onClose={() => setShowCalculator(false)} />
      )}

    </div>
  );
}
