import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../shared/Header';
import { Modal } from '../shared/Modal';
import { OTPRequestModal } from './OTPRequestModal';
import { Share2, Eye, EyeOff, Copy, Check, Shield } from 'lucide-react';

interface PasswordEntry {
  id: string;
  website_name: string;
  website_url: string;
  username: string;
  password: string;
  notes: string;
  otp_required: boolean;
  created_at: string;
}

export function EmployeeDashboard() {
  const { userProfile } = useAuth();
  const [sharedPasswords, setSharedPasswords] = useState<PasswordEntry[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);

  useEffect(() => {
    fetchSharedPasswords();
  }, [userProfile]);

  const fetchSharedPasswords = async () => {
    if (!userProfile) return;

    const { data, error } = await supabase
      .from('password_assignments')
      .select(`
        password_entry_id,
        password_entries(*)
      `)
      .eq('assigned_to', userProfile.id);

    if (error) {
      console.error('Error fetching shared passwords:', error);
      return;
    }

    const passwords = data.map(item => item.password_entries).filter(Boolean) as PasswordEntry[];
    setSharedPasswords(passwords);
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

  const handleOTPRequest = (entry: PasswordEntry) => {
    setSelectedEntry(entry);
    setShowOTPModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Employee Dashboard</h2>
          <p className="text-slate-600 mt-1">View passwords shared with you</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Shared Access ({sharedPasswords.length})</h3>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {sharedPasswords.length === 0 ? (
                <p className="text-center text-slate-500 py-12">No shared passwords yet</p>
              ) : (
                sharedPasswords.map(entry => (
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
                      {entry.otp_required && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            OTP Required
                          </span>
                          <button
                            onClick={() => handleOTPRequest(entry)}
                            className="flex items-center gap-2 px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                          >
                            <Shield className="w-4 h-4" />
                            Request OTP
                          </button>
                        </div>
                      )}
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
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                        <p className="text-sm text-slate-700">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedEntry && (
        <Modal
          isOpen={showOTPModal}
          onClose={() => {
            setShowOTPModal(false);
            setSelectedEntry(null);
          }}
          title="OTP Request"
        >
          <OTPRequestModal
            passwordEntryId={selectedEntry.id}
            websiteName={selectedEntry.website_name}
            onClose={() => {
              setShowOTPModal(false);
              setSelectedEntry(null);
            }}
            onSuccess={() => {}}
          />
        </Modal>
      )}
    </div>
  );
}
