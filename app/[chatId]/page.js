'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import ChatList from '@/components/ChatList';

export default function ChatPage() {
  const params = useParams();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const response = await fetch(`/api/chats/${params.chatId}/messages`, {
        next: { revalidate: 10 }, // Cache for 10 seconds
        headers: {
          'Cache-Control': 'public, max-age=10',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch history: ${response.status}`);
      }
      const data = await response.json();
      setMessages(data.messages);
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setError(err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [params.chatId]);

  useEffect(() => {
    if (params.chatId) {
      fetchHistory();
    }
  }, [params.chatId, fetchHistory]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !params.chatId) return;

    const newMessage = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    try {
      const response = await fetch(`/api/chats/${params.chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
    }
  }, [inputValue, params.chatId]);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ChatList />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div 
          ref={chatContainerRef}
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '20px',
            scrollBehavior: 'smooth'
          }}
        >
          {isLoadingHistory ? (
            <div>Loading chat history...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>Error: {error}</div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id || index}
                style={{
                  marginBottom: '10px',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef',
                  color: msg.role === 'user' ? 'white' : 'black',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                  marginLeft: msg.role === 'user' ? 'auto' : '0',
                  marginRight: msg.role === 'assistant' ? 'auto' : '0',
                  maxWidth: '75%',
                  wordBreak: 'break-word',
                }}
              >
                <strong>{msg.role === 'user' ? 'You' : 'AI'}: </strong>
                {msg.content}
                <div style={{ fontSize: '0.75em', color: msg.role === 'user' ? '#f0f0f0' : '#555', marginTop: '3px' }}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '10px', borderTop: '1px solid #eee' }}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              marginRight: '10px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              ':hover': {
                backgroundColor: '#0056b3'
              }
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
} 