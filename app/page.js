'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const createNewChat = async () => {
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
    };

    createNewChat();
  }, [router]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      fontSize: '1.2rem',
      color: '#666'
    }}>
      Creating new chat...
    </div>
  );
} 