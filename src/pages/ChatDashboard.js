import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/utils/axiosConfig';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { encryptMessage, decryptMessage } from '@/utils/encryption';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  SignOut, 
  PaperPlaneRight, 
  ShieldCheck,
  User as UserIcon,
  Circle,
  Megaphone,
  ChatsCircle,
  Gear
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { filterProfanity } from '@/utils/profanityFilter';

const BACKEND_URL = 'https://krmu.saivyytechnologies.com';
const API = `${BACKEND_URL}/api`;

const ChatDashboard = () => {
  const { user, token, privateKey, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('chats');
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', attachmentUrl: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    const socket = io(BACKEND_URL, {
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    socket.on('online_users', (data) => {
      console.log('Online users:', data);
      setOnlineUsers(data.users.map(u => u.id));
    });

    socket.on('new_message', async (data) => {
      const msg = data.message;
      if (selectedUser && (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)) {
        // Decrypt received messages only
        if (msg.receiver_id === user.id && privateKey) {
          try {
            const decrypted = await decryptMessage(msg.encrypted_message, privateKey);
            setMessages(prev => [...prev, { ...msg, decrypted_message: decrypted, is_sent: false }]);
          } catch (error) {
            console.error('Failed to decrypt message:', error);
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    wsRef.current = socket;
  }, [token, selectedUser, user?.id, privateKey]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    }
  }, [token]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${API}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  }, [token]);

  const fetchMessages = useCallback(async (userId) => {
    try {
      const response = await axiosInstance.get(`${API}/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const decryptedMessages = await Promise.all(
        response.data.map(async (msg) => {
          // Only decrypt messages we received (where we are the receiver)
          // For messages we sent, we can't decrypt them (encrypted with receiver's key)
          if (msg.receiver_id === user.id) {
            const decrypted = await decryptMessage(msg.encrypted_message, privateKey);
            return { ...msg, decrypted_message: decrypted, is_sent: false };
          } else {
            // For sent messages, mark as sent but we can't decrypt
            return { ...msg, decrypted_message: '[Sent Message]', is_sent: true };
          }
        })
      );
      
      setMessages(decryptedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [token, user?.id, privateKey]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    requestNotificationPermission();
    fetchUsers();
    fetchAnnouncements();
    connectWebSocket();

    // Poll for new announcements every 30 seconds
    const announcementInterval = setInterval(() => fetchAnnouncements(), 30000);

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
      clearInterval(announcementInterval);
    };
  }, [token, navigate, fetchUsers, fetchAnnouncements, connectWebSocket]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser, fetchMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    setLoading(true);
    const messagePlaintext = newMessage;
    try {
      const encrypted = await encryptMessage(messagePlaintext, selectedUser.public_key);
      
      const response = await axiosInstance.post(
        `${API}/messages`,
        {
          receiver_id: selectedUser.id,
          encrypted_message: encrypted
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const msg = response.data;
      // Store the original plaintext for sent messages
      setMessages(prev => [...prev, { ...msg, decrypted_message: messagePlaintext, is_sent: true }]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const postAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

    try {
      const response = await axiosInstance.post(
        `${API}/announcements`,
        {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          attachment_url: newAnnouncement.attachmentUrl || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setAnnouncements(prev => [response.data, ...prev]);
      setNewAnnouncement({ title: '', content: '', attachmentUrl: '' });
      toast.success('Announcement posted!');
    } catch (error) {
      console.error('Failed to post announcement:', error);
      toast.error(error.response?.data?.detail || 'Failed to post announcement');
    }
  };

  const updateAnnouncement = async (announcementId) => {
    if (!editingAnnouncement) return;

    try {
      const response = await axiosInstance.put(
        `${API}/announcements/${announcementId}`,
        {
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          attachment_url: editingAnnouncement.attachment_url
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setAnnouncements(prev => prev.map(ann => ann.id === announcementId ? response.data : ann));
      setEditingAnnouncement(null);
      toast.success('Announcement updated!');
    } catch (error) {
      console.error('Failed to update announcement:', error);
      toast.error('Failed to update announcement');
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await axiosInstance.delete(
        `${API}/announcements/${announcementId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
      toast.success('Announcement deleted!');
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: theme.background }}>
      <div className="border-b" style={{ borderColor: theme.border, backgroundColor: theme.primary }}>
        <div className="px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/krmu-logo.png" alt="KRMU Logo" className="h-10 w-10" />
            <span className="text-xl font-bold text-white">
              K.R. Mangalam University
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-white">{user?.name}</div>
              <div className="text-xs text-white/70">
                🔒 Encrypted
              </div>
            </div>
            <Button
              data-testid="settings-button"
              onClick={() => navigate('/settings')}
              variant="outline"
              className="rounded-lg border-2 border-white h-10 px-4 text-white hover:bg-white/10"
            >
              <Gear size={20} />
            </Button>
            {user?.role === 'admin' && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="rounded-lg border-2 border-white h-10 px-4 text-white hover:bg-white/10"
                title="Admin Panel"
              >
                <ShieldCheck size={20} />
              </Button>
            )}
            <Button
              data-testid="logout-button"
              onClick={handleLogout}
              variant="outline"
              className="rounded-lg border-2 border-white h-10 px-4 text-white hover:bg-white/10"
            >
              <SignOut size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r flex flex-col" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
          <div className="border-b border-black/15 bg-white">
            <div className="flex">
              <button
                data-testid="tab-chats"
                onClick={() => {
                  setActiveTab('chats');
                  setSelectedUser(null);
                }}
                className="flex-1 p-4 flex items-center justify-center gap-2 border-r border-black/15"
                style={{
                  backgroundColor: activeTab === 'chats' ? '#002FA7' : 'white',
                  color: activeTab === 'chats' ? 'white' : '#0A0A0A'
                }}
              >
                <ChatsCircle size={20} weight="fill" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  CHATS
                </span>
              </button>
              <button
                data-testid="tab-announcements"
                onClick={() => {
                  setActiveTab('announcements');
                  setSelectedUser(null);
                }}
                className="flex-1 p-4 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: activeTab === 'announcements' ? '#002FA7' : 'white',
                  color: activeTab === 'announcements' ? 'white' : '#0A0A0A'
                }}
              >
                <Megaphone size={20} weight="fill" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  NEWS
                </span>
              </button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {activeTab === 'chats' ? (
              <div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    data-testid={`user-list-item-${u.id}`}
                    onClick={() => setSelectedUser(u)}
                    className="w-full p-4 border-b border-black/15 flex items-center gap-3 hover:bg-white transition-colors text-left"
                    style={{
                      backgroundColor: selectedUser?.id === u.id ? 'white' : 'transparent'
                    }}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 rounded-none border border-black/15">
                        <AvatarFallback className="rounded-none" style={{ backgroundColor: '#002FA7', color: 'white', fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-none border border-white"
                        style={{ backgroundColor: isUserOnline(u.id) ? '#00C853' : '#52525B' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ color: '#0A0A0A' }}>
                        {u.name}
                      </div>
                      <div className="text-xs truncate" style={{ color: '#52525B' }}>
                        {u.email}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {user?.role === 'admin' && (
                  <div className="bg-white border border-black/15 p-4">
                    <h4 className="text-xs uppercase tracking-[0.2em] font-semibold mb-3" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#0A0A0A' }}>
                      POST ANNOUNCEMENT
                    </h4>
                    <form onSubmit={postAnnouncement} className="space-y-3">
                      <Input
                        data-testid="announcement-title-input"
                        type="text"
                        placeholder="Title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        className="rounded-none border-black/20 h-10"
                        required
                      />
                      <Textarea
                        data-testid="announcement-content-input"
                        placeholder="Announcement content..."
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        className="rounded-none border-black/20 min-h-[80px]"
                        required
                      />
                      <Input
                        data-testid="announcement-attachment-input"
                        type="url"
                        placeholder="Attachment URL (optional)"
                        value={newAnnouncement.attachmentUrl}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, attachmentUrl: e.target.value })}
                        className="rounded-none border-black/20 h-10"
                      />
                      <Button
                        data-testid="post-announcement-button"
                        type="submit"
                        className="w-full rounded-none h-10"
                        style={{ backgroundColor: '#002FA7', color: 'white' }}
                      >
                        POST ANNOUNCEMENT
                      </Button>
                    </form>
                  </div>
                )}
                <div className="text-xs uppercase tracking-[0.2em] font-semibold mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#0A0A0A' }}>
                  RECENT ANNOUNCEMENTS
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col" style={{ backgroundColor: theme.background }}>
          {activeTab === 'announcements' ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                <h3 className="text-xl font-bold tracking-tight" style={{ color: theme.text }}>
                  UNIVERSITY ANNOUNCEMENTS
                </h3>
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  Official communications from administration
                </p>
              </div>
              
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <div className="text-center py-12">
                      <Megaphone size={48} style={{ color: '#52525B' }} className="mx-auto mb-4" />
                      <p className="text-sm" style={{ color: '#52525B' }}>
                        No announcements yet
                      </p>
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div
                        key={ann.id}
                        data-testid={`announcement-${ann.id}`}
                        className="border border-black/15 p-4 bg-[#F4F4F5]"
                      >
                        {editingAnnouncement?.id === ann.id ? (
                          <div className="space-y-3">
                            <Input
                              type="text"
                              value={editingAnnouncement.title}
                              onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                              className="rounded-none border-black/20 h-10"
                            />
                            <Textarea
                              value={editingAnnouncement.content}
                              onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                              className="rounded-none border-black/20 min-h-[80px]"
                            />
                            <Input
                              type="url"
                              placeholder="Attachment URL"
                              value={editingAnnouncement.attachment_url || ''}
                              onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, attachment_url: e.target.value })}
                              className="rounded-none border-black/20 h-10"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => updateAnnouncement(ann.id)}
                                className="rounded-none"
                                style={{ backgroundColor: '#002FA7', color: 'white' }}
                              >
                                SAVE
                              </Button>
                              <Button
                                onClick={() => setEditingAnnouncement(null)}
                                variant="outline"
                                className="rounded-none border-2 border-black/20"
                              >
                                CANCEL
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-lg flex-1" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', color: '#0A0A0A' }}>
                                {ann.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                <div className="text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#52525B' }}>
                                  {new Date(ann.timestamp).toLocaleDateString()}
                                </div>
                                {user?.role === 'admin' && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => setEditingAnnouncement(ann)}
                                      className="px-2 py-1 text-xs border border-black/20 hover:bg-white"
                                      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                                    >
                                      EDIT
                                    </button>
                                    <button
                                      onClick={() => deleteAnnouncement(ann.id)}
                                      className="px-2 py-1 text-xs border border-black/20 hover:bg-white"
                                      style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#FF3B30' }}
                                    >
                                      DELETE
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm mb-3 whitespace-pre-wrap" style={{ color: '#0A0A0A' }}>
                              {ann.content}
                            </p>
                            {ann.attachment_url && (
                              <div className="mb-3 p-2 border border-black/15 bg-white">
                                <a
                                  href={ann.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs flex items-center gap-2 hover:underline"
                                  style={{ color: '#002FA7', fontFamily: 'IBM Plex Mono, monospace' }}
                                >
                                  📎 View Attachment
                                </a>
                              </div>
                            )}
                            <div className="text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#52525B' }}>
                              Posted by: {ann.author_name}
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : selectedUser ? (
            <>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-lg border" style={{ borderColor: theme.border }}>
                    <AvatarFallback className="rounded-lg" style={{ backgroundColor: theme.primary, color: 'white' }}>
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: theme.text }}>
                      {selectedUser.name}
                    </div>
                    <div className="text-xs flex items-center gap-1" style={{ color: isUserOnline(selectedUser.id) ? theme.success : theme.textSecondary }}>
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isUserOnline(selectedUser.id) ? theme.success : theme.textSecondary }}
                      />
                      {isUserOnline(selectedUser.id) ? 'ONLINE' : 'OFFLINE'}
                    </div>
                  </div>
                </div>
                <div className="text-xs uppercase tracking-wider" style={{ color: theme.success }}>
                  🔒 E2E ENCRYPTED
                </div>
              </div>

              <ScrollArea className="flex-1 p-6" style={{ backgroundColor: theme.background }}>
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      data-testid={`message-${msg.id}`}
                      className="flex"
                      style={{
                        justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        className="max-w-md border rounded-lg p-3"
                        style={{
                          borderColor: theme.border,
                          backgroundColor: msg.sender_id === user.id ? theme.primary : theme.surface,
                          color: msg.sender_id === user.id ? 'white' : theme.text
                        }}
                      >
                        <div className="text-sm leading-relaxed mb-1">
                          {filterProfanity(msg.decrypted_message)}
                        </div>
                        <div 
                          className="text-xs" 
                          style={{ 
                            color: msg.sender_id === user.id ? 'rgba(255,255,255,0.7)' : theme.textSecondary
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    data-testid="message-input"
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg h-12"
                    style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
                    disabled={loading}
                  />
                  <Button
                    data-testid="send-message-button"
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="rounded-lg h-12 px-6 transition-all hover:opacity-90"
                    style={{ backgroundColor: theme.primary, color: 'white' }}
                  >
                    <PaperPlaneRight size={20} weight="fill" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: theme.background }}>
              <div className="text-center">
                <ShieldCheck size={64} weight="duotone" style={{ color: theme.primary }} className="mx-auto mb-4" />
                <h3 className="text-2xl font-bold tracking-tight mb-2" style={{ color: theme.text }}>
                  SELECT A CONTACT
                </h3>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  Choose a user from the list to start a secure conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;