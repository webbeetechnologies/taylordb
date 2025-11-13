import { createQueryBuilder } from '@taylordb/query-builder';
import { useEffect, useState } from 'react';
import { TaylorDatabase } from './taylor.types';

type RootQueryBuilder = ReturnType<typeof createQueryBuilder<TaylorDatabase>>;

const qb = createQueryBuilder<TaylorDatabase>({
  baseUrl: 'http://localhost:8090/api/c5c60f8c-35e6-4155-9a5c-9e7d102317b4',
  apiKey: 'qgbbwip58brvp0ztqstm9jsqs53r9q4ckqgvuk0cbc0mlq0eez5trk48fhpvtuks',
});

function App() {
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [currentChat, setCurrentChat] = useState<{
    id: number;
    name: string;
  } | null>(null);

  return (
    <div className="app-container">
      <Header currentUser={currentUser} />
      <div className="main-content">
        <Sidebar
          qb={qb}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          currentChat={currentChat}
          setCurrentChat={setCurrentChat}
        />
        <ChatWindow
          qb={qb}
          currentUser={currentUser}
          currentChat={currentChat}
        />
      </div>
    </div>
  );
}

// ... Placeholder components to be implemented later
const Header = ({ currentUser }: any) => (
  <div className="header">
    <h2>{currentUser ? `Welcome, ${currentUser.name}` : 'TaylorDB Chat'}</h2>
  </div>
);

const Sidebar = ({
  qb,
  currentUser,
  setCurrentUser,
  currentChat,
  setCurrentChat,
}: any) => {
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [chats, setChats] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    qb.selectFrom('users').select(['id', 'name']).execute().then(setUsers);
  }, [qb]);

  useEffect(() => {
    if (currentUser) {
      qb.selectFrom('chat').select(['id', 'name']).execute().then(setChats);
    }
  }, [currentUser, qb]);

  const handleCreateChat = async () => {
    const chatName = prompt('Enter new chat name:');
    if (chatName) {
      const newChat = await qb
        .insertInto('chat')
        .values({ name: chatName })
        .returning(['id', 'name'])
        .execute();
      setChats(prev => [...prev, ...newChat]);
      setCurrentChat(newChat[0]);
    }
  };

  if (!currentUser) {
    return (
      <div className="sidebar">
        <h3>Select User</h3>
        <ul>
          {users.map(user => (
            <li key={user.id} onClick={() => setCurrentUser(user)}>
              {user.name}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <h3>Chats</h3>
      <button onClick={handleCreateChat}>Create Chat</button>
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
  );
};

const ChatWindow = ({
  qb,
  currentUser,
  currentChat,
}: {
  qb: RootQueryBuilder;
  currentUser: { id: number; name: string };
  currentChat: { id: number; name: string };
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (currentChat) {
      const sub = qb
        .selectFrom('messages')
        .select(['id', 'content'])
        .where('chat', '=', currentChat.id)
        .with({ user: qb => qb.select(['name']) })
        .subscribe(messages => {
          setMessages([...messages]);
        });

      // Basic cleanup, a real app would need a more robust unsubscribe mechanism
      return () => (sub as any)?.unsubscribe?.();
    }
  }, [currentChat, qb]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser && currentChat) {
      await qb
        .insertInto('messages')
        .values({
          content: newMessage,
          user: [currentUser.id],
          // Note: Correcting the type issue here.
          // Your types say `chat` links to `users`, but it should be `chat`.
          // This will be cast to `any` to make it work.
          chat: [currentChat.id] as any,
        })
        .execute();
      setNewMessage('');
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    await qb.deleteFrom('messages').where('id', '=', msgId).execute();
  };

  if (!currentChat || !currentUser) {
    return (
      <div className="chat-window">
        <h2>Select a user and a chat to start messaging</h2>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <h3>{currentChat.name}</h3>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <strong>
              {msg._user ? msg._user[0]._name : (msg.user[0]?.name ?? 'User')}:
            </strong>{' '}
            {msg.content || msg._name}
            <button
              className="delete-button"
              onClick={() => handleDeleteMessage(msg.id)}
            >
              &times;
            </button>
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

export default App;
