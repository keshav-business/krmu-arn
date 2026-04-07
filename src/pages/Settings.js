import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, SignOut, Trash, Bell, Moon, Sun, UserCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';

const BACKEND_URL = 'https://unevaporative-holden-unvatted.ngrok-free.dev';
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const { user, token, logout } = useAuth();
  const { isDarkMode, toggleDarkMode, theme } = useTheme();
  const navigate = useNavigate();
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    browser_notifications: true,
    announcement_notifications: true,
    message_notifications: true
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/me/settings`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setNotificationSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, [token]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
    if (user?.role === 'admin') {
      fetchAllUsers();
    }
    requestNotificationPermission();
  }, [user?.role, fetchSettings, fetchAllUsers, requestNotificationPermission]);

  const updateSettings = async (newSettings) => {
    try {
      await axios.put(
        `${API}/me/settings`,
        { notification_settings: newSettings },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      setNotificationSettings(newSettings);
      toast.success('Settings updated');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API}/auth/account`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}'s account?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success('User deleted successfully');
      fetchAllUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background, color: theme.text }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: theme.border, backgroundColor: theme.primary }}>
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <button
            data-testid="back-button"
            onClick={() => navigate('/chat')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} style={{ color: 'white' }} />
          </button>
          <img src="/krmu-logo.png" alt="KRMU Logo" className="h-10 w-10" />
          <span className="text-2xl font-bold text-white tracking-tight">
            Settings
          </span>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Section */}
          <div className="border rounded-lg p-6" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: theme.primary }}>
              <UserCircle size={28} />
              Account
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? theme.background : '#F8F9FA', border: `1px solid ${theme.border}` }}>
                <div className="font-semibold text-lg" style={{ color: theme.text }}>{user?.name}</div>
                <div className="text-sm mt-1" style={{ color: theme.textSecondary }}>{user?.email}</div>
                <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: theme.primary, color: 'white' }}>
                  {user?.role.toUpperCase()}
                </div>
              </div>

              <Button
                data-testid="logout-button"
                onClick={handleLogout}
                className="w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: theme.primary, color: 'white' }}
              >
                <SignOut size={20} weight="bold" />
                <span>Sign Out</span>
              </Button>

              <Button
                data-testid="delete-account-button"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: theme.error, color: 'white' }}
              >
                <Trash size={20} weight="bold" />
                <span>Delete Account</span>
              </Button>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="border rounded-lg p-6" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: theme.primary }}>
              {isDarkMode ? <Moon size={28} weight="fill" /> : <Sun size={28} weight="fill" />}
              Appearance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? theme.background : '#F8F9FA', border: `1px solid ${theme.border}` }}>
                <div>
                  <div className="font-semibold" style={{ color: theme.text }}>Dark Mode</div>
                  <div className="text-sm" style={{ color: theme.textSecondary }}>Switch to {isDarkMode ? 'light' : 'dark'} theme</div>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="border rounded-lg p-6 md:col-span-2" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: theme.primary }}>
              <Bell size={28} weight="fill" />
              Notifications
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? theme.background : '#F8F9FA', border: `1px solid ${theme.border}` }}>
                <div>
                  <div className="font-semibold" style={{ color: theme.text }}>Email Notifications</div>
                  <div className="text-sm" style={{ color: theme.textSecondary }}>Receive notifications via email</div>
                </div>
                <Switch
                  checked={notificationSettings.email_notifications}
                  onCheckedChange={(checked) => updateSettings({ ...notificationSettings, email_notifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? theme.background : '#F8F9FA', border: `1px solid ${theme.border}` }}>
                <div>
                  <div className="font-semibold" style={{ color: theme.text }}>Browser Notifications</div>
                  <div className="text-sm" style={{ color: theme.textSecondary }}>Show desktop notifications</div>
                </div>
                <Switch
                  checked={notificationSettings.browser_notifications}
                  onCheckedChange={(checked) => updateSettings({ ...notificationSettings, browser_notifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? theme.background : '#F8F9FA', border: `1px solid ${theme.border}` }}>
                <div>
                  <div className="font-semibold" style={{ color: theme.text }}>Announcement Notifications</div>
                  <div className="text-sm" style={{ color: theme.textSecondary }}>Notify for new announcements</div>
                </div>
                <Switch
                  checked={notificationSettings.announcement_notifications}
                  onCheckedChange={(checked) => updateSettings({ ...notificationSettings, announcement_notifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? theme.background : '#F8F9FA', border: `1px solid ${theme.border}` }}>
                <div>
                  <div className="font-semibold" style={{ color: theme.text }}>Message Notifications</div>
                  <div className="text-sm" style={{ color: theme.textSecondary }}>Notify for new messages</div>
                </div>
                <Switch
                  checked={notificationSettings.message_notifications}
                  onCheckedChange={(checked) => updateSettings({ ...notificationSettings, message_notifications: checked })}
                />
              </div>
            </div>
          </div>

          {/* Admin: User Management */}
          {user?.role === 'admin' && (
            <div className="border rounded-lg p-6 md:col-span-2" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: theme.secondary }}>
                User Management (Admin)
              </h3>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? theme.background : '#F8F9FA', border: `1px solid ${theme.border}` }}>
                      <div>
                        <div className="font-semibold" style={{ color: theme.text }}>{u.name}</div>
                        <div className="text-sm" style={{ color: theme.textSecondary }}>{u.email}</div>
                        <div className="mt-1 inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: theme.accent, color: 'white' }}>
                          {u.role}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
                        style={{ backgroundColor: theme.error, color: 'white' }}
                      >
                        DELETE
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Profanity Filter Info */}
          <div className="border rounded-lg p-6 md:col-span-2" style={{ borderColor: theme.border, backgroundColor: theme.accent + '15' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: theme.text }}>
              Profanity Filter
            </h3>
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              Inappropriate language in messages is automatically filtered and replaced with asterisks (***) to maintain a respectful communication environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
