export interface FilterAdjustment {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  warmth: number;     // -100 to 100
  saturation: number; // -100 to 100
  clarity: number;    // 0 to 100 (sharpen strength)
  vignette: number;   // 0 to 100
}

export interface BakeryPresetFilter {
  id: string;
  name: string;
  description: string;
  icon: string;
  adjustments: FilterAdjustment;
}

export const BAKERY_PRESETS: BakeryPresetFilter[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Foto natural sin modificaciones',
    icon: '✨',
    adjustments: { brightness: 0, contrast: 0, warmth: 0, saturation: 0, clarity: 0, vignette: 0 },
  },
  {
    id: 'dorado_crujiente',
    name: 'Dorado Crujiente',
    description: 'Realza los tonos caramelo, brillo de corteza y apetitosidad de horno',
    icon: '🥐',
    adjustments: { brightness: 6, contrast: 14, warmth: 28, saturation: 22, clarity: 20, vignette: 15 },
  },
  {
    id: 'alveolado_nitido',
    name: 'Alveolado Nítido',
    description: 'Aumenta el microcontraste para apreciar la textura de la miga y alveolos',
    icon: '🥖',
    adjustments: { brightness: 4, contrast: 25, warmth: 2, saturation: -5, clarity: 50, vignette: 10 },
  },
  {
    id: 'rustico_obrador',
    name: 'Rústico Obrador',
    description: 'Atmósfera artesanal cálida con viñeteado envolvente y profundidad',
    icon: '🪵',
    adjustments: { brightness: -2, contrast: 18, warmth: 35, saturation: 12, clarity: 30, vignette: 40 },
  },
  {
    id: 'luz_taller',
    name: 'Luz Natural Taller',
    description: 'Corrige la luz fluorescente del aula neutralizando tonos verdosos',
    icon: '💡',
    adjustments: { brightness: 12, contrast: 10, warmth: -10, saturation: 5, clarity: 15, vignette: 0 },
  },
  {
    id: 'blanco_negro_tecnico',
    name: 'B/N Técnico (Greñado)',
    description: 'Monocromo de alto contraste para evaluar la apertura del corte y greña',
    icon: '⚖️',
    adjustments: { brightness: 5, contrast: 40, warmth: 0, saturation: -100, clarity: 45, vignette: 25 },
  },
];

/**
 * Aplica los ajustes de imagen pixel a pixel sobre un canvas HTML5
 */
export function applyFiltersToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  adjustments: FilterAdjustment,
  watermarkText?: string
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const { brightness, contrast, warmth, saturation, clarity, vignette } = adjustments;

  // Factores normalizados
  const bFactor = brightness * 1.28; // -128 a 128
  const cFactor = (contrast + 100) / 100; // factor de contraste
  const cFactorSq = cFactor * cFactor;
  const sFactor = (saturation + 100) / 100;
  const wRed = warmth > 0 ? warmth * 0.8 : 0;
  const wBlue = warmth < 0 ? -warmth * 0.8 : 0;

  // Centro para viñeta
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  const vigFactor = vignette / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Brillo
    r += bFactor;
    g += bFactor;
    b += bFactor;

    // 2. Contraste
    r = (r - 128) * cFactorSq + 128;
    g = (g - 128) * cFactorSq + 128;
    b = (b - 128) * cFactorSq + 128;

    // 3. Calidez (Warmth / Temperatura de horno)
    r += wRed;
    b += wBlue;
    if (warmth > 0) {
      g += wRed * 0.3; // toque dorado
    }

    // 4. Saturación
    const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * sFactor;
    g = gray + (g - gray) * sFactor;
    b = gray + (b - gray) * sFactor;

    // 5. Viñeteado
    if (vigFactor > 0) {
      const pixelIdx = i / 4;
      const x = pixelIdx % width;
      const y = Math.floor(pixelIdx / width);
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const ratio = dist / maxDist;
      const falloff = 1 - vigFactor * Math.pow(ratio, 2.2);
      r *= falloff;
      g *= falloff;
      b *= falloff;
    }

    // Clamping
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imgData, 0, 0);

  // 6. Nitidez / Claridad mediante convolución si claridad > 0
  if (clarity > 0) {
    applySharpen(ctx, width, height, clarity / 100);
  }

  // 7. Sello Técnico de Obrador si se proporciona
  if (watermarkText) {
    drawTechnicalStamp(ctx, width, height, watermarkText);
  }
}

/**
 * Convolución sharpen rápida
 */
function applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;

  // Kernel: [0, -a, 0, -a, 1 + 4a, -a, 0, -a, 0]
  const a = amount * 0.6;
  const centerWeight = 1 + 4 * a;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top = ((y - 1) * width + x) * 4 + c;
        const bottom = ((y + 1) * width + x) * 4 + c;
        const left = (y * width + (x - 1)) * 4 + c;
        const right = (y * width + (x + 1)) * 4 + c;

        const val =
          src[idx + c] * centerWeight -
          a * (src[top] + src[bottom] + src[left] + src[right]);

        dst[idx + c] = Math.min(255, Math.max(0, val));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Dibuja un elegante badge técnico de obrador en la esquina inferior
 */
function drawTechnicalStamp(ctx: CanvasRenderingContext2D, width: number, height: number, text: string) {
  ctx.save();
  const fontSize = Math.max(12, Math.min(22, Math.floor(width / 38)));
  ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;

  const paddingX = fontSize * 0.9;
  const paddingY = fontSize * 0.55;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = fontSize + paddingY * 2;

  const posX = width - badgeWidth - 16;
  const posY = height - badgeHeight - 16;

  // Fondo translúcido elegante
  ctx.fillStyle = 'rgba(28, 25, 23, 0.82)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(posX, posY, badgeWidth, badgeHeight, 6);
  } else {
    ctx.rect(posX, posY, badgeWidth, badgeHeight);
  }
  ctx.fill();

  // Borde fino ámbar
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Texto
  ctx.fillStyle = '#fef3c7'; // amber-100
  ctx.fillText(text, posX + paddingX, posY + badgeHeight - paddingY - 2);

  ctx.restore();
}
