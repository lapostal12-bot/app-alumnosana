import { Recipe, WorkGroup, ObservationLog, BakeryPhoto, RecipeCategory } from '../types/bakery';
import { INITIAL_RECIPES, INITIAL_GROUPS } from '../data/initialData';

const RECIPES_KEY = 'panapp_recipes_v3';
const GROUPS_KEY = 'panapp_groups_v3';
const ACTIVE_GROUP_KEY = 'panapp_active_group_v2';
const STUDENT_NAME_KEY = 'panapp_student_name_v2';

// In-memory fallback in case localStorage is blocked by mobile security/cookies
const memoryStorage: Record<string, string> = {};

function safeGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (err) {
    console.warn('localStorage read error, using memory fallback:', err);
  }
  return memoryStorage[key] || null;
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn('localStorage write error, using memory fallback:', err);
  }
  memoryStorage[key] = value;
}

function safeDispatch(name: string, detail: any): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch (err) {
    console.warn('Error dispatching custom event:', err);
  }
}

export function normalizeRecipeCategory(cat: string): RecipeCategory {
  if (cat === 'pan' || cat === 'pan_comun') return 'pan';
  if (cat === 'pan_rustico_masa_madre' || cat === 'pan_masa_madre_rusticos' || cat === 'masa_madre') return 'pan_rustico_masa_madre';
  if (cat === 'bolleria' || cat === 'enriquecidas') return 'bolleria';
  if (cat === 'bolleria_hojaldrada' || cat === 'hojaldrados') return 'bolleria_hojaldrada';
  if (cat === 'bolleria_especial' || cat === 'especiales') return 'bolleria_especial';
  if (cat === 'pasteleria_basica' || cat === 'bolleria_especial_pasteleria') return 'pasteleria_basica';
  return 'pan';
}

export function getStoredRecipes(): Recipe[] {
  try {
    const raw = safeGet(RECIPES_KEY);
    if (!raw) {
      saveStoredRecipes(INITIAL_RECIPES);
      return INITIAL_RECIPES;
    }
    const parsed: Recipe[] = JSON.parse(raw);
    let hadChanges = false;
    const sanitized = parsed.map(recipe => {
      let photos = recipe.photos || [];
      if (photos.some(p => p.url?.includes('images.unsplash.com'))) {
        hadChanges = true;
        photos = photos.filter(p => !p.url?.includes('images.unsplash.com'));
      }
      const normalizedCat = normalizeRecipeCategory(recipe.category);
      if (normalizedCat !== recipe.category) {
        hadChanges = true;
      }
      return {
        ...recipe,
        category: normalizedCat,
        photos,
      };
    });
    if (hadChanges) {
      safeSet(RECIPES_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (err) {
    console.error('Error reading recipes from storage', err);
    return INITIAL_RECIPES;
  }
}

export function saveStoredRecipes(recipes: Recipe[]) {
  safeSet(RECIPES_KEY, JSON.stringify(recipes));
  safeDispatch('panapp_recipes_changed', recipes);
}

export function getStoredGroups(): WorkGroup[] {
  try {
    const raw = safeGet(GROUPS_KEY);
    if (!raw) {
      saveStoredGroups(INITIAL_GROUPS);
      return INITIAL_GROUPS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading groups from storage', err);
    return INITIAL_GROUPS;
  }
}

export function saveStoredGroups(groups: WorkGroup[]) {
  safeSet(GROUPS_KEY, JSON.stringify(groups));
  safeDispatch('panapp_groups_changed', groups);
}

export function getActiveGroupId(): string {
  return safeGet(ACTIVE_GROUP_KEY) || 'brigada-1';
}

export function setActiveGroupId(id: string) {
  safeSet(ACTIVE_GROUP_KEY, id);
  safeDispatch('panapp_active_group_changed', id);
}

export function getStudentName(): string {
  return safeGet(STUDENT_NAME_KEY) || 'Alumno 1º Panadería';
}

export function setStudentName(name: string) {
  safeSet(STUDENT_NAME_KEY, name);
  safeDispatch('panapp_student_changed', name);
}

export function upsertRecipe(recipe: Recipe) {
  const current = getStoredRecipes();
  const index = current.findIndex(r => r.id === recipe.id);
  let updated: Recipe[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...recipe, updatedAt: new Date().toISOString().split('T')[0] };
  } else {
    updated = [recipe, ...current];
  }
  saveStoredRecipes(updated);
  return updated;
}

export function deleteRecipe(recipeId: string) {
  const current = getStoredRecipes();
  const updated = current.filter(r => r.id !== recipeId);
  saveStoredRecipes(updated);
  return updated;
}

export function addObservationToRecipe(recipeId: string, observation: ObservationLog) {
  const current = getStoredRecipes();
  const updated = current.map(r => {
    if (r.id === recipeId) {
      return {
        ...r,
        observations: [observation, ...r.observations],
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }
    return r;
  });
  saveStoredRecipes(updated);
  return updated;
}

export function addPhotoToRecipe(recipeId: string, photo: BakeryPhoto) {
  const current = getStoredRecipes();
  const updated = current.map(r => {
    if (r.id === recipeId) {
      return {
        ...r,
        photos: [photo, ...r.photos],
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }
    return r;
  });
  saveStoredRecipes(updated);
  return updated;
}

export function updatePhotoInRecipe(recipeId: string, updatedPhoto: BakeryPhoto) {
  const current = getStoredRecipes();
  const updated = current.map(r => {
    if (r.id === recipeId) {
      return {
        ...r,
        photos: r.photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p),
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }
    return r;
  });
  saveStoredRecipes(updated);
  return updated;
}

export function exportBackupJSON(): string {
  const data = {
    version: 'panapp-backup-v1',
    exportedAt: new Date().toISOString(),
    recipes: getStoredRecipes(),
    groups: getStoredGroups(),
    studentName: getStudentName(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.recipes && Array.isArray(data.recipes)) {
      saveStoredRecipes(data.recipes);
    }
    if (data.groups && Array.isArray(data.groups)) {
      saveStoredGroups(data.groups);
    }
    if (data.studentName && typeof data.studentName === 'string') {
      setStudentName(data.studentName);
    }
    return true;
  } catch (err) {
    console.error('Error importing backup:', err);
    return false;
  }
}

export function resetToDefaults() {
  saveStoredRecipes(INITIAL_RECIPES);
  saveStoredGroups(INITIAL_GROUPS);
  setActiveGroupId('brigada-1');
  setStudentName('Alumno 1º Panadería');
}
