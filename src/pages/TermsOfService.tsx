import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Scale, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

export default function TermsOfService() {
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
            Reglas de Uso
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4 shadow-xl shadow-blue-500/10">
              <Scale size={40} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">Términos de Servicio</h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Acuerdo Legal para el uso de la plataforma de gestión operativa de More Paper & Design.
            </p>
          </section>

          {/* Key Acceptance Box */}
          <div className="p-6 rounded-[32px] bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-white/10 flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-400 shrink-0">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-2">
              <p className="font-bold text-sm text-white">Aceptación de los Términos</p>
              <p className="text-sm text-slate-500 leading-relaxed italic">
                "Al acceder o utilizar la plataforma de **More Paper & Design / More Paper 2024**, usted acepta cumplir y estar sujeto a los términos y condiciones aquí descritos. Si no está de acuerdo, por favor absténgase de utilizar el servicio."
              </p>
            </div>
          </div>

          <div className="prose prose-invert prose-blue max-w-none space-y-12">
            
            <article className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 italic">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-blue-500">1</span>
                Descripción del Servicio
              </h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                La plataforma (en adelante, "El Sistema") es una herramienta de gestión para **More Paper 2024 / More Paper & Design** que facilita:
              </p>
              <div className="grid gap-3 pt-2">
                {[
                  'Gestión colaborativa de actividades y tareas.',
                  'Seguimiento administrativo de órdenes de servicio.',
                  'Comunicación interna y generación de reportes operativos.',
                  'Centralización de evidencias fotográficas para auditoría.'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-300 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle className="text-blue-500 shrink-0" size={16} />
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 italic">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-blue-500">2</span>
                Responsabilidades del Usuario
              </h2>
              <p className="text-slate-400 leading-relaxed">
                El usuario es el único responsable de la veracidad de la información ingresada y del uso correcto de sus credenciales. Queda prohibido:
              </p>
              <ul className="space-y-3 list-none p-0">
                {[
                  'Ceder el acceso a la cuenta a personal no autorizado.',
                  'Utilizar el sistema para fines ajenos a la operación de More Paper & Design.',
                  'Ingresar información falsa o malintencionada en las órdenes o tareas.',
                  'Intentar vulnerar la seguridad del sistema o realizar ingeniería inversa.'
                ].map((item, i) => (
                  <li key={i} className="m-0 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-sm text-slate-300 flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 italic">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-blue-500">3</span>
                Propiedad Intelectual
              </h2>
              <p className="text-slate-400 leading-relaxed p-6 bg-white/5 rounded-[32px] border border-white/10">
                Todo el software, diseño, logotipos, marcas y contenidos digitales presentes en El Sistema son propiedad exclusiva de **More Paper & Design / More Paper 2024** o sus licenciantes. Su reproducción o distribución sin autorización escrita está estrictamente prohibida.
              </p>
            </article>

            <article className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 italic">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-blue-500">4</span>
                Modificaciones
              </h2>
              <p className="text-slate-400 leading-relaxed italic border-l-2 border-blue-500 pl-4 py-2">
                More Paper & Design se reserva el derecho de modificar estos términos en cualquier momento. El uso continuado de la plataforma tras dichas modificaciones constituirá la aceptación de los nuevos términos.
              </p>
            </article>

            <article className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 italic">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-blue-500">5</span>
                Contacto y Domicilio
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Para cualquier comunicación oficial, requerimiento técnico o legal, More Paper & Design dispone de los siguientes canales en su sede de **Barranquilla, Colombia**:
              </p>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-sm text-slate-300">
                <p>• Correo: morepaper2024@gmail.com</p>
                <p>• Soporte: 304 526 7493 / 318 380 6342</p>
              </div>
            </article>

            <article className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3 italic">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-blue-500">6</span>
                Legislación Aplicable
              </h2>
              <p className="text-slate-400 leading-relaxed font-bold flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-500" />
                Este acuerdo se rige bajo las leyes de la República de Colombia.
              </p>
            </article>

          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
