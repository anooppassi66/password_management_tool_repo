import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Header } from '../shared/Header';
import { Modal } from '../shared/Modal';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AddPasswordModal } from './AddPasswordModal';
import { Plus, Users, Key, Eye, EyeOff, Copy, Check, Trash2 } from 'lucide-react';

interface PasswordEntry {
  id: string;
  website_name: string;
  website_url: string;
  username: string;
  password: string;
  notes: string;
  otp_required: boolean;
  created_at: string;
  assignments: { assigned_to: string; users: { name: string; email: string } }[];
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'passwords' | 'employees'>('passwords');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPasswords();
    fetchEmployees();
  }, []);

  const fetchPasswords = async () => {
    const { data, error } = await supabase
      .from('password_entries')
      .select(`
        *,
        assignments:password_assignments(
          assigned_to,
          users:assigned_to(name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching passwords:', error);
      return;
    }

    setPasswords(data || []);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }

    setEmployees(data || []);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deletePasswordEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this password entry?')) return;

    const { error } = await supabase
      .from('password_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting password:', error);
      return;
    }

    fetchPasswords();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
            <p className="text-slate-600 mt-1">Manage passwords and employees</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddEmployee(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Employee
            </button>
            <button
              onClick={() => setShowAddPassword(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Password
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('passwords')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'passwords'
                    ? 'text-slate-900 border-b-2 border-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Key className="w-5 h-5" />
                Password Entries ({passwords.length})
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'employees'
                    ? 'text-slate-900 border-b-2 border-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-5 h-5" />
                Employees ({employees.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'passwords' && (
              <div className="space-y-4">
                {passwords.length === 0 ? (
                  <p className="text-center text-slate-500 py-12">No password entries yet</p>
                ) : (
                  passwords.map(entry => (
                    <div key={entry.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 text-lg">{entry.website_name}</h3>
                          <a
                            href={entry.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {entry.website_url}
                          </a>
                        </div>
                        <button
                          onClick={() => deletePasswordEntry(entry.id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Username</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-900">{entry.username}</p>
                            <button
                              onClick={() => copyToClipboard(entry.username, `username-${entry.id}`)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {copiedId === `username-${entry.id}` ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Password</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-900">
                              {visiblePasswords.has(entry.id) ? entry.password : '••••••••'}
                            </p>
                            <button
                              onClick={() => togglePasswordVisibility(entry.id)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {visiblePasswords.has(entry.id) ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(entry.password, `password-${entry.id}`)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {copiedId === `password-${entry.id}` ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                          <p className="text-sm text-slate-700">{entry.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {entry.assignments.map((assignment, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                            >
                              {assignment.users.name}
                            </span>
                          ))}
                        </div>
                        {entry.otp_required && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            OTP Required
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'employees' && (
              <div className="space-y-4">
                {employees.length === 0 ? (
                  <p className="text-center text-slate-500 py-12">No employees yet</p>
                ) : (
                  employees.map(employee => (
                    <div key={employee.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">{employee.name}</h3>
                          <p className="text-sm text-slate-600">{employee.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          employee.role === 'admin'
                            ? 'bg-emerald-100 text-emerald-800'
                            : employee.role === 'team_lead'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {employee.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showAddEmployee} onClose={() => setShowAddEmployee(false)} title="Add Employee">
        <AddEmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => {
            fetchEmployees();
            setShowAddEmployee(false);
          }}
        />
      </Modal>

      <Modal isOpen={showAddPassword} onClose={() => setShowAddPassword(false)} title="Add Password Entry">
        <AddPasswordModal
          onClose={() => setShowAddPassword(false)}
          onSuccess={() => {
            fetchPasswords();
            setShowAddPassword(false);
          }}
        />
      </Modal>
    </div>
  );
}
