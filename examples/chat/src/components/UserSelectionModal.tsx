import { createQueryBuilder } from '@taylordb/query-builder';
import { useEffect, useState } from 'react';
import { TableRaws, TaylorDatabase } from '../taylor.types';

type RootQueryBuilder = ReturnType<typeof createQueryBuilder<TaylorDatabase>>;

type User = TableRaws<'users'>;
type UserSelectionModalProps = {
  qb: RootQueryBuilder;
  onUserSelect: (user: User) => void;
};

export const UserSelectionModal = ({
  qb,
  onUserSelect,
}: UserSelectionModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = qb
      .selectFrom('users')
      .select(['id', 'name'])
      .with({ avatar: qb => qb.select(['url']) })
      .subscribe(users => {
        setUsers(users as User[]);
      });

    return () => {
      (subscription as any)?.unsubscribe?.();
    };
  }, [qb]);

  const handleCreateUser = async () => {
    if (!newUserName || !avatarFile) {
      setError('Please provide a name and an avatar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const attachments = await qb.uploadAttachments([
        { file: avatarFile, name: avatarFile.name },
      ]);

      if (attachments.length > 0) {
        const newUser = await qb
          .insertInto('users')
          .values({
            name: newUserName,
            username: newUserName,
            avatar: attachments, // Convert attachments to column values
          })
          .executeTakeFirst();

        if (newUser) {
          onUserSelect(newUser as User);
        }
      }
    } catch (err) {
      setError('Failed to create user. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {isCreatingUser ? (
          <>
            <h2>Create a New User</h2>
            <div className="form-group">
              <label htmlFor="userName">Name</label>
              <input
                id="userName"
                type="text"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="avatar">Avatar</label>
              <input id="avatar" type="file" onChange={handleFileChange} />
            </div>
            {error && <p className="error-message">{error}</p>}
            <div className="modal-actions">
              <button
                onClick={handleCreateUser}
                disabled={isLoading || !newUserName || !avatarFile}
              >
                {isLoading ? 'Creating...' : 'Create User'}
              </button>
              <button
                onClick={() => setIsCreatingUser(false)}
                className="secondary"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Select a User</h2>
            <ul className="user-list">
              {users.map(user => (
                <li key={user.id} onClick={() => onUserSelect(user)}>
                  <img
                    src={
                      (user.avatar as any)?.[0]?.url
                        ? `https://media.taylordb.ai/${(user.avatar as any)[0].url}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.name!,
                          )}&background=random`
                    }
                    alt={user.name!}
                    className="avatar"
                  />
                  {user.name}
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button onClick={() => setIsCreatingUser(true)}>
                Create New User
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
