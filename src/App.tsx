import { useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeamLeadDashboard } from './components/teamlead/TeamLeadDashboard';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';

function App() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <LoginForm />;
  }

  switch (userProfile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'team_lead':
      return <TeamLeadDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    default:
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600">Invalid role</p>
          </div>
        </div>
      );
  }
}

export default App;
