import React, { useState, useEffect, useRef, useContext } from "react";
import { motion } from "motion/react";
import { BottomNav } from "../components/common/BottomNav";
import {
  ArrowLeft,
  Send,
  Image,
  MoreVertical,
  Phone,
  Video,
  Users,
  Paperclip,
  Smile,
  Camera,
} from "lucide-react";
import { NavigationContext } from "../App";
import "../styles/ChatScreen.css";

type Message = {
  id: number;
  text: string;
  sender: "me" | "them";
  time: string;
  type: "text" | "image" | "system";
  imageUrl?: string;
  read: boolean;
};

export function ChatScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hej! Kako ide čišćenje parka?",
      sender: "them",
      time: "09:30",
      type: "text",
      read: true,
    },
    {
      id: 2,
      text: "Super! Završili smo jučer. Sakupili smo preko 50kg otpada!",
      sender: "me",
      time: "09:32",
      type: "text",
      read: true,
    },
    {
      id: 3,
      text: "Wow, odlično! Možeš li poslati neke slike?",
      sender: "them",
      time: "09:33",
      type: "text",
      read: true,
    },
    {
      id: 4,
      text: "Evo slika iz čišćenja",
      sender: "me",
      time: "09:35",
      type: "image",
      imageUrl:
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400",
      read: true,
    },
    {
      id: 5,
      text: "Ana se pridružila grupi",
      sender: "them",
      time: "09:40",
      type: "system",
      read: true,
    },
    {
      id: 6,
      text: "Sutra planiramo još jedno čišćenje. Hoćeš li doći?",
      sender: "them",
      time: "10:15",
      type: "text",
      read: true,
    },
    {
      id: 7,
      text: "Definitivno! U koliko sati?",
      sender: "me",
      time: "10:16",
      type: "text",
      read: true,
    },
    {
      id: 8,
      text: "U 9h ispred glavnog ulaza u park.",
      sender: "them",
      time: "10:17",
      type: "text",
      read: false,
    },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [chatUser, setChatUser] = useState({
    name: "Marko Eco",
    avatar: "ME",
    status: "online",
    isGroup: false,
    members: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Učitaj podatke o chatu iz localStorage
    const chatData = localStorage.getItem("currentChat");
    if (chatData) {
      const data = JSON.parse(chatData);
      setChatUser({
        name: data.name,
        avatar:
          data.avatar ||
          data.name
            .split(" ")
            .map((n: string) => n[0])
            .join(""),
        status: "online",
        isGroup: data.type === "group",
        members: data.members || 0,
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg: Message = {
      id: messages.length + 1,
      text: newMessage,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "text",
      read: false,
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");

    // Simuliraj odgovor nakon 1 sekunde
    setTimeout(() => {
      const replies = [
        "Odlično! Vidimo se tamo.",
        "Donosim dodatne kese za reciklažu.",
        "Javio sam se i drugima iz grupe.",
        "Hoćeš li donijeti i rukavice?",
        "Imamo sve potrebno opremu.",
        "Pridružio nam se i lokalni ekološki klub.",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const replyMsg: Message = {
        id: messages.length + 2,
        text: randomReply,
        sender: "them",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "text",
        read: false,
      };

      setMessages((prev) => [...prev, replyMsg]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = () => {
    const imageMsg: Message = {
      id: messages.length + 1,
      text: "Slika ekološke aktivnosti",
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "image",
      imageUrl:
        "https://images.unsplash.com/photo-1575408264798-b50b252663e6?w=400",
      read: false,
    };

    setMessages([...messages, imageMsg]);
  };

  const handleBack = () => {
    navigateTo("friends");
  };

  return (
    <div className="chat-screen">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <button onClick={handleBack} className="chat-back-button">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="chat-user-info">
            <div className="chat-avatar">
              {chatUser.avatar}
              {chatUser.status === "online" && (
                <div className="chat-status online"></div>
              )}
            </div>
            <div className="chat-user-details">
              <h2 className="chat-user-name">{chatUser.name}</h2>
              <p className="chat-user-status">
                {chatUser.isGroup ? (
                  <>
                    <Users className="w-3 h-3" /> {chatUser.members} članova •
                    Online
                  </>
                ) : (
                  <>Online • Eco aktivist</>
                )}
              </p>
            </div>
          </div>

          <div className="chat-header-actions">
            <button className="chat-action-button">
              <Phone className="w-5 h-5" />
            </button>
            <button className="chat-action-button">
              <Video className="w-5 h-5" />
            </button>
            <button className="chat-action-button">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        <div className="date-separator">
          <span>Danas</span>
        </div>

        <div className="messages-list">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`message-wrapper ${message.sender}`}
            >
              {message.type === "system" ? (
                <div className="system-message">
                  <span>{message.text}</span>
                  <span className="message-time">{message.time}</span>
                </div>
              ) : message.type === "image" ? (
                <div className="message-image-container">
                  <img
                    src={message.imageUrl}
                    alt="Chat"
                    className="message-image"
                  />
                  <div className="message-meta">
                    <span className="message-time">{message.time}</span>
                    {message.sender === "me" && (
                      <div
                        className={`message-status ${
                          message.read ? "read" : "sent"
                        }`}
                      >
                        {message.read ? "✓✓" : "✓"}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="message-bubble">
                  <p className="message-text">{message.text}</p>
                  <div className="message-meta">
                    <span className="message-time">{message.time}</span>
                    {message.sender === "me" && (
                      <div
                        className={`message-status ${
                          message.read ? "read" : "sent"
                        }`}
                      >
                        {message.read ? "✓✓" : "✓"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <div className="message-input-wrapper">
          <button className="input-action-button">
            <Paperclip className="w-5 h-5" />
          </button>

          <button className="input-action-button" onClick={handleImageUpload}>
            <Camera className="w-5 h-5" />
          </button>

          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Napišite poruku..."
              className="message-text-input"
            />
            <button className="emoji-button">
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`send-button ${newMessage.trim() ? "active" : ""}`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
