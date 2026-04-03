import React from 'react';

interface HoneypotFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Filtro de seguridad "Honeypot" para detectar bots.
 * Si un bot rellena este campo invisible, la validación del formulario debería fallar.
 */
export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <div style={{ 
      position: 'absolute', 
      left: '-5000px', 
      top: '-5000px', 
      height: 0, 
      width: 0, 
      overflow: 'hidden', 
      pointerEvents: 'none',
      opacity: 0
    }} aria-hidden="true">
      <label htmlFor="website_url">Si eres humano, deja este campo vacío</label>
      <input
        id="website_url"
        name="website_url"
        type="text"
        tabIndex={-1}
        value={value}
        onChange={onChange}
        autoComplete="off"
      />
    </div>
  );
}
