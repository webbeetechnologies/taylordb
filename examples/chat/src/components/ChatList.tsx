import {
  DocumentIcon,
  MicrophoneIcon,
  PencilSquareIcon,
  PhotoIcon,
  TrashIcon,
  UsersIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid';
import { createQueryBuilder } from '@taylordb/query-builder';
import { orderBy } from 'lodash';
import { useEffect, useState } from 'react';
import { AttachmentColumnValue, TaylorDatabase } from '../taylor.types';

type RootQueryBuilder = ReturnType<typeof createQueryBuilder<TaylorDatabase>>;

type User = {
  id: number;
  name: string;
  avatar?: AttachmentColumnValue[];
};

type ChatListItem = {
  id: number;
  name: string;
  lastMessage: React.ReactNode;
  timestamp: string;
  hasUnread: boolean;
  avatarUrl: string;
  online?: boolean;
  isGroup: boolean;
};

type ChatListProps = {
  qb: RootQueryBuilder;
  currentUser: User | null;
  currentChat: { id: number; name: string } | null;
  setCurrentChat: (chat: { id: number; name: string }) => void;
  onCreateChat: () => void;
  onChatDeleted: (chatId: number) => void;
};

const formatTimestamp = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
  const diffInDays = diffInSeconds / (60 * 60 * 24);

  if (diffInDays < 1 && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffInDays < 2 && now.getDate() - 1 === date.getDate()) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString();
};

const renderLastMessage = (
  message?: {
    content?: string | null;
    type?: { name?: string | null }[] | null;
  } | null,
) => {
  if (!message) {
    return 'No messages yet';
  }

  const messageType = message.type?.[0]?.name;

  switch (messageType) {
    case 'image':
      return (
        <span className="last-message-icon">
          <PhotoIcon /> Image
        </span>
      );
    case 'video':
      return (
        <span className="last-message-icon">
          <VideoCameraIcon /> Video
        </span>
      );
    case 'audio':
      return (
        <span className="last-message-icon">
          <MicrophoneIcon /> Voice message
        </span>
      );
    case 'file':
      return (
        <span className="last-message-icon">
          <DocumentIcon /> File
        </span>
      );
    case 'text':
    default:
      return message.content;
  }
};

export const ChatList = ({
  qb,
  currentUser,
  currentChat,
  setCurrentChat,
  onCreateChat,
  onChatDeleted,
}: ChatListProps) => {
  const [chats, setChats] = useState<ChatListItem[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    qb.selectFrom('chats')
      .count()
      .then(r => {
        console.log(r);
      });

    const subscription = qb
      .selectFrom('chats')
      .where('participants', 'hasAnyOf', [currentUser.id])
      .where('messages', 'isNotEmpty')
      .select(['id', 'name', 'updatedAt', 'type'])
      .with({
        messages: qb =>
          qb
            .select(['content', 'createdAt', 'id', 'type'])
            .orderBy('createdAt', 'desc')
            .limit(1)
            .with({
              sender: qb => qb.select(['id']),
            }),
        participants: qb =>
          qb.select(['name', 'id']).with({
            avatar: qb => qb.selectAll(),
          }),
        activities: qb =>
          qb
            .where('user', 'hasAnyOf', [currentUser.id])
            .with({ lastSeenMessage: qb => qb.select(['id']) }),
      })
      .subscribe(async (chatsData: any[]) => {
        const sortedChats = orderBy(
          chatsData,
          chat => {
            return chat.messages?.[0]?.id;
          },
          'desc',
        );

        const formattedChats = sortedChats.map(chat => {
          const lastMessage = chat.messages?.[0];
          const participants = chat.participants as any[];
          const isGroup = chat.type?.[0]?.name === 'group';

          const otherParticipant = participants?.find(
            p => p.id !== currentUser.id,
          );
          const chatName = isGroup
            ? chat.name
            : otherParticipant?.name || 'Chat';

          const avatar = otherParticipant?.avatar as
            | { url: string }[]
            | undefined;

          const unreadStatus =
            chat.activities?.[0]?.lastSeenMessage?.[0]?.id < lastMessage?.id &&
            lastMessage.sender?.[0]?.id !== currentUser.id;

          return {
            id: chat.id!,
            name: chatName,
            lastMessage: renderLastMessage(lastMessage),
            timestamp: formatTimestamp(
              lastMessage?.createdAt || chat.updatedAt || '',
            ),
            hasUnread: unreadStatus || false,
            avatarUrl: isGroup
              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  chatName,
                )}&background=3b82f6&color=fff&rounded=true&size=128`
              : avatar?.[0]?.url
                ? `https://media.taylordb.ai/${avatar[0].url}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    chatName,
                  )}&background=random`,
            online: false, // Placeholder for online status logic
            isGroup,
          };
        });

        setChats(formattedChats);
      });

    return () => {
      subscription.then(res => res.unsubscribe());
    };
  }, [qb, currentUser]);

  const handleDeleteChat = async (e: React.MouseEvent, chatId: number) => {
    e.stopPropagation(); // Prevent chat selection when clicking delete
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await qb.deleteFrom('chats').where('id', '=', chatId).execute();
        onChatDeleted(chatId);
      } catch (error) {
        console.error('Failed to delete chat:', error);
      }
    }
  };

  const groupChats = chats.filter(c => c.isGroup);
  const privateChats = chats.filter(c => !c.isGroup);

  return (
    <div className="chat-list">
      <ChatListHeader user={currentUser!} onCreateChat={onCreateChat} />
      <div className="search-bar">
        <input type="text" placeholder="Search chats or neighbors" />
      </div>
      <div className="chat-list-items">
        {groupChats.length > 0 && (
          <div className="chat-list-section">
            <h2>Groups</h2>
            <ul>
              {groupChats.map(chat => (
                <li
                  key={chat.id}
                  className={currentChat?.id === chat.id ? 'active' : ''}
                  onClick={() => setCurrentChat(chat)}
                >
                  <div className="avatar-container">
                    <div className="group-avatar">
                      <UsersIcon />
                    </div>
                  </div>
                  <div className="chat-details">
                    <div className="chat-name">{chat.name}</div>
                    <div className="last-message">{chat.lastMessage}</div>
                  </div>
                  <div className="chat-meta">
                    <div className="timestamp">{chat.timestamp}</div>
                    {chat.hasUnread && <div className="unread-dot" />}
                  </div>
                  <button
                    className="delete-chat-btn"
                    onClick={e => handleDeleteChat(e, chat.id)}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {privateChats.length > 0 && (
          <div className="chat-list-section">
            <h2>Chats</h2>
            <ul>
              {privateChats.map(chat => (
                <li
                  key={chat.id}
                  className={currentChat?.id === chat.id ? 'active' : ''}
                  onClick={() => setCurrentChat(chat)}
                >
                  <div className="avatar-container">
                    <img
                      src={chat.avatarUrl}
                      alt={chat.name}
                      className="avatar"
                    />
                    {chat.online && <div className="online-indicator" />}
                  </div>
                  <div className="chat-details">
                    <div className="chat-name">{chat.name}</div>
                    <div className="last-message">{chat.lastMessage}</div>
                  </div>
                  <div className="chat-meta">
                    <div className="timestamp">{chat.timestamp}</div>
                    {chat.hasUnread && <div className="unread-dot" />}
                  </div>
                  <button
                    className="delete-chat-btn"
                    onClick={e => handleDeleteChat(e, chat.id)}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatListHeader = ({
  user,
  onCreateChat,
}: {
  user: User;
  onCreateChat: () => void;
}) => {
  return (
    <div className="chat-list-header">
      <div className="header-left">
        <img
          src={
            user.avatar?.[0]?.url
              ? `https://media.taylordb.ai/${user.avatar[0].url}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name,
                )}&background=random`
          }
          alt={user.name}
          className="avatar header-avatar"
        />
        <h1>Chats</h1>
      </div>
      <button className="new-chat-btn" onClick={onCreateChat}>
        <PencilSquareIcon className="icon" />
      </button>
    </div>
  );
};
