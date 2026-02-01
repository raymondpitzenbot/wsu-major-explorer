
import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, text, className }) => {
  return (
    <div className={`group relative flex items-center ${className || ''}`}>
      {children}
      <div className="absolute bottom-full mb-2 w-max max-w-xs scale-0 transform transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 origin-bottom z-50">
        {text}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
      </div>
    </div>
  );
};

export default Tooltip;
