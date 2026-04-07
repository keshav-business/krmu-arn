import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { LockKey } from '@phosphor-icons/react';
import { getUtf8ByteLength, truncatePasswordTo72Bytes } from '@/utils/passwordHelper';

export const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = 'Enter password',
  theme,
  showByteCounter = true,
  autoTruncate = false
}) => {
  const byteLength = getUtf8ByteLength(value);
  const maxBytes = 72;
  const isExceeded = byteLength > maxBytes;
  const percentage = Math.min((byteLength / maxBytes) * 100, 100);

  const handleChange = (e) => {
    let newValue = e.target.value;
    
    // Auto-truncate if enabled
    if (autoTruncate && getUtf8ByteLength(newValue) > maxBytes) {
      newValue = truncatePasswordTo72Bytes(newValue);
    }
    
    onChange(newValue);
  };

  const handleTruncate = () => {
    const truncated = truncatePasswordTo72Bytes(value);
    onChange(truncated);
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: theme.text }}>
        Password
      </label>
      <div className="relative">
        <LockKey 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" 
          size={20} 
          style={{ color: theme.textSecondary }} 
        />
        <Input
          type="password"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="pl-11 pr-24 rounded-lg h-12"
          style={{ 
            borderColor: isExceeded ? '#ef4444' : theme.border, 
            backgroundColor: theme.surface, 
            color: theme.text 
          }}
          required
        />
        
        {/* Byte Counter Badge */}
        <div 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-semibold px-3 py-1 rounded whitespace-nowrap"
          style={{
            backgroundColor: isExceeded ? '#fee2e2' : '#f0fdf4',
            color: isExceeded ? '#991b1b' : '#166534',
            borderWidth: '1px',
            borderColor: isExceeded ? '#fecaca' : '#bbf7d0'
          }}
        >
          {byteLength}/{maxBytes}
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.border }}>
        <div 
          className="h-full transition-all duration-200"
          style={{
            width: `${percentage}%`,
            backgroundColor: isExceeded ? '#ef4444' : percentage > 50 ? '#f59e0b' : '#10b981'
          }}
        />
      </div>

      {/* Warning and Truncate Button */}
      {isExceeded && (
        <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#fef2f2', borderLeft: `3px solid #ef4444` }}>
          <p style={{ color: '#991b1b', fontSize: '0.875rem', fontWeight: '500' }}>
            ⚠️ Password exceeds 72-byte limit ({byteLength} bytes)
          </p>
          <p style={{ color: '#7f1d1d', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Bcrypt only supports passwords up to 72 bytes. Longer passwords will be truncated.
          </p>
          <button
            type="button"
            onClick={handleTruncate}
            className="mt-2 px-3 py-1.5 rounded text-sm font-semibold transition-colors"
            style={{
              backgroundColor: '#ef4444',
              color: 'white'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
          >
            🔪 Truncate to 72 Bytes
          </button>
        </div>
      )}

      {!isExceeded && byteLength > 0 && (
        <p style={{ color: theme.textSecondary, fontSize: '0.75rem', marginTop: '0.5rem' }}>
          ✓ Password size: {byteLength} bytes (Secure)
        </p>
      )}
    </div>
  );
};
