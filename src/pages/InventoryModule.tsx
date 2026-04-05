import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Users, 
  Plus, 
  Search, 
  ClipboardList, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Clock,
  Trash2,
  FileText
} from 'lucide-react';
import { useInventory, Supplier, MissingItem } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { triggerHaptic } from '../utils/haptics';
import { Skeleton } from '../components/ui/Skeleton';

export default function Inventory() {
  const { user } = useAuth();
  usePageTitle('Inventarios y Proveedores');
  const { suppliers, missingItems, loading, addSupplier, addMissingItem, approveItem, deleteItem } = useInventory();


  const [activeTab, setActiveTab] = useState<'suppliers' | 'missing'>('missing');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  
  // Modal States
  const [newSupplier, setNewSupplier] = useState({ name: '', nit: '', categories: [] as string[], contact_person: '', phone: '', email: '', address: '' });
  const [newItem, setNewItem] = useState({ supplier_id: '', product_name: '', brand: 'More Paper' as any, quantity: '', priority: 'media' as any, status: 'agotado' as any });
  const [catInput, setCatInput] = useState('');

  // Filters
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nit.includes(searchQuery) ||
      s.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [suppliers, searchQuery]);

  const filteredItems = useMemo(() => {
    return missingItems.filter(i => 
      i.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [missingItems, searchQuery]);

  const generateInventoryPdf = async () => {
     try {
       const { default: jsPDF } = await import('jspdf');
       const doc = new jsPDF();
       doc.setFontSize(20);
       doc.text("Reporte de Faltantes e Inventario", 20, 20);
       doc.setFontSize(10);
       doc.text(`Generado el: ${new Date().toLocaleString()}`, 20, 28);
       
       let y = 40;
       filteredItems.forEach((item, idx) => {
         if (y > 270) { doc.addPage(); y = 20; }
         doc.setFont("helvetica", "bold");
         doc.text(`${idx + 1}. ${item.product_name.toUpperCase()}`, 20, y);
         doc.setFont("helvetica", "normal");
         doc.text(`Proveedor: ${item.supplier_name || 'Geral'} | Marca: ${item.brand} | Cant: ${item.quantity} | Prioridad: ${item.priority}`, 25, y + 5);
         y += 15;
       });

       doc.save(`Faltantes_More_${new Date().toISOString().split('T')[0]}.pdf`);
       triggerHaptic('success');
     } catch (err) {
       console.error("PDF Generate error:", err);
     }
  };

  const handleAction = (type: 'success' | 'light' | 'warning' | 'error') => triggerHaptic(type);

  if (loading) return <InventorySkeleton />;

  // v3.1: Guarda de Seguridad Corporativa (Bloqueo Colaborador) - Saneada tras Hooks
  if (user?.role === 'Colaborador' || user?.isColaborador) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f0a15]">
        <div className="max-w-md w-full bg-red-500/5 border border-red-500/20 rounded-[40px] p-10 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Acceso Denegado</h2>
          <p className="text-red-400 font-bold text-sm uppercase tracking-[0.2em] mb-6 leading-relaxed">
            Seguridad Corporativa Antigravity
          </p>
          <div className="h-px bg-white/10 w-full mb-6" />
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
            Tu nivel de acceso actual (Temporal/Prueba) no tiene privilegios para visualizar la infraestructura de suministros y proveedores de Grupo More.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 rounded-2xl bg-white/5 text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
          >
            Volver al Panel de Trabajo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-32 animate-in fade-in duration-700">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Package className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">Suministros More</h1>
            <p className="text-[0.65rem] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5 opacity-60">
              <ClipboardList size={14} className="text-blue-500" /> Abastecimiento Colaborativo
            </p>
          </div>
        </div>

        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
           <button 
             onClick={() => { handleAction('light'); setActiveTab('missing'); }}
             className={`px-6 py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${activeTab === 'missing' ? 'bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
           >
             Faltantes
           </button>
           <button 
             onClick={() => { handleAction('light'); setActiveTab('suppliers'); }}
             className={`px-6 py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${activeTab === 'suppliers' ? 'bg-indigo-500 text-slate-950 shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
           >
             Proveedores
           </button>
        </div>

        {activeTab === 'missing' && filteredItems.length > 0 && (
          <button 
            onClick={() => generateInventoryPdf()}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-[0.65rem] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <FileText size={16} /> Reporte PDF
          </button>
        )}
      </header>

      {/* Search Bar */}
      <div className="relative mb-8 group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder={activeTab === 'missing' ? "Buscar producto o proveedor..." : "Buscar por nombre, NIT o categoría..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-[24px] pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-medium placeholder:text-slate-600"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
           <button 
            onClick={() => activeTab === 'suppliers' ? setShowAddSupplier(true) : setShowAddItem(true)}
            className="p-2 bg-blue-500 text-slate-950 rounded-xl hover:bg-blue-400 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
           >
             <Plus size={20} />
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'suppliers' ? (
          <motion.div key="supp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid gap-4 sm:grid-cols-2">
            {filteredSuppliers.map(supplier => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
            {filteredSuppliers.length === 0 && <EmptyState message="No se encontraron proveedores" icon={<Users size={48} />} />}
          </motion.div>
        ) : (
          <motion.div key="miss" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
             <div className="grid gap-4">
                {filteredItems.map(item => (
                  <MissingItemRow 
                    key={item.id} 
                    item={item} 
                    onApprove={approveItem} 
                    onDelete={deleteItem} 
                    isAdmin={!!(user?.isMaster || user?.isSupervisor)} 
                  />
                ))}
                {filteredItems.length === 0 && <EmptyState message="No hay faltantes registrados" icon={<Package size={48} />} />}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showAddSupplier && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddSupplier(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-[#1a1622] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
               <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Nuevo Proveedor</h3>
                     <button onClick={() => setShowAddSupplier(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><Plus className="rotate-45" size={24} /></button>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Nombre Comercial</label>
                        <input type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">NIT / ID</label>
                           <input type="text" value={newSupplier.nit} onChange={e => setNewSupplier({...newSupplier, nit: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Contacto</label>
                           <input type="text" value={newSupplier.contact_person} onChange={e => setNewSupplier({...newSupplier, contact_person: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Categorías (Separadas por coma)</label>
                        <input type="text" value={catInput} onChange={e => setCatInput(e.target.value)} onBlur={() => setNewSupplier({...newSupplier, categories: catInput.split(',').map(c => c.trim()).filter(Boolean)})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" placeholder="Papelería, Diseño, Otros..." />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">WhatsApp / Tel</label>
                           <input type="tel" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Email</label>
                           <input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" />
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={async () => {
                      try {
                        await addSupplier(newSupplier);
                        handleAction('success');
                        setShowAddSupplier(false);
                        setNewSupplier({ name: '', nit: '', categories: [], contact_person: '', phone: '', email: '', address: '' });
                        setCatInput('');
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                    className="w-full mt-8 py-4 bg-blue-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    Guardar Proveedor
                  </button>
               </div>
            </motion.div>
          </div>
        )}

        {showAddItem && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddItem(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-[#1a1622] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
               <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Reportar Faltante</h3>
                     <button onClick={() => setShowAddItem(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><Plus className="rotate-45" size={24} /></button>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Producto / Insumo</label>
                        <input type="text" value={newItem.product_name} onChange={e => setNewItem({...newItem, product_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" placeholder="Ej: Resmas de papel, Tinta..." />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Proveedor Asociado</label>
                        <select value={newItem.supplier_id} onChange={e => setNewItem({...newItem, supplier_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none appearance-none">
                           <option value="">Seleccionar Proveedor...</option>
                           {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.nit})</option>)}
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Marca / Línea</label>
                           <div className="flex bg-white/5 p-1 rounded-xl">
                              <button onClick={() => setNewItem({...newItem, brand: 'More Paper'})} className={`flex-1 py-2 rounded-lg text-[0.6rem] font-black uppercase transition-all ${newItem.brand === 'More Paper' ? 'bg-purple-500 text-white' : 'text-slate-500'}`}>Paper</button>
                              <button onClick={() => setNewItem({...newItem, brand: 'More Design'})} className={`flex-1 py-2 rounded-lg text-[0.6rem] font-black uppercase transition-all ${newItem.brand === 'More Design' ? 'bg-blue-500 text-white' : 'text-slate-500'}`}>Design</button>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Cantidad Sugerida</label>
                           <input type="text" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" placeholder="Ej: 5 unidades" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Nivel de Prioridad</label>
                        <div className="flex gap-2">
                           {['baja', 'media', 'alta'].map(p => (
                             <button key={p} onClick={() => setNewItem({...newItem, priority: p as any})} className={`flex-1 py-3 rounded-2xl text-[0.65rem] font-black uppercase border transition-all ${newItem.priority === p ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-600'}`}>
                               {p}
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={async () => {
                      if (!newItem.product_name || !newItem.supplier_id) return alert('Complete los campos obligatorios');
                      try {
                        await addMissingItem(newItem);
                        handleAction('success');
                        setShowAddItem(false);
                        setNewItem({ supplier_id: '', product_name: '', brand: 'More Paper', quantity: '', priority: 'media', status: 'agotado' });
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                    className="w-full mt-8 py-4 bg-indigo-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    Registrar Faltante
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SupplierCard({ supplier }: { supplier: Supplier }) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden backdrop-blur-xl shadow-2xl"
    >
      {/* Decorative gradient */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors uppercase leading-none">{supplier.name}</h3>
            <p className="text-[0.6rem] text-slate-600 font-black uppercase tracking-[0.2em] mt-2">ID Corporativo: {supplier.nit}</p>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-900 transition-all shadow-lg shadow-blue-500/5">
            <Users size={20} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {supplier.categories.map((cat, i) => (
            <span key={i} className="px-3 py-1.5 bg-slate-900/60 text-slate-400 rounded-xl text-[0.55rem] font-black uppercase tracking-widest border border-white/5 group-hover:border-blue-500/20 group-hover:text-blue-300 transition-all">
              {cat}
            </span>
          ))}
        </div>

        <div className="grid gap-3 pt-6 border-t border-white/5">
          <div className="flex items-center gap-4 text-[0.7rem] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-300 transition-colors">
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-500"><Phone size={14} /></div>
             {supplier.phone}
          </div>
          <div className="flex items-center gap-4 text-[0.7rem] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-300 transition-colors">
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-500"><Mail size={14} /></div>
             {supplier.email || 'Sin correo registrado'}
          </div>
          <div className="flex items-center gap-4 text-[0.7rem] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-300 transition-colors">
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-500"><MapPin size={14} /></div>
             {supplier.address || 'Logística Central Grupo More'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MissingItemRow({ item, onApprove, onDelete, isAdmin }: { item: MissingItem, onApprove: (id: string) => void, onDelete: (id: string) => void, isAdmin: boolean }) {
  const priorityStyles = {
    alta: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5',
    media: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5',
    baja: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5'
  };

  return (
    <motion.div 
      layout
      whileHover={{ x: 4 }}
      className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-[32px] p-6 flex flex-col sm:flex-row items-center gap-6 transition-all group relative overflow-hidden backdrop-blur-md shadow-xl"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.priority === 'alta' ? 'bg-rose-500' : item.priority === 'media' ? 'bg-amber-500' : 'bg-blue-500'}`} />
      
      <div className="flex-1 w-full sm:w-auto relative z-10">
        <div className="flex items-center gap-3 mb-3">
           <span className={`px-2.5 py-1 rounded-lg text-[0.55rem] font-black uppercase tracking-widest border ${item.brand === 'More Paper' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
             {item.brand}
           </span>
           <span className={`px-2.5 py-1 rounded-lg text-[0.55rem] font-black uppercase tracking-widest border ${priorityStyles[item.priority]}`}>
             Urgencia {item.priority}
           </span>
        </div>
        <h4 className="text-xl font-black text-white leading-tight uppercase group-hover:text-blue-400 transition-colors tracking-tight">{item.product_name}</h4>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-[0.65rem] text-slate-500 font-black uppercase tracking-[0.15em] opacity-70">
           <span className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full border border-white/5"><Users size={12} className="text-blue-500" /> {item.supplier_name || 'Stock General'}</span>
           <span className="flex items-center gap-2"><Package size={12} className="text-blue-500" /> <span className="text-white">{item.quantity}</span> Disponibles</span>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 sm:ml-auto relative z-10">
         <div className="text-right hidden sm:block">
            <p className="text-[0.6rem] text-slate-600 font-black uppercase tracking-widest">Solicitante</p>
            <p className="text-sm font-black text-white tracking-tight">@{item.requested_by_name}</p>
         </div>
         
         <div className="flex items-center gap-3">
            {!item.is_approved ? (
              <div className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl text-[0.6rem] font-black uppercase tracking-widest shadow-lg shadow-amber-500/5">
                <Clock size={14} className="animate-pulse" /> Pendiente
              </div>
            ) : (
              <div className="flex items-center gap-2 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-[0.6rem] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/5">
                <CheckCircle2 size={14} /> Procesado
              </div>
            )}

            {isAdmin && !item.is_approved && (
              <button 
                onClick={() => { triggerHaptic('success'); onApprove(item.id); }}
                className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-2xl hover:bg-emerald-400 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center group/btn"
                title="Aprobar Solicitud"
              >
                <CheckCircle2 size={24} className="group-hover/btn:scale-110 transition-transform" />
              </button>
            )}

            {isAdmin && (
              <button 
                onClick={() => { triggerHaptic('warning'); onDelete(item.id); }}
                className="w-12 h-12 bg-white/5 border border-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all active:scale-95 flex items-center justify-center"
                title="Eliminar Registro"
              >
                <Trash2 size={20} />
              </button>
            )}
         </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ message, icon }: { message: string, icon: React.ReactNode }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-600 bg-white/[0.01] border border-dashed border-white/5 rounded-[40px]">
      <div className="opacity-20 mb-4">{icon}</div>
      <p className="text-sm font-black uppercase tracking-widest">{message}</p>
    </div>
  );
}

function InventorySkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-32 space-y-12 animate-pulse">
      <div className="flex justify-between items-center">
         <div className="flex gap-4">
            <Skeleton width={56} height={56} className="rounded-2xl" />
            <div className="space-y-2">
               <Skeleton width={200} height={24} />
               <Skeleton width={150} height={12} />
            </div>
         </div>
         <Skeleton width={120} height={44} className="rounded-2xl" />
      </div>
      <Skeleton width="100%" height={64} className="rounded-[24px]" />
      <div className="grid grid-cols-2 gap-4">
         <Skeleton width="100%" height={240} className="rounded-[32px]" />
         <Skeleton width="100%" height={240} className="rounded-[32px]" />
      </div>
    </div>
  );
}
