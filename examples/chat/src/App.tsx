import { createQueryBuilder } from '@taylordb/query-builder';
import { useState } from 'react';
import { ChatList } from './components/ChatList';
import { ChatPanel } from './components/ChatPanel';
import { UserSelectionModal } from './components/UserSelectionModal';
import { TaylorDatabase } from './taylor.types';

const qb = createQueryBuilder<TaylorDatabase>({
  baseUrl: 'http://localhost:8090/api/2afc6865-e139-42b1-bf63-5b783bb4736d',
  apiKey: 'cb0fz9hxt5yri1r8qrn1omfvrhgc4i2y67pq7abuk7kwcr7xrsx29bh480mivdtf',
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

  if (!currentUser) {
    return <UserSelectionModal qb={qb} onUserSelect={setCurrentUser} />;
  }

  return (
    <div className="app-container">
      <ChatList
        qb={qb}
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
      />
      <ChatPanel qb={qb} currentUser={currentUser} currentChat={currentChat} />
    </div>
  );
}

export default App;
