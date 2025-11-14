import { useAuth } from '../../contexts/AuthContext';
import { Lock, LogOut, User } from 'lucide-react';

export function Header() {
  const { userProfile, signOut } = useAuth();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-emerald-100 text-emerald-800';
      case 'team_lead':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Password Manager</h1>
              <p className="text-xs text-slate-500">Secure Credential Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userProfile && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{userProfile.name}</p>
                  <p className="text-xs text-slate-500">{userProfile.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userProfile.role)}`}>
                  {formatRole(userProfile.role)}
                </span>
              </div>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
