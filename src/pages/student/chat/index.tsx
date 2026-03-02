import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input, Spin, Popconfirm, Tag, Avatar, Badge } from 'antd';
import type { InputRef } from 'antd';
import { SendOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { MessageSquare, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getMyConversation,
  getMyConversations,
  closeMyConversation,
  getMessages,
  markAsRead,
  type ChatConversation,
  type ChatMessage,
} from '@/lib/actions/chat';
import { connectSocket, getSocket } from '@/lib/socket';

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
  const isOpen = conv.status === 'open';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        active ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar
              size={34}
              icon={<UserOutlined />}
              className={isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}
            />
            {isOpen && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {conv.staff?.fullname || (isOpen ? 'Waiting for agent...' : 'Support Agent')}
            </div>
            <div className="text-xs text-gray-400">
              {conv.last_message_at
                ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
                : format(new Date(conv.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Tag color={isOpen ? 'green' : 'default'} className="text-xs m-0">
            {isOpen ? 'Open' : 'Closed'}
          </Tag>
          {conv.student_unread > 0 && (
            <Badge count={conv.student_unread} size="small" color="blue" />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Message Bubble ───────────────────────────────────────

function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isMe && (
        <Avatar
          size={28}
          icon={<UserOutlined />}
          className="mr-2 mt-1 flex-shrink-0 bg-orange-100 text-orange-600"
        />
      )}
      <div className="max-w-[70%]">
        {!isMe && (
          <p className="text-xs font-medium text-orange-600 mb-1 ml-1">
            {msg.sender?.fullname || 'Support Staff'}
          </p>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm ${
            isMe
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100 shadow-sm'
          }`}
        >
          <p className="break-words leading-relaxed">{msg.message_text}</p>
          <div className={`text-xs mt-1.5 ${isMe ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
            {formatDistanceToNow(new Date(msg.sent_at), { addSuffix: true })}
            {isMe && msg.is_read && <span className="ml-1">✓✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export default function StudentChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<InputRef>(null);
  // Track open conversation ID for socket room management
  const openConvIdRef = useRef<string | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;
  const openConv = conversations.find((c) => c.status === 'open') ?? null;

  // ─── Load all conversations + auto-join open ──────────────

  const init = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyConversations({ limit: 50 });
      const items = res.items;
      setConversations(items);

      const open = items.find((c) => c.status === 'open');
      if (open) {
        setActiveConvId(open.id);
        openConvIdRef.current = open.id;
        const msgRes = await getMessages(open.id, { limit: 100 });
        setMessages(msgRes.messages);
        const socket = connectSocket();
        socket.emit('join_conversation', { conversationId: open.id });
      } else if (items.length > 0) {
        // No open conv — show most recent closed one (read-only)
        const first = items[0];
        setActiveConvId(first.id);
        const msgRes = await getMessages(first.id, { limit: 100 });
        setMessages(msgRes.messages);
        // Reset DB unread for closed conv (socket room not joined, must use REST API)
        if (first.student_unread > 0) {
          markAsRead(first.id).catch(() => {});
          setConversations((prev) =>
            prev.map((c) => (c.id === first.id ? { ...c, student_unread: 0 } : c))
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    init();
    return () => {
      if (openConvIdRef.current) {
        getSocket()?.emit('leave_conversation', { conversationId: openConvIdRef.current });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Socket events ────────────────────────────────────────

  useEffect(() => {
    const socket = connectSocket();

    socket.on('new_message', ({ message, conversationId, student_unread }) => {
      const isActive = conversationId === activeConvId;
      if (isActive) {
        setMessages((prev) => [...prev, message]);
        setSending(false);
        // Student is actively viewing — emit mark_read to keep server counter in sync
        socket.emit('mark_read', { conversationId });
      }
      // Use 0 when active (student is reading), server value otherwise
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, student_unread: isActive ? 0 : student_unread, last_message_at: message.sent_at }
            : c
        )
      );
    });

    socket.on('conversation_read', ({ conversationId }) => {
      if (conversationId === activeConvId) {
        setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
      }
    });

    socket.on('conversation_closed', ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, status: 'closed' } : c))
      );
      if (conversationId === openConvIdRef.current) {
        openConvIdRef.current = null;
      }
    });

    socket.on('error', ({ message }: { message: string }) => {
      toast.error(message || 'Failed to send message');
      setSending(false);
    });

    socket.on('connect', () => {
      if (openConvIdRef.current) {
        socket.emit('join_conversation', { conversationId: openConvIdRef.current });
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('conversation_read');
      socket.off('conversation_closed');
      socket.off('error');
      socket.off('connect');
    };
  }, [activeConvId]);

  // ─── Select a conversation from sidebar ───────────────────

  const handleSelectConv = async (convId: string) => {
    if (convId === activeConvId) return;
    setActiveConvId(convId);
    setText('');
    try {
      setLoadingMsgs(true);
      const res = await getMessages(convId, { limit: 100 });
      setMessages(res.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
    }
    const target = conversations.find((c) => c.id === convId);
    // Reset local unread badge immediately
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, student_unread: 0 } : c))
    );
    if (target?.status === 'open') {
      // Open conv: socket join_conversation triggers markAsRead on BE
      getSocket()?.emit('join_conversation', { conversationId: convId });
    } else if (target && target.student_unread > 0) {
      // Closed conv: socket room not joined, must reset via REST API
      markAsRead(convId).catch(() => {});
    }
  };

  // ─── Auto scroll ──────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send message ─────────────────────────────────────────

  const handleSend = () => {
    if (!text.trim() || !activeConvId || sending) return;
    if (activeConv?.status !== 'open') return;
    const socket = getSocket();
    if (!socket?.connected) {
      toast.error('Connection lost. Please wait and try again.');
      return;
    }
    setSending(true);
    socket.emit('send_message', { conversationId: activeConvId, text: text.trim() });
    setText('');
    inputRef.current?.focus();
    setTimeout(() => setSending(false), 2000);
  };

  // ─── Close conversation ───────────────────────────────────

  const handleClose = async () => {
    if (!openConv) return;
    try {
      const updated = await closeMyConversation();
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, status: 'closed' } : c))
      );
      getSocket()?.emit('close_conversation', { conversationId: updated.id });
      openConvIdRef.current = null;
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Start new conversation ───────────────────────────────

  const handleStartNew = async () => {
    try {
      setLoading(true);
      // getMyConversation calls getOrCreateConversation on BE
      const newConv = await getMyConversation();
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === newConv.id);
        return exists ? prev : [newConv, ...prev];
      });
      setActiveConvId(newConv.id);
      openConvIdRef.current = newConv.id;
      setMessages([]);
      const socket = connectSocket();
      socket.emit('join_conversation', { conversationId: newConv.id });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 h-[calc(100vh-64px)]">
      <div className="h-full flex bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* ── Left: Conversation Sidebar ── */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-gray-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Support Center</div>
                <div className="text-xs text-gray-400">FPT Dormitory</div>
              </div>
            </div>
            {!openConv && (
              <Button type="primary" size="small" block onClick={handleStartNew}>
                + New conversation
              </Button>
            )}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 px-6">
                <MessageSquare size={32} className="opacity-30" />
                <p className="text-sm text-center text-gray-400">
                  No conversations yet. Start one to get support.
                </p>
                <Button type="primary" size="small" onClick={handleStartNew}>
                  Start conversation
                </Button>
              </div>
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

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Mon–Fri 7:00–17:00 · Response &lt; 10 min
            </p>
          </div>
        </div>

        {/* ── Right: Chat Panel ── */}
        {activeConv ? (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Chat header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar
                    size={36}
                    icon={<UserOutlined />}
                    className={activeConv.staff ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}
                  />
                  {activeConv.status === 'open' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {activeConv.staff?.fullname || 'Support Chat'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {activeConv.staff
                      ? `${activeConv.staff.email} · Active now`
                      : activeConv.status === 'open'
                        ? 'Waiting for a manager to join...'
                        : `Closed · ${format(new Date(activeConv.updatedAt), 'MMM d, yyyy')}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeConv.status === 'closed' && (
                  <Tag icon={<LockOutlined />} color="default" className="text-xs">
                    Closed
                  </Tag>
                )}
                {activeConv.status === 'open' && (
                  <Popconfirm
                    title="Close this conversation?"
                    description="You can start a new one anytime."
                    onConfirm={handleClose}
                    okText="Close"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                    placement="bottomRight"
                  >
                    <Button size="small" icon={<X size={13} />} type="text" danger className="flex items-center gap-1">
                      Close
                    </Button>
                  </Popconfirm>
                )}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-5 bg-gray-50">
              {loadingMsgs ? (
                <div className="flex justify-center py-8"><Spin /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                    <MessageSquare size={28} className="text-blue-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-500 text-sm">No messages yet</p>
                    {activeConv.status === 'open' && (
                      <p className="text-xs text-gray-400 mt-1">
                        Describe your issue and a support agent will join shortly
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {format(new Date(messages[0].sent_at), 'MMMM d, yyyy')}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMe={msg.sender_type === 'student'}
                    />
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {activeConv.status === 'open' ? (
              <div className="px-5 py-4 border-t border-gray-100 bg-white">
                <div className="flex items-end gap-2">
                  <Input.TextArea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement & { focus(): void }>}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message... (Shift+Enter for new line)"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    maxLength={1000}
                    className="flex-1 resize-none"
                    style={{ borderRadius: 12 }}
                  />
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={sending}
                    disabled={!text.trim()}
                    size="large"
                  />
                </div>
                <p className="text-xs text-gray-300 mt-2 text-right">{text.length}/1000</p>
              </div>
            ) : (
              <div className="px-5 py-4 border-t border-gray-100 bg-white text-center">
                <p className="text-sm text-gray-400 mb-2">This conversation has been closed.</p>
                {!openConv && (
                  <Button type="primary" size="small" onClick={handleStartNew}>
                    Start a new conversation
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <MessageSquare size={28} className="text-blue-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Select a conversation or start a new one</p>
            <Button type="primary" size="small" onClick={handleStartNew}>
              Start conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
