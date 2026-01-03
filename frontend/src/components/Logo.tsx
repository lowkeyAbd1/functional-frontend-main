const Logo = ({ size = 'default', showText = true }: { size?: 'small' | 'default' | 'large'; showText?: boolean }) => {
  const sizes = {
    small: { icon: 'w-8 h-8', text: 'text-lg', house: 'w-4 h-4', window: 'w-1.5 h-1.5' },
    default: { icon: 'w-12 h-12', text: 'text-2xl', house: 'w-6 h-6', window: 'w-2 h-2' },
    large: { icon: 'w-16 h-16', text: 'text-3xl', house: 'w-8 h-8', window: 'w-2.5 h-2.5' },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {/* House Icon */}
      <div className={`${s.icon} relative`}>
        {/* House Shape */}
        <svg viewBox="0 0 48 48" className="w-full h-full">
          {/* Orange/Gold gradient background */}
          <defs>
            <linearGradient id="houseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
            <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(196 80% 45%)" />
            </linearGradient>
          </defs>
          
          {/* House body */}
          <path 
            d="M8 24 L24 8 L40 24 L40 42 L8 42 Z" 
            fill="url(#houseGradient)"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
          />
          
          {/* Roof accent */}
          <path 
            d="M4 26 L24 6 L44 26" 
            fill="none"
            stroke="url(#roofGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Window */}
          <rect 
            x="19" y="18" 
            width="10" height="10" 
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
          />
          {/* Window cross */}
          <line x1="24" y1="18" x2="24" y2="28" stroke="hsl(var(--primary))" strokeWidth="1" />
          <line x1="19" y1="23" x2="29" y2="23" stroke="hsl(var(--primary))" strokeWidth="1" />
          
          {/* Door */}
          <rect 
            x="20" y="32" 
            width="8" height="10" 
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
          />
        </svg>
        
        {/* Green curved accent under logo */}
        <svg viewBox="0 0 60 12" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[120%]">
          <path 
            d="M0 10 Q30 0 60 10" 
            fill="none"
            stroke="hsl(152 69% 45%)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${s.text} font-extrabold tracking-tight`}>
            <span className="text-primary">FAITH</span>
            <span className="text-foreground">STATE</span>
          </span>
          <span className="text-[0.6em] font-semibold text-accent tracking-[0.2em] uppercase">
            Real Estate
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
