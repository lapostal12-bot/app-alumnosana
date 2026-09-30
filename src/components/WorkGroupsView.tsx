import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  UserCheck, 
  QrCode, 
  CheckCircle, 
  Award, 
  BookOpen, 
  Table, 
  Sparkles,
  Trash2,
  Edit2,
  Heart,
  Smile,
  X,
  UserPlus
} from 'lucide-react';
import { WorkGroup, GroupMember, Recipe } from '../types/bakery';

interface WorkGroupsViewProps {
  groups: WorkGroup[];
  recipes: Recipe[];
  activeGroupId: string;
  onSelectActiveGroup: (groupId: string) => void;
  onUpdateGroups: (groups: WorkGroup[]) => void;
  onOpenQR: (group: WorkGroup) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

const AVATAR_COLORS = [
  'bg-amber-500',
  'bg-orange-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-rose-500',
];

const ROLES_LIST: GroupMember['role'][] = [
  'Jefe de Brigada',
  'Amasado y Pesaje',
  'Control de Fermentación',
  'Horno y Cocción',
  'Fotografía y Bitácora',
];

export const WorkGroupsView: React.FC<WorkGroupsViewProps> = ({
  groups,
  recipes,
  activeGroupId,
  onSelectActiveGroup,
  onUpdateGroups,
  onOpenQR,
  onSelectRecipe,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<WorkGroup | null>(null);

  // Form State
  const [groupName, setGroupName] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [shift, setShift] = useState<'mañana' | 'tarde'>('mañana');
  const [motto, setMotto] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [members, setMembers] = useState<Array<{ id?: string; name: string; role: GroupMember['role']; avatarBg?: string }>>([]);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setGroupName(`Brigada ${groups.length + 1} • Nueva Mesa ✨`);
    setTableNumber(groups.length + 1);
    setShift('mañana');
    setMotto('¡Pasión por el amasado y el buen pan!');
    setNotes('Mesa de trabajo y cámara de fermentación asignada.');
    setMembers([
      { id: `m-${Date.now()}-1`, name: 'Alumno 1', role: 'Jefe de Brigada', avatarBg: 'bg-amber-500' },
      { id: `m-${Date.now()}-2`, name: 'Alumno 2', role: 'Amasado y Pesaje', avatarBg: 'bg-orange-500' },
      { id: `m-${Date.now()}-3`, name: 'Alumno 3', role: 'Control de Fermentación', avatarBg: 'bg-emerald-500' },
      { id: `m-${Date.now()}-4`, name: 'Alumno 4', role: 'Fotografía y Bitácora', avatarBg: 'bg-rose-500' },
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (group: WorkGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setTableNumber(group.tableNumber);
    setShift(group.shift);
    setMotto(group.motto || '');
    setNotes(group.notes || '');
    setMembers(
      group.members.length > 0 
        ? group.members.map(m => ({ id: m.id, name: m.name, role: m.role, avatarBg: m.avatarBg }))
        : [
            { id: `m-${Date.now()}-1`, name: 'Alumno 1', role: 'Jefe de Brigada', avatarBg: 'bg-amber-500' },
            { id: `m-${Date.now()}-2`, name: 'Alumno 2', role: 'Amasado y Pesaje', avatarBg: 'bg-orange-500' },
          ]
    );
    setShowModal(true);
  };

  const handleAddMember = () => {
    const nextIdx = members.length + 1;
    const color = AVATAR_COLORS[members.length % AVATAR_COLORS.length];
    setMembers([
      ...members,
      {
        id: `m-${Date.now()}-${nextIdx}`,
        name: `Alumno ${nextIdx}`,
        role: 'Amasado y Pesaje',
        avatarBg: color,
      }
    ]);
  };

  const handleRemoveMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const validMembers: GroupMember[] = members
      .filter(m => m.name.trim().length > 0)
      .map((m, idx) => ({
        id: m.id || `member-${Date.now()}-${idx}`,
        name: m.name.trim(),
        role: m.role,
        avatarBg: m.avatarBg || AVATAR_COLORS[idx % AVATAR_COLORS.length],
      }));

    if (editingGroup) {
      // Update existing group
      const updated = groups.map(g => {
        if (g.id === editingGroup.id) {
          return {
            ...g,
            name: groupName.trim(),
            tableNumber,
            shift,
            motto: motto.trim(),
            notes: notes.trim(),
            members: validMembers,
          };
        }
        return g;
      });
      onUpdateGroups(updated);
      setShowModal(false);
    } else {
      // Create new group
      const colors = ['#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#8b5cf6', '#06b6d4'];
      const assignedColor = colors[groups.length % colors.length];

      const newGroup: WorkGroup = {
        id: `brigada-${Date.now()}`,
        name: groupName.trim(),
        tableNumber,
        shift,
        motto: motto.trim(),
        color: assignedColor,
        notes: notes.trim(),
        members: validMembers,
        assignedRecipeIds: [],
      };

      const updated = [...groups, newGroup];
      onUpdateGroups(updated);
      onSelectActiveGroup(newGroup.id);
      setShowModal(false);
    }
  };

  const deleteGroup = (groupId: string) => {
    if (groups.length <= 1) {
      alert('Debe existir al menos un grupo de trabajo en el taller.');
      return;
    }
    if (confirm('¿Eliminar esta brigada de trabajo?')) {
      const updated = groups.filter(g => g.id !== groupId);
      onUpdateGroups(updated);
      if (activeGroupId === groupId) {
        onSelectActiveGroup(updated[0].id);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cheerful Header bar */}
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 text-9xl opacity-15 select-none pointer-events-none">
          👥
        </div>

        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/25 backdrop-blur-md text-white font-extrabold text-xs border border-white/30">
            <span>🤝 Cooperación y Trabajo en Equipo en Obrador</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight font-display text-white">
            Brigadas y Mesas de Taller 🥐🥖
          </h2>

          <p className="text-sm text-amber-50 font-medium leading-relaxed">
            Organiza tu mesa, edita los nombres de los alumnos de tu brigada y reparte los roles de la práctica (Jefe de Brigada, Amasado, Horno, Fermentación).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-6 py-4 bg-stone-900 hover:bg-black text-amber-300 hover:text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-xl transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5 text-amber-400" />
          <span>Crear Nueva Mesa / Brigada</span>
        </button>
      </div>

      {/* Grid of Work Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => {
          const isActive = group.id === activeGroupId;
          const groupRecipes = recipes.filter(r => r.groupId === group.id);

          return (
            <div
              key={group.id}
              className={`bg-white border-2 rounded-3xl overflow-hidden shadow-md flex flex-col justify-between transition-all duration-200 transform hover:-translate-y-1 ${
                isActive
                  ? 'border-amber-500 ring-4 ring-amber-300/40 shadow-xl shadow-amber-500/10'
                  : 'border-amber-100 hover:border-amber-300'
              }`}
            >
              
              {/* Group Top header banner */}
              <div
                className="p-5 text-stone-900 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${group.color}25 0%, #fffbf0 100%)`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-white shadow-xs text-amber-900 border border-amber-200">
                        Mesa {group.tableNumber} • Turno {group.shift}
                      </span>
                      {isActive && (
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Mi Brigada
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-stone-900 tracking-tight font-display">
                      {group.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(group)}
                      title="Editar esta brigada y sus alumnos"
                      className="p-2 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-xs transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>

                    <button
                      onClick={() => onOpenQR(group)}
                      title="Generar cartel QR para la mesa de trabajo"
                      className="p-2 rounded-xl bg-white hover:bg-amber-100 text-stone-700 hover:text-amber-800 border border-amber-200 shadow-xs transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {group.motto && (
                  <p className="text-xs text-stone-600 italic mt-2.5 line-clamp-2 font-medium">
                    "{group.motto}"
                  </p>
                )}
              </div>

              {/* Members List */}
              <div className="p-5 space-y-4 flex-1">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider block">
                      Integrantes y Roles ({group.members.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(group)}
                      className="text-[11px] text-amber-700 hover:text-amber-950 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Editar alumnos
                    </button>
                  </div>
                  
                  {group.members.length === 0 ? (
                    <div className="text-xs text-stone-400 italic py-2">
                      Sin alumnos asignados todavía.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.members.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl ${member.avatarBg} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-stone-800 truncate">
                              {member.name}
                            </span>
                          </div>

                          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-white text-amber-950 font-bold border border-amber-200/80 shrink-0 shadow-2xs">
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assigned Recipes */}
                <div className="pt-2 border-t border-amber-100">
                  <span className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider block mb-2">
                    Fórmulas Asignadas a esta Mesa ({groupRecipes.length})
                  </span>

                  {groupRecipes.length === 0 ? (
                    <p className="text-xs text-stone-400">Sin recetas asignadas todavía.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {groupRecipes.map(r => (
                        <button
                          key={r.id}
                          onClick={() => onSelectRecipe(r)}
                          className="text-left px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-stone-800 text-xs font-bold border border-amber-200 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>🥖</span>
                          <span className="truncate max-w-[150px]">{r.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {group.notes && (
                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 text-[11px] text-stone-600 font-medium">
                    <strong className="text-amber-950 font-bold">Puesto de taller:</strong> {group.notes}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-amber-100 bg-amber-50/40 flex items-center justify-between gap-2">
                {!isActive ? (
                  <button
                    onClick={() => onSelectActiveGroup(group.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-amber-500 hover:text-white text-stone-800 border border-amber-200 text-xs font-extrabold transition-all text-center shadow-xs cursor-pointer"
                  >
                    Seleccionar como Mi Mesa
                  </button>
                ) : (
                  <div className="flex-1 py-2 px-3 rounded-xl bg-amber-500 text-white text-xs font-black text-center shadow-sm">
                    ✓ Mi Mesa Activa
                  </div>
                )}

                <button
                  onClick={() => handleOpenEdit(group)}
                  className="p-2 rounded-xl bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Editar Brigada"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="text-xs">Editar</span>
                </button>

                <button
                  onClick={() => deleteGroup(group.id)}
                  className="p-2 text-stone-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                  title="Eliminar grupo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Create / Edit Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border-2 border-amber-300 rounded-3xl shadow-2xl overflow-hidden text-stone-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50/80">
              <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2 font-display">
                <span>👥</span> {editingGroup ? `Editar Brigada: ${editingGroup.name}` : 'Nueva Brigada de Taller'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-amber-100 text-stone-500 text-sm font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-extrabold text-stone-800 block mb-1">
                  Nombre de la Brigada *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Ej. Brigada 1 • Espiga Dorada"
                  className="w-full px-3 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-stone-800 font-extrabold block mb-1">
                    Número de Mesa de Obrador
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tableNumber}
                    onChange={e => setTableNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-stone-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-stone-800 font-extrabold block mb-1">
                    Turno
                  </label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value as any)}
                    className="w-full px-3 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-stone-900 font-bold"
                  >
                    <option value="mañana">Mañana</option>
                    <option value="tarde">Tarde</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-stone-800 block mb-1">
                  Lema de la Brigada
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={e => setMotto(e.target.value)}
                  placeholder="Ej. Buena fermentación y corteza crujiente"
                  className="w-full px-3 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-stone-900 font-medium"
                />
              </div>

              {/* Members Inputs */}
              <div className="space-y-2 pt-2 border-t border-amber-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wide block">
                    Alumnos Integrantes ({members.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Añadir Alumno</span>
                  </button>
                </div>

                <p className="text-[11px] text-stone-500">
                  Puedes editar el nombre de cada alumno (ej. Alumno 1, o su nombre real) y seleccionar su rol en el taller:
                </p>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {members.map((m, idx) => (
                    <div 
                      key={m.id || idx} 
                      className="flex items-center gap-2 p-2 bg-amber-50/70 border border-amber-200 rounded-2xl"
                    >
                      <div className={`w-7 h-7 rounded-lg ${m.avatarBg || 'bg-amber-500'} text-white flex items-center justify-center font-black text-[11px] shrink-0`}>
                        {m.name ? m.name.charAt(0).toUpperCase() : `${idx + 1}`}
                      </div>

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={m.name}
                          onChange={e => {
                            const updated = [...members];
                            updated[idx].name = e.target.value;
                            setMembers(updated);
                          }}
                          placeholder={`Alumno ${idx + 1}...`}
                          className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-stone-900 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="w-40 shrink-0">
                        <select
                          value={m.role}
                          onChange={e => {
                            const updated = [...members];
                            updated[idx].role = e.target.value as any;
                            setMembers(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-xl text-[11px] text-stone-800 font-semibold cursor-pointer"
                        >
                          {ROLES_LIST.map(role => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        title="Eliminar alumno"
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-stone-800 block mb-1">
                  Notas / Puesto de Taller
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej. Mesa frente a la amasadora espiral nº 2..."
                  className="w-full px-3 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold shadow-md shadow-amber-500/25 cursor-pointer"
                >
                  {editingGroup ? 'Guardar Cambios' : 'Crear Brigada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
