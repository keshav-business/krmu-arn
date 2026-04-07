import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axiosInstance from '@/utils/axiosConfig';
import { Users, ChartBar, SignOut, Lock } from '@phosphor-icons/react';

const BACKEND_URL = 'https://unevaporative-holden-unvatted.ngrok-free.dev';
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const { user, token, logout } = useAuth();
  const { theme } = useTheme();
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Admin access required');
    }
  }, [user]);

  const handleAdminVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.post(`${API}/auth/verify-admin`, {
        email: user.email,
        password: adminPassword
      });
      setAdminVerified(true);
      setAdminPassword('');
      toast.success('Admin verified!');
    } catch (error) {
      toast.error('Admin verification failed');
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch statistics');
      console.error('Stats error:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Users error:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axiosInstance.get(`${API}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data);
    } catch (error) {
      toast.error('Failed to fetch announcements');
      console.error('Announcements error:', error);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      await axiosInstance.post(
        `${API}/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('User role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`${API}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axiosInstance.delete(`${API}/announcements/${announcementId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  if (!adminVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.background }}>
        <Card className="w-full max-w-md" style={{ backgroundColor: theme.surface }}>
          <CardHeader className="text-center">
            <Lock size={40} style={{ color: theme.primary, margin: '0 auto 16px' }} />
            <CardTitle style={{ color: theme.text }}>Admin Verification Required</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminVerification} className="space-y-4">
              <div>
                <label style={{ color: theme.text }} className="block text-sm font-semibold mb-2">
                  Enter your password to verify admin access
                </label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Password"
                  className="rounded-lg h-10"
                  style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                style={{ backgroundColor: theme.primary, color: 'white' }}
              >
                {loading ? 'Verifying...' : 'Verify Admin Access'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: theme.background }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold" style={{ color: theme.text }}>
              Admin Panel
            </h1>
            <p style={{ color: theme.textSecondary }}>Welcome, {user?.name}</p>
          </div>
          <Button
            onClick={logout}
            className="flex items-center gap-2"
            style={{ backgroundColor: '#ef4444', color: 'white' }}
          >
            <SignOut size={18} />
            Logout
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b" style={{ borderColor: theme.border }}>
          <button
            onClick={() => {
              setActiveTab('stats');
              fetchStats();
            }}
            className={`pb-3 px-4 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'border-b-2'
                : ''
            }`}
            style={{
              color: activeTab === 'stats' ? theme.primary : theme.textSecondary,
              borderColor: activeTab === 'stats' ? theme.primary : 'transparent'
            }}
          >
            <ChartBar size={18} />
            Statistics
          </button>
          <button
            onClick={() => {
              setActiveTab('users');
              fetchUsers();
            }}
            className={`pb-3 px-4 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-b-2'
                : ''
            }`}
            style={{
              color: activeTab === 'users' ? theme.primary : theme.textSecondary,
              borderColor: activeTab === 'users' ? theme.primary : 'transparent'
            }}
          >
            <Users size={18} />
            Users
          </button>
          <button
            onClick={() => {
              setActiveTab('announcements');
              fetchAnnouncements();
            }}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'announcements'
                ? 'border-b-2'
                : ''
            }`}
            style={{
              color: activeTab === 'announcements' ? theme.primary : theme.textSecondary,
              borderColor: activeTab === 'announcements' ? theme.primary : 'transparent'
            }}
          >
            Announcements
          </button>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats && (
              <>
                <Card style={{ backgroundColor: theme.surface }}>
                  <CardHeader>
                    <CardTitle style={{ color: theme.text }}>Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" style={{ color: theme.primary }}>
                      {stats.totalUsers}
                    </p>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.surface }}>
                  <CardHeader>
                    <CardTitle style={{ color: theme.text }}>Admins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-500">
                      {stats.usersByRole.admin}
                    </p>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.surface }}>
                  <CardHeader>
                    <CardTitle style={{ color: theme.text }}>Faculty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-500">
                      {stats.usersByRole.faculty}
                    </p>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.surface }}>
                  <CardHeader>
                    <CardTitle style={{ color: theme.text }}>Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-500">
                      {stats.usersByRole.student}
                    </p>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.surface }}>
                  <CardHeader>
                    <CardTitle style={{ color: theme.text }}>Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" style={{ color: theme.primary }}>
                      {stats.totalMessages}
                    </p>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.surface }}>
                  <CardHeader>
                    <CardTitle style={{ color: theme.text }}>Announcements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" style={{ color: theme.primary }}>
                      {stats.totalAnnouncements}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card style={{ backgroundColor: theme.surface }}>
            <CardHeader>
              <CardTitle style={{ color: theme.text }}>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ color: theme.text }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td className="p-3">{u.name}</td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                            className="rounded px-2 py-1"
                            style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
                            disabled={u.id === user?.id}
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <Button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user?.id}
                            className="text-red-500 hover:bg-red-50 text-sm"
                            variant="ghost"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <Card key={ann.id} style={{ backgroundColor: theme.surface }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle style={{ color: theme.text }}>{ann.title}</CardTitle>
                      <p style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
                        by {ann.created_by_name} • {new Date(ann.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="text-red-500 hover:bg-red-50"
                      variant="ghost"
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p style={{ color: theme.text }}>{ann.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
