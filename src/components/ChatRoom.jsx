import { useState, useEffect, useRef } from "react";
import leoProfanity from "leo-profanity";

leoProfanity.add([
  // Your custom words array (unchanged)
  "fuck","shit","bitch","bastard","asshole","dick","pussy","cunt","damn","crap","bollocks","bugger","fucker","motherfucker","cock","prick","twat","douche","slut","whore","arse","arsehole",
  "sex","porn","nude","naked","slut","whore","cock","penis","vagina","rape","orgy","boobs","tits","cum","ejaculate","blowjob","handjob","masturbate","hentai","xxx","fetish",
  "kill","murder","stab","shoot","bomb","gun","terrorist","die","slap","punch","hurt","destroy","assault","behead","choke","fight","brawl","attack","kill yourself","hang","shoot yourself",
  "loser","idiot","stupid","dumb","fat","ugly","retard","moron","nerd","faggot","dyke","bitchy","weirdo","loser","lame","jerk","coward","scum","loser","losing","suck","loserface",
  "nigger","chink","spic","kike","gook","wetback","coon","slant","raghead","towelhead","cracker","wop","hebe","beaner","gypsy","oriental","injun",
  "suicide","cutting","hang","kill myself","die myself","depress","self-harm","anorexia","bulimia","starve","faint","die alone","cry","worthless","worthlessness",
  "drugs","cocaine","heroin","meth","weed","marijuana","alcohol","binge","addict","stoned","stoner","smoke weed","ecstasy","lsd","molly","crack","hash","opiate","pill","tripping",
  "slap","shithead","fuckhead","dumbass","asshat","twatface","dipshit","tard","idiotface","asswipe","numbnuts","butthole","douchebag","wanker","bloody","bollocks","arsewipe","piss off","screw you","dammit","crappy","loserish","moronic","shitbag","fuckboy","fuckgirl",
  "rape","molest","harass","stalk","fondle","touch me","grope","perv","pervert","pedo","paedo",
  "torture","beating","lynch","massacre","slaughter","exterminate","execute","kill them all","chop off"
]);

function ChatRoom({ username, roomname, onError, onDisconnect, displayName, roomType }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [readyToChat, setReadyToChat] = useState(false);
  const [isProcessingBacklog, setIsProcessingBacklog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [roomKey, setRoomKey] = useState(0); // Used to force reconnect

  const chatlogRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const userIsInRoomRef = useRef(true);

  const userCount = connectedUsers.length;

  useEffect(() => {
    userIsInRoomRef.current = true;

    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const host = import.meta.env.VITE_HOST_NAME || "127.0.0.1:8787";
    const cleanedRoomname = roomname.match(/^[0-9a-f]{64}$/i)
      ? roomname
      : roomname.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();

    const wsUrl = `${protocol}${host}/api/room/${cleanedRoomname}/websocket`;
    console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    const startHeartbeat = () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    const stopHeartbeat = () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };

    ws.onopen = () => {
      console.log("✅ Connected to room");
      setIsConnected(true);
      setIsConnecting(false);
      setReadyToChat(false);
      setIsProcessingBacklog(true);
      startHeartbeat();
      ws.send(JSON.stringify({ name: username }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.message) {
          addMessage(data.name, data.message, "message", isProcessingBacklog);
        } else if (data.joined) {
          if (!isProcessingBacklog) addMessage(null, `${data.joined === username ? "You" : data.joined} joined the room`, "system");
          setConnectedUsers((prev) => (prev.includes(data.joined) ? prev : [...prev, data.joined]));
        } else if (data.quit) {
          addMessage(null, `${data.quit === username ? "You" : data.quit} left the room`, "system");
          setConnectedUsers((prev) => prev.filter((u) => u !== data.quit));
        } else if (data.error) {
          console.error("Server error:", data.error);
          onError(data.error);
        } else if (data.ready) {
          setReadyToChat(true);
          setIsProcessingBacklog(false);
          setConnectedUsers((prev) => (prev.includes(username) ? prev : [...prev, username]));
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err, e.data);
      }
    };

    ws.onclose = (event) => {
      console.log(`🔌 WebSocket closed: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`);
      stopHeartbeat();
      setIsConnected(false);
      setIsConnecting(false);
      setReadyToChat(false);
      setIsProcessingBacklog(false);
      setConnectedUsers([]);

      // Only auto-reconnect for unexpected disconnections
      if (event.code !== 1000 && userIsInRoomRef.current) {
        console.log("🔄 Attempting reconnect in 3s...");
        reconnectTimeoutRef.current = setTimeout(() => {
          if (userIsInRoomRef.current) {
            console.log("🔄 Auto-reconnecting...");
            setMessages([]);
            setConnectedUsers([]);
            // Don't call connectToRoom, just let useEffect re-run
          }
        }, 3000);
      }
    };

    ws.onerror = (e) => {
      console.error("🚨 WebSocket error event:", e);
      stopHeartbeat();
      setIsConnected(false);
      setIsConnecting(false);
      setReadyToChat(false);
      setIsProcessingBacklog(false);
      setConnectedUsers([]);
    };

    // Cleanup
    return () => {
      userIsInRoomRef.current = false;
      stopHeartbeat();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Component unmounted or user left");
      }
      socketRef.current = null;
    };
  }, [roomname, roomKey]); // Reconnect when room changes or manual reconnect triggered

  // ------------------- Utility functions -------------------
  const containsProfaneSubstring = (message) => {
    const trimmedMessage = message.trim().toLowerCase();
    const words = trimmedMessage.split(/\s+/);
    for (const word of words) {
      for (let start = 0; start < word.length; start++) {
        for (let end = start + 1; end <= word.length; end++) {
          if (leoProfanity.check(word.slice(start, end))) return true;
        }
      }
    }
    return false;
  };

  const addMessage = (name, text, type = "message", isBacklog = false) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      name,
      text,
      timestamp: new Date(),
      type,
      isOwn: name === username,
      isBacklog,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const sendMessage = () => {
    const trimmedMessage = currentMessage.trim();
    if (socketRef.current && trimmedMessage && isConnected && readyToChat) {
      if (trimmedMessage.length > 256) return onError("Message too long (max 256 characters)");
      if (containsProfaneSubstring(trimmedMessage)) return onError("Please avoid using offensive language.");
      socketRef.current.send(JSON.stringify({ message: trimmedMessage }));
      setCurrentMessage("");
      chatlogRef.current?.scrollTo({ top: chatlogRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } };
  const handleInputChange = (e) => setCurrentMessage(e.target.value);

  const connectToRoom = () => {
    if (!roomname) return;
    
    console.log("🔄 Manual reconnect triggered");
    
    // Close existing connection if any
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close(1000, "Manual reconnect");
      }
    }

    // Clear any pending reconnect timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Reset state and trigger useEffect to create new connection
    setIsConnecting(true);
    setMessages([]);
    setConnectedUsers([]);
    userIsInRoomRef.current = true;
    
    // Force useEffect to re-run by updating a dependency
    // The useEffect will handle the actual connection
    setRoomKey(prev => prev + 1);
  };

  const shareRoom = async () => {
    try {
      const isPrivateRoom = roomname.match(/^[0-9a-f]{64}$/i);
      if (!isPrivateRoom) return onError("Only private rooms can be shared.");
      const shareUrl = `${window.location.origin}/room/${roomname}`;
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(shareUrl);
      else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.focus(); textArea.select();
        document.execCommand("copy"); textArea.remove();
      }
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      onError("Failed to copy room link to clipboard");
    }
  };

  return (
    <main className="flex-1 flex flex-col lg:flex-row p-2 sm:p-4 gap-2 sm:gap-4 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-0">
      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden min-h-0">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-gray-700/80 to-gray-600/80 backdrop-blur-sm px-3 sm:px-6 py-2 sm:py-4 border-b border-gray-600/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                  }`}
                ></div>
                {isConnected && (
                  <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                )}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  #{displayName || roomname}
                </h3>
                <p className="text-xs text-gray-300">
                  {userCount} user{userCount !== 1 ? "s" : ""} online
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mobile Sidebar Toggle Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg bg-gray-600/50 hover:bg-gray-600/80 transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatlogRef}
          className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-900/50 to-gray-800/50 min-h-0"
        >
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.isOwn ? "justify-end" : "justify-start"
              } animate-slideIn`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {msg.type === "system" ? (
                <div className="flex justify-center w-full">
                  <div className="bg-gray-700/50 backdrop-blur-sm text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-600/30">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div
                  className={`max-w-[75%] sm:max-w-xs lg:max-w-md xl:max-w-lg ${
                    msg.isOwn ? "order-2" : "order-1"
                  }`}
                >
                  <div
                    className={`relative group ${
                      msg.isOwn
                        ? "bg-purple-600 text-white ml-auto"
                        : "bg-gray-700/80 backdrop-blur-sm text-gray-100"
                    } rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                      msg.isBacklog
                        ? "opacity-75 border border-gray-600/50"
                        : ""
                    }`}
                  >
                    {!msg.isOwn && (
                      <div className="text-xs font-semibold text-purple-400 mb-1 flex items-center">
                        {msg.name}
                        {msg.isBacklog && (
                          <span className="ml-2 text-gray-400 text-xs">📜</span>
                        )}
                      </div>
                    )}

                    <div className="text-sm leading-relaxed break-words">
                      {msg.text}
                    </div>

                    {msg.isOwn && msg.isBacklog && (
                      <div className="text-xs text-gray-300 mt-1 opacity-75">
                        📜 Historical
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {messages.length === 0 && !isProcessingBacklog && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 sm:w-16 h-12 sm:h-16 mb-4 bg-gray-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 sm:w-8 h-6 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
                Welcome to the chat!
              </h3>
              <p className="text-sm sm:text-base text-gray-400">
                Start the conversation by sending your first message
              </p>
            </div>
          )}

          {isProcessingBacklog && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 sm:w-16 h-12 sm:h-16 mb-4 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-6 sm:w-8 h-6 sm:h-8 text-white animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
                Loading chat history...
              </h3>
              <p className="text-sm sm:text-base text-gray-400">
                Retrieving messages and user list
              </p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-gray-700/50 backdrop-blur-sm border-t border-gray-600/50 p-2 sm:p-4 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex-1 relative">
              <input
                className="w-full bg-gray-600/50 backdrop-blur-sm border border-gray-500/50 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 transition-all duration-300 pr-12 sm:pr-16 text-sm"
                type="text"
                value={currentMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isConnected && readyToChat
                    ? "Type your message..."
                    : isConnected
                      ? "Connecting to room..."
                      : "Connecting..."
                }
                disabled={!isConnected || !readyToChat}
                maxLength={256}
              />
              <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                {currentMessage.length}/256
              </div>
            </div>

            <button
              onClick={sendMessage}
              disabled={!isConnected || !readyToChat || !currentMessage.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white p-2 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-purple-400/30"
            >
              <svg
                className="w-4 sm:w-5 h-4 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Hidden on mobile by default, overlay when toggled */}
      <div
        className={`
        ${isSidebarOpen ? "fixed inset-0 z-50 lg:relative lg:inset-auto" : "hidden lg:block"}
        lg:w-64 lg:relative lg:z-auto
      `}
      >
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Content */}
        <div
          className={`
          ${isSidebarOpen ? "fixed right-0 top-0 h-full w-80 max-w-[90vw] lg:relative lg:w-64 lg:h-auto" : "lg:w-64"}
          bg-gray-800/90 backdrop-blur-lg rounded-none lg:rounded-2xl shadow-2xl border-l border-gray-700/50 lg:border lg:border-gray-700/50 p-3 sm:p-4 space-y-3 sm:space-y-4 flex flex-col
        `}
        >
          {/* Mobile Close Button */}
          {isSidebarOpen && (
            <div className="flex justify-between items-center lg:hidden mb-2">
              <h3 className="text-lg font-semibold text-white">Room Info</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700/80 transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5 text-white"
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
          )}

          {/* Sidebar Content Container with Scroll */}
          <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 min-h-0 max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-150px)]">
            {/* Room Info */}
            <div className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl p-3 sm:p-4 border border-gray-600/30 flex-shrink-0">
              <h4 className="font-semibold text-white mb-2 flex items-center text-sm sm:text-base">
                <svg
                  className="w-4 sm:w-5 h-4 sm:h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0"
                  />
                </svg>
                Room Info
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white font-medium">
                    {roomType || (roomname.match(/^[0-9a-f]{64}$/i) ? "Private" : "Public")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white font-medium truncate ml-2">
                    #{displayName || roomname}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Users:</span>
                  <span className="text-green-400 font-medium">
                    {userCount} online
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">You:</span>
                  <span className="text-purple-400 font-medium truncate ml-2">
                    {username}
                  </span>
                </div>
              </div>
            </div>

            {/* Online Users List */}
            <div className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl p-3 sm:p-4 border border-gray-600/30 flex-shrink-0">
              <h4 className="font-semibold text-white mb-3 flex items-center text-sm sm:text-base">
                <img
                  src="/icons8-users-32 (2).png"
                  alt="online users"
                  className="w-4 sm:w-5 h-4 sm:h-5 mr-2 "
                />
                Online Users ({connectedUsers.length})
              </h4>
              <div className="space-y-2 max-h-32 lg:max-h-40 overflow-y-auto">
                {connectedUsers.map((user, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
                      user === username
                        ? "bg-purple-500/20 border border-purple-500/30"
                        : "bg-gray-600/30 hover:bg-gray-600/50"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user === username ? "bg-purple-400" : "bg-green-400"
                      } animate-pulse`}
                    ></div>
                    <span
                      className={`text-xs sm:text-sm font-medium truncate ${
                        user === username ? "text-purple-300" : "text-gray-300"
                      }`}
                    >
                      {user === username ? `${user} (You)` : user}
                    </span>
                  </div>
                ))}
                {connectedUsers.length === 0 && (
                  <div className="text-center py-2 sm:py-4">
                    <p className="text-gray-400 text-xs sm:text-sm">
                      No users online
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div
              className={`rounded-xl p-3 sm:p-4 border transition-all duration-300 flex-shrink-0 ${
                isConnected
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                  }`}
                ></div>
                <span
                  className={`font-medium text-xs sm:text-sm ${
                    isConnected ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Always Visible at Bottom */}
          <div className="space-y-2 flex-shrink-0 border-t border-gray-600/30 pt-3">
            {/* Share Room Button - Only for private rooms */}
            {roomname.match(/^[0-9a-f]{64}$/i) && (
              <button
                onClick={shareRoom}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400/30 text-xs sm:text-sm"
              >
                <div className="flex items-center justify-center space-x-2">
                  {linkCopied ? (
                    <>
                      <svg
                        className="w-3 sm:w-4 h-3 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3 sm:w-4 h-3 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                      <span>Share Room</span>
                    </>
                  )}
                </div>
              </button>
            )}

            {!isConnected && (
              <button
                onClick={connectToRoom}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400/30 text-xs sm:text-sm"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-3 sm:w-4 h-3 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Reconnect</span>
                </div>
              </button>
            )}

            <button
              onClick={onDisconnect}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-400/30 text-xs sm:text-sm"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-3 sm:w-4 h-3 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Leave Room</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ChatRoom;
