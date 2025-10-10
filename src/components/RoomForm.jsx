import React, { useState, useEffect } from "react";
import { useUser } from "@stackframe/react";
import FormSidebar from "./FormSidebar";
import BackButton from "./ui/BackButton";
import { getEncryptedJSON } from "../utils/encryption.js";
import RoomSidebar from "./RoomSidebar.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function RoomForm({
  onJoinRoom,
  onError,
  username,
  privateRooms,
  publicRooms,
}) {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [roomType, setRoomType] = useState("public");
  const [isCreating, setIsCreating] = useState(false);
  const user = useUser({ or: "return-null" });
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([
    ...publicRooms,
    ...privateRooms,
  ]);

  // Handle room click from sidebar
  const handleRoomClick = (roomData) => {
    console.log("Room clicked:", roomData);
    if (onJoinRoom && roomData) {
      const roomId = roomData.roomId || roomData.name;
      const displayName = roomData.name;
      const isPrivate = roomData.type === "private";

      console.log(
        "Joining room:",
        roomId,
        "displayName:",
        displayName,
        "isPrivate:",
        isPrivate
      );
      onJoinRoom(roomId, displayName);
    }
  };

  useEffect(() => {
    const recommendedRooms = getEncryptedJSON("recommendedRooms", []);

    if (recommendedRooms.length > 0) {
      setRooms(
        recommendedRooms.map((name, index) => ({
          name,
          index: index + 1,
          isRecommended: true,
        }))
      );
    } else {
      navigate("/questionnaire", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const recommendedRooms = getEncryptedJSON("recommendedRooms", []).map(
      (name) => ({
        name,
        isRecommended: true,
      })
    );

    const combined = [
      ...recommendedRooms,
      ...publicRooms.map((r) => ({ ...r, isRecommended: false })),
      ...privateRooms.map((r) => ({ ...r, isRecommended: false })),
    ];

    const filtered = combined.filter((room) =>
      room.name.toLowerCase().includes(roomName.toLowerCase())
    );

    // console.log("Filtered Rooms:", filtered);

    setFilteredRooms(filtered);
  }, [roomName, publicRooms, privateRooms]);

  const handleJoinPublic = () => {
    const trimmedRoom = roomName.trim();
    if (trimmedRoom) {
      setIsJoining(true);
      const cleanedRoom = trimmedRoom
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .toLowerCase();
      if (cleanedRoom) {
        setTimeout(() => {
          onJoinRoom(cleanedRoom);
        }, 500);
      } else {
        setIsJoining(false);
        onError("Please enter a valid room name!");
      }
    } else {
      onError("Please enter a room name!");
    }
  };

  const handleCreatePrivate = async () => {
    setShowCreateForm(true);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      onError("Please enter a room name!");
      return;
    }

    if (!user?.id) {
      onError("You must be logged in to create a room!");
      return;
    }

    // Normalize room name for comparison when creating public rooms
    const trimmedName = newRoomName.trim();
    const normalizedPublicName = trimmedName.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();

    // Choose the name to check in DB: for public rooms use normalizedPublicName, for private use trimmedName
    const nameToCheck = roomType.toUpperCase() === "PUBLIC" ? normalizedPublicName : trimmedName;

    setIsCreating(true);
    let existingRoom = null;
    try {
      existingRoom = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/rooms/existing?roomName=${encodeURIComponent(nameToCheck)}&userId=${user.id}&roomType=${roomType.toUpperCase()}`
      );
    } catch (err) {
      console.warn("Could not check existing rooms (API error)", err?.message || err);
      existingRoom = null;
    }

    if (existingRoom?.data?.existingRoom === true) {
      console.log("Room with these details already exists for you.");
      onError("Room with these details already exists!");
      return;
    }

    setIsCreating(true);
    try {
      // Step 1: Create room in Wrangler (Cloudflare Workers) to get unique roomId
      console.log("Creating room in Wrangler API...");
      const wranglerApiUrl = import.meta.env.VITE_HOST_NAME
        ? `https://${import.meta.env.VITE_HOST_NAME}/api/room`
        : "http://127.0.0.1:8787/api/room";

      const wranglerResponse = await fetch(wranglerApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        mode: "cors",
      });

      if (!wranglerResponse.ok) {
        throw new Error(`Wrangler API error: ${wranglerResponse.status}`);
      }

      const roomId = await wranglerResponse.text();
      console.log("Room created in Wrangler with ID:", roomId);

      // Step 2: Store room information in Express API
      console.log("Storing room information in Express API...");

      if (!user?.id) {
        throw new Error("No valid user found. Please log in again.");
      }

      const expressApiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const expressResponse = await axios.post(
        `${expressApiUrl}/rooms`,
        {
          roomId: roomId,
          roomName: newRoomName.trim(),
          roomType: roomType.toUpperCase(),
          userId: user.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "Room information stored in Express API:",
        expressResponse.data
      );

      if (
        expressResponse.data.success ||
        expressResponse.status === 200 ||
        expressResponse.status === 201
      ) {
        // Navigate to the newly created room using the roomId from Wrangler
        setTimeout(() => {
          onJoinRoom(roomId);
        }, 300);
      } else {
        throw new Error(
          expressResponse.data.message || "Failed to store room information"
        );
      }
    } catch (err) {
      console.error("Error creating room:", err);
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to create room";
      onError(`${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setShowCreateForm(false);
    setNewRoomName("");
    setRoomType("public");
    setIsCreating(false);
  };

  return (
    <>
      {/* FormSidebar Component */}
      <div className="flex justify-between items-center">
        {/* <BackButton /> */}
        <RoomSidebar
          privateRooms={privateRooms}
          publicRooms={publicRooms}
          onRoomClick={handleRoomClick}
        />
        <FormSidebar privateRooms={privateRooms} publicRooms={publicRooms} />
      </div>

      <div className="fixed items-center justify-center inset-0 z-40 bg-gradient-to-br from-gray-900 via-blue-900/80 to-gray-900 backdrop-blur-sm flex flex-col justify-center items-center animate-fadeIn p-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/6 w-32 h-32 bg-purple-600/10 rounded-full blur-xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/6 w-40 h-40 bg-blue-600/10 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-pink-600/10 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>
        <div className="flex items-center justify-center py-6 my-10 rounded-xl shadow-2xl border border-gray-300/50 max-w-lg">
          <div className="flex justify-center items-center">
            <img src="/logo.png" alt="Company Logo" className="h-12 mx-4" />
          </div>
        </div>

        <div
          className={`items-center justify-center flex relative transform transition-all duration-500 ${
            isJoining || isCreatingPrivate
              ? "scale-110 opacity-50"
              : "scale-100 opacity-100"
          }`}
        >
          {/* Main card */}
          <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 md:p-7 lg:p-8 shadow-2xl border border-gray-700/50 max-w-sm sm:max-w-md md:max-w-lg w-full mx-4 transform transition-all duration-300">
            {/* Welcome back message */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
                Welcome back, <span className="text-white">{username}!</span>
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm md:text-base">
                Choose how you want to join the conversation
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Public Room Section */}
              <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6 border border-gray-600/30 hover:border-purple-400/50 transition-all duration-300">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white">
                    Join Public Room
                  </h3>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="relative">
                    <input
                      className="w-full text-sm sm:text-base md:text-lg p-3 sm:p-4 bg-gray-600/50 backdrop-blur-sm border-2 border-gray-500/50 rounded-xl text-white placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 transition-all duration-300 hover:border-gray-400"
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowDropdown(false), 200)
                      }
                      placeholder="Choose from popular rooms"
                      // autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleJoinPublic();
                        }
                      }}
                    />

                    {/* Dropdown Arrow */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          showDropdown ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                        <div className="p-0">
                          {filteredRooms.length > 0
                            ? filteredRooms.map((room, index) => (
                                <button
                                  key={index}
                                  className={`w-full text-left px-3 py-2 text-sm text-white rounded-lg transition-all duration-200 flex items-center justify-between ${room.isRecommended ? "hover:bg-purple-600/30" : publicRooms.find((r) => r.id === room.id) ? "hover:bg-green-600/30" : "hover:bg-blue-600/30"}`}
                                  onClick={() => {
                                    setRoomName(room.name);
                                    setShowDropdown(false);
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-2 h-2 rounded-full animate-pulse ${
                                        room.isRecommended
                                          ? "bg-purple-400"
                                          : publicRooms.find(
                                                (r) => r.id === room.id
                                              )
                                            ? "bg-green-400"
                                            : "bg-blue-400"
                                      }`}
                                    ></div>
                                    <span className="capitalize">
                                      {room.name}
                                    </span>
                                  </div>
                                  {room.isRecommended && (
                                    <span className="text-xs bg-purple-600/50 text-purple-200 px-2 py-1 rounded-full">
                                      Recommended
                                    </span>
                                  )}
                                </button>
                              ))
                            : null}
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 rounded-xl bg-green-600/10 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <button
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 md:py-4 px-4 sm:px-6 md:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-green-400/30 text-sm sm:text-base md:text-lg"
                    onClick={handleJoinPublic}
                    disabled={isCreatingPrivate || isJoining}
                  >
                    {isJoining ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Joining...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <svg
                          className="w-3 sm:w-4 md:w-5 h-3 sm:h-4 md:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Join Room</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                <div className="relative bg-gray-800 px-4 text-gray-400 font-medium text-xs sm:text-sm md:text-base">
                  OR
                </div>
              </div>

              {/* Create Room Section */}
              {!showCreateForm ? (
                <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6 border border-gray-600/30 hover:border-blue-400/50 transition-all duration-300">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white">
                      Create Room
                    </h3>
                  </div>

                  <p className="text-gray-300 text-xs sm:text-sm md:text-base mb-3 sm:mb-4">
                    Create a new room and customize who can join
                  </p>

                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 md:py-4 px-4 sm:px-6 md:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-400/30 text-sm sm:text-base md:text-lg"
                    onClick={handleCreatePrivate}
                    disabled={isJoining}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-3 sm:w-4 md:w-5 h-3 sm:h-4 md:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span>Create New Room</span>
                    </div>
                  </button>
                </div>
              ) : (
                /* Create Room Form */
                <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6 border border-gray-600/30 border-blue-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white">
                        Create New Room
                      </h3>
                    </div>
                    <button
                      onClick={resetCreateForm}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                      disabled={isCreating}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Room Name Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Room Name
                      </label>
                      <input
                        className="w-full text-sm sm:text-base p-3 bg-gray-600/50 backdrop-blur-sm border-2 border-gray-500/50 rounded-xl text-white placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-400"
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Enter room name..."
                        maxLength={64}
                        disabled={isCreating}
                      />
                    </div>

                    {/* Room Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Room Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setRoomType("public")}
                          disabled={isCreating}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                            roomType === "public"
                              ? "border-green-400 bg-green-400/20 text-green-300"
                              : "border-gray-500/50 bg-gray-600/30 text-gray-300 hover:border-green-400/50"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 17l4-4 4 4m-4-4v12"
                              />
                            </svg>
                            <span className="text-sm font-medium">Public</span>
                          </div>
                          <p className="text-xs mt-1 opacity-75">
                            Anyone can join
                          </p>
                        </button>

                        <button
                          onClick={() => setRoomType("private")}
                          disabled={isCreating}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                            roomType === "private"
                              ? "border-purple-400 bg-purple-400/20 text-purple-300"
                              : "border-gray-500/50 bg-gray-600/30 text-gray-300 hover:border-purple-400/50"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            <span className="text-sm font-medium">Private</span>
                          </div>
                          <p className="text-xs mt-1 opacity-75">Invite only</p>
                        </button>
                      </div>
                    </div>

                    {/* Create Button */}
                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-400/30 text-sm"
                      onClick={handleCreateRoom}
                      disabled={isCreating || !newRoomName.trim()}
                    >
                      {isCreating ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Creating Room...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          <span>
                            Create{" "}
                            {roomType === "public" ? "Public" : "Private"} Room
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RoomForm;
