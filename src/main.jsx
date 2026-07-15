import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Last-resort fallback. If anything in App rendering throws (Firebase init,
// IndexedDB cache corruption, a malformed lazy chunk, a parse error in a
// browser that doesn't support a JS feature), we want the user to see a
// readable error instead of a blank white screen.
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('Jifunze boot crash:', error, info);
  }
  render() {
    if (this.state.error) {
      const message = this.state.error?.message || String(this.state.error);
      return (
        <div style={{
          minHeight: '100vh',
          padding: '32px 20px',
          background: '#fafafa',
          fontFamily: '"Open Sans", system-ui, sans-serif',
          color: '#111',
        }}>
          <div style={{ maxWidth: 640, margin: '40px auto', background: '#fff', border: '2px solid #000', borderRadius: 12, padding: 28 }}>
            <h1 style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>Jifunze had trouble starting</h1>
            <p style={{ marginTop: 12, fontSize: 14, color: '#444' }}>
              Try a hard refresh (Cmd/Ctrl + Shift + R), then sign out and back in.
              If it keeps failing, clear site data: DevTools (Cmd/Ctrl + Option/Alt + I) → Application → Storage → Clear site data.
            </p>
            <pre style={{
              marginTop: 16,
              padding: 12,
              background: '#1b1b1b',
              color: '#FFC800',
              borderRadius: 8,
              fontSize: 12,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}>{message}</pre>
            <p style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
              Send this error message to <a href="mailto:jifunze@solidaridadnetwork.org">jifunze@solidaridadnetwork.org</a> if it persists.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
