import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdDelete, MdEdit, MdUpload, MdSearch, MdClose } from 'react-icons/md';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', labels: '', notes: '' });
  const [importText, setImportText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContacts = () => {
    api.get('/contacts', { params: { search } })
      .then(({ data }) => setContacts(data.contacts))
      .catch(() => toast.error('Failed to load contacts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContacts(); }, [search]);

  const openAdd = () => {
    setEditingContact(null);
    setForm({ name: '', phone: '', email: '', labels: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (contact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      labels: (contact.labels || []).join(', '),
      notes: contact.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      labels: form.labels.split(',').map((l) => l.trim()).filter(Boolean),
    };
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact._id}`, payload);
        toast.success('Contact updated');
      } else {
        await api.post('/contacts', payload);
        toast.success('Contact added');
      }
      setShowModal(false);
      fetchContacts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success('Contact deleted');
      fetchContacts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleImport = async () => {
    try {
      const lines = importText.trim().split('\n').filter(Boolean);
      const contacts = lines.map((line) => {
        const [name, phone, ...rest] = line.split(',').map((s) => s.trim());
        return { name, phone, labels: rest.length ? rest : [] };
      });
      const { data } = await api.post('/contacts/import', { contacts });
      toast.success(`Imported ${data.imported}, updated ${data.updated}`);
      setShowImport(false);
      setImportText('');
      fetchContacts();
    } catch {
      toast.error('Import failed — check your format');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Contacts</h1>
          <p style={styles.subheading}>{contacts.length} contacts</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => setShowImport(true)} style={styles.btnOutline}>
            <MdUpload size={18} /> Import
          </button>
          <button onClick={openAdd} style={styles.btnPrimary}>
            <MdAdd size={18} /> Add Contact
          </button>
        </div>
      </div>

      <div style={styles.searchWrap}>
        <MdSearch size={18} color="#5a6577" />
        <input
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.table}>
        <div style={styles.tableHead}>
          <span style={{ flex: 2 }}>Name</span>
          <span style={{ flex: 2 }}>Phone</span>
          <span style={{ flex: 2 }}>Labels</span>
          <span style={{ flex: 1 }}>Status</span>
          <span style={{ flex: 1, textAlign: 'right' }}>Actions</span>
        </div>
        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : contacts.length === 0 ? (
          <div style={styles.empty}>No contacts yet. Add your first contact!</div>
        ) : (
          contacts.map((c) => (
            <div key={c._id} style={styles.tableRow}>
              <span style={{ flex: 2, color: '#fff', fontWeight: 500 }}>{c.name}</span>
              <span style={{ flex: 2, color: '#8a95a5' }}>{c.phone}</span>
              <span style={{ flex: 2 }}>
                {(c.labels || []).map((l) => (
                  <span key={l} style={styles.badge}>{l}</span>
                ))}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ ...styles.statusDot, background: c.conversationStatus === 'active' ? '#25D366' : '#ef4444' }} />
                {c.conversationStatus}
              </span>
              <span style={{ flex: 1, textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button onClick={() => openEdit(c)} style={styles.iconBtn}><MdEdit size={16} /></button>
                <button onClick={() => handleDelete(c._id)} style={{ ...styles.iconBtn, color: '#ef4444' }}><MdDelete size={16} /></button>
              </span>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingContact ? 'Edit Contact' : 'Add Contact'}</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}><MdClose size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              {['name', 'phone', 'email'].map((field) => (
                <div key={field} style={{ marginBottom: 16 }}>
                  <label style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input
                    style={styles.input}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    placeholder={field === 'phone' ? '2348012345678' : ''}
                  />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Labels (comma separated)</label>
                <input
                  style={styles.input}
                  value={form.labels}
                  onChange={(e) => setForm({ ...form, labels: e.target.value })}
                  placeholder="customer, vip"
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Notes</label>
                <textarea
                  style={{ ...styles.input, height: 80, resize: 'vertical' }}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowModal(false)} style={styles.btnOutline}>Cancel</button>
              <button onClick={handleSave} style={styles.btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div style={styles.overlay} onClick={() => setShowImport(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Import Contacts</h3>
              <button onClick={() => setShowImport(false)} style={styles.closeBtn}><MdClose size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <p style={{ color: '#8a95a5', fontSize: 13, marginBottom: 12 }}>
                Paste contacts in CSV format: name, phone, label1, label2
              </p>
              <textarea
                style={{ ...styles.input, height: 200, fontFamily: 'monospace', fontSize: 13 }}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={'John Doe, 2348012345678, customer\nJane Smith, 2348098765432, vip, customer'}
              />
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowImport(false)} style={styles.btnOutline}>Cancel</button>
              <button onClick={handleImport} style={styles.btnPrimary}>Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heading: { color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' },
  subheading: { color: '#5a6577', fontSize: 14, margin: 0 },
  headerActions: { display: 'flex', gap: 10 },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnOutline: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: '1px solid #1a2035', background: 'transparent', color: '#8a95a5', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#0d1321', border: '1px solid #1a2035', borderRadius: 10, marginBottom: 20 },
  searchInput: { flex: 1, background: 'none', border: 'none', color: '#e1e5eb', fontSize: 14, outline: 'none' },
  table: { background: '#0d1321', border: '1px solid #1a2035', borderRadius: 14, overflow: 'hidden' },
  tableHead: { display: 'flex', padding: '14px 20px', borderBottom: '1px solid #1a2035', color: '#5a6577', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #0a0f1a', fontSize: 14, color: '#8a95a5' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: '#25D36618', color: '#25D366', fontSize: 11, fontWeight: 600, marginRight: 4 },
  statusDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 6 },
  iconBtn: { background: 'none', border: 'none', color: '#5a6577', cursor: 'pointer', padding: 4 },
  empty: { padding: 40, textAlign: 'center', color: '#5a6577', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#0d1321', border: '1px solid #1a2035', borderRadius: 16, width: 460, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #1a2035' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#5a6577', cursor: 'pointer' },
  modalBody: { padding: '20px 24px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #1a2035' },
  label: { display: 'block', color: '#8a95a5', fontSize: 13, fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1a2035', background: '#0a0f1a', color: '#e1e5eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
};
