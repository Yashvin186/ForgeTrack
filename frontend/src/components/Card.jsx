import React from 'react';

/**
 * Card component that applies the design‑system .card styles.
 * Use for any container that needs the glass‑surface look.
 * Props:
 *   children – content inside the card.
 *   className – additional classes to extend styling.
 */
export default function Card({ children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}
