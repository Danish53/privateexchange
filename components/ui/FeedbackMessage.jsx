'use client';

import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const toneStyles = {
  error: 'border-rose-500/35 bg-rose-500/[0.12] text-rose-100',
  success: 'border-emerald-500/35 bg-emerald-500/[0.12] text-emerald-100',
  info: 'border-sky-500/35 bg-sky-500/[0.12] text-sky-100',
};

const toneIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export default function FeedbackMessage({ tone = 'info', title = '', message = '', className = '' }) {
  if (!message) return null;
  const Icon = toneIcons[tone] || Info;
  return (
    <div className={cn('rounded-xl border px-4 py-3', toneStyles[tone] || toneStyles.info, className)}>
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" />
        <div className="min-w-0">
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          <p className={cn('text-sm leading-relaxed', title ? 'mt-0.5' : '')}>{message}</p>
        </div>
      </div>
    </div>
  );
}
