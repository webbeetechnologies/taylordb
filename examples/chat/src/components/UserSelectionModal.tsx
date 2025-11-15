import { createQueryBuilder } from '@taylordb/query-builder';
import { useEffect, useState } from 'react';
import { TaylorDatabase } from '../taylor.types';

type RootQueryBuilder = ReturnType<typeof createQueryBuilder<TaylorDatabase>>;

type User = { id: number; name: string; avatar?: { url?: string }[] };
type UserSelectionModalProps = {
  qb: RootQueryBuilder;
  onUserSelect: (user: User) => void;
};

export const UserSelectionModal = ({
  qb,
  onUserSelect,
}: UserSelectionModalProps) => {
  const [users, setUsers] = useState<User[]>([]);

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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Select a User</h2>
        <ul className="user-list">
          {users.map(user => (
            <li key={user.id} onClick={() => onUserSelect(user)}>
              <img
                src={
                  user.avatar?.[0]?.url
                    ? `https://media.taylordb.ai/${user.avatar[0].url}`
                    : 'default-avatar.png'
                }
                alt={user.name}
                className="avatar"
              />
              {user.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
