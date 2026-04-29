import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060b14' }}>
      <Sidebar />
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  main: {
    marginLeft: 260,
    flex: 1,
    padding: '32px 40px',
    color: '#e1e5eb',
    fontFamily: "'DM Sans', sans-serif",
  },
};
