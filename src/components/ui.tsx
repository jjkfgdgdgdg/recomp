import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';
import { useToasts } from '../lib/effects';
import { fmt } from '../lib/logic';
import { IconClose, IconTicket } from './Icons';

export function Tickets({ n, big, ghost, sign }: { n: number; big?: boolean; ghost?: boolean; sign?: boolean }) {
  return (
    <span class={`ticket${big ? ' big' : ''}${ghost ? ' ghost' : ''}`} aria-label={`${fmt(n)} tickets`}>
      <IconTicket size={big ? 26 : 16} />
      {sign && n > 0 ? '+' : ''}
      {fmt(n)}
    </span>
  );
}

export function Bar({ value, kind }: { value: number; kind?: 'ticket' | 'good' }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div class={`bar${kind ? ` ${kind}-bar` : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose(): void; children: ComponentChildren }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div class="section-title">
          <h2>{title}</h2>
          <button class="icon-btn" onClick={onClose} aria-label="Fermer">
            <IconClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useToasts();
  return (
    <div class="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div class="toast" key={t.id}>
          <span class="e">{t.emoji}</span>
          <div>
            {t.title}
            {t.text && <small>{t.text}</small>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Stepper({
  id,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange(v: number): void;
}) {
  return (
    <div class="stepper" id={id}>
      <button type="button" aria-label="Moins" onClick={() => onChange(Math.max(min, value - step))}>
        −
      </button>
      <output>
        {value}
        {unit ? ` ${unit}` : ''}
      </output>
      <button type="button" aria-label="Plus" onClick={() => onChange(Math.min(max, value + step))}>
        +
      </button>
    </div>
  );
}
