import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard,
  MdContacts,
  MdCampaign,
  MdSmartToy,
  MdChat,
  MdLogout,
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';

const navItems = [
  { path: '/', icon: MdDashboard, label: 'Dashboard' },
  { path: '/contacts', icon: MdContacts, label: 'Contacts' },
  { path: '/broadcasts', icon: MdCampaign, label: 'Broadcasts' },
  { path: '/auto-replies', icon: MdSmartToy, label: 'Auto Replies' },
  { path: '/conversations', icon: MdChat, label: 'Conversations' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <FaWhatsapp size={28} color="#25D366" />
        <span style={styles.logoText}>WA Dashboard</span>
      </div>

      <nav style={styles.nav}>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={styles.userSection}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userEmail}>{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <MdLogout size={18} />
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 260,
    height: '100vh',
    background: '#0a0f1a',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    borderRight: '1px solid #1a2035',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '24px 20px',
    borderBottom: '1px solid #1a2035',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '-0.02em',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 10,
    color: '#7a8599',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
    fontFamily: "'DM Sans', sans-serif",
  },
  navLinkActive: {
    background: '#25D366',
    color: '#fff',
  },
  userSection: {
    padding: '16px 16px 20px',
    borderTop: '1px solid #1a2035',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#25D366',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
  },
  userEmail: {
    color: '#5a6577',
    fontSize: 11,
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#5a6577',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 6,
  },
};
