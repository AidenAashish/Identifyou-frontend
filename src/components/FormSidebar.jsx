import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Menu, X, Home, User, LogOut, MessageCircle, Settings } from 'lucide-react';
import RoomSidebar from './RoomSidebar';

function FormSidebar({ isLandingPage = false, privateRooms = [], publicRooms = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsOpen(false);
      if (isLandingPage) {
        // Stay on landing page after sign out and reload to update UI
        window.location.reload();
      } else {
        setTimeout(() => navigate('/'), 100);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: 'Home',
      action: () => handleNavigation('/'),
      description: 'Go to landing page'
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'Chat Rooms',
      action: () => handleNavigation('/chat'),
      description: 'Access chat rooms'
    },
    {
      icon: <User className="w-5 h-5" />,
      label: 'Profile',
      action: () => handleNavigation('/'),
      description: 'Manage your profile'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      action: () => handleNavigation('/'),
      description: 'App settings and preferences'
    }
  ];

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-3 right-4 z-[60] p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl border border-white"
        aria-label="Toggle menu"
        style={{ minWidth: '48px', minHeight: '48px' }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gray-900/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out z-[55] border-l border-gray-700/50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="mb-4 justify-end flex">
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700/80 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {user && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-medium">Online</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4">
          {(user || !isLandingPage) ? (
            <div className="space-y-6">
              {/* Navigation Menu */}
              <nav className="space-y-2">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="w-full flex items-center space-x-4 p-4 rounded-xl bg-gray-800/30 hover:bg-gray-700/50 transition-all duration-200 group border border-transparent hover:border-purple-500/30"
                  >
                    <div className="flex-shrink-0 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                      {item.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium text-sm group-hover:text-purple-300 transition-colors duration-200">
                        {item.label}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-gray-500 group-hover:text-purple-400 transition-colors duration-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Mobile Rooms Section */}
              {/* <div className="block md:hidden">
                <div className="border-t border-gray-700/50 pt-4">
                  <h3 className="text-lg font-bold text-white mb-4">Available Rooms</h3>
                  <RoomSidebar 
                    isMobile={true} 
                    privateRooms={privateRooms}
                    publicRooms={publicRooms}
                    onRoomClick={(room) => {
                      setIsOpen(false);
                      navigate(`/chat/${room.roomId}`);
                    }} 
                  />
                </div>
              </div> */}
            </div>
          ) : (
            // Show only sign-in option for non-authenticated users on landing page
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Welcome to IdentifYou</h3>
                <p className="text-gray-400 text-sm">
                  Sign in to access all features
                </p>
              </div>
              
              <button
                onClick={() => handleNavigation('/auth')}
                className="w-full flex items-center justify-center space-x-3 p-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 transition-all duration-200 group border border-purple-600/30 hover:border-purple-500/50"
              >
                <User className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors duration-200" />
                <div className="text-left">
                  <p className="text-purple-400 group-hover:text-purple-300 font-medium text-sm transition-colors duration-200">
                    Sign In
                  </p>
                  <p className="text-purple-400/70 text-xs mt-1">
                    Access your account
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-700/50">
          {user && (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-4 p-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 transition-all duration-200 group border border-red-600/30 hover:border-red-500/50"
            >
              <div className="flex-shrink-0 text-red-400 group-hover:text-red-300 transition-colors duration-200">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-red-400 group-hover:text-red-300 font-medium text-sm transition-colors duration-200">
                  Sign Out
                </p>
                <p className="text-red-400/70 text-xs mt-1">
                  End your current session
                </p>
              </div>
            </button>
          )}
          
          {!user && !isLandingPage && (
            <button
              onClick={() => handleNavigation('/auth')}
              className="w-full flex items-center space-x-4 p-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 transition-all duration-200 group border border-purple-600/30 hover:border-purple-500/50"
            >
              <div className="flex-shrink-0 text-purple-400 group-hover:text-purple-300 transition-colors duration-200">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-purple-400 group-hover:text-purple-300 font-medium text-sm transition-colors duration-200">
                  Sign In
                </p>
                <p className="text-purple-400/70 text-xs mt-1">
                  Access your account
                </p>
              </div>
            </button>
          )}

          {/* App Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 mb-2">Powered by</p>
            <a
              href="https://www.aidenai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors duration-200 font-medium text-xs"
            >
              <span>Aiden AI</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default FormSidebar;