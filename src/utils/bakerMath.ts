import { Ingredient, Recipe } from '../types/bakery';

/**
 * Calcula la hidratación total (%) en base a los ingredientes tipo agua y harina
 */
export function calculateHydration(ingredients: Ingredient[]): number {
  // Suma TODAS las harinas de la fórmula (una receta puede mezclar varias:
  // fuerza + integral + centeno...), no solo la primera.
  const flourWeight = ingredients
    .filter(i => i.isFlourBase || i.type === 'harina')
    .reduce((sum, i) => sum + i.grams, 0);

  const waterWeight = ingredients
    .filter(i => i.type === 'agua')
    .reduce((sum, i) => sum + i.grams, 0);

  if (flourWeight <= 0) return 0;
  return Number(((waterWeight / flourWeight) * 100).toFixed(1));
}

/**
 * Calcula el peso total de la masa sumando todos los ingredientes
 */
export function calculateTotalDoughWeight(ingredients: Ingredient[]): number {
  return ingredients.reduce((sum, i) => sum + i.grams, 0);
}

/**
 * Recalcula los ingredientes en función de un nuevo peso base de harina
 */
export function scaleIngredientsByFlour(ingredients: Ingredient[], newFlourGrams: number): Ingredient[] {
  return ingredients.map(ing => {
    const calculatedGrams = Math.round((newFlourGrams * ing.percentage) / 100);
    return {
      ...ing,
      grams: calculatedGrams,
    };
  });
}

/**
 * Recalcula los ingredientes en base al número deseado de piezas y peso por pieza
 */
export function scaleIngredientsByYield(
  ingredients: Ingredient[],
  pieces: number,
  pieceWeightGrams: number,
  lossPercentage = 2.5 // merma de obrador/horneado
): { ingredients: Ingredient[]; flourGrams: number; totalDoughGrams: number } {
  const targetTotalDough = pieces * pieceWeightGrams * (1 + lossPercentage / 100);
  
  // Suma de porcentajes panaderos
  const totalPercentage = ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
  
  // Harina necesaria = Peso Total deseado / (Suma de porcentajes / 100)
  const flourGrams = Math.round((targetTotalDough / totalPercentage) * 100);
  
  const scaled = ingredients.map(ing => ({
    ...ing,
    grams: Math.round((flourGrams * ing.percentage) / 100),
  }));

  return {
    ingredients: scaled,
    flourGrams,
    totalDoughGrams: Math.round(targetTotalDough),
  };
}

/**
 * Cálculo de Temperatura del Agua de Amasado (Fórmula Panadera del TDM)
 * Tª Agua = (Factor × Tª Masa Deseada) - (Tª Ambiente + Tª Harina + Tª Fricción Amasadora)
 */
export function calculateWaterTemp(params: {
  targetDoughTempC: number;
  roomTempC: number;
  flourTempC: number;
  frictionTempC: number;
  usePreferment?: boolean;
  prefermentTempC?: number;
}): { waterTempC: number; warning?: string } {
  const { targetDoughTempC, roomTempC, flourTempC, frictionTempC, usePreferment, prefermentTempC } = params;

  let factor = 3;
  let subtract = roomTempC + flourTempC + frictionTempC;

  if (usePreferment && prefermentTempC !== undefined) {
    factor = 4;
    subtract += prefermentTempC;
  }

  const calculated = Math.round((factor * targetDoughTempC) - subtract);

  let warning: string | undefined = undefined;
  if (calculated < 2) {
    warning = '¡Precaución! La Tª calculada es menor a 2°C. Es necesario usar hielo picado sustituyendo parte del agua.';
  } else if (calculated > 35) {
    warning = '¡Precaución! Tª de agua muy alta (>35°C). Podría desnaturalizar las levaduras si supera 40°C.';
  }

  return {
    waterTempC: calculated,
    warning,
  };
}

export function formatGrams(val: number): string {
  if (val >= 1000) {
    return `${(val / 1000).toFixed(2)} kg`;
  }
  return `${val} g`;
}
