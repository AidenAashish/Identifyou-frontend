import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import RoomForm from "../components/RoomForm.jsx";
import ChatRoom from "../components/ChatRoom.jsx";
import ErrorDisplay from "../components/ErrorDisplay.jsx";
import {
  getEncryptedItem,
  setEncryptedItem,
  removeEncryptedItem,
  decryptData,
} from "../utils/encryption.js";
import axios from "axios";
import { useUser } from "@stackframe/react";

function ChatPage() {
  const user = useUser({ or: 'return-null' });
  const [currentStep, setCurrentStep] = useState("room");
  const [username, setUsername] = useState("");
  const [roomname, setRoomname] = useState("");
  const [actualRoomName, setActualRoomName] = useState(""); // Store the actual display name
  const [privateRooms, setPrivateRooms] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actualRoom, setActualRoom] = useState(null); // Store the actual room object
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      
      // If we have a user, set up the global name and restore state
      if (user?.id) {
        await handleSessionRestore(user);
      } else {
        // No user, check if we have saved data anyway (for guest mode or persistence)
        await handleLocalRestore();
      }
      
      setIsLoading(false);
    };

    initializeSession();
  }, [user]);

  const handleSessionRestore = async (user) => {
    try {
      // Set global name from API
      await setGlobalName(user);
      
      // Then restore room state
      await restoreRoomState();
    } catch (e) {
      console.error("Error during session restore:", e);
      // Fall back to local restore if API fails
      await handleLocalRestore();
    }
  };

  const handleLocalRestore = async () => {
    const savedUser = getEncryptedItem("username");
    const savedRoom = getEncryptedItem("roomname");
    const savedActualRoomName = getEncryptedItem("actualRoomName");

    // console.log("Local restore - savedUser:", savedUser, "savedRoom:", savedRoom);

    if (savedUser && savedRoom) {
      setUsername(savedUser);
      setRoomname(savedRoom);
      
      if (savedActualRoomName) {
        setActualRoomName(savedActualRoomName);
      } else {
        // Check if the saved room is a private room and fetch its details
        const isPrivateRoom = savedRoom.match(/^[0-9a-f]{64}$/i);
        if (isPrivateRoom) {
          await fetchRoomDetails(savedRoom);
        } else {
          setActualRoomName(savedRoom);
        }
      }
      
      setCurrentStep("chat");
    } else {
      setCurrentStep("room");
    }
  };

  const restoreRoomState = async () => {
    const savedRoom = getEncryptedItem("roomname");
    const savedActualRoomName = getEncryptedItem("actualRoomName");

    // Check for room parameter in URL (both query param and path param)
    const roomFromQuery = searchParams.get("room");
    const roomFromPath = roomId;
    const roomFromUrl = roomFromPath || roomFromQuery;

    if (roomFromUrl) {
      setRoomname(roomFromUrl);
      setEncryptedItem("roomname", roomFromUrl);

      // Check if this is a private room (64-character hex string)
      const isPrivateRoom = roomFromUrl.match(/^[0-9a-f]{64}$/i);
      
      if (isPrivateRoom) {
        // console.log("Detected private room, fetching details...");
        await fetchRoomDetails(roomFromUrl);
      } else {
        // For public rooms, use the roomname as display name
        setActualRoomName(roomFromUrl);
        setEncryptedItem("actualRoomName", roomFromUrl);
      }

      setCurrentStep("chat");

      // Update URL to remove the query room parameter for cleaner experience (keep path params)
      if (roomFromQuery && !roomFromPath) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    } else if (savedRoom) {
      // Normal session restoration
      setRoomname(savedRoom);
      
      // Restore the actual room name if available
      if (savedActualRoomName) {
        setActualRoomName(savedActualRoomName);
      } else {
        // Check if the saved room is a private room and fetch its details
        const isPrivateRoom = savedRoom.match(/^[0-9a-f]{64}$/i);
        if (isPrivateRoom) {
          await fetchRoomDetails(savedRoom);
        } else {
          setActualRoomName(savedRoom);
        }
      }
      
      setCurrentStep("chat");
    }
  };

  useEffect(() => {
    if (!user?.id) {
      return
    }
    fetchRooms();
  }, [user, currentStep]);

  const setGlobalName = async (user) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/users/${user.id}`
      );

      // console.log("Fetched user data:", response.data);
      setUsername(response.data.username);
      setEncryptedItem("username", response.data.username);
      
      setError("");
      return true; // Success
    } catch (e) {
      console.error("Error fetching user data:", e);
      setError("Failed to fetch user data. Please try again.");
      return false; // Failure
    }
  };

  const fetchRooms = async (userData = null) => {
    try {
      // Use the provided user or the current user
      const currentUser = userData || user;

      if (!currentUser?.id) {
        console.warn("No valid user found for fetching rooms");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/rooms/${currentUser.id}`
      );

      setPrivateRooms(response.data.privateRooms || []);
      setPublicRooms(response.data.publicRooms || []);
    } catch (e) {
      console.error("Error fetching rooms:", e);
      // Set empty arrays on error
      setPublicRooms([]);
      setPrivateRooms([]);
    }
  };

  // Function to fetch room details by roomId (for private rooms)
  const fetchRoomDetails = async (roomId) => {
    try {
      // console.log("Fetching details for room:", roomId);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/rooms/room/${roomId}`
      );
      
      // console.log("Room details fetched:", response.data);
      setActualRoom(response.data)
      setActualRoomName(response.data.name);
      return response.data;
    } catch (e) {
      console.error("Error fetching room details:", e);
      // For public rooms or if fetch fails, use roomId as fallback
      setActualRoomName(roomId);
      return null;
    }
  };

  const handleRoomJoin = async (room, displayName = null) => {
    // Ensure room is a string
    const roomId = typeof room === 'string' ? room : (room?.roomId || room?.name || '');
    
    setRoomname(roomId);
    setEncryptedItem("roomname", roomId);
    
    // If displayName is provided, use it; otherwise detect if it's a private room
    if (displayName) {
      setActualRoomName(displayName);
      setEncryptedItem("actualRoomName", displayName);
    } else {
      const isPrivateRoom = roomId && typeof roomId === 'string' && roomId.match(/^[0-9a-f]{64}$/i);
      if (isPrivateRoom) {
        await fetchRoomDetails(roomId);
      } else {
        setActualRoomName(roomId);
        setEncryptedItem("actualRoomName", roomId);
      }
    }
    
    setCurrentStep("chat");
    setError("");
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError("");
  };

  const resetToNameForm = () => {
    setCurrentStep("room");
    setRoomname("");
    setActualRoomName("");
    setError("");
    // Clear localStorage
    removeEncryptedItem("username");
    removeEncryptedItem("roomname");
    removeEncryptedItem("actualRoomName");
  };

  // Show loading state while checking for saved session
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen z-40 bg-gradient-to-br from-gray-900 via-blue-900/80 to-gray-900 backdrop-blur-sm bg-black/60 animate-fadeIn">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-purple-400/30 border-t-blue-400 rounded-full animate-spin"></div>
          <p className="text-white font-semibold">Fetching session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-gray-200 overflow-hidden bg-black/60 backdrop-blur-sm min-h-screen">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-purple-600/5 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute top-3/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-blue-600/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 sm:w-80 h-40 sm:h-80 bg-pink-600/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <Header />

      <ErrorDisplay error={error} onClearError={clearError} />

      {currentStep === "room" && (
        <RoomForm
          onJoinRoom={handleRoomJoin}
          onError={handleError}
          username={username}
          privateRooms={privateRooms}
          publicRooms={publicRooms}
        />
      )}

      {currentStep === "chat" && (
        <ChatRoom
          username={username}
          roomname={roomname}
          displayName={actualRoomName || roomname}
          onError={handleError}
          onDisconnect={resetToNameForm}
          roomType={actualRoom?.type}
        />
      )}
    </div>
  );
}

export default ChatPage;
