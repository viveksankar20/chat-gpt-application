'use client';

import React, { useState, useEffect, useRef } from 'react';

// Helper function to generate a simple unique ID for sessionId if not in localStorage
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Effect for Session ID management
  useEffect(() => {
    let storedSessionId = localStorage.getItem('chatSessionId');
    if (!storedSessionId) {
      storedSessionId = generateSessionId();
      localStorage.setItem('chatSessionId', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  // Effect for fetching chat history when sessionId is available
  useEffect(() => {
    if (!sessionId) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      setError(null);
      try {
        const response = await fetch(`/api/chat/history?sessionId=${sessionId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch history: ${response.status}`);
        }
        const history = await response.json();
        // Ensure history messages are in the correct format
        const formattedHistory = history.map(msg => ({
            sender: msg.sender,
            text: msg.message, // API returns 'message', client uses 'text'
            timestamp: msg.timestamp
        }));
        setMessages(formattedHistory);
      } catch (err) {
        console.error("Error fetching chat history:", err);
        setError(err.message);
        // Optionally, clear messages or set to an error state
        // setMessages([]); 
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [sessionId]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newMessageText = inputValue.trim();
    if (!newMessageText || !sessionId) return;

    const userMessage = {
      sender: 'user',
      text: newMessageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessageText,
          sessionId: sessionId,
          // userId: 'optionalUserId' // Include if you have user authentication
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const aiResponse = await response.json(); // Expects { aiResponse: "text" }
      
      const aiMessage = {
        sender: 'ai',
        text: aiResponse.aiResponse, // API returns { aiResponse: "..." }
        timestamp: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message);
      // Optionally, add an error message to the chat or revert optimistic update
      const errorMessage = {
        sender: 'system', // Or 'ai' with an error flag
        text: `Error: ${err.message}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '90vh', maxWidth: '700px', margin: '0 auto', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
      <h1 style={{ textAlign: 'center', padding: '10px 0', borderBottom: '1px solid #eee', margin: 0 }}>Chat</h1>
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px 20px' }}>
        {isLoadingHistory && <p>Loading history...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!isLoadingHistory && messages.length === 0 && !error && <p>No messages yet. Start chatting!</p>}
        
        {messages.map((msg, index) => (
          <div key={index} style={{
            margin: '10px 0',
            padding: '8px 12px',
            borderRadius: '7px',
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.sender === 'user' ? '#007bff' : (msg.sender === 'ai' ? '#e9ecef' : '#f8d7da'),
            color: msg.sender === 'user' ? 'white' : 'black',
            textAlign: msg.sender === 'user' ? 'right' : 'left',
            marginLeft: msg.sender === 'user' ? 'auto' : '0',
            marginRight: msg.sender === 'ai' ? 'auto' : '0',
            maxWidth: '75%',
          }}>
            <strong>{msg.sender === 'user' ? 'You' : (msg.sender === 'ai' ? 'AI' : 'System')}: </strong>{msg.text}
            <div style={{ fontSize: '0.75em', color: msg.sender === 'user' ? '#f0f0f0' : '#555', marginTop: '3px' }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', padding: '10px', borderTop: '1px solid #eee' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          style={{ flexGrow: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ddd', marginRight: '10px' }}
          aria-label="Chat message input"
        />
        <button type="submit" style={{ padding: '10px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' }}>
          Send
        </button>
      </form>
    </div>
  );
}
