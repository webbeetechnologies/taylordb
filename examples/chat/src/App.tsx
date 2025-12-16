import { createQueryBuilder } from '@taylordb/query-builder';
import { useState } from 'react';
import { ChatList } from './components/ChatList';
import { ChatPanel } from './components/ChatPanel';
import { CreateChatModal } from './components/CreateChatModal';
import { UserSelectionModal } from './components/UserSelectionModal';
import {
  AttachmentColumnValue,
  TableRaws,
  TaylorDatabase,
} from './taylor.types';

type User = {
  id: number;
  name: string;
  avatar?: AttachmentColumnValue[];
};

const qb = createQueryBuilder<TaylorDatabase>({
  baseUrl: 'http://localhost:8090',
  baseId: '2afc6865-e139-42b1-bf63-5b783bb4736d',
  apiKey: 'f18pcwq2lrifc54wmxsegel1zwravswom9j0nxqe2rys1jpsvtc9ut8bh39i8hmc',
});

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentChat, setCurrentChat] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isCreateChatModalOpen, setCreateChatModalOpen] = useState(false);

  const handleChatDeleted = (deletedChatId: number) => {
    if (currentChat?.id === deletedChatId) {
      setCurrentChat(null);
    }
  };

  if (!currentUser) {
    return (
      <UserSelectionModal
        qb={qb}
        onUserSelect={user => setCurrentUser(user as User)}
      />
    );
  }

  return (
    <div className={`app-container ${currentChat ? 'chat-active' : ''}`}>
      {isCreateChatModalOpen && (
        <CreateChatModal
          qb={qb}
          currentUser={currentUser as TableRaws<'users'>}
          onClose={() => setCreateChatModalOpen(false)}
          onChatCreated={(chat: { id: number; name: string }) => {
            setCurrentChat(chat);
            setCreateChatModalOpen(false);
          }}
        />
      )}
      <ChatList
        qb={qb}
        currentUser={currentUser}
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        onCreateChat={() => setCreateChatModalOpen(true)}
        onChatDeleted={handleChatDeleted}
      />
      <ChatPanel
        qb={qb}
        currentUser={currentUser}
        currentChat={currentChat}
        onBack={() => setCurrentChat(null)}
      />
    </div>
  );
}

export default App;
