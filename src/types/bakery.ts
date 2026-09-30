export type RecipeCategory = 
  | 'pan'
  | 'pan_rustico_masa_madre'
  | 'bolleria'
  | 'bolleria_hojaldrada'
  | 'bolleria_especial'
  | 'pasteleria_basica'
  | 'pan_masa_madre_rusticos'
  | 'pan_comun'
  | 'masa_madre'
  | 'enriquecidas'
  | 'hojaldrados'
  | 'especiales'
  | 'bolleria_especial_pasteleria';

export type IngredientType = 
  | 'harina' 
  | 'agua' 
  | 'sal' 
  | 'levadura' 
  | 'masa_madre' 
  | 'grasa' 
  | 'azucar' 
  | 'mejora' 
  | 'semillas' 
  | 'otro';

export interface Ingredient {
  id: string;
  name: string;
  percentage: number; // Baker's percentage (% sobre la harina base)
  grams: number;      // Calculado para la masa base
  isFlourBase?: boolean;
  type: IngredientType;
}

export interface ProcessSteps {
  kneadingSlowMins: number;
  kneadingFastMins: number;
  targetDoughTempC: number; // TDM (°C)
  autolysisMins?: number;
  bulkFermentationMins: number; // Bloque
  bulkFolds: number;           // Pliegues
  divisionWeightGrams: number; // Peso pieza
  preformRestMins: number;     // Reposo preformado
  finalFermentationMins: number; // Apresto / 2ª fermentación
  finalFermentationTempC: number;
  scoringType: string;         // Tipo de corte (longitudinal, cruz, espiga...)
  bakingTempC: number;         // Tª Horno
  bakingTimeMins: number;      // Minutos cocción
  steamSeconds: number;        // Vapor inicial en segundos
  ovenDeckVentilationMins: number; // Apertura de tiro final (minutos)
  detailedNotes: string;
}

export interface BakeryPhoto {
  id: string;
  url: string;
  originalUrl?: string;
  label: string;
  type: 'corteza' | 'miga' | 'greñado' | 'proceso' | 'final';
  date: string;
  appliedFilter?: string;
  filterParams?: {
    brightness: number;
    contrast: number;
    warmth: number;
    saturation: number;
    clarity: number;
    vignette: number;
  };
  metadataBadge?: {
    recipeTitle: string;
    studentOrGroup: string;
    doughTemp?: number;
    hydration?: number;
    capturedWithMobile?: boolean;
    stage?: string;
  };
}

export interface ObservationLog {
  id: string;
  recipeId: string;
  recipeTitle: string;
  date: string;
  sessionName: string;
  instructor: string;
  groupId?: string;
  groupName?: string;
  // Temperaturas del obrador
  roomTempC: number;
  flourTempC: number;
  calculatedWaterTempC: number;
  actualDoughTempC: number; // Al salir de la amasadora
  // Evaluación sensorial (1 a 5)
  crustScore: number;
  crumbScore: number;
  alveoliScore: number;
  flavorAromaScore: number;
  // Textos técnicos
  crustObservations: string;
  crumbObservations: string;
  incidentsAndFixes: string; // "Qué falló y cómo solucionarlo en la próxima práctica"
  teacherFeedback: string;   // "Comentario del profesor de taller"
  photos: BakeryPhoto[];
}

export interface Recipe {
  id: string;
  title: string;
  category: RecipeCategory;
  description: string;
  courseLevel: string; // ej. "1º Curso - Módulo de Panadería"
  flourBaseWeightGrams: number;
  targetYieldPieces: number;
  pieceWeightGrams: number;
  flourSpecs: {
    type: string;      // ej. Harina Panadera W180-200
    strengthW?: string;
    plRatio?: string;
  };
  ingredients: Ingredient[];
  processSteps: ProcessSteps;
  photos: BakeryPhoto[];
  observations: ObservationLog[];
  groupId?: string;
  groupName?: string;
  studentAuthor: string;
  createdAt: string;
  updatedAt: string;
  difficulty: 'Básico 1º' | 'Intermedio 1º' | 'Avanzado 1º';
}

export interface GroupMember {
  id: string;
  name: string;
  role: 'Jefe de Brigada' | 'Amasado y Pesaje' | 'Control de Fermentación' | 'Horno y Cocción' | 'Fotografía y Bitácora';
  avatarBg: string;
}

export interface WorkGroup {
  id: string;
  name: string;
  tableNumber: number;
  shift: 'mañana' | 'tarde';
  motto: string;
  color: string;
  members: GroupMember[];
  notes: string;
  assignedRecipeIds: string[];
}
