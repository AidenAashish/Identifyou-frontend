import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@stackframe/react";
import { Menu, X, Users, Lock, Quote, Lightbulb, MessageSquareLock, MessagesSquare, MessageSquare, MessageSquareText, MessageSquareMore } from "lucide-react";
import axios from "axios";
import {
  getEncryptedItem,
  getEncryptedJSON,
} from "../utils/encryption.js";

function RoomSidebar({ isMobile = false, onRoomClick = null, privateRooms, publicRooms }) {
  const [isOpen, setIsOpen] = useState(true);
  const [recommendedRooms, setRecommendedRooms] = useState([]);
  const user = useUser({ or: 'return-null' });
  const navigate = useNavigate();

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchRecommendedRooms = () => {
      const rooms = getEncryptedJSON('recommendedRooms', []);
      setRecommendedRooms(rooms);
      // console.log("Recommended Rooms:", rooms);
    }

    fetchRecommendedRooms();
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Render room content component for use in other sidebars
  const RoomContent = () => (
    <div className="space-y-6">
      {recommendedRooms.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3 px-2">
            <MessagesSquare className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
              Recommended Rooms
            </h3>
          </div>
          <div className="space-y-2">
            {Array.isArray(recommendedRooms) && recommendedRooms.length > 0 && recommendedRooms.map((room) => (
              <button
                key={room}
                onClick={() => onRoomClick && onRoomClick({ roomId: room, name: room, type: 'public' })}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gray-800/30 hover:bg-purple-600/20 transition-all duration-200 group border border-transparent hover:border-purple-500/30 cursor-pointer"
              >
                <div className="flex-shrink-0">
                  <MessagesSquare className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors duration-200" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium text-sm group-hover:text-purple-300 transition-colors duration-200">
                    {room}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Public • Recommended
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Public Rooms Section */}
      {publicRooms.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3 px-2">
            <MessageSquareText className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
              Public Rooms
            </h3>
          </div>
          <div className="space-y-2">
            {publicRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomClick && onRoomClick({ roomId: room.roomId || room.name, name: room.name, type: 'public' })}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gray-800/30 hover:bg-green-600/20 transition-all duration-200 group border border-transparent hover:border-green-500/30 cursor-pointer"
              >
                <div className="flex-shrink-0">
                  <MessageSquareText className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors duration-200" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium text-sm group-hover:text-green-300 transition-colors duration-200">
                    {room.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Public • {room.memberships?.length || 0} members
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Private Rooms Section */}
      {privateRooms.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3 px-2">
            <MessageSquareLock className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
              Private Rooms
            </h3>
          </div>
          <div className="space-y-2">
            {privateRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomClick && onRoomClick({ roomId: room.roomId, name: room.name, type: 'private' })}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gray-800/30 hover:bg-blue-600/20 transition-all duration-200 group border border-transparent hover:border-blue-500/30 cursor-pointer"
              >
                <div className="flex-shrink-0">
                  <MessageSquareLock className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors duration-200" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium text-sm group-hover:text-blue-300 transition-colors duration-200">
                    {room.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Private • {room.memberships?.length || 0} members
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not authenticated message */}
      {!user && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Sign In Required
          </h3>
          <p className="text-gray-400 text-sm">
            Please sign in to view available chat rooms.
          </p>
        </div>
      )}
    </div>
  );

  // If this is being used as a mobile component, just return the content
  if (isMobile) {
    return <RoomContent />;
  }

  return (
    <>
      {/* Toggle Button - Hidden when sidebar is open */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-3 left-4 z-[60] p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl border border-white ${
          isOpen ? "hidden" : ""
        }`}
        aria-label="Toggle menu"
        style={{ minWidth: "48px", minHeight: "48px" }}
      >
        <MessageSquareMore className="w-5 h-5 text-white" />
      </button>

      {/* Backdrop - Mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Toggleable on all screens */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-gray-700/50 z-[55] transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Chat Rooms</h2>
            {/* Close Button - Visible on all screens */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700/80 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto p-4 h-[calc(100vh-144px)]">
          <RoomContent />
        </div>
      </div>

      {/* Spacer for desktop layout to prevent content overlap - Only when sidebar is open */}
      {isOpen && <div className="hidden md:block w-80 flex-shrink-0"></div>}
    </>
  );
}

export default RoomSidebar;