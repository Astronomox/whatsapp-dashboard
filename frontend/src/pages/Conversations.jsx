import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MdSend } from 'react-icons/md';

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get('/messages/conversations')
      .then(({ data }) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectConversation = async (phone) => {
    setSelectedPhone(phone);
    try {
      const { data } = await api.get('/messages', { params: { phone } });
      setMessages(data.messages.reverse());
    } catch {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPhone) return;
    setSending(true);
    try {
      // This would go through your backend to the WhatsApp API
      await api.post('/broadcasts', {
        name: `Direct to ${selectedPhone}`,
        messageType: 'text',
        messageData: { body: newMessage },
        recipients: [selectedPhone],
      });
      // Immediately send
      const broadcasts = await api.get('/broadcasts');
      const latest = broadcasts.data[0];
      if (latest) await api.post(`/broadcasts/${latest._id}/send`);

      setNewMessage('');
      toast.success('Message sent');
      setTimeout(() => selectConversation(selectedPhone), 2000);
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Conversation List */}
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Conversations</h2>
        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : conversations.length === 0 ? (
          <div style={styles.empty}>No conversations yet</div>
        ) : (
          conversations.map((c) => (
            <div
              key={c._id}
              onClick={() => selectConversation(c._id)}
              style={{
                ...styles.convItem,
                ...(selectedPhone === c._id ? styles.convItemActive : {}),
              }}
            >
              <div style={styles.convAvatar}>{(c.contactName || c._id).charAt(0).toUpperCase()}</div>
              <div style={styles.convInfo}>
                <div style={styles.convName}>{c.contactName || c._id}</div>
                <div style={styles.convPreview}>{c.lastMessage?.slice(0, 40)}</div>
              </div>
              {c.unreadCount > 0 && (
                <span style={styles.unreadBadge}>{c.unreadCount}</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {!selectedPhone ? (
          <div style={styles.noChat}>
            <p style={{ color: '#5a6577', fontSize: 16 }}>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div style={styles.chatHeader}>
              <div style={styles.chatAvatar}>{selectedPhone.charAt(0).toUpperCase()}</div>
              <span style={styles.chatPhone}>{selectedPhone}</span>
            </div>

            <div style={styles.messagesArea}>
              {messages.map((msg, i) => (
                <div key={msg._id || i} style={{ ...styles.bubble, ...(msg.direction === 'outbound' ? styles.bubbleOut : styles.bubbleIn) }}>
                  <div style={styles.bubbleText}>{msg.content}</div>
                  <div style={styles.bubbleTime}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.direction === 'outbound' && <span style={{ marginLeft: 6, color: msg.status === 'read' ? '#25D366' : '#5a6577' }}>✓✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.inputArea}>
              <input
                style={styles.chatInput}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} disabled={sending} style={styles.sendBtn}>
                <MdSend size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: 'calc(100vh - 64px)', gap: 0 },
  sidebar: { width: 320, background: '#0d1321', borderRight: '1px solid #1a2035', borderRadius: '14px 0 0 14px', overflow: 'auto' },
  sidebarTitle: { color: '#fff', fontSize: 18, fontWeight: 600, padding: '20px 16px 12px', margin: 0 },
  convItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #0a0f1a', transition: 'background 0.15s' },
  convItemActive: { background: '#1a2035' },
  convAvatar: { width: 40, height: 40, borderRadius: '50%', background: '#25D36630', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 },
  convInfo: { flex: 1, minWidth: 0 },
  convName: { color: '#fff', fontSize: 14, fontWeight: 500 },
  convPreview: { color: '#5a6577', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  unreadBadge: { background: '#25D366', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0f1a', borderRadius: '0 14px 14px 0' },
  noChat: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chatHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #1a2035' },
  chatAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#25D36630', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  chatPhone: { color: '#fff', fontSize: 15, fontWeight: 500 },
  messagesArea: { flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 },
  bubble: { maxWidth: '70%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.4 },
  bubbleIn: { alignSelf: 'flex-start', background: '#0d1321', color: '#e1e5eb', borderBottomLeftRadius: 4 },
  bubbleOut: { alignSelf: 'flex-end', background: '#25D366', color: '#fff', borderBottomRightRadius: 4 },
  bubbleText: {},
  bubbleTime: { fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: 'right' },
  inputArea: { display: 'flex', gap: 10, padding: '16px 20px', borderTop: '1px solid #1a2035' },
  chatInput: { flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #1a2035', background: '#0d1321', color: '#e1e5eb', fontSize: 14, outline: 'none' },
  sendBtn: { width: 48, height: 48, borderRadius: 10, border: 'none', background: '#25D366', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 40, textAlign: 'center', color: '#5a6577', fontSize: 13 },
};
