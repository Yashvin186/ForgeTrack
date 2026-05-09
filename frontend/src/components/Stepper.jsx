import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Stepper component for multi‑stage import flow.
 * Props:
 *   - steps: array of step label strings
 *   - current: zero‑based index of active step
 *   - onStepClick?: (index) => void – optional for navigation (only allowed for completed steps)
 */
export default function Stepper({ steps, current, onStepClick }) {
  return (
    <div className="flex items-center justify-center gap-6 mb-16 scale-90 md:scale-100">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black border-2 transition-all duration-500 ${
              current > i
                ? 'border-accent-glow bg-accent-glow/10 text-accent-glow shadow-glow cursor-pointer'
                : current === i
                ? 'border-accent-glow bg-accent-glow/20 text-accent-glow shadow-glow'
                : 'border-border-default text-fg-tertiary opacity-30'
            }`}
            onClick={() => {
              if (onStepClick && current > i) onStepClick(i);
            }}
          >
            {current > i ? <CheckCircle2 size={16} strokeWidth={3} /> : i + 1}
          </div>
          <span
            className={`text-[10px] uppercase font-black tracking-[0.2em] hidden sm:block ${
              current > i ? 'text-fg-primary' : 'text-fg-tertiary opacity-30'
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-12 h-[2px] rounded-full transition-colors duration-500 ${
                current > i ? 'bg-accent-glow' : 'bg-border-subtle opacity-30'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
