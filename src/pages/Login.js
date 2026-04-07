import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Envelope } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { truncatePasswordTo72Bytes } from '@/utils/passwordHelper';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Truncate password to 72 bytes for bcrypt compatibility
      const truncatedPassword = truncatePasswordTo72Bytes(password);
      await login(email, truncatedPassword);
      toast.success('Login successful!');
      navigate('/chat');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert("Google login is currently disabled.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: theme.primary, opacity: 0.85 }} />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <img src="/krmu-logo.png" alt="KRMU Logo" className="h-32 w-32 mb-6" />
          <h1 className="text-5xl font-bold mb-4">
            K.R. Mangalam University
          </h1>
          <p className="text-xl">Secure Communication Platform</p>
          <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <p className="text-sm">🔒 End-to-End Encrypted</p>
            <p className="text-sm mt-2">✓ Real-time Messaging</p>
            <p className="text-sm mt-2">🎓 University Announcements</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ backgroundColor: theme.background }}>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-2" style={{ color: theme.primary }}>
              Sign In
            </h2>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              Access your KRMU account
            </p>
          </div>

          <Button
            data-testid="google-login-button"
            onClick={handleGoogleLogin}
            className="w-full h-12 rounded-lg font-semibold text-base mb-6 bg-white border-2 hover:bg-gray-50"
            style={{ borderColor: theme.border, color: theme.text }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: theme.border }}></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 text-sm" style={{ backgroundColor: theme.background, color: theme.textSecondary }}>
                Or continue with KRMU email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: theme.text }}>
                KRMU Email
              </label>
              <div className="relative">
                <Envelope className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: theme.textSecondary }} />
                <Input
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@krmu.edu.in"
                  className="pl-11 rounded-lg h-12"
                  style={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }}
                  required
                />
              </div>
            </div>

            <PasswordInput
              value={password}
              onChange={setPassword}
              theme={theme}
              showByteCounter={true}
              autoTruncate={false}
            />

            <Button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg font-semibold text-base transition-all hover:opacity-90"
              style={{ backgroundColor: theme.primary, color: 'white' }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              Don't have an account?{' '}
              <button
                data-testid="navigate-to-register-button"
                onClick={() => navigate('/register')}
                className="font-semibold hover:underline"
                style={{ color: theme.primary }}
              >
                Register Now
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
