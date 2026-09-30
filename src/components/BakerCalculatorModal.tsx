import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  Thermometer, 
  Scale, 
  Droplets, 
  AlertTriangle, 
  Info,
  Check
} from 'lucide-react';
import { calculateWaterTemp } from '../utils/bakerMath';

interface BakerCalculatorModalProps {
  onClose: () => void;
}

export const BakerCalculatorModal: React.FC<BakerCalculatorModalProps> = ({ onClose }) => {
  const [calcTab, setCalcTab] = useState<'water' | 'scaling'>('water');

  // TDM State
  const [targetDoughTemp, setTargetDoughTemp] = useState<number>(24.0);
  const [roomTemp, setRoomTemp] = useState<number>(22.0);
  const [flourTemp, setFlourTemp] = useState<number>(21.0);
  const [kneaderFriction, setKneaderFriction] = useState<number>(9.0); // 9°C espiral estándar
  const [kneaderType, setKneaderType] = useState<string>('espiral');
  const [usePreferment, setUsePreferment] = useState<boolean>(false);
  const [prefermentTemp, setPrefermentTemp] = useState<number>(20.0);

  // Scaling state
  const [targetPieces, setTargetPieces] = useState<number>(10);
  const [pieceWeight, setPieceWeight] = useState<number>(250); // gramos
  const [doughLoss, setDoughLoss] = useState<number>(3); // % merma
  const [sampleHydration, setSampleHydration] = useState<number>(65);
  const [sampleSalt, setSampleSalt] = useState<number>(1.8);
  const [sampleYeast, setSampleYeast] = useState<number>(1.5);

  const handleKneaderPreset = (type: string) => {
    setKneaderType(type);
    if (type === 'espiral') setKneaderFriction(9.0);
    else if (type === 'brazos') setKneaderFriction(5.0);
    else if (type === 'horquilla') setKneaderFriction(3.0);
    else if (type === 'manual') setKneaderFriction(1.5);
  };

  const waterCalcResult = calculateWaterTemp({
    targetDoughTempC: targetDoughTemp,
    roomTempC: roomTemp,
    flourTempC: flourTemp,
    frictionTempC: kneaderFriction,
    usePreferment,
    prefermentTempC: prefermentTemp,
  });

  const totalTargetDough = Math.round(targetPieces * pieceWeight * (1 + doughLoss / 100));
  const sumPercentages = 100 + sampleHydration + sampleSalt + sampleYeast;
  const scaledFlour = Math.round((totalTargetDough / sumPercentages) * 100);
  const scaledWater = Math.round((scaledFlour * sampleHydration) / 100);
  const scaledSalt = Math.round((scaledFlour * sampleSalt) / 100);
  const scaledYeast = Math.round((scaledFlour * sampleYeast) / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border-2 border-amber-300 rounded-3xl shadow-2xl overflow-hidden text-stone-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 font-display">
                Calculadora Técnica de Obrador 🧮🌾
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Fórmulas de temperatura y pesaje para alumnos de 1º curso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-amber-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-amber-100 bg-amber-50/40 p-1.5">
          <button
            onClick={() => setCalcTab('water')}
            className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              calcTab === 'water'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            Tª del Agua (TDM)
          </button>
          <button
            onClick={() => setCalcTab('scaling')}
            className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              calcTab === 'scaling'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            Escalado por Piezas
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {calcTab === 'water' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-5 text-white flex items-center justify-between shadow-lg shadow-amber-500/20">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-100 block">
                    TEMPERATURA CALCULADA DEL AGUA:
                  </span>
                  <div className="text-4xl font-black mt-1 font-mono tracking-tight drop-shadow-sm">
                    {waterCalcResult.waterTempC} °C
                  </div>
                  <span className="text-xs text-amber-50 font-medium">
                    💧 Añade agua fría o hielo picado si la temperatura ambiente es alta.
                  </span>
                </div>
                <div className="text-5xl drop-shadow-md">💧</div>
              </div>

              {waterCalcResult.warning && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{waterCalcResult.warning}</span>
                </div>
              )}

              {/* Form inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">
                    Tª Masa Deseada (TDM)
                  </label>
                  <div className="flex items-center bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      step="0.5"
                      value={targetDoughTemp}
                      onChange={e => setTargetDoughTemp(Number(e.target.value))}
                      className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                    />
                    <span className="text-stone-500 font-semibold ml-1">°C</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium">Habitualmente 24°C - 25°C</span>
                </div>

                <div>
                  <label className="text-stone-700 font-bold block mb-1">
                    Tª Ambiente del Obrador
                  </label>
                  <div className="flex items-center bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      step="0.5"
                      value={roomTemp}
                      onChange={e => setRoomTemp(Number(e.target.value))}
                      className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                    />
                    <span className="text-stone-500 font-semibold ml-1">°C</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium">Termómetro del aula</span>
                </div>

                <div>
                  <label className="text-stone-700 font-bold block mb-1">
                    Tª del Saco de Harina
                  </label>
                  <div className="flex items-center bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      step="0.5"
                      value={flourTemp}
                      onChange={e => setFlourTemp(Number(e.target.value))}
                      className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                    />
                    <span className="text-stone-500 font-semibold ml-1">°C</span>
                  </div>
                </div>

                <div>
                  <label className="text-stone-700 font-bold block mb-1">
                    Fricción de Amasadora
                  </label>
                  <div className="flex items-center bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      step="0.5"
                      value={kneaderFriction}
                      onChange={e => setKneaderFriction(Number(e.target.value))}
                      className="w-full bg-transparent text-stone-900 font-mono font-bold outline-none"
                    />
                    <span className="text-stone-500 font-semibold ml-1">°C</span>
                  </div>
                </div>
              </div>

              {/* Kneader presets */}
              <div>
                <label className="text-xs font-black text-amber-950 block mb-1.5 uppercase tracking-wide">
                  Preajuste de Fricción según maquinaria:
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                  {[
                    { id: 'espiral', label: 'Espiral (9°C)' },
                    { id: 'brazos', label: 'Brazos (5°C)' },
                    { id: 'horquilla', label: 'Horquilla (3°C)' },
                    { id: 'manual', label: 'Manual (1.5°C)' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleKneaderPreset(item.id)}
                      className={`p-2 rounded-xl border text-center transition-all font-bold cursor-pointer ${
                        kneaderType === item.id
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-amber-50 text-stone-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferment toggle */}
              <div className="pt-2 border-t border-amber-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-800 font-bold">
                  <input
                    type="checkbox"
                    checked={usePreferment}
                    onChange={e => setUsePreferment(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>¿La receta incluye Masa Madre / Biga / Poolish templado?</span>
                </label>
                {usePreferment && (
                  <div className="mt-2 pl-6">
                    <label className="text-[11px] text-stone-600 font-semibold block mb-1">
                      Tª del Prefermento (°C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={prefermentTemp}
                      onChange={e => setPrefermentTemp(Number(e.target.value))}
                      className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-stone-900 font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Comprehensive TDM Educational Guide */}
              <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 space-y-3 text-xs shadow-xs">
                <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
                  <span className="text-xl">📚</span>
                  <span>¿Para qué sirve la Calculadora TDM en 1º de Panadería?</span>
                </div>

                <div className="space-y-2.5 text-stone-700 leading-relaxed font-normal">
                  <p>
                    <strong className="text-stone-900 font-extrabold">1. ¿Qué es la TDM?:</strong> Significa <strong className="text-amber-800 font-bold">Temperatura Deseada de la Masa</strong> (o <em>Temperatura Base</em>). Es la temperatura exacta (habitualmente <strong>24°C - 25°C</strong>) a la que debe salir la masa de la amasadora para que la levadura y las bacterias comiencen a fermentar al ritmo técnico planificado.
                  </p>

                  <p>
                    <strong className="text-stone-900 font-extrabold">2. ¿Por qué se calcula la temperatura del agua?:</strong> En el obrador, la temperatura ambiente y la de la harina del saco ya vienen dadas. Además, la máquina transmite calor por fricción mecánica. <strong className="text-amber-900 font-bold">El AGUA es el único ingrediente cuya temperatura podemos regular a voluntad</strong> para compensar el calor o el frío.
                  </p>

                  <div className="p-3 bg-white rounded-2xl border border-amber-200 text-stone-900 font-mono text-[11px] space-y-1">
                    <span className="font-bold text-amber-900 block font-sans">📐 Fórmula Panadera Maestra:</span>
                    <div>Tª Agua = (TDM × 3) - (Tª Ambiente + Tª Harina + Fricción Amasadora)</div>
                    <div className="text-[10px] text-stone-500 font-sans">*(Se multiplica por 4 si se añade masa madre o prefermento líquido)*</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-950">
                      <strong className="block text-blue-900 font-bold mb-0.5">❄️ Si la masa sale fría (&lt; 22°C):</strong>
                      La levadura se aletarga, el pan tarda el doble en fermentar, pierde volumen y la greña queda cerrada.
                    </div>
                    <div className="p-2.5 bg-rose-50/80 rounded-xl border border-rose-200 text-rose-950">
                      <strong className="block text-rose-900 font-bold mb-0.5">🔥 Si la masa sale caliente (&gt; 26°C):</strong>
                      Fermenta en la propia cubeta, degrada el gluten, se vuelve pegajosa y la corteza se arruga rápido.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {calcTab === 'scaling' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">
                    Número de Piezas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetPieces}
                    onChange={e => setTargetPieces(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl font-mono text-stone-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">
                    Peso por pieza (g)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={pieceWeight}
                    onChange={e => setPieceWeight(Math.max(10, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl font-mono text-stone-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">
                    % Hidratación
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="100"
                    value={sampleHydration}
                    onChange={e => setSampleHydration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl font-mono text-stone-900 font-bold"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-5 bg-amber-50/80 rounded-3xl border border-amber-200 space-y-3 shadow-xs">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-amber-200/80 font-bold">
                  <span className="text-stone-600">Masa total requerida (+{doughLoss}% merma):</span>
                  <span className="text-amber-800 font-black font-mono text-base">{totalTargetDough} g</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-800 font-bold flex items-center gap-1.5">
                      🌾 Harina Panadera Base (100%):
                    </span>
                    <span className="font-black font-mono text-stone-900 text-sm">{scaledFlour} g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-800 font-bold flex items-center gap-1.5">
                      💧 Agua ({sampleHydration}%):
                    </span>
                    <span className="font-black font-mono text-stone-900 text-sm">{scaledWater} g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-800 font-bold flex items-center gap-1.5">
                      🧂 Sal marina ({sampleSalt}%):
                    </span>
                    <span className="font-black font-mono text-stone-900 text-sm">{scaledSalt} g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-800 font-bold flex items-center gap-1.5">
                      🧫 Levadura fresca ({sampleYeast}%):
                    </span>
                    <span className="font-black font-mono text-stone-900 text-sm">{scaledYeast} g</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-stone-600 flex items-center gap-1.5 font-medium">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Lleva estos pesos a la báscula de tu mesa de taller para no desperdiciar ingredientes.
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
