import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showBadge = true,
  className = '',
  onClick,
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }[size];

  const textSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  }[size];

  return (
    <div 
      className={`flex items-center gap-2.5 select-none cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* SaaS Geometric Icon Badge */}
      <div className={`${iconDimensions} rounded-[8px] bg-[#0c1322] flex items-center justify-center p-1 relative shadow-sm border border-slate-800/40 flex-shrink-0`}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Main "D" glyph in electric blue */}
          <path 
            d="M7 6C7 4.89543 7.89543 4 9 4H18C23.5228 4 28 8.47715 28 14C28 19.5228 23.5228 24 18 24H9C7.89543 24 7 23.1046 7 22V6Z" 
            fill="#2563EB"
          />
          {/* Inner negative space for D */}
          <path 
            d="M13 10C13 9.44772 13.4477 9 14 9H17C19.7614 9 22 11.2386 22 14C22 16.7614 19.7614 19 17 19H14C13.4477 19 13 18.5523 13 18V10Z" 
            fill="#FFFFFF"
          />
          {/* Operational Pulse Dot on Top-Right */}
          <circle cx="23.5" cy="6.5" r="3.5" fill="#10B981" />
        </svg>
      </div>

      {/* Wordmark and Subtitle */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-slate-900 ${textSize}`}>
            DORM<span className="text-slate-900">DESK</span>
          </span>
          {showBadge && (
            <span className="bg-slate-50 text-slate-900 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono-code font-bold tracking-wider leading-none">
              LIVE
            </span>
          )}
        </div>
        {showSubtitle && (
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 leading-tight mt-0.5">
            Student Ops
          </span>
        )}
      </div>
    </div>
  );
};
