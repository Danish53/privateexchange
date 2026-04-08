'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  id: idProp,
  required,
  disabled,
}) {
  const genId = useId();
  const id = idProp || genId;
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className="auth-input pr-12"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-brand-subtle transition hover:bg-white/[0.06] hover:text-brand-heading"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
