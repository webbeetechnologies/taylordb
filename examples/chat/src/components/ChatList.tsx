import { createQueryBuilder } from '@taylordb/query-builder';
import { useEffect, useState } from 'react';
import { TableRaws, TaylorDatabase } from '../taylor.types';

type RootQueryBuilder = ReturnType<typeof createQueryBuilder<TaylorDatabase>>;

type Chat = Pick<TableRaws<'chats'>, 'id' | 'name'>;

type ChatListProps = {
  qb: RootQueryBuilder;
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat) => void;
};

export const ChatList = ({
  qb,
  currentChat,
  setCurrentChat,
}: ChatListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const subscription = qb
      .selectFrom('chats')
      .select(['id', 'name'])
      .subscribe(chats => {
        setChats(chats.map(chat => ({ id: chat.id!, name: chat.name! })));
      });

    return () => {
      subscription.then(response => response.unsubscribe());
    };
  }, [qb]);

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <input type="text" placeholder="Search" />
      </div>
      <div className="chat-list-items">
        <ul>
          {chats.map(chat => (
            <li
              key={chat.id}
              className={currentChat?.id === chat.id ? 'active' : ''}
              onClick={() => setCurrentChat(chat)}
            >
              {chat.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
