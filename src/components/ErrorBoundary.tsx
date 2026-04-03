import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl shadow-red-500/20">
                <AlertTriangle size={40} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">¡Vaya! Algo no salió bien</h1>
              <p className="text-slate-400 text-sm font-light leading-relaxed">
                La aplicación encontró un error inesperado. No te preocupes, tus datos están a salvo en la nube.
              </p>
            </div>

             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-bold">Detalles Técnicos</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(this.state.error?.stack || this.state.error?.message || "No error details")}
                    className="text-[0.6rem] text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider"
                  >
                    Copiar
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-xs font-mono text-red-400/80 break-words leading-tight bg-black/40 p-3 rounded-lg border border-red-500/10">
                    {this.state.error?.message || "Error desconocido"}
                  </p>
                </div>
             </div>

             <div className="flex flex-col gap-3">
               <button 
                 onClick={this.handleReset}
                 className="w-full py-4 bg-purple-500 text-slate-900 font-black rounded-2xl hover:bg-purple-400 transition-all active:scale-95 shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2"
               >
                 <RefreshCw size={18} className="animate-spin-slow" /> Reintentar Cargar
               </button>
               
               <button 
                 onClick={() => window.location.href = '/'}
                 className="w-full py-4 bg-white/5 text-slate-400 font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center gap-2"
               >
                 <Home size={18} /> Volver al Inicio
               </button>
             </div>

             <p className="text-[0.6rem] text-slate-600 font-medium uppercase tracking-[0.2em] pt-4">
               Antigravity Project 2026 • Auditoría de Resiliencia
             </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
