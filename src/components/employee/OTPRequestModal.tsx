import { useState } from 'react';
import { AlertCircle, Shield, Clock } from 'lucide-react';

interface OTPRequestModalProps {
  passwordEntryId: string;
  websiteName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OTPRequestModal({ passwordEntryId, websiteName, onClose, onSuccess }: OTPRequestModalProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');

  const requestOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-otp`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          password_entry_id: passwordEntryId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate OTP');
      }

      const data = await response.json();
      setOtpCode(data.otp_code);
      setExpiresAt(data.expires_at);
      setOtpRequested(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatExpiryTime = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = Math.floor((expiry.getTime() - now.getTime()) / 1000 / 60);
    return `${diff} minutes`;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!otpRequested ? (
        <>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Request OTP Access</h3>
            <p className="text-slate-600">
              This password entry requires OTP verification. Click below to request a one-time access code for{' '}
              <span className="font-semibold">{websiteName}</span>.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">OTP Expiry</p>
                <p className="text-sm text-slate-600">
                  The OTP will expire after 10 minutes and can only be used once.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={requestOTP}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Request OTP'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">OTP Generated Successfully</h3>
            <p className="text-slate-600 mb-4">
              Your one-time password has been generated. Use this code to access the credentials.
            </p>

            <div className="bg-slate-900 rounded-lg p-6 mb-4">
              <p className="text-xs text-slate-400 mb-2">Your OTP Code</p>
              <p className="text-3xl font-bold text-white tracking-wider">{otpCode}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-amber-900 mb-1">Expires in {formatExpiryTime(expiresAt)}</p>
                  <p className="text-sm text-amber-700">
                    This code can only be used once and will expire automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </>
      )}
    </div>
  );
}
