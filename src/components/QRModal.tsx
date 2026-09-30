import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Download, 
  Smartphone, 
  Printer, 
  Copy, 
  Check, 
  FileJson, 
  QrCode, 
  Users, 
  BookOpen, 
  ExternalLink, 
  ImageIcon, 
  Globe, 
  Laptop, 
  Edit3 
} from 'lucide-react';
import { Recipe, WorkGroup } from '../types/bakery';
import { exportBackupJSON } from '../utils/storage';
import { 
  FALLBACK_DEV_URL, 
  FALLBACK_SHARED_URL, 
  fetchServerAppUrls, 
  buildQrTargetUrl, 
  downloadDataUrlAsFile, 
  copyQrImageToClipboard 
} from '../utils/qrHelper';

interface QRModalProps {
  initialMode?: 'app' | 'recipe' | 'group';
  recipe?: Recipe;
  group?: WorkGroup;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  initialMode = 'app',
  recipe,
  group,
  onClose,
}) => {
  const [mode, setMode] = useState<'app' | 'recipe' | 'group'>(initialMode);
  const [urlType, setUrlType] = useState<'dev' | 'shared' | 'custom'>('dev');
  const [devBaseUrl, setDevBaseUrl] = useState<string>(FALLBACK_DEV_URL);
  const [sharedBaseUrl, setSharedBaseUrl] = useState<string>(FALLBACK_SHARED_URL);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>('');
  const [isEditingCustom, setIsEditingCustom] = useState<boolean>(false);

  const [qrTargetUrl, setQrTargetUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Fetch real server URLs from API on mount
  useEffect(() => {
    fetchServerAppUrls().then(urls => {
      if (urls.devUrl) setDevBaseUrl(urls.devUrl);
      if (urls.sharedUrl) setSharedBaseUrl(urls.sharedUrl);
    });
  }, []);

  // Recalculate target URL whenever mode, urlType, or recipes/groups change
  useEffect(() => {
    let base = devBaseUrl;
    if (urlType === 'shared') {
      base = sharedBaseUrl;
    } else if (urlType === 'custom') {
      base = customBaseUrl || devBaseUrl;
    }

    const params = mode === 'recipe' && recipe
      ? { recipeId: recipe.id }
      : mode === 'group' && group
      ? { groupId: group.id }
      : undefined;

    const finalUrl = buildQrTargetUrl(base, params);
    setQrTargetUrl(finalUrl);
    generateQR(finalUrl);
  }, [mode, urlType, recipe, group, sharedBaseUrl, devBaseUrl, customBaseUrl]);

  const generateQR = async (url: string) => {
    try {
      const code = await QRCode.toDataURL(url, {
        width: 520,
        margin: 2,
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(code);
    } catch (err) {
      console.error('Error generando QR:', err);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomBaseUrl(val);
    setUrlType('custom');
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(qrTargetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    const ok = await copyQrImageToClipboard(qrDataUrl);
    if (ok) {
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2200);
    }
  };

  const handleDownloadQRImage = () => {
    if (!qrDataUrl) return;
    let filename = 'panapp_qr_cuaderno.png';
    if (mode === 'recipe' && recipe) {
      filename = `qr_receta_${recipe.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    } else if (mode === 'group' && group) {
      filename = `qr_brigada_${group.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    }

    const success = downloadDataUrlAsFile(qrDataUrl, filename);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `panapp_recetario_1curso_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border-2 border-amber-300 rounded-3xl shadow-2xl overflow-hidden text-stone-800 animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-100 bg-amber-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 font-display">
                Generador de Código QR 📲
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Acceso directo desde teléfonos móviles y pizarras
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Mode Selector (App, Recipe, Group) */}
        <div className="flex border-b border-amber-100 bg-amber-50/40 p-1.5 gap-1">
          <button
            onClick={() => setMode('app')}
            className={`flex-1 py-2 px-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'app'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Todo el Cuaderno</span>
          </button>

          {recipe && (
            <button
              onClick={() => setMode('recipe')}
              className={`flex-1 py-2 px-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'recipe'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="truncate max-w-[120px]">{recipe.title}</span>
            </button>
          )}

          {group && (
            <button
              onClick={() => setMode('group')}
              className={`flex-1 py-2 px-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'group'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="truncate max-w-[120px]">{group.name}</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          
          {/* QR Display Card */}
          <div className="p-3 sm:p-4 bg-white rounded-3xl shadow-xl border-4 border-amber-400 relative">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Código QR para abrir en móvil"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl select-all"
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-stone-400 text-xs">
                Generando QR...
              </div>
            )}

            <div className="mt-2 text-[11px] font-mono text-stone-800 font-black tracking-wider">
              {mode === 'app' && 'PANAPP • CUADERNO COMPLETO'}
              {mode === 'recipe' && (recipe ? recipe.title.toUpperCase() : 'RECETA')}
              {mode === 'group' && (group ? group.name.toUpperCase() : 'BRIGADA')}
            </div>
          </div>

          {/* Toast de confirmación de descarga */}
          {downloadSuccess && (
            <div className="w-full p-2.5 bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-white" />
              <span>¡Imagen del código QR descargada en tu dispositivo!</span>
            </div>
          )}

          {/* Selector de Dirección Web (Pública vs Dev) */}
          <div className="w-full space-y-2 text-left bg-stone-50 p-3 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-stone-700">
              <span>Selecciona la dirección para el QR:</span>
              <button
                type="button"
                onClick={() => setIsEditingCustom(!isEditingCustom)}
                className="text-amber-700 hover:text-amber-900 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingCustom ? 'Cerrar edición' : 'Escribir otra URL / IP'}</span>
              </button>
            </div>

            {/* Selector de servidor */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUrlType('dev');
                  setIsEditingCustom(false);
                }}
                className={`py-2 px-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  urlType === 'dev'
                    ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm font-bold'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Laptop className="w-3.5 h-3.5 shrink-0" />
                  <span>Enlace Activo (Directo)</span>
                </div>
                <div className="text-[10px] opacity-80 truncate mt-0.5">
                  ais-dev-... (Igual que en tus juegos)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUrlType('shared');
                  setIsEditingCustom(false);
                }}
                className={`py-2 px-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  urlType === 'shared'
                    ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm font-bold'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>Enlace Público (Pre)</span>
                </div>
                <div className="text-[10px] opacity-80 truncate mt-0.5">
                  ais-pre-... (Al compartir app)
                </div>
              </button>
            </div>

            {/* Custom URL Input if selected or editing */}
            {isEditingCustom && (
              <div className="pt-1 animate-in fade-in">
                <label className="text-[10px] font-bold text-stone-500 block mb-1">
                  Introduce tu dominio o IP local de taller (ej. http://192.168.1.15:3000):
                </label>
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={handleCustomChange}
                  placeholder="https://tu-dominio.com o http://192.168.X.X:3000"
                  className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            )}

            {/* Dirección resultante con botones de copiar y probar */}
            <div className="mt-2 flex items-center gap-1.5 bg-white p-2 rounded-xl border border-amber-200">
              <input
                type="text"
                readOnly
                value={qrTargetUrl}
                className="flex-1 text-[11px] truncate px-1 font-mono font-bold outline-none text-stone-800 bg-transparent"
              />

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-stone-800 text-xs font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                title="Copiar enlace"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
                <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
              </button>

              <a
                href={qrTargetUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 text-xs font-bold transition-colors shrink-0"
                title="Abrir enlace en pestaña nueva para comprobar que funciona"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
              </a>
            </div>
          </div>

            {/* Action Buttons: Download PNG, Copy Image, Print */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleDownloadQRImage}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Imagen QR (PNG)</span>
              </button>

              <button
                onClick={handleCopyImage}
                className="py-3 px-4 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                title="Copiar imagen al portapapeles"
              >
                {copiedImage ? <Check className="w-4 h-4 text-emerald-600" /> : <ImageIcon className="w-4 h-4 text-amber-700" />}
                <span>{copiedImage ? '¡Imagen Copiada!' : 'Copiar Imagen QR'}</span>
              </button>
            </div>

            {/* Consejo de apertura en móvil */}
            <div className="w-full bg-amber-50/90 border border-amber-200/90 rounded-2xl p-2.5 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                <span>💡 Si al escanear ves el logo de AI Studio o un círculo de carga:</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                El lector de cámara de algunos móviles bloquea cookies de Google. Pulsa en los <strong>tres puntos (⋮)</strong> o icono de <strong>brújula</strong> de tu teléfono y elige <em>"Abrir en Chrome"</em> o <em>"Abrir en Safari"</em>.
              </p>
            </div>

            <div className="w-full flex items-center justify-center pt-1">
            <button
              onClick={() => window.print()}
              className="py-2 px-4 rounded-xl bg-white hover:bg-amber-50 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>Imprimir Ficha con Código QR</span>
            </button>
          </div>

          {/* Backup JSON */}
          <div className="pt-3 border-t border-amber-100 w-full flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1.5 font-medium">
              <FileJson className="w-4 h-4 text-amber-600" />
              Copia de seguridad del recetario
            </span>
            <button
              onClick={handleDownloadBackup}
              className="text-amber-700 hover:text-amber-800 font-extrabold underline flex items-center gap-1 cursor-pointer"
            >
              Descargar todo (.JSON)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
