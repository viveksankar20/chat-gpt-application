'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const currentChatId = pathname.split('/')[1];

  const fetchChats = useCallback(async () => {
    try {
      const response = await fetch('/api/chats', {
        next: { revalidate: 30 }, // Cache for 30 seconds
        headers: {
          'Cache-Control': 'public, max-age=30',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      setChats(data.chats);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    // Set up periodic refresh
    const intervalId = setInterval(fetchChats, 30000); // Refresh every 30 seconds
    return () => clearInterval(intervalId);
  }, [fetchChats]);

  const handleChatSelect = useCallback((chatId) => {
    if (chatId === currentChatId) return; // Prevent unnecessary navigation
    router.push(`/${chatId}`);
  }, [router, currentChatId]);

  const handleNewChat = useCallback(async () => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create new chat');
      }
      
      const data = await response.json();
      router.push(`/${data.chat.id}`);
    } catch (err) {
      console.error('Error creating new chat:', err);
    }
  }, [router]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [chats]);

  if (isLoading) {
    return (
      <div style={{ 
        width: '250px', 
        height: '100vh', 
        borderRight: '1px solid #eee',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        Loading chats...
      </div>
    );
  }

  return (
    <div style={{ 
      width: '250px', 
      height: '100vh', 
      borderRight: '1px solid #eee',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <button
        onClick={handleNewChat}
        style={{
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'background-color 0.2s',
          ':hover': {
            backgroundColor: '#0056b3'
          }
        }}
      >
        New Chat
      </button>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {sortedChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleChatSelect(chat.id)}
            style={{
              padding: '10px',
              marginBottom: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: chat.id === currentChatId ? '#e9ecef' : '#f8f9fa',
              border: '1px solid #dee2e6',
              transition: 'background-color 0.2s',
              ':hover': {
                backgroundColor: '#e9ecef'
              }
            }}
          >
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {chat.title}
            </div>
            <div style={{ fontSize: '0.8em', color: '#6c757d' }}>
              {new Date(chat.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 