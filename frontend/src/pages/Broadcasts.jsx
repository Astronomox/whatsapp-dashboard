import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdSend, MdDelete, MdClose } from 'react-icons/md';

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [form, setForm] = useState({
    name: '',
    messageType: 'text',
    body: '',
    templateName: '',
    recipients: '',
    targetLabels: '',
  });

  const fetchBroadcasts = () => {
    api.get('/broadcasts')
      .then(({ data }) => setBroadcasts(data))
      .catch(() => toast.error('Failed to load broadcasts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBroadcasts(); }, []);

  const handleCreate = async () => {
    const payload = {
      name: form.name,
      messageType: form.messageType,
      messageData: {
        body: form.body,
        templateName: form.templateName,
      },
      recipients: form.recipients.split(',').map((r) => r.trim()).filter(Boolean),
      targetLabels: form.targetLabels.split(',').map((l) => l.trim()).filter(Boolean),
    };
    try {
      await api.post('/broadcasts', payload);
      toast.success('Broadcast created');
      setShowModal(false);
      setForm({ name: '', messageType: 'text', body: '', templateName: '', recipients: '', targetLabels: '' });
      fetchBroadcasts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create');
    }
  };

  const handleSend = async (id) => {
    setSending(id);
    try {
      const { data } = await api.post(`/broadcasts/${id}/send`);
      toast.success(`Sending to ${data.total} recipients...`);
      setTimeout(fetchBroadcasts, 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Send failed');
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this broadcast?')) return;
    try {
      await api.delete(`/broadcasts/${id}`);
      toast.success('Deleted');
      fetchBroadcasts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const statusColors = {
    draft: '#5a6577',
    scheduled: '#f59e0b',
    sending: '#3b82f6',
    completed: '#25D366',
    failed: '#ef4444',
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Broadcasts</h1>
          <p style={styles.subheading}>Create and send bulk message campaigns</p>
        </div>
        <button onClick={() => setShowModal(true)} style={styles.btnPrimary}>
          <MdAdd size={18} /> New Broadcast
        </button>
      </div>

      <div style={styles.grid}>
        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : broadcasts.length === 0 ? (
          <div style={styles.empty}>No broadcasts yet. Create your first one!</div>
        ) : (
          broadcasts.map((b) => (
            <div key={b._id} style={styles.card}>
              <div style={styles.cardTop}>
                <h3 style={styles.cardName}>{b.name}</h3>
                <span style={{ ...styles.statusBadge, background: statusColors[b.status] + '20', color: statusColors[b.status] }}>
                  {b.status}
                </span>
              </div>
              <div style={styles.cardMeta}>
                <span>Type: {b.messageType}</span>
                <span>Recipients: {b.stats?.total || b.recipients?.length || 0}</span>
              </div>
              {b.messageData?.body && (
                <p style={styles.cardPreview}>"{b.messageData.body.slice(0, 80)}..."</p>
              )}
              <div style={styles.statsRow}>
                <span style={styles.stat}><strong>{b.stats?.sent || 0}</strong> sent</span>
                <span style={styles.stat}><strong>{b.stats?.delivered || 0}</strong> delivered</span>
                <span style={styles.stat}><strong>{b.stats?.failed || 0}</strong> failed</span>
              </div>
              <div style={styles.cardActions}>
                {b.status === 'draft' && (
                  <button
                    onClick={() => handleSend(b._id)}
                    disabled={sending === b._id}
                    style={styles.btnPrimary}
                  >
                    <MdSend size={16} /> {sending === b._id ? 'Sending...' : 'Send Now'}
                  </button>
                )}
                <button onClick={() => handleDelete(b._id)} style={styles.btnDanger}>
                  <MdDelete size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>New Broadcast</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}><MdClose size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Campaign Name</label>
                <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekend Sale" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Message Type</label>
                <select style={styles.input} value={form.messageType} onChange={(e) => setForm({ ...form, messageType: e.target.value })}>
                  <option value="text">Text Message</option>
                  <option value="template">Template Message</option>
                </select>
              </div>
              {form.messageType === 'text' ? (
                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>Message Body</label>
                  <textarea style={{ ...styles.input, height: 100, resize: 'vertical' }} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Type your message here..." />
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>Template Name</label>
                  <input style={styles.input} value={form.templateName} onChange={(e) => setForm({ ...form, templateName: e.target.value })} placeholder="hello_world" />
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Recipients (phone numbers, comma separated)</label>
                <textarea style={{ ...styles.input, height: 60, fontFamily: 'monospace', fontSize: 13 }} value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} placeholder="2348012345678, 2348098765432" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Or target by labels (comma separated)</label>
                <input style={styles.input} value={form.targetLabels} onChange={(e) => setForm({ ...form, targetLabels: e.target.value })} placeholder="customer, vip" />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowModal(false)} style={styles.btnOutline}>Cancel</button>
              <button onClick={handleCreate} style={styles.btnPrimary}>Create Broadcast</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heading: { color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 4px' },
  subheading: { color: '#5a6577', fontSize: 14, margin: 0 },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnOutline: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: '1px solid #1a2035', background: 'transparent', color: '#8a95a5', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  btnDanger: { display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: 8, border: '1px solid #ef444430', background: 'transparent', color: '#ef4444', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 },
  card: { background: '#0d1321', border: '1px solid #1a2035', borderRadius: 14, padding: 20 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardName: { color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 },
  statusBadge: { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  cardMeta: { display: 'flex', gap: 16, color: '#5a6577', fontSize: 13, marginBottom: 10 },
  cardPreview: { color: '#8a95a5', fontSize: 13, fontStyle: 'italic', marginBottom: 12, lineHeight: 1.4 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 16 },
  stat: { color: '#5a6577', fontSize: 13 },
  cardActions: { display: 'flex', gap: 8 },
  empty: { gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#5a6577', fontSize: 14, background: '#0d1321', borderRadius: 14, border: '1px solid #1a2035' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#0d1321', border: '1px solid #1a2035', borderRadius: 16, width: 500, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #1a2035' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#5a6577', cursor: 'pointer' },
  modalBody: { padding: '20px 24px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #1a2035' },
  label: { display: 'block', color: '#8a95a5', fontSize: 13, fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1a2035', background: '#0a0f1a', color: '#e1e5eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
};
