import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export default function App() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [privateTarget, setPrivateTarget] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [theme, setTheme] = useState("light");

  const joinChat = () => {
    if (!username.trim()) return;
    socket.emit("join", username);
    setJoined(true);
  };

  useEffect(() => {
    socket.on("receive_message", (data) => setChat((prev) => [...prev, data]));
    socket.on("receive_image", (data) => setChat((prev) => [...prev, data]));

    socket.on("receive_private_message", ({ from, message, image }) => {
      setChat((prev) => [
        ...prev,
        {
          username: from,
          text: message ? `(Private) ${message}` : null,
          image,
          private: true,
        },
      ]);
      new Notification("Private message", { body: `From ${from}` });
    });

    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    socket.on("notification", (msg) =>
      setNotifications((prev) => [...prev, msg])
    );

    socket.on("user_typing", (name) => setTypingUser(name));
    socket.on("user_stop_typing", () => setTypingUser(""));

    return () => {
      socket.off("receive_message");
      socket.off("receive_image");
      socket.off("receive_private_message");
      socket.off("onlineUsers");
      socket.off("notification");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, []);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", username);
    if (e.target.value === "") socket.emit("stop_typing");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() && !imagePreview) return;

    const msgData = {
      username,
      text: message || null,
      image: imagePreview || null,
      time: new Date().toLocaleTimeString(),
    };

    if (privateTarget) {
      socket.emit("private_message", {
        to: privateTarget,
        message: msgData.text,
        image: msgData.image,
        from: username,
      });
      setChat((prev) => [
        ...prev,
        {
          username: `To ${privateTarget}`,
          text: msgData.text,
          image: msgData.image,
          private: true,
        },
      ]);
    } else if (msgData.image) {
      socket.emit("send_image", msgData);
      setChat((prev) => [...prev, msgData]);
    } else {
      socket.emit("send_message", msgData);
      setChat((prev) => [...prev, msgData]);
    }

    setMessage("");
    setImagePreview(null);
    socket.emit("stop_typing");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (!joined)
    return (
      <div
        className={`flex h-screen items-center justify-center ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100"
        }`}
      >
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md text-center w-96">
          <h2 className="text-2xl font-bold mb-4">Enter your username</h2>
          <input
            type="text"
            placeholder="Username"
            className="border p-2 w-full rounded mb-4 text-black"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            onClick={joinChat}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Join Chat
          </button>
        </div>
      </div>
    );

  return (
    <div
      className={`flex h-screen ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100"
      }`}
    >
      {/* Sidebar */}
      <div
        className={`w-1/4 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        } border-r shadow-lg p-4`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">🟢 Online Users</h3>
          <button
            onClick={toggleTheme}
            className="text-sm bg-blue-500 px-2 py-1 rounded text-white"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
        {onlineUsers.map((user, i) => (
          <div
            key={i}
            onClick={() => setPrivateTarget(user === username ? "" : user)}
            className={`cursor-pointer p-1 rounded ${
              privateTarget === user ? "bg-blue-100 dark:bg-blue-700" : ""
            }`}
          >
            {user === username ? `${user} (You)` : user}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col p-4">
        <div
          className={`flex-1 overflow-y-auto rounded-xl p-4 shadow-inner ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          {chat.map((msg, i) => (
            <div key={i} className="mb-3">
              <span className="font-semibold">{msg.username}: </span>
              {msg.text && (
                <span
                  className={`${
                    msg.private
                      ? "text-purple-400"
                      : theme === "dark"
                      ? "text-gray-200"
                      : "text-gray-800"
                  }`}
                >
                  {msg.text}
                </span>
              )}
              {msg.image && (
                <div>
                  <img
                    src={msg.image}
                    alt="sent"
                    className="rounded-lg max-w-xs mt-2 border"
                  />
                </div>
              )}
            </div>
          ))}
          {typingUser && (
            <p className="italic text-sm text-gray-400">{typingUser} is typing...</p>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex mt-4">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder={
              privateTarget
                ? `Private to ${privateTarget}`
                : "Type your message..."
            }
            className="flex-1 border p-2 rounded-l-lg text-black focus:outline-none"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="fileInput"
          />
          <label
            htmlFor="fileInput"
            className="bg-green-500 text-white px-4 flex items-center cursor-pointer hover:bg-green-600"
          >
            📎
          </label>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600"
          >
            Send
          </button>
        </form>

        {imagePreview && (
          <div className="mt-2 text-sm">
            <p>Preview:</p>
            <img
              src={imagePreview}
              alt="preview"
              className="max-w-xs rounded-lg mt-1 border"
            />
          </div>
        )}

        {notifications.slice(-3).map((n, i) => (
          <div key={i} className="text-xs mt-1 text-gray-400">
            🔔 {n}
          </div>
        ))}
      </div>
    </div>
  );
}
