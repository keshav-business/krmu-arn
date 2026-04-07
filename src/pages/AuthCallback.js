import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = 'https://unevaporative-holden-unvatted.ngrok-free.dev';
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('Invalid authentication response');
          navigate('/login');
          return;
        }

        const response = await axios.post(
          `${API}/auth/google-session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        const user = response.data;
        
        // Store minimal user info in localStorage for immediate access
        localStorage.setItem('user', JSON.stringify(user));
        
        // Fetch private key
        const keyResponse = await axios.get(`${API}/me/private-key`, {
          withCredentials: true
        });
        localStorage.setItem('privateKey', keyResponse.data.private_key);

        toast.success('Logged in successfully!');
        navigate('/chat', { state: { user }, replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed');
        navigate('/login');
      }
    };

    processSession();
  }, [location, navigate]);

  return (
    <div className="h-screen flex items-center justify-center" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <div className="text-center">
        <div className="text-xl font-semibold mb-2" style={{ color: '#0A0A0A' }}>
          AUTHENTICATING...
        </div>
        <div className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#52525B' }}>
          Please wait
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;