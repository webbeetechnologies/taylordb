import {
  ChevronLeftIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
} from '@heroicons/react/24/solid';
import { createQueryBuilder } from '@taylordb/query-builder';
import { Send, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useVoiceVisualizer, VoiceVisualizer } from 'react-voice-visualizer';
import { FilePreview } from 'reactjs-file-preview';
import {
  AttachmentColumnValue,
  TableRaws,
  TaylorDatabase,
} from '../taylor.types';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

type RootQueryBuilder = ReturnType<typeof createQueryBuilder<TaylorDatabase>>;

type User = { id: number; name: string };
type Chat = { id: number; name: string };
type Message = TableRaws<'messages'> & {
  sender: (TableRaws<'users'> & { avatar: AttachmentColumnValue[] })[];
  attachments?: AttachmentColumnValue[];
  voice?: AttachmentColumnValue[];
  type?: { name: string }[];
};

type ChatPanelProps = {
  qb: RootQueryBuilder;
  currentUser: User | null;
  currentChat: Chat | null;
  onBack: () => void;
};

export const ChatPanel = ({
  qb,
  currentUser,
  currentChat,
  onBack,
}: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const recorderControls = useVoiceVisualizer();
  const { recordedBlob, startRecording, stopRecording, clearCanvas, error } =
    recorderControls;

  useEffect(() => {
    if (error) {
      console.error('Voice visualizer error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (recordedBlob) {
      const sendVoiceMessage = async () => {
        if (currentUser && currentChat) {
          setIsUploading(true);
          try {
            const attachments = await qb.uploadAttachments([
              {
                file: recordedBlob,
                name: `voice-message-${Date.now()}.webm`,
              },
            ]);
            if (attachments.length > 0) {
              await qb
                .insertInto('messages')
                .values({
                  content: '',
                  sender: [currentUser.id],
                  chats: [currentChat.id],
                  voice: attachments,
                  type: [5], // NOTE: Hardcoded ID for 'audio' type
                })
                .execute();
            }
          } catch (error) {
            console.error('Failed to upload voice message:', error);
          } finally {
            setIsUploading(false);
          }
        }
      };
      sendVoiceMessage();
      clearCanvas();
    }
  }, [recordedBlob, qb, currentUser, currentChat, clearCanvas]);

  useEffect(() => {
    if (!currentChat || !currentUser) return;

    const markAsRead = async () => {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return;

      const activity = await qb
        .selectFrom('activities')
        .where('user', 'hasAnyOf', [currentUser.id])
        .where('chat', 'hasAnyOf', [currentChat.id])
        .select(['id'])
        .executeTakeFirst();

      if (activity) {
        // Update existing activity
        await qb
          .update('activities')
          .set({ lastSeenMessage: [lastMessage.id!] })
          .where('id', '=', activity.id!)
          .execute();
      } else {
        // Create new activity
        await qb
          .insertInto('activities')
          .values({
            user: [currentUser.id],
            chat: [currentChat.id],
            lastSeenMessage: [lastMessage.id!],
          })
          .execute();
      }
    };

    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, currentChat, currentUser, qb]);

  useEffect(() => {
    if (!currentChat) return;

    const subscription = qb
      .selectFrom('messages')
      .select(['id', 'content', 'createdAt'])
      .where('chats', 'hasAnyOf', [currentChat.id])
      .with({
        sender: qb => qb.select(['id', 'name', 'avatar' as any]),
        attachments: qb => qb.select(['url', 'name', 'fileType', 'size']),
        voice: qb => qb.select(['url', 'name', 'fileType', 'size']),
        type: qb => qb.select(['name']),
      })
      .orderBy('createdAt', 'asc')
      .subscribe(messagesData => {
        setMessages([...messagesData] as any[]);
      });

    return () => {
      subscription.then(res => res.unsubscribe());
    };
  }, [currentChat, qb]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !currentChat) return;

    await qb
      .insertInto('messages')
      .values({
        content: newMessage,
        sender: [currentUser.id],
        chats: [currentChat.id],
        type: [1], // NOTE: Hardcoded ID for 'text' type
      })
      .execute();

    setNewMessage('');
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser && currentChat) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        // NOTE: Hardcoded IDs for message types
        let messageTypeId = 4; // default to 'file'
        if (file.type.startsWith('image/')) {
          messageTypeId = 2; // 'image'
        } else if (file.type.startsWith('video/')) {
          messageTypeId = 3; // 'video'
        }

        const attachments = await qb.uploadAttachments([
          { file, name: file.name },
        ]);
        if (attachments.length > 0) {
          await qb
            .insertInto('messages')
            .values({
              content: '',
              sender: [currentUser.id],
              chats: [currentChat.id],
              attachments: attachments,
              type: [messageTypeId],
            })
            .execute();
        }
      } catch (error) {
        console.error('Failed to upload attachment:', error);
      } finally {
        setIsUploading(false);
      }
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
      <div className="chat-panel-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeftIcon />
        </button>
        {currentChat.name}
      </div>
      <div className="messages">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`message ${
              msg.sender?.[0]?.id === currentUser.id
                ? 'current-user'
                : 'other-user'
            }`}
          >
            <img
              src={
                msg.sender?.[0]?.avatar?.[0]?.url
                  ? `https://media.taylordb.ai/${msg.sender[0].avatar[0].url}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      msg.sender?.[0]?.name || 'U',
                    )}&background=random`
              }
              alt={msg.sender?.[0]?.name || 'User'}
              className="avatar"
            />
            <div className="message-content">
              <div className="message-meta">{msg.sender?.[0]?.name}</div>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="attachments-container">
                  {msg.attachments.map((att: AttachmentColumnValue) => (
                    <div className="file-preview-wrapper" key={att.url}>
                      <FilePreview
                        preview={`https://media.taylordb.ai/${att.url}`}
                      />
                    </div>
                  ))}
                </div>
              )}
              {msg.voice && msg.voice.length > 0 && (
                <div className="voice-message-container">
                  <VoiceMessagePlayer
                    audioUrl={`https://media.taylordb.ai/${msg.voice[0].url}`}
                  />
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="message-form" onSubmit={handleSendMessage}>
        {isUploading ? (
          <div className="loader">Uploading...</div>
        ) : showVoiceRecorder ? (
          <div className="recording-controls">
            <button
              type="button"
              onClick={() => {
                stopRecording();
                clearCanvas();
                setShowVoiceRecorder(false);
              }}
              className="icon-btn"
            >
              <Trash2 className="w-6 h-6" />
            </button>
            <div className="visualizer-recording-wrapper">
              <VoiceVisualizer
                controls={recorderControls}
                isControlPanelShown={false}
                mainBarColor="#137fec"
                secondaryBarColor="#a0aec0"
                height={50}
                barWidth={5}
                gap={2}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                stopRecording();
                setShowVoiceRecorder(false);
              }}
              className="icon-btn send-btn recording-send-btn"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={handleAttachmentClick}
            >
              <PaperClipIcon />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setShowVoiceRecorder(true);
                startRecording();
              }}
            >
              <MicrophoneIcon />
            </button>
            <button type="submit" className="icon-btn send-btn">
              <PaperAirplaneIcon />
            </button>
          </>
        )}
      </form>
    </div>
  );
};
