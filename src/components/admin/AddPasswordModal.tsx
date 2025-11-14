import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Globe, Link, User, Lock, FileText, Users, Shield } from 'lucide-react';

interface AddPasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function AddPasswordModal({ onClose, onSuccess }: AddPasswordModalProps) {
  const { userProfile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    website_name: '',
    website_url: '',
    username: '',
    password: '',
    notes: '',
    otp_required: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .in('role', ['employee', 'team_lead']);

    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }

    setEmployees(data || []);
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: passwordEntry, error: entryError } = await supabase
        .from('password_entries')
        .insert({
          ...formData,
          created_by: userProfile!.id,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      if (selectedEmployees.length > 0) {
        const assignments = selectedEmployees.map(employeeId => ({
          password_entry_id: passwordEntry.id,
          assigned_to: employeeId,
          assigned_by: userProfile!.id,
        }));

        const { error: assignError } = await supabase
          .from('password_assignments')
          .insert(assignments);

        if (assignError) throw assignError;

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-access-notification`;
        const headers = {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        };

        await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            password_entry_id: passwordEntry.id,
            assigned_to: selectedEmployees,
          }),
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add password entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Globe className="w-4 h-4 inline mr-2" />
            Website Name
          </label>
          <input
            type="text"
            value={formData.website_name}
            onChange={(e) => setFormData({ ...formData, website_name: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            placeholder="Google Drive"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Link className="w-4 h-4 inline mr-2" />
            Website URL
          </label>
          <input
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            placeholder="https://drive.google.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Email / Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            placeholder="user@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Lock className="w-4 h-4 inline mr-2" />
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            placeholder="Enter password"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <FileText className="w-4 h-4 inline mr-2" />
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          placeholder="Additional notes or instructions"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="otp_required"
          checked={formData.otp_required}
          onChange={(e) => setFormData({ ...formData, otp_required: e.target.checked })}
          className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
        />
        <label htmlFor="otp_required" className="text-sm font-medium text-slate-700">
          <Shield className="w-4 h-4 inline mr-2" />
          Require OTP for access
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          <Users className="w-4 h-4 inline mr-2" />
          Assign to Employees
        </label>
        <div className="border border-slate-300 rounded-lg max-h-48 overflow-y-auto">
          {employees.length === 0 ? (
            <p className="text-sm text-slate-500 p-4 text-center">No employees available</p>
          ) : (
            employees.map(employee => (
              <label
                key={employee.id}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-200 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedEmployees.includes(employee.id)}
                  onChange={() => toggleEmployee(employee.id)}
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{employee.name}</p>
                  <p className="text-xs text-slate-500">{employee.email}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  employee.role === 'team_lead' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {employee.role === 'team_lead' ? 'Team Lead' : 'Employee'}
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Password Entry'}
        </button>
      </div>
    </form>
  );
}
