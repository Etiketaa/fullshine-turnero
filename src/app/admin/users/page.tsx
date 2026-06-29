import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  AlertTriangle,
  X,
  Shield,
} from 'lucide-react';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'gerente' | 'empleado';
  is_active: boolean;
  created_at: string;
};

const roleLabels: Record<Profile['role'], string> = {
  admin: 'Admin',
  gerente: 'Gerente',
  empleado: 'Empleado',
};

const roleBadgeStyles: Record<Profile['role'], string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  gerente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  empleado: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'empleado' as Profile['role'],
    is_active: true,
  });

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return profiles.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  const handleCreate = async () => {
    if (!formData.full_name.trim() || !formData.email.trim()) return;

    const { error } = await supabase.from('profiles').insert({
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      is_active: formData.is_active,
    });

    if (!error) {
      setShowCreateModal(false);
      resetForm();
      fetchProfiles();
    }
  };

  const handleEdit = async () => {
    if (!selectedProfile || !formData.full_name.trim()) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name.trim(),
        role: formData.role,
        is_active: formData.is_active,
      })
      .eq('id', selectedProfile.id);

    if (!error) {
      setShowEditModal(false);
      setSelectedProfile(null);
      resetForm();
      fetchProfiles();
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', selectedProfile.id);

    if (!error) {
      setShowDeleteModal(false);
      setSelectedProfile(null);
      fetchProfiles();
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      role: 'empleado',
      is_active: true,
    });
  };

  const openEditModal = (profile: Profile) => {
    setSelectedProfile(profile);
    setFormData({
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowDeleteModal(true);
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Email', 'Rol', 'Activo', 'Fecha de Creación'];
    const rows = filteredProfiles.map((p) => [
      p.full_name,
      p.email,
      roleLabels[p.role],
      p.is_active ? 'Sí' : 'No',
      new Date(p.created_at).toLocaleDateString('es-AR'),
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Usuarios</h1>
              <p className="text-sm text-zinc-400">
                Gestiona los perfiles y roles del sistema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-white/10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-sm text-zinc-400">Total</p>
            <p className="text-2xl font-bold text-white">{profiles.length}</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-sm text-zinc-400">Admins</p>
            <p className="text-2xl font-bold text-red-400">
              {profiles.filter((p) => p.role === 'admin').length}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-sm text-zinc-400">Gerentes</p>
            <p className="text-2xl font-bold text-yellow-400">
              {profiles.filter((p) => p.role === 'gerente').length}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-sm text-zinc-400">Empleados</p>
            <p className="text-2xl font-bold text-green-400">
              {profiles.filter((p) => p.role === 'empleado').length}
            </p>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 py-20 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
            <p className="text-lg font-medium text-zinc-400">
              {searchQuery
                ? 'No se encontraron usuarios'
                : 'No hay usuarios registrados'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="group relative rounded-2xl bg-white/5 border border-white/10 p-5 transition-colors hover:bg-white/[0.07]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                      {profile.full_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {profile.full_name}
                      </h3>
                      <p className="text-sm text-zinc-400">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEditModal(profile)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(profile)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium',
                      roleBadgeStyles[profile.role]
                    )}
                  >
                    <Shield className="h-3 w-3" />
                    {roleLabels[profile.role]}
                  </span>
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium',
                      profile.is_active ? 'text-green-400' : 'text-zinc-500'
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        profile.is_active ? 'bg-green-400' : 'bg-zinc-600'
                      )}
                    />
                    {profile.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="mt-3 border-t border-white/5 pt-3">
                  <p className="text-xs text-zinc-500">
                    Creado: {new Date(profile.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-800 border border-white/10 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Nuevo Usuario</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Juan Pérez"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="juan@ejemplo.com"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as Profile['role'],
                    })
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500/50"
                >
                  <option value="empleado">Empleado</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setFormData({ ...formData, is_active: !formData.is_active })
                  }
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    formData.is_active ? 'bg-blue-600' : 'bg-zinc-600'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                      formData.is_active && 'translate-x-5'
                    )}
                  />
                </button>
                <span className="text-sm text-zinc-300">
                  {formData.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.full_name.trim() || !formData.email.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-800 border border-white/10 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Editar Usuario</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Juan Pérez"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-zinc-500 outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as Profile['role'],
                    })
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500/50"
                >
                  <option value="empleado">Empleado</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setFormData({ ...formData, is_active: !formData.is_active })
                  }
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    formData.is_active ? 'bg-blue-600' : 'bg-zinc-600'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                      formData.is_active && 'translate-x-5'
                    )}
                  />
                </button>
                <span className="text-sm text-zinc-300">
                  {formData.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                disabled={!formData.full_name.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-zinc-800 border border-white/10 p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-white">
              Eliminar usuario
            </h2>
            <p className="mb-6 text-sm text-zinc-400">
              ¿Estás seguro de que deseas eliminar a{' '}
              <span className="font-medium text-white">
                {selectedProfile.full_name}
              </span>
              ? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
