import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge, Button, Empty, Input, Popconfirm, Spin, Tag, Tooltip } from 'antd';
import type { InputRef } from 'antd';
import toast from 'react-hot-toast';
import { SendOutlined, UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  getConversations,
  getMessages,
  assignConversation,
  closeConversation,
  type ChatConversation,
  type ChatMessage,
} from '@/lib/actions/chat';
import { connectSocket, getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts';

// ─── Conversation List Item ───────────────────────────────

function ConvItem({
  conv,
  active,
  onClick,
}: {
  conv: ChatConversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        active ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <UserOutlined className="text-orange-600 text-sm" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 text-sm truncate">
              {conv.student?.fullname || conv.student?.email || 'Student'}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {conv.student?.email}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {conv.manager_unread > 0 && (
            <Badge count={conv.manager_unread} size="small" color="orange" />
          )}
          {conv.last_message_at && (
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
            </span>
          )}
          {!conv.staff && (
            <Tag color="blue" className="text-xs m-0">New</Tag>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Message Bubble ───────────────────────────────────────

function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
          isMe
            ? 'bg-orange-500 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
      >
        <p className="break-words">{msg.message_text}</p>
        <div className={`text-xs mt-1 ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>
          {formatDistanceToNow(new Date(msg.sent_at), { addSuffix: true })}
          {isMe && msg.is_read && <CheckOutlined className="ml-1" />}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export default function ManagerChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'all'>('open');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<InputRef>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;
  // isAssigned: conversation has been picked up by someone
  const isAssigned = !!activeConv?.staff;
  // isMyConv: assigned specifically to the current manager
  const isMyConv = isAssigned && activeConv?.staff?.id === user?.id;

  // Refs to avoid stale closures inside socket event handlers
  const activeConvIdRef = useRef<string | null>(null);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  // statusFilterRef keeps the latest filter value accessible inside socket handlers
  // without needing to re-register listeners on every filter change
  const statusFilterRef = useRef(statusFilter);
  useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);

  // ─── Load conversations ──────────────────────────────────

  const loadConversations = useCallback(async (status = statusFilter) => {
    try {
      setLoadingConvs(true);
      const res = await getConversations({ status, limit: 50 });
      setConversations(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConvs(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadConversations(statusFilter);
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load messages when conversation selected ────────────

  const loadMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMsgs(true);
      const res = await getMessages(convId, { limit: 100 });
      setMessages(res.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // ─── Socket setup ────────────────────────────────────────

  useEffect(() => {
    const socket = connectSocket();

    socket.on('new_message', ({ message, conversationId, manager_unread }) => {
      const isActive = conversationId === activeConvIdRef.current;
      if (isActive) {
        setMessages((prev) => [...prev, message]);
        setSending(false); // Server confirmed — message delivered
        // Manager is actively viewing — keep server unread counter in sync
        socket.emit('mark_read', { conversationId });
      }
      // Use 0 when active (manager is reading), server value otherwise
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, manager_unread: isActive ? 0 : manager_unread, last_message_at: message.sent_at }
            : c
        )
      );
    });

    socket.on('conversation_updated', ({ conversation: updatedConv, conversationId, manager_unread, last_message_at }) => {
      const isActive = conversationId === activeConvIdRef.current;
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        if (exists) {
          return prev.map((c) =>
            c.id === conversationId
              ? { ...c, manager_unread: isActive ? 0 : manager_unread, last_message_at }
              : c
          );
        }
        // New conversation not yet in the list — prepend if current filter includes open convs
        if (updatedConv && (statusFilterRef.current === 'open' || statusFilterRef.current === 'all')) {
          return [{ ...updatedConv, manager_unread: isActive ? 0 : manager_unread, last_message_at }, ...prev];
        }
        return prev;
      });
    });

    socket.on('conversation_read', ({ conversationId }) => {
      if (conversationId === activeConvId) {
        setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
      }
    });

    socket.on('error', ({ message }: { message: string }) => {
      toast.error(message || 'Failed to send message');
      setSending(false);
    });

    // Rejoin room after socket reconnects (e.g. network loss)
    socket.on('connect', () => {
      if (activeConvIdRef.current) {
        socket.emit('join_conversation', { conversationId: activeConvIdRef.current });
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('conversation_updated');
      socket.off('conversation_read');
      socket.off('error');
      socket.off('connect');
    };
  }, [activeConvId]);

  // ─── Select conversation ─────────────────────────────────

  const handleSelectConv = async (convId: string) => {
    // Leave previous room
    if (activeConvId) {
      getSocket()?.emit('leave_conversation', { conversationId: activeConvId });
    }

    setActiveConvId(convId);
    await loadMessages(convId);

    const socket = getSocket();
    socket?.emit('join_conversation', { conversationId: convId });

    // Reset unread badge locally
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, manager_unread: 0 } : c))
    );

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ─── Auto scroll to bottom ───────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send message ─────────────────────────────────────────

  const handleSend = () => {
    if (!text.trim() || !activeConvId || sending) return;
    const socket = getSocket();
    if (!socket?.connected) {
      toast.error('Connection lost. Please wait and try again.');
      return;
    }
    setSending(true);
    socket.emit('send_message', { conversationId: activeConvId, text: text.trim() });
    setText('');
    inputRef.current?.focus();
    // Reset sending after short delay — server will emit new_message or error
    setTimeout(() => setSending(false), 2000);
  };

  // ─── Assign self ─────────────────────────────────────────

  const handleAssign = async () => {
    if (!activeConvId) return;
    try {
      const updated = await assignConversation(activeConvId);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? updated : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Close conversation ───────────────────────────────────

  const handleClose = async () => {
    if (!activeConvId) return;
    try {
      await closeConversation(activeConvId);
      // Notify student in room that conversation is closed
      getSocket()?.emit('close_conversation', { conversationId: activeConvId });
      setConversations((prev) => prev.filter((c) => c.id !== activeConvId));
      setActiveConvId(null);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-80px)] flex bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ── Left: Conversation list ── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-orange-600" />
            <span className="font-semibold text-gray-900">Conversations</span>
          </div>
          <div className="flex gap-1">
            {(['open', 'closed', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-1 text-xs py-1 rounded-lg transition-colors capitalize ${
                  statusFilter === s
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-8">
              <Spin size="small" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No conversations</div>
          ) : (
            conversations.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeConvId}
                onClick={() => handleSelectConv(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right: Chat panel ── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">
                {activeConv.student?.fullname || activeConv.student?.email}
              </div>
              <div className="text-xs text-gray-400">{activeConv.student?.email}</div>
            </div>
            <div className="flex items-center gap-2">
              {!activeConv.staff && (
                <Tooltip title="Assign to myself">
                  <Button size="small" icon={<UserOutlined />} onClick={handleAssign}>
                    Pick up
                  </Button>
                </Tooltip>
              )}
              {activeConv.staff && (
                <Tag color="green" className="text-xs">
                  {activeConv.staff.fullname || activeConv.staff.email}
                </Tag>
              )}
              {isMyConv && (
                <Popconfirm
                  title="Close conversation?"
                  description="The student will be notified and can open a new one."
                  onConfirm={handleClose}
                  okText="Close"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Close conversation">
                    <Button size="small" danger icon={<CloseOutlined />} />
                  </Tooltip>
                </Popconfirm>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loadingMsgs ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare size={32} className="mb-2 opacity-30" />
                <span className="text-sm">No messages yet</span>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={msg.sender_type === 'staff'}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {activeConv.status !== 'open' ? (
            <div className="px-4 py-3 border-t border-gray-100 text-center text-sm text-gray-400">
              This conversation is closed
            </div>
          ) : !isAssigned ? (
            <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-center gap-3 bg-orange-50">
              <span className="text-sm text-gray-500">Pick up this conversation to start chatting</span>
              <Button type="primary" size="small" icon={<UserOutlined />} onClick={handleAssign}>
                Pick up
              </Button>
            </div>
          ) : !isMyConv ? (
            <div className="px-4 py-3 border-t border-gray-100 text-center text-sm text-gray-400">
              Handled by <span className="font-medium text-gray-600">{activeConv.staff?.fullname || activeConv.staff?.email}</span> — view only
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <Input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPressEnter={handleSend}
                placeholder="Type a message..."
                className="flex-1"
                maxLength={1000}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={sending}
                disabled={!text.trim()}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Select a conversation to start chatting"
          />
        </div>
      )}
    </div>
  );
}
