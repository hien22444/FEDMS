import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loginAsStudent } from '@/lib/actions/auth';

export default function LoginAsStudentPage() {
  const [studentCode, setStudentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) {
      setError('Please enter a student code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await loginAsStudent(studentCode.trim());

      // Save manager token so we can restore later
      const managerToken = localStorage.getItem('token');
      if (managerToken) {
        localStorage.setItem('managerToken', managerToken);
      }

      // Switch to student token
      localStorage.setItem('token', res.token);

      // Update auth context with student identity
      login(res.token, res.user, res.profile);

      navigate('/student/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Student not found.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Login as Student</h1>
        <p className="text-gray-500 text-sm mb-6">
          Enter the student code to view the system from the student's perspective.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Code
            </label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="e.g. SE123456"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login as Student'}
          </button>
        </form>
      </div>
    </div>
  );
}
