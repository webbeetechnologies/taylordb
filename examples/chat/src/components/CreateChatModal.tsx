import { createQueryBuilder } from '@taylordb/query-builder';
import { useEffect, useState } from 'react';
import { TableRaws, TaylorDatabase } from '../taylor.types';

type RootQueryBuilder = ReturnType<typeof createQueryBuilder<TaylorDatabase>>;
type User = TableRaws<'users'>;

type CreateChatModalProps = {
  qb: RootQueryBuilder;
  currentUser: User;
  onClose: () => void;
  onChatCreated: (chat: { id: number; name: string }) => void;
};

export const CreateChatModal = ({
  qb,
  currentUser,
  onClose,
  onChatCreated,
}: CreateChatModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [chatName, setChatName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.id == null) return;
    qb.selectFrom('users')
      .select(['id', 'name'])
      .with({
        avatar: qb => qb.selectAll(),
      })
      .where('id', '!=', currentUser.id)
      .execute()
      .then(users => setUsers(users as User[]));
  }, [qb, currentUser.id]);

  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0 || currentUser?.id == null) {
      setError('Please select at least one participant.');
      return;
    }
    setError(null);

    try {
      const participants = [currentUser.id, ...selectedUsers];
      const isGroupChat = participants.length > 2;

      // Use user names for the default chat name if not provided
      const finalChatName =
        chatName.trim() ||
        users
          .filter(u => selectedUsers.includes(u.id!))
          .map(u => u.name)
          .join(', ');

      const newChat = await qb
        .insertInto('chats')
        .values({
          name: finalChatName,
          participants,
          type: [isGroupChat ? 2 : 1], // 7 for Group, 6 for Private
        })
        .executeTakeFirst();

      if (newChat) {
        onChatCreated({ id: newChat.id!, name: newChat.name! });
      }
    } catch (err) {
      console.error('Failed to create chat:', err);
      setError("Couldn't create the chat. Please try again.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create Chat</h2>
        <div className="form-group">
          <label htmlFor="chatName">Chat Name (optional)</label>
          <input
            id="chatName"
            type="text"
            value={chatName}
            onChange={e => setChatName(e.target.value)}
            placeholder="Enter a name for your chat"
          />
        </div>
        <h3>Select Participants</h3>
        <ul className="user-list create-chat-user-list">
          {users.map(user => (
            <li
              key={user.id}
              onClick={() => handleUserToggle(user.id!)}
              className={selectedUsers.includes(user.id!) ? 'selected' : ''}
            >
              <img
                src={
                  (user.avatar as any)?.[0]?.url
                    ? `https://media.taylordb.ai/${(user.avatar as any)[0].url}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name!)}&background=random`
                }
                alt={user.name!}
                className="avatar"
              />
              {user.name}
            </li>
          ))}
        </ul>
        {error && <p className="error-message">{error}</p>}
        <div className="modal-actions">
          <button
            onClick={handleCreateChat}
            disabled={selectedUsers.length === 0}
          >
            Create
          </button>
          <button onClick={onClose} className="secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
