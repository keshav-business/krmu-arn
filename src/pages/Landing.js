import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { ShieldCheck, LockKey, ChatCircleDots, Megaphone } from '@phosphor-icons/react';

const Landing = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background }}>
      <div className="border-b" style={{ borderColor: theme.border, backgroundColor: theme.primary }}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/krmu-logo.png" alt="KRMU Logo" className="h-12 w-12" />
            <span className="text-2xl font-bold text-white">
              K.R. Mangalam University
            </span>
          </div>
          <div className="flex gap-4">
            <Button
              data-testid="landing-login-button"
              onClick={() => navigate('/login')}
              variant="outline"
              className="rounded-lg border-2 border-white h-10 px-6 font-semibold text-white hover:bg-white/10"
            >
              Sign In
            </Button>
            <Button
              data-testid="landing-register-button"
              onClick={() => navigate('/register')}
              className="rounded-lg h-10 px-6 font-semibold"
              style={{ backgroundColor: 'white', color: theme.primary }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="mb-8">
            <img src="/krmu-logo.png" alt="KRMU Logo" className="h-32 w-32 mx-auto mb-6" />
          </div>
          <h1 
            className="text-6xl lg:text-7xl font-bold mb-6" 
            style={{ color: theme.primary, lineHeight: '1.1' }}
          >
            Secure Communication Platform
          </h1>
          <p className="text-xl mb-8" style={{ color: theme.secondary }}>
            End-to-end encrypted messaging for the KRMU community.
            <br />
            Connect with students, faculty, and stay updated with university announcements.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              data-testid="hero-get-started-button"
              onClick={() => navigate('/register')}
              className="rounded-lg h-14 px-10 text-lg font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: theme.primary, color: 'white' }}
            >
              Start Secure Chat
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="border rounded-lg p-6" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <ShieldCheck size={48} weight="duotone" style={{ color: theme.primary }} className="mb-4" />
            <h3 className="text-xl font-bold mb-3" style={{ color: theme.text }}>
              End-to-End Encryption
            </h3>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              Military-grade RSA + AES encryption for all messages.
            </p>
          </div>

          <div className="border rounded-lg p-6" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <ChatCircleDots size={48} weight="duotone" style={{ color: theme.primary }} className="mb-4" />
            <h3 className="text-xl font-bold mb-3" style={{ color: theme.text }}>
              Real-Time Chat
            </h3>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              Instant messaging with WebSocket technology.
            </p>
          </div>

          <div className="border rounded-lg p-6" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <Megaphone size={48} weight="duotone" style={{ color: theme.primary }} className="mb-4" />
            <h3 className="text-xl font-bold mb-3" style={{ color: theme.text }}>
              University News
            </h3>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              Stay updated with official announcements.
            </p>
          </div>

          <div className="border rounded-lg p-6" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <LockKey size={48} weight="duotone" style={{ color: theme.primary }} className="mb-4" />
            <h3 className="text-xl font-bold mb-3" style={{ color: theme.text }}>
              Secure Access
            </h3>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              Role-based authentication for students, faculty, and admin.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t py-6 mt-20" style={{ borderColor: theme.border }}>
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            © 2026 K.R. Mangalam University — Secure Communication Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;