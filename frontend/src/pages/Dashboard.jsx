import { useState, useEffect } from 'react';
import api from '../utils/api';
import { MdSend, MdInbox, MdToday, MdDateRange } from 'react-icons/md';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalSent: 0, totalReceived: 0, sentToday: 0, sentThisWeek: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/messages/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Sent', value: stats.totalSent, icon: MdSend, color: '#25D366' },
    { label: 'Total Received', value: stats.totalReceived, icon: MdInbox, color: '#3b82f6' },
    { label: 'Sent Today', value: stats.sentToday, icon: MdToday, color: '#f59e0b' },
    { label: 'Sent This Week', value: stats.sentThisWeek, icon: MdDateRange, color: '#8b5cf6' },
  ];

  const chartData = [
    { name: 'Sent', value: stats.totalSent },
    { name: 'Received', value: stats.totalReceived },
    { name: 'Today', value: stats.sentToday },
    { name: 'This Week', value: stats.sentThisWeek },
  ];

  return (
    <div>
      <h1 style={styles.heading}>Dashboard</h1>
      <p style={styles.subheading}>Overview of your WhatsApp messaging activity</p>

      <div style={styles.grid}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={styles.card}>
            <div style={{ ...styles.iconWrap, background: color + '18' }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={styles.cardValue}>{loading ? '—' : value.toLocaleString()}</div>
              <div style={styles.cardLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Message Overview</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#5a6577" fontSize={12} />
            <YAxis stroke="#5a6577" fontSize={12} />
            <Tooltip
              contentStyle={{ background: '#0d1321', border: '1px solid #1a2035', borderRadius: 8, color: '#e1e5eb' }}
            />
            <Bar dataKey="value" fill="#25D366" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const styles = {
  heading: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 700,
    margin: '0 0 4px',
    letterSpacing: '-0.02em',
  },
  subheading: {
    color: '#5a6577',
    fontSize: 14,
    marginBottom: 32,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  card: {
    background: '#0d1321',
    border: '1px solid #1a2035',
    borderRadius: 14,
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 700,
  },
  cardLabel: {
    color: '#5a6577',
    fontSize: 13,
    marginTop: 2,
  },
  chartCard: {
    background: '#0d1321',
    border: '1px solid #1a2035',
    borderRadius: 14,
    padding: '24px',
  },
  chartTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 20,
  },
};
