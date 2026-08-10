import { Component } from 'react';

// ErrorBoundary global: si cualquier componente del árbol lanza un error
// durante el render (por ejemplo, un mount roto en un componente nuevo),
// React desmonta el árbol completo y deja la pantalla en blanco de forma
// silenciosa. Este boundary atrapa esos errores y muestra un mensaje
// legible en vez de un blanco sin explicación, y deja el error real
// registrado en consola para debugging.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Error capturado en el árbol de React:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            background: '#fbf9f5',
            color: '#1f2937',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Ocurrió un error inesperado
          </h1>
          <p style={{ maxWidth: '32rem', color: '#4b5563' }}>
            Algo falló al cargar esta pantalla. Puedes intentar recargar la
            página; si el problema persiste, contacta al equipo técnico.
          </p>
          {this.state.error?.message ? (
            <pre
              style={{
                maxWidth: '32rem',
                overflowX: 'auto',
                fontSize: '0.75rem',
                background: '#f3f4f6',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                color: '#b91c1c',
              }}
            >
              {this.state.error.message}
            </pre>
          ) : null}
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              background: '#111827',
              color: '#fff',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
