import React from 'react';

export default function PlayerAvatar({ icon, name, className = 'w-12 h-12', textClassName = 'text-2xl' }) {
  if (!icon || icon.startsWith('http')) {
    return (
      <img 
        src={icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'P')}&background=random`} 
        alt={name || 'Player'}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  
  return (
    <div className={`rounded-full bg-slate-200 flex items-center justify-center ${className}`}>
      <span className={textClassName}>{icon}</span>
    </div>
  );
}