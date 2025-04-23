
import { useState, useRef, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const VipButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleTogglePopup = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <button
        className="px-4 py-1 rounded-md flex items-center space-x-1 font-medium shadow-sm hover:shadow transition-shadow"
        aria-label="VIP access"
        onClick={handleTogglePopup}
        style={{
          background: 'linear-gradient(90deg, #FFD700 0%, #FFB800 100%)',
          color: 'white',
          border: '2px solid #fff8dc',
          boxShadow: '0 0 8px 2px #ffd70080, 0 1px 4px 0 #ffb80044',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span className="animate-pulse absolute -right-2 -top-2 w-5 h-5 rounded-full bg-yellow-200/70 blur-md opacity-70 pointer-events-none"></span>
        <Crown className="h-4 w-4 mr-1 drop-shadow" style={{ color: '#FFF8DC', filter: 'drop-shadow(0 0 4px #FFD700AA)' }} />
        <span className="z-10">VIP</span>
      </button>

      {isOpen && (
        <div 
          ref={popupRef}
          className="absolute right-0 top-10 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-50"
        >
          <div className="flex flex-col py-1">
            <Link 
              to="/vip/login" 
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            <Link 
              to="/vip-plans"
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              onClick={() => setIsOpen(false)}
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
