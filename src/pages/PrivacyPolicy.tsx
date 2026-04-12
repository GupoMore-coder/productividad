import { motion } from 'framer-motion';
import { Shield, ChevronLeft, Mail, MapPin, FileCheck, Info, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500/30">
      {/* Header / Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-bold text-slate-400 group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Volver
          </button>
          <div className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-purple-500">
            Seguridad & Datos
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <section className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4 shadow-xl shadow-purple-500/10">
              <Shield size={40} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">Política de Privacidad</h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Tu privacidad es nuestra prioridad absoluta. Conoce cómo protegemos tus datos bajo la legislación colombiana.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[0.6rem] font-black uppercase tracking-widest">
                Vigencia: Abril 2026
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.6rem] font-black uppercase tracking-widest">
                Cumplimiento Ley 1581
              </span>
            </div>
          </section>

          <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 grid sm:grid-cols-2 gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-5 transition-opacity pointer-events-none">
              <Shield size={120} />
            </div>
            <div className="space-y-4 relative">
              <h3 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-purple-500">Responsable del Tratamiento</h3>
              <p className="text-2xl font-black text-white tracking-tight">More Paper 2024 / More Paper & Design</p>
              <div className="space-y-2">
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Info size={14} className="text-slate-600" />
                  NIT: 72345510-8
                </p>
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <FileCheck size={14} className="text-slate-600" />
                  Matrícula Mercantil: 899.897
                </p>
              </div>
            </div>
            <div className="space-y-4 flex flex-col justify-end">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                <a href="mailto:morepaper2024@gmail.com" className="flex items-center gap-3 text-xs text-slate-400 hover:text-white transition-colors">
                  <Mail size={16} className="text-purple-400" />
                  morepaper2024@gmail.com
                </a>
                <p className="flex items-center gap-3 text-xs text-slate-400">
                  <MapPin size={16} className="text-purple-400" />
                  Barranquilla, Colombia | Operación Nacional
                </p>
                <div className="pt-1 flex flex-col gap-1">
                  <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Phone size={12} /> 304 526 7493 / 318 380 6342
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-invert prose-purple max-w-none space-y-12">
            <article className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-purple-500">01</span>
                Objetivo de la Política
              </h2>
              <p className="text-slate-400 leading-relaxed">
                La presente Política de Tratamiento de Información de **More Paper 2024 / More Paper & Design**, tiene por objeto dar cumplimiento a lo previsto en la Ley 1581 de 2012 y el Decreto 1377 de 2013, regulando los procedimientos de recolección, almacenamiento y tratamiento de los datos personales que se capten a través de nuestra plataforma.
              </p>
            </article>

            <article className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-purple-500">02</span>
                Finalidad del Tratamiento
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Los datos recolectados se utilizan exclusivamente para los siguientes fines asociados a nuestra operación en la plataforma:
              </p>
              <ul className="grid sm:grid-cols-2 gap-4 list-none p-0">
                {[
                  'Gestión y seguimiento de órdenes de servicio.',
                  'Coordinación de actividades y tareas colaborativas.',
                  'Comunicación directa sobre el estado de procesos.',
                  'Cumplimiento de obligaciones legales y tributarias.'
                ].map((item, i) => (
                  <li key={i} className="m-0 p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-slate-300 flex items-start gap-3">
                    <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

function CheckCircle({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      className={className} 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
