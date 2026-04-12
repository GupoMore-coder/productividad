import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, Send, MessageSquare, BadgeCheck, 
  AlertCircle, Sparkles, Camera, Image as ImageIcon, 
  Trash2, Loader2, RefreshCcw 
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../utils/haptics';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

interface Attachment {
  id: string;
  file: File;
  preview: string;
}

const Feedback = () => {
    usePageTitle('Hallazgos y Sugerencias');
    const { user } = useAuth();
    const [msg, setMsg] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [status, setStatus] = useState<'idle' | 'compressing' | 'generating' | 'sending' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setStatus('compressing');
        triggerHaptic('light');

        const options = {
            maxSizeMB: 0.5, // Reducido para optimizar envío
            maxWidthOrHeight: 1024, // Resolución ideal para reportes
            useWebWorker: true,
            fileType: 'image/jpeg' as any, // Forzar formato eficiente
        };

        try {
            const newAttachments: Attachment[] = [];
            for (let i = 0; i < files.length; i++) {
                const compressedFile = await imageCompression(files[i], options);
                const preview = URL.createObjectURL(compressedFile);
                newAttachments.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file: compressedFile,
                    preview
                });
            }
            setAttachments(prev => [...prev, ...newAttachments]);
            setStatus('idle');
        } catch (err) {
            console.error('Error comprimiendo imagen:', err);
            setStatus('idle');
        }
    };

    const removeAttachment = (id: string) => {
        triggerHaptic('light');
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const generatePDF = async (): Promise<string> => {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const COLORS = {
            DEEP_BG: [15, 23, 42],
            PURPLE: [147, 51, 234],
            AMBER: [217, 119, 6],
            SLATE_900: [15, 23, 42],
            SLATE_700: [51, 65, 85],
            SLATE_500: [100, 116, 139],
            SLATE_50: [248, 250, 252],
            WHITE: [255, 255, 255]
        };

        // Header Background
        doc.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setFillColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
        doc.rect(0, 43, 210, 2, 'F');

        // Logo & Brand
        const loadLogo = (): Promise<string | null> => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => resolve(null);
                img.src = '/logo.png';
            });
        };
        const logoBase64 = await loadLogo();
        if (logoBase64) doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20);

        doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("More Paper & Design", 40, 22);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
        doc.text("Un regalo auténtico · Personalizar es identidad", 40, 27);

        // Header Label
        doc.setFillColor(255, 255, 255, 0.08);
        doc.roundedRect(135, 12, 60, 20, 3, 3, 'F');
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(7);
        doc.text("REPORTE DE HALLAZGO", 140, 19);
        doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
        doc.setFontSize(11);
        doc.text("CONTROL DE CALIDAD", 140, 26);

        // Body Header
        let y = 60;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
        doc.text("METADATOS DEL INFORME", 15, y);
        doc.setDrawColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2], 0.2);
        doc.line(15, y + 2, 195, y + 2);

        y += 12;
        doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
        doc.setFontSize(10);
        doc.text(`Colaborador:`, 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(user?.full_name || user?.username || 'Usuario Invitado', 45, y);
        
        y += 7;
        doc.setFont("helvetica", "bold");
        doc.text(`Fecha y Hora:`, 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(new Date().toLocaleString('es-CO'), 45, y);

        y += 7;
        doc.setFont("helvetica", "bold");
        doc.text(`Sede Origen:`, 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(`Barranquilla, Colombia (Central)`, 45, y);

        // Message Section
        y += 15;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
        doc.text("DESCRIPCIÓN TÉCNICA / SUGERENCIA", 15, y);
        doc.setDrawColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2], 0.1);
        doc.line(15, y + 2, 195, y + 2);

        y += 10;
        doc.setTextColor(COLORS.SLATE_700[0], COLORS.SLATE_700[1], COLORS.SLATE_700[2]);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(msg, 180);
        doc.text(splitText, 15, y);
        
        y += (splitText.length * 5) + 20;

        // Evidence Section
        if (attachments.length > 0) {
            if (y > 230) { doc.addPage(); y = 20; }
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
            doc.text("EVIDENCIA GRÁFICA ADJUNTA", 15, y);
            doc.line(15, y + 2, 195, y + 2);
            
            y += 10;
            const colCount = 2;
            const spacing = 5;
            const colWidth = (180 - spacing) / colCount;
            const imgHeight = colWidth * 0.75;

            for (let i = 0; i < attachments.length; i++) {
                const colIdx = i % colCount;
                if (i > 0 && colIdx === 0) y += imgHeight + spacing;
                
                if (y + imgHeight > 260) {
                    doc.addPage();
                    y = 20;
                }

                const base64 = await imageCompression.getDataUrlFromFile(attachments[i].file);
                // Usar compresión MEDIUM de jsPDF para balance óptimo
                doc.addImage(base64, 'JPEG', 15 + (colIdx * (colWidth + spacing)), y, colWidth, imgHeight, undefined, 'MEDIUM');
            }
        }

        // Professional Footer
        const renderFooter = (pdf: any) => {
            const footY = 275;
            pdf.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
            pdf.rect(0, footY, 210, 22, 'F');
            pdf.setFillColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
            pdf.rect(0, footY, 210, 0.5, 'F');

            pdf.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "bold");
            pdf.text("More Paper & Design · UN REGALO AUTÉNTICO · PERSONALIZAR ES IDENTIDAD", 15, footY + 13);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(200, 200, 200);
            pdf.text("Este reporte ha sido generado automáticamente por el núcleo Antigravity PWA para el Administrador Maestro.", 15, footY + 8);
        };

        renderFooter(doc);
        
        return doc.output('datauristring').split(',')[1];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!msg) return;
        
        setStatus('generating');
        triggerHaptic('medium');

        try {
            const pdfBase64 = await generatePDF();
            
            setStatus('sending');
            
            const { data, error } = await supabase.functions.invoke('send-feedback', {
                body: {
                    userName: user?.full_name || user?.username,
                    message: msg,
                    pdfBase64
                }
            });

            if (error || !data?.success) throw new Error(error?.message || data?.error || 'Error al enviar');

            triggerHaptic('success');
            setStatus('success');
            setMsg('');
            setAttachments([]);
            
            setTimeout(() => setStatus('idle'), 5000);
        } catch (err: any) {
            console.error('Error en proceso:', err);
            setErrorMsg(err.message || 'Error inesperado');
            setStatus('error');
            triggerHaptic('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#1a1622] pt-6 pb-32 px-4 animate-in fade-in duration-700">
            <header className="mb-10 text-center">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-4">
                    <Lightbulb size={24} />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Hallazgos & Sugerencias</h1>
                <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-[0.3em] mt-3 italic">More Paper & Design · Sandbox Improvement</p>
            </header>

            <div className="max-w-xl mx-auto">
                <AnimatePresence mode="wait">
                    {status !== 'success' ? (
                        <motion.form 
                            key="form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onSubmit={handleSubmit}
                            className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] space-y-6 shadow-2xl relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Aportes del Equipo</h2>
                                        <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest mt-1.5 opacity-70">Tu visión construye Antigravity</p>
                                    </div>
                                </div>
                            </div>
                            
                            <textarea 
                                value={msg}
                                onChange={e => setMsg(e.target.value)}
                                placeholder="Describe cualquier fallo encontrado o idea para mejorar la plataforma..."
                                className="w-full h-40 bg-black/40 border border-white/10 rounded-3xl p-5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium placeholder:text-slate-700"
                                required
                                disabled={status !== 'idle' && status !== 'error'}
                            />

                            {/* Evidencia Gráfica Section */}
                            <div className="space-y-4">
                                <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest block px-1">Evidencia Gráfica (Opcional)</label>
                                
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        type="button"
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="flex-1 min-w-[120px] aspect-square rounded-3xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/5 transition-all transition-all active:scale-95"
                                    >
                                        <Camera size={24} />
                                        <span className="text-[0.55rem] font-black uppercase tracking-widest">Cámara</span>
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 min-w-[120px] aspect-square rounded-3xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/5 transition-all transition-all active:scale-95"
                                    >
                                        <ImageIcon size={24} />
                                        <span className="text-[0.55rem] font-black uppercase tracking-widest">Galería</span>
                                    </button>

                                    {/* Inputs ocultos */}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        capture="environment" 
                                        ref={cameraInputRef}
                                        title="Capturar foto con cámara"
                                        placeholder="Capturar foto"
                                        className="hidden" 
                                        onChange={handleFileChange}
                                    />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        multiple 
                                        ref={fileInputRef}
                                        title="Seleccionar imágenes de galería"
                                        placeholder="Seleccionar imágenes"
                                        className="hidden" 
                                        onChange={(e) => handleFileChange(e)}
                                    />
                                </div>

                                {/* Previews */}
                                <AnimatePresence>
                                    {attachments.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="grid grid-cols-4 gap-3 pt-2"
                                        >
                                            {attachments.map(att => (
                                                <div key={att.id} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10">
                                                    <img src={att.preview} alt="Evidence" className="w-full h-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeAttachment(att.id)}
                                                        title="Eliminar imagen"
                                                        className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {status === 'error' && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold animate-in zoom-in-95 duration-200">
                                    <AlertCircle size={16} />
                                    <span>{errorMsg}</span>
                                    <button 
                                        type="button"
                                        onClick={handleSubmit}
                                        className="ml-auto flex items-center gap-1.5 uppercase tracking-widest text-[0.6rem] bg-red-500 text-white px-3 py-1.5 rounded-lg"
                                    >
                                        <RefreshCcw size={10} /> Reintentar
                                    </button>
                                </div>
                            )}

                            <button 
                                type="submit"
                                disabled={status !== 'idle' && status !== 'error'}
                                className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                                    status === 'idle' || status === 'error' 
                                    ? 'bg-purple-500 text-slate-950 shadow-purple-500/20 hover:scale-[1.02]' 
                                    : 'bg-white/10 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                                {status === 'compressing' && <><Loader2 className="animate-spin" size={16} /> Comprimiendo...</>}
                                {status === 'generating' && <><Loader2 className="animate-spin" size={16} /> Generando PDF...</>}
                                {status === 'sending' && <><Loader2 className="animate-spin" size={16} /> Verificando Envío...</>}
                                {(status === 'idle' || status === 'error') && <><Send size={16} /> Enviar Hallazgo</>}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-500/10 border border-emerald-500/20 p-10 rounded-[40px] flex flex-col items-center text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                                <BadgeCheck size={32} />
                            </div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight">Reporte Verificado</h3>
                            <p className="text-[0.7rem] text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                                Se ha confirmado la recepción técnica de tu hallazgo en el correo del administrador. Gracias por contribuir a la evolución de Antigravity.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/10 rounded-[32px] flex items-start gap-4">
                    <AlertCircle size={20} className="text-blue-500 shrink-0" />
                    <div>
                        <p className="text-[0.65rem] font-black text-blue-500 uppercase tracking-widest mb-1.5 shadow-sm">Protocolo Sandbox</p>
                        <p className="text-[0.6rem] text-slate-500 font-bold uppercase leading-relaxed">
                            Respetado <span className="text-slate-300">@{user?.username}</span>, este canal es exclusivo para reportes de usabilidad y estabilidad. Si tienes un problema técnico crítico, por favor contacta soporte directamente.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center opacity-30 flex flex-col items-center gap-2 pb-10">
                    <Sparkles size={16} className="text-purple-500" />
                    <p className="text-[0.5rem] font-bold text-slate-600 uppercase tracking-[0.5em]">Elite Enhancement Unit</p>
                </div>
            </div>
        </div>
    );
};

export default Feedback;
