import { Link } from 'react-router-dom';
import { Shield, FileText, Mail, Globe, Copyright } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto w-full pt-16 pb-24 sm:pb-12 px-6 bg-slate-950/50 backdrop-blur-md border-t border-white/5 overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-30" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
        
        {/* Brand Section */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-white/5 overflow-hidden">
               <img 
                 src="/logo.svg" 
                 alt="Grupo More Logo" 
                 className="w-full h-full object-contain p-1"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=200&q=80';
                 }}
               />
            </div>
            <div>
              <h4 className="text-lg font-black text-white tracking-tight uppercase">Grupo More</h4>
              <p className="text-[0.6rem] text-[#d4bc8f] font-black tracking-[0.2em] uppercase">Personalizar es identidad</p>
            </div>
          </motion.div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            Papeleria creativa y detalles autenticos.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[0.6rem] font-bold uppercase tracking-wider">
              Sistema Activo • v3.1.0
            </span>
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-6">
          <h5 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-slate-500">Soporte & Contacto</h5>
          <ul className="space-y-4">
            <li>
              <a 
                href="mailto:morepaper2024@gmail.com" 
                className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/20 transition-colors">
                  <Mail size={16} />
                </div>
                morepaper2024@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-400">
              <div className="p-2 rounded-lg bg-white/5">
                <Globe size={16} />
              </div>
              Barranquilla, Colombia
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-400">
              <div className="p-2 rounded-lg bg-white/5">
                <Shield size={16} />
              </div>
              Tel: 304 526 7493 / 318 380 6342
            </li>
          </ul>
        </div>

        {/* Legal Section */}
        <div className="space-y-6">
          <h5 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-slate-500">Legalidad & Datos</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <Link 
              to="/privacy" 
              className="group flex items-center gap-3 text-sm text-slate-400 hover:text-purple-400 transition-colors"
            >
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/20 transition-colors">
                <Shield size={16} />
              </div>
              Privacidad (Habeas Data)
            </Link>
            <Link 
              to="/terms" 
              className="group flex items-center gap-3 text-sm text-slate-400 hover:text-purple-400 transition-colors"
            >
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/20 transition-colors">
                <FileText size={16} />
              </div>
              Términos de Servicio
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest">
          <Copyright size={12} />
          {currentYear} Grupo More | Barranquilla, Colombia.
        </div>
        <div className="text-[0.65rem] text-slate-600 font-medium">
          Matrícula: 899.897 | NIT: 72345510-8
        </div>
      </div>

      {/* Subliminal Brand Text */}
      <div className="absolute -bottom-8 -right-8 text-8xl font-black text-white/[0.02] select-none pointer-events-none">
        MORE
      </div>
    </footer>
  );
}
