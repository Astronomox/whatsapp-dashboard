import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <FaWhatsapp size={36} color="#25D366" />
          <h1 style={styles.title}>WA Dashboard</h1>
        </div>
        <p style={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#060b14',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: '#0d1321',
    border: '1px solid #1a2035',
    borderRadius: 16,
    padding: '48px 40px',
    width: 400,
    maxWidth: '90vw',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: '#5a6577',
    fontSize: 14,
    marginBottom: 32,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  label: {
    display: 'block',
    color: '#8a95a5',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #1a2035',
    background: '#0a0f1a',
    color: '#e1e5eb',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '13px',
    borderRadius: 10,
    border: 'none',
    background: '#25D366',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    color: '#5a6577',
    fontSize: 13,
  },
  link: {
    color: '#25D366',
    textDecoration: 'none',
    fontWeight: 600,
  },
};
