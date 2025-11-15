import { createQueryBuilder } from '@taylordb/query-builder';
import React, { useEffect, useRef, useState } from 'react';
import { TaylorDatabase } from '../taylor.types';

const PAGE_SIZE = 20;
const MAX_ACTIVE_PAGES = 4; // The "window" of active subscriptions

type RootQueryBuilder = ReturnType<typeof createQueryBuilder<TaylorDatabase>>;

type User = { id: number; name: string };
type Chat = { id: number; name: string };
type Message = {
  id: number;
  content: string;
  user: { id: number; name: string; avatar?: { url?: string }[] }[];
};

type ChatPanelProps = {
  qb: RootQueryBuilder;
  currentUser: User | null;
  currentChat: Chat | null;
};

export const ChatPanel = ({ qb, currentUser, currentChat }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageSubscriptions = useRef<Map<number, () => void>>(new Map());
  const currentPage = useRef(1);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number | null>(null);

  // Effect to handle chat changes
  useEffect(() => {
    if (!currentChat) {
      setMessages([]);
      return;
    }

    // Cleanup previous chat's subscriptions and reset state
    pageSubscriptions.current.forEach(unsub => unsub());
    pageSubscriptions.current.clear();
    setMessages([]);
    setHasMore(true);
    currentPage.current = 1;

    // Subscribe to the first, most recent page
    subscribeToPage(1, true);

    // Return cleanup for when the component unmounts
    return () => {
      pageSubscriptions.current.forEach(unsub => unsub());
    };
  }, [currentChat, qb]);

  // Effect for smart auto-scrolling and scroll preservation
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      if (prevScrollHeight.current === null) {
        // Initial load
        container.scrollTop = container.scrollHeight;
      } else {
        const isScrolledToBottom =
          container.scrollHeight - container.clientHeight <=
          prevScrollHeight.current + 150;

        if (isScrolledToBottom) {
          // If user was at the bottom, scroll to new bottom
          container.scrollTop = container.scrollHeight;
        } else {
          // If user was scrolled up, maintain their position
          container.scrollTop +=
            container.scrollHeight - prevScrollHeight.current;
        }
      }
      prevScrollHeight.current = container.scrollHeight;
    }
  }, [messages]);

  const subscribeToPage = (page: number, isInitialLoad = false) => {
    if (!currentChat) return;

    setIsLoading(true);

    const subscription = qb
      .selectFrom('messages')
      .select(['id', 'content'])
      .where('chats', 'hasAnyOf', [currentChat.id])
      .with({
        user: qb =>
          qb.select(['id', 'name']).with({ avatar: qb => qb.select(['url']) }),
      })
      .orderBy('createdAt', 'desc')
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
      .subscribe(pageMessages => {
        const newMessages = pageMessages as Message[];
        if (newMessages.length < PAGE_SIZE) {
          setHasMore(false);
        }

        const container = messagesContainerRef.current;
        const oldScrollHeight = container?.scrollHeight || 0;
        const oldScrollTop = container?.scrollTop || 0;

        setMessages(prev => {
          const messageMap = new Map(prev.map(m => [m.id, m]));
          newMessages.forEach(m => messageMap.set(m.id, m));
          return Array.from(messageMap.values()).sort((a, b) => a.id - b.id);
        });

        // Use a timeout to allow the DOM to update before adjusting scroll
        setTimeout(() => {
          if (container) {
            if (isInitialLoad) {
              // On initial load, scroll to the bottom
              container.scrollTop = container.scrollHeight;
              prevScrollHeight.current = container.scrollHeight;
            } else {
              // After loading more, preserve the scroll position
              container.scrollTop =
                oldScrollTop + (container.scrollHeight - oldScrollHeight);
              // We don't update prevScrollHeight here to not interfere with the other useEffect
            }
          }
        }, 0);

        setIsLoading(false);
      });

    // Manage subscription window
    if (pageSubscriptions.current.size >= MAX_ACTIVE_PAGES) {
      const oldestPage = Math.min(
        ...Array.from(pageSubscriptions.current.keys()),
      );
      pageSubscriptions.current.get(oldestPage)?.();
      pageSubscriptions.current.delete(oldestPage);
    }
    pageSubscriptions.current.set(page, () =>
      subscription.then(response => response.unsubscribe()),
    );
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container?.scrollTop === 0 && hasMore && !isLoading) {
      const nextPage = currentPage.current + 1;
      currentPage.current = nextPage;
      subscribeToPage(nextPage);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !currentChat) {
      return;
    }

    try {
      await qb
        .insertInto('messages')
        .values({
          content: newMessage,
          user: [currentUser.id],
          chats: [currentChat.id],
        })
        .execute();
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!currentChat || !currentUser) {
    return (
      <div className="chat-panel">
        <div className="chat-panel-placeholder">
          <h2>Select a chat to start messaging</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">{currentChat.name}</div>
      <div
        className="messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {isLoading && <div className="loading-spinner">Loading...</div>}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`message ${
              msg.user?.[0]?.id === currentUser.id
                ? 'current-user'
                : 'other-user'
            }`}
          >
            <img
              src={
                msg.user?.[0]?.avatar?.[0]?.url
                  ? `https://media.taylordb.ai/${msg.user[0].avatar[0].url}`
                  : 'default-avatar.png'
              }
              alt={msg.user?.[0]?.name ?? 'User'}
              className="avatar"
            />
            <div className="message-content">
              <div className="message-meta">
                {msg.user?.[0]?.name ?? 'User'}
              </div>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <form className="message-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};
