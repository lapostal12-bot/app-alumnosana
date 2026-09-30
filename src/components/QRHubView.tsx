import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Smartphone, 
  Share2, 
  FileJson, 
  Upload, 
  Check, 
  Copy, 
  Printer, 
  Users, 
  BookOpen, 
  Layers, 
  Sparkles,
  Info,
  Heart,
  ExternalLink
} from 'lucide-react';
import { Recipe, WorkGroup } from '../types/bakery';
import { exportBackupJSON, importBackupJSON } from '../utils/storage';
import { 
  FALLBACK_DEV_URL, 
  FALLBACK_SHARED_URL, 
  fetchServerAppUrls, 
  buildQrTargetUrl, 
  downloadDataUrlAsFile, 
  copyQrImageToClipboard 
} from '../utils/qrHelper';

interface QRHubViewProps {
  recipes: Recipe[];
  groups: WorkGroup[];
  onImportSuccess: () => void;
}

export const QRHubView: React.FC<QRHubViewProps> = ({
  recipes,
  groups,
  onImportSuccess,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'app' | 'recipe' | 'group'>('app');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [urlType, setUrlType] = useState<'dev' | 'shared'>('dev');
  const [sharedBaseUrl, setSharedBaseUrl] = useState<string>(FALLBACK_SHARED_URL);
  const [devBaseUrl, setDevBaseUrl] = useState<string>(FALLBACK_DEV_URL);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchServerAppUrls().then(urls => {
      if (urls.sharedUrl) setSharedBaseUrl(urls.sharedUrl);
      if (urls.devUrl) setDevBaseUrl(urls.devUrl);
    });
  }, []);

  useEffect(() => {
    generateQR();
  }, [selectedTarget, selectedRecipeId, selectedGroupId, urlType, sharedBaseUrl, devBaseUrl]);

  const generateQR = async () => {
    const base = urlType === 'dev' ? devBaseUrl : sharedBaseUrl;
    const params = selectedTarget === 'recipe' && selectedRecipeId
      ? { recipeId: selectedRecipeId }
      : selectedTarget === 'group' && selectedGroupId
      ? { groupId: selectedGroupId }
      : undefined;

    const url = buildQrTargetUrl(base, params);
    setTargetUrl(url);

    try {
      const code = await QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: {
          dark: '#1c1917', // stone-900
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(code);
    } catch (err) {
      console.error('Error generating QR', err);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    let name = 'panapp_qr_app_completa.png';
    if (selectedTarget === 'recipe') {
      const rec = recipes.find(r => r.id === selectedRecipeId);
      name = `panapp_qr_${rec?.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    } else if (selectedTarget === 'group') {
      const grp = groups.find(g => g.id === selectedGroupId);
      name = `panapp_qr_${grp?.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    }
    downloadDataUrlAsFile(qrDataUrl, name);
  };

  const handleExportJSON = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panapp_recetario_1curso_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = importBackupJSON(content);
      if (success) {
        setImportStatus('¡Recetario importado correctamente!');
        onImportSuccess();
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Error: Archivo JSON no válido');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Cheerful Top Banner */}
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 text-9xl opacity-15 select-none pointer-events-none">
          📲
        </div>
        <div className="absolute right-40 bottom-0 text-8xl opacity-15 select-none pointer-events-none">
          🥖
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/25 backdrop-blur-md text-white font-extrabold text-xs border border-white/30">
              <span>🚀 Acceso Rápido & Descarga en Obrador</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display text-white">
              Centro de Descarga por Código QR 📲✨
            </h1>

            <p className="text-sm text-amber-50 font-medium leading-relaxed">
              Abre la cámara de tu teléfono móvil, escanea el código y tendrás toda la aplicación con las fórmulas y cálculos en tu bolsillo sin necesidad de cables ni descargas pesadas.
            </p>
          </div>

          {/* JSON Quick Export/Import box */}
          <div className="bg-white/95 backdrop-blur-md text-stone-800 p-5 rounded-3xl shadow-xl min-w-[280px] space-y-2 border border-white">
            <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
              <FileJson className="w-4 h-4 text-amber-600" /> Copia de Seguridad JSON
            </span>
            <p className="text-[11px] text-stone-600 font-medium">
              Guarda tus recetas, notas y fotos en un archivo para compartir con tu profesor.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleExportJSON}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Descargar
              </button>

              <label className="flex-1 py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
                <Upload className="w-3.5 h-3.5" /> Importar
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>
            {importStatus && (
              <div className="text-[11px] text-center text-amber-700 font-bold mt-1">
                {importStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main QR Showcase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Controls and Target selector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" /> ¿Qué deseas compartir o descargar?
            </h3>

            {/* Target Radio Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => setSelectedTarget('app')}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                  selectedTarget === 'app'
                    ? 'bg-amber-50 border-amber-500 text-stone-900 shadow-sm'
                    : 'bg-white border-amber-100 text-stone-700 hover:bg-amber-50/50'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-stone-900">1. Cuaderno de Panadería y Bollería: Recetas / Fotos / Grupos</h4>
                  <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                    Para que cualquier compañero abra e instale el cuaderno en su teléfono móvil durante la clase.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedTarget('recipe')}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                  selectedTarget === 'recipe'
                    ? 'bg-amber-50 border-amber-500 text-stone-900 shadow-sm'
                    : 'bg-white border-amber-100 text-stone-700 hover:bg-amber-50/50'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-sm text-stone-900">2. Ficha Técnica de Receta Individual</h4>
                  <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                    Genera el QR de una receta específica con todos sus porcentajes de pesaje.
                  </p>

                  {selectedTarget === 'recipe' && (
                    <select
                      value={selectedRecipeId}
                      onChange={e => setSelectedRecipeId(e.target.value)}
                      className="mt-3 w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-stone-800 shadow-xs"
                    >
                      {recipes.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedTarget('group')}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                  selectedTarget === 'group'
                    ? 'bg-amber-50 border-amber-500 text-stone-900 shadow-sm'
                    : 'bg-white border-amber-100 text-stone-700 hover:bg-amber-50/50'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-sm text-stone-900">3. Cartel de Mesa / Brigada de Taller</h4>
                  <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                    Para imprimir el cartel de tu mesa con los nombres de los alumnos y roles.
                  </p>

                  {selectedTarget === 'group' && (
                    <select
                      value={selectedGroupId}
                      onChange={e => setSelectedGroupId(e.target.value)}
                      className="mt-3 w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-stone-800 shadow-xs"
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name} (Mesa {g.tableNumber})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </button>
            </div>

            {/* URL Display */}
            <div className="pt-2 border-t border-amber-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600 font-bold">
                <span>Servidor de Enlace:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setUrlType('dev')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      urlType === 'dev' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Activo (Dev)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlType('shared')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      urlType === 'shared' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Compartido (Pre)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-50/80 p-2.5 rounded-2xl border border-amber-200 text-xs">
                <input
                  type="text"
                  readOnly
                  value={targetUrl}
                  className="bg-transparent text-stone-700 font-mono flex-1 outline-none text-xs truncate px-1 font-semibold"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-stone-800 text-xs font-extrabold flex items-center gap-1 border border-amber-200 transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-xl bg-white hover:bg-amber-100 text-stone-700 text-xs font-bold border border-amber-200 transition-colors shrink-0 shadow-xs"
                  title="Probar en nueva pestaña"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                </a>
              </div>
            </div>

          </div>

          {/* Instructions for mobile */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm">
              <Info className="w-4 h-4 text-amber-600" />
              ¿Cómo guardarla en el móvil como app?
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-xs leading-relaxed pl-1 text-stone-700 font-medium">
              <li><strong>En Android (Chrome):</strong> Escanea el QR, toca los tres puntos (⋮) y selecciona <em>"Añadir a pantalla de inicio"</em>.</li>
              <li><strong>En iPhone / iPad (Safari):</strong> Escanea el QR con la cámara, pulsa el icono de compartir (<Share2 className="w-3 h-3 inline mx-0.5 text-amber-700" />) y elige <em>"Añadir a pantalla de inicio"</em>.</li>
            </ul>
          </div>

        </div>

        {/* Right: High-Res QR Display Card (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-lg relative">
            
            <div className="p-6 bg-white rounded-3xl shadow-xl border-4 border-amber-400 max-w-sm w-full mx-auto">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR"
                  className="w-full aspect-square object-contain rounded-xl"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center text-stone-400 text-xs">
                  Generando QR...
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-amber-100">
                <div className="font-black text-sm text-stone-900 font-mono tracking-wider">
                  PANAPP 1º • CFGM PANADERÍA
                </div>
                <div className="text-xs font-bold text-amber-700 mt-0.5">
                  {selectedTarget === 'app' && 'CUADERNO DE OBRADOR Y BOLLERÍA'}
                  {selectedTarget === 'recipe' && (recipes.find(r => r.id === selectedRecipeId)?.title.toUpperCase() || 'RECETA')}
                  {selectedTarget === 'group' && (groups.find(g => g.id === selectedGroupId)?.name.toUpperCase() || 'BRIGADA')}
                </div>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
              <button
                onClick={handleDownloadPNG}
                className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar Imagen QR (PNG)
              </button>

              <button
                onClick={() => window.print()}
                className="py-3 px-5 rounded-2xl bg-white hover:bg-amber-50 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 border border-amber-300 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-amber-600" />
                Imprimir
              </button>
            </div>

            <p className="text-xs text-stone-500 mt-4 font-medium">
              Código QR vectorial nítido para pegar en la pizarra de taller o en las carpetas de los alumnos.
            </p>

          </div>
        </div>

      </div>

    </div>
  );
};
