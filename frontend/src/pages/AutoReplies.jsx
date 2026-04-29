import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdDelete, MdEdit, MdClose, MdToggleOn, MdToggleOff } from 'react-icons/md';

export default function AutoReplies() {
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    triggerType: 'keyword',
    triggerValue: '',
    responseType: 'text',
    responseBody: '',
    priority: 0,
  });

  const fetchRules = () => {
    api.get('/autoreplies')
      .then(({ data }) => setRules(data))
      .catch(() => toast.error('Failed to load rules'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, []);

  const openAdd = () => {
    setEditingRule(null);
    setForm({ name: '', triggerType: 'keyword', triggerValue: '', responseType: 'text', responseBody: '', priority: 0 });
    setShowModal(true);
  };

  const openEdit = (rule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      triggerType: rule.trigger.type,
      triggerValue: rule.trigger.value || '',
      responseType: rule.response.type,
      responseBody: rule.response.body || '',
      priority: rule.priority || 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      trigger: { type: form.triggerType, value: form.triggerValue },
      response: { type: form.responseType, body: form.responseBody },
      priority: Number(form.priority),
    };
    try {
      if (editingRule) {
        await api.put(`/autoreplies/${editingRule._id}`, payload);
        toast.success('Rule updated');
      } else {
        await api.post('/autoreplies', payload);
        toast.success('Rule created');
      }
      setShowModal(false);
      fetchRules();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const toggleActive = async (rule) => {
    try {
      await api.put(`/autoreplies/${rule._id}`, { isActive: !rule.isActive });
      fetchRules();
    } catch {
      toast.error('Failed to toggle');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await api.delete(`/autoreplies/${id}`);
      toast.success('Deleted');
      fetchRules();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const triggerLabels = { keyword: 'Exact Match', contains: 'Contains', regex: 'Regex', default: 'Default (catch-all)' };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Auto Replies</h1>
          <p style={styles.subheading}>Set up automatic responses to incoming messages</p>
        </div>
        <button onClick={openAdd} style={styles.btnPrimary}>
          <MdAdd size={18} /> New Rule
        </button>
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : rules.length === 0 ? (
          <div style={styles.empty}>No auto-reply rules yet. Create one!</div>
        ) : (
          rules.map((rule) => (
            <div key={rule._id} style={{ ...styles.ruleCard, opacity: rule.isActive ? 1 : 0.5 }}>
              <div style={styles.ruleTop}>
                <div>
                  <h3 style={styles.ruleName}>{rule.name}</h3>
                  <div style={styles.ruleInfo}>
                    <span style={styles.triggerBadge}>{triggerLabels[rule.trigger.type]}</span>
                    {rule.trigger.value && <span style={styles.triggerValue}>"{rule.trigger.value}"</span>}
                    <span style={styles.priorityBadge}>Priority: {rule.priority}</span>
                  </div>
                </div>
                <div style={styles.ruleActions}>
                  <button onClick={() => toggleActive(rule)} style={styles.iconBtn}>
                    {rule.isActive ? <MdToggleOn size={28} color="#25D366" /> : <MdToggleOff size={28} color="#5a6577" />}
                  </button>
                  <button onClick={() => openEdit(rule)} style={styles.iconBtn}><MdEdit size={18} /></button>
                  <button onClick={() => handleDelete(rule._id)} style={{ ...styles.iconBtn, color: '#ef4444' }}><MdDelete size={18} /></button>
                </div>
              </div>
              <div style={styles.responsePreview}>
                <span style={{ color: '#5a6577', fontSize: 12 }}>Response:</span> {rule.response.body?.slice(0, 100)}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingRule ? 'Edit Rule' : 'New Rule'}</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}><MdClose size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Rule Name</label>
                <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Welcome Message" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Trigger Type</label>
                <select style={styles.input} value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value })}>
                  <option value="keyword">Exact Match</option>
                  <option value="contains">Contains</option>
                  <option value="regex">Regex</option>
                  <option value="default">Default (catch-all)</option>
                </select>
              </div>
              {form.triggerType !== 'default' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>Trigger Value</label>
                  <input style={styles.input} value={form.triggerValue} onChange={(e) => setForm({ ...form, triggerValue: e.target.value })} placeholder={form.triggerType === 'keyword' ? 'hi' : form.triggerType === 'contains' ? 'price' : '^hello.*'} />
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Response Message</label>
                <textarea style={{ ...styles.input, height: 100, resize: 'vertical' }} value={form.responseBody} onChange={(e) => setForm({ ...form, responseBody: e.target.value })} placeholder="Thanks for reaching out! How can we help?" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Priority (higher = checked first)</label>
                <input style={styles.input} type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowModal(false)} style={styles.btnOutline}>Cancel</button>
              <button onClick={handleSave} style={styles.btnPrimary}>Save Rule</button>
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
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  ruleCard: { background: '#0d1321', border: '1px solid #1a2035', borderRadius: 14, padding: 20, transition: 'opacity 0.2s' },
  ruleTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  ruleName: { color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 8px' },
  ruleInfo: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  triggerBadge: { padding: '3px 10px', borderRadius: 20, background: '#3b82f620', color: '#3b82f6', fontSize: 11, fontWeight: 600 },
  triggerValue: { color: '#8a95a5', fontSize: 13 },
  priorityBadge: { padding: '3px 10px', borderRadius: 20, background: '#8b5cf620', color: '#8b5cf6', fontSize: 11, fontWeight: 600 },
  ruleActions: { display: 'flex', gap: 4, alignItems: 'center' },
  iconBtn: { background: 'none', border: 'none', color: '#5a6577', cursor: 'pointer', padding: 4 },
  responsePreview: { color: '#8a95a5', fontSize: 13, lineHeight: 1.4 },
  empty: { padding: 40, textAlign: 'center', color: '#5a6577', fontSize: 14, background: '#0d1321', borderRadius: 14, border: '1px solid #1a2035' },
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
