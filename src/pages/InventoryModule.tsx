import { useState, useMemo, useEffect } from 'react';
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
  FileText,
  Tag
} from 'lucide-react';
import { useInventory, Supplier, MissingItem } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { triggerHaptic } from '../utils/haptics';
import { checkInventoryReminders, notifySupervisorOfNewRequest } from '../services/NotificationsService';

export default function Inventory() {
  const { user } = useAuth();
  usePageTitle('Inventarios y Proveedores');
  const { 
    suppliers, 
    missingItems, 
    loading, 
    addSupplier, 
    updateSupplier, 
    addMissingItem, 
    updateMissingItem, 
    completeItem, 
    approveItem, 
    deleteItem,
    deleteSupplier 
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'suppliers' | 'missing' | 'history'>('missing');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  
  // Modal States
  const [newSupplier, setNewSupplier] = useState({ 
    name: '', nit: '', categories: [] as string[], contact_person: '', phone: '', secondary_contact: '', email: '', address: '', social_links: [] as string[]
  });
  const [newItem, setNewItem] = useState({ 
    category: 'GENERAL', product_name: '', brand: 'More Paper' as any, quantity: '', priority: 'media' as any, status: 'agotado' as any 
  });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingItem, setEditingItem] = useState<MissingItem | null>(null);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherInput, setOtherInput] = useState('');

  const { categories, addCategory, deleteCategory } = useInventory();

  const toggleCategory = (cat: string) => {
    const normalizedCat = cat.trim().toUpperCase();
    setNewSupplier(prev => {
      const isSelected = prev.categories.includes(normalizedCat);
      if (isSelected) return { ...prev, categories: prev.categories.filter(c => c !== normalizedCat) };
      return { ...prev, categories: [...prev.categories, normalizedCat] };
    });
  };

  // Filters & Data Processing
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    suppliers.forEach(s => s.categories?.forEach(c => cats.add(c.trim().toUpperCase())));
    categories.forEach(c => cats.add(c.trim().toUpperCase()));
    return Array.from(cats).sort();
  }, [suppliers, categories]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nit.includes(searchQuery) ||
      (s.categories && s.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [suppliers, searchQuery]);

  const filteredItems = useMemo(() => {
    return missingItems.filter(i => {
      const matchesSearch = i.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (i.category && i.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (activeTab === 'history') return i.lifecycle_status === 'completed' && matchesSearch;
      return i.lifecycle_status !== 'completed' && matchesSearch;
    });
  }, [missingItems, searchQuery, activeTab]);

  useEffect(() => {
    if (!loading && user) {
      checkInventoryReminders(missingItems, user.role);
    }
  }, [loading, missingItems, user]);

  const handleEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setNewSupplier({
      name: s.name,
      nit: s.nit,
      categories: s.categories || [],
      contact_person: s.contact_person,
      phone: s.phone,
      secondary_contact: s.secondary_contact || '',
      email: s.email,
      address: s.address || '',
      social_links: s.social_links || []
    });
    setShowAddSupplier(true);
  };

  const handleEditItem = (item: MissingItem) => {
    setEditingItem(item);
    setNewItem({
      category: item.category?.trim().toUpperCase() || 'GENERAL',
      product_name: item.product_name,
      brand: item.brand,
      quantity: item.quantity,
      priority: item.priority || 'media',
      status: item.status || 'agotado'
    });
    setShowAddItem(true);
  };

  const generateInventoryPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const COLORS = {
        DEEP_BG: [15, 23, 42],
        BLUE: [59, 130, 246], 
        SLATE_900: [15, 23, 42],
        SLATE_700: [51, 65, 85],
        SLATE_500: [100, 116, 139],
        SLATE_50: [248, 250, 252],
        WHITE: [255, 255, 255]
      };

      const renderFooter = (pdf: any) => {
        const footY = 275;
        pdf.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
        pdf.rect(0, footY, 210, 22, 'F');
        pdf.setFillColor(COLORS.BLUE[0], COLORS.BLUE[1], COLORS.BLUE[2]);
        pdf.rect(0, footY, 210, 0.5, 'F');
        pdf.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.text("More Paper & Design · UN REGALO AUTÉNTICO · PERSONALIZAR ES IDENTIDAD", 15, footY + 13);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(200, 200, 200);
        pdf.text(`Documento de sourcing generado el ${new Date().toLocaleString('es-CO')}.`, 15, footY + 8);
      };

      // --- HEADER: ABSOLUTE REPLICATION (Identical Layout) ---
      const headerH = 45;
      const splitXTop = 90;
      const splitXBottom = 68;

      // Right Side: Lavender/Gray Area
      doc.setFillColor(226, 226, 235);
      doc.rect(0, 0, 210, headerH, 'F');

      // Left Side: White Area with Geometry
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, splitXBottom, headerH, 'F');
      doc.triangle(splitXBottom, 0, splitXTop, 0, splitXBottom, headerH, 'F');
      
      // Bottom Brand Bar
      doc.setFillColor(142, 87, 163); // Brand Purple
      doc.rect(0, 43, 210, 2, 'F');

      // Info Box (Left Side Integrated)
      doc.setFillColor(15, 23, 42); // Obsidian Brand Color
      doc.roundedRect(12, 9, 60, 26, 3, 3, 'F');

      
      doc.setTextColor(180, 180, 190);
      doc.setFontSize(7);
      doc.text("CONTROL", 18, 16);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text("CONTROL DE SOURCING", 18, 26);

      // --- LOGO LOADING (Required for Brand) ---
      const loadLogo = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null);
          img.src = '/logo.png';
        });
      };
      const logoBase64 = await loadLogo();


      // Branding Text & Logo (Right Side Balanced)
      doc.setTextColor(142, 87, 163); // Brand Purple
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("Papeleria creativa, detalles y personalización", 195, 8, { align: 'right' } as any);

      if (logoBase64) {
        // Optimized Scale (Taller & Bolder as per final proposal)
        doc.addImage(logoBase64, 'PNG', 145, 10, 55, 33);
      }






      let y = 60;
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.BLUE[0], COLORS.BLUE[1], COLORS.BLUE[2]);
      doc.text("LISTADO DE REQUERIMIENTOS Y PROVEEDORES ASOCIADOS", 15, y);
      doc.setDrawColor(COLORS.BLUE[0], COLORS.BLUE[1], COLORS.BLUE[2], 0.2);
      doc.line(15, y + 2, 195, y + 2);

      y += 12;

      const activeForPdf = filteredItems.filter(i => i.lifecycle_status === 'approved');
      if (activeForPdf.length === 0) return;

      activeForPdf.forEach((item, idx) => {
        if (y > 230) { renderFooter(doc); doc.addPage(); y = 30; }

        doc.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
        doc.rect(15, y - 5, 180, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9); doc.setFont("helvetica", "bold");
        doc.text(`${idx + 1}. ${item.product_name.toUpperCase()} (GRUPO: ${item.category?.toUpperCase() || '-'})`, 20, y);
        doc.setFontSize(7); doc.text(`CANTIDAD SOLICITADA: ${item.quantity}`, 160, y);

        y += 8;

        const matchingSuppliers = suppliers.filter(s => s.categories && s.categories.includes(item.category));
        if (matchingSuppliers.length === 0) {
          doc.setTextColor(150, 150, 150);
          doc.setFont("helvetica", "italic");
          doc.text("No se encontraron proveedores registrados para esta categoría.", 20, y + 5);
          y += 10;
        } else {
          matchingSuppliers.forEach(s => {
            if (y > 260) { renderFooter(doc); doc.addPage(); y = 30; }
            doc.setFillColor(245, 247, 250); doc.rect(15, y, 180, 10, 'F');
            doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
            doc.setFont("helvetica", "bold"); doc.setFontSize(8);
            doc.text(s.name.toUpperCase(), 20, y + 6);
            doc.setFont("helvetica", "normal"); doc.setFontSize(7);
            doc.text(`NIT: ${s.nit} | TEL: ${s.phone} | EMAIL: ${s.email || 'N/A'}`, 100, y + 6);
            y += 11;
          });
        }
        y += 5;
      });

      renderFooter(doc);
      doc.save(`Sourcing_More_${new Date().toISOString().split('T')[0]}.pdf`);
      triggerHaptic('success');
    } catch (err) {
      console.error("PDF error:", err);
      triggerHaptic('error');
    }
  };

  const handleAction = (type: 'success' | 'light' | 'warning' | 'error') => triggerHaptic(type);

  if (loading) return <InventorySkeleton />;

  // Roles verification
  const isAuthority = !!(user?.isMaster || user?.isSupervisor || (user?.isAdmin && user?.role === 'Director General (CEO)'));
  const isConsultant = user?.role === 'Consultora de Ventas' || user?.isConsultant;

  if (isConsultant && activeTab === 'suppliers') {
    setActiveTab('missing'); // Consultants can't see suppliers tab but can see missing items
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
             title="Ver Faltantes"
             className={`px-6 py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${activeTab === 'missing' ? 'bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
           >
             Faltantes
           </button>
           <button 
             onClick={() => { handleAction('light'); setActiveTab('history'); }}
             title="Ver Historial"
             className={`px-6 py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
           >
             Historial
           </button>
           {!isConsultant && (
             <button 
               onClick={() => { handleAction('light'); setActiveTab('suppliers'); }}
               title="Ver Proveedores"
               className={`px-6 py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${activeTab === 'suppliers' ? 'bg-indigo-500 text-slate-950 shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
             >
               Proveedores
             </button>
           )}
        </div>

        {activeTab === 'missing' && filteredItems.filter(i => i.lifecycle_status === 'approved').length > 0 && (
          <button 
            onClick={() => generateInventoryPdf()}
            title="Generar Reporte de Sourcing"
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <FileText size={16} /> Reporte PDF
          </button>
        )}
      </header>

      <div className="relative mb-8 group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder={activeTab === 'missing' ? "Buscar producto o categoría..." : "Buscar por nombre, NIT o categoría..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-[24px] pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-medium placeholder:text-slate-600"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
           <button 
            onClick={() => {
              if (activeTab === 'suppliers') {
                setEditingSupplier(null);
                setNewSupplier({ name: '', nit: '', categories: [], contact_person: '', phone: '', secondary_contact: '', email: '', address: '', social_links: [] });
                setShowAddSupplier(true);
              } else {
                setEditingItem(null);
                setNewItem({ category: 'GENERAL', product_name: '', brand: 'More Paper' as any, quantity: '', priority: 'media' as any, status: 'agotado' as any });
                setShowAddItem(true);
              }
            }}
            title={activeTab === 'suppliers' ? "Agregar Proveedor" : "Reportar Faltante"}
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
              <SupplierCard 
                key={supplier.id} 
                supplier={supplier} 
                onClick={() => handleEditSupplier(supplier)} 
                onDelete={deleteSupplier}
                canDelete={user?.isMaster || user?.role === 'Director General (CEO)'}
              />
            ))}
            {filteredSuppliers.length === 0 && <EmptyState message="No se encontraron proveedores" icon={<Users size={48} />} />}
          </motion.div>
        ) : (
          <motion.div key="items" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {filteredItems.map(item => (
              <MissingItemRow 
                key={item.id} 
                item={item} 
                onApprove={approveItem} 
                onDelete={id => { if (window.confirm('¿Confirmar eliminación definitiva?')) deleteItem(id); }} 
                onProcess={id => { if (window.confirm('¿Confirmar adquisición? Pasará al histórico.')) completeItem(id, { id: user?.id || '', name: user?.full_name || user?.username || '' }); }}
                onReactivate={old => {
                  if (window.confirm('¿Deseas generar un nuevo pedido basado en este registro?')) {
                    // v17: Ultra-clean clone logic
                    const freshItem = {
                      category: old.category || 'GENERAL',
                      product_name: old.product_name,
                      brand: old.brand || 'More Paper',
                      quantity: old.quantity || '1',
                      priority: old.priority || 'media',
                      status: old.status || 'agotado',
                      supplier_id: (old.supplier_id && old.supplier_id !== 'N/A' && old.supplier_id.length > 10) ? old.supplier_id : undefined,
                      lifecycle_status: (user?.isMaster || user?.role === 'Director General (CEO)' || user?.isSupervisor) ? 'approved' : 'pending'
                    };
                    
                    addMissingItem(freshItem as any, user?.role);
                    handleAction('success');
                    setActiveTab('missing');
                  }
                }}
                isAdmin={isAuthority} 
                userRole={user?.role || ''}
                onClick={() => {
                  if (isAuthority && item.lifecycle_status !== 'completed') handleEditItem(item);
                }} 
              />
            ))}
            {filteredItems.length === 0 && <EmptyState message={activeTab === 'history' ? "Historial vacío" : "No hay reportes activos"} icon={<Package size={48} />} />}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddSupplier && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddSupplier(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-[#1a1622] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
               <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                     <button onClick={() => setShowAddSupplier(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><Plus className="rotate-45" size={24} /></button>
                  </div>
               </div>
               <div className="p-8 overflow-y-auto custom-scrollbar">
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-blue-400 ml-1">Especialidad</label>
                        <div className="grid grid-cols-2 gap-2">
                           {categories.map(cat => (
                             <div key={cat} className="group relative">
                                <button 
                                  onClick={() => toggleCategory(cat)} 
                                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-[0.65rem] font-black uppercase transition-all ${newSupplier.categories.includes(cat) ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                                >
                                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${newSupplier.categories.includes(cat) ? 'bg-blue-500 border-blue-500 text-slate-900' : 'border-white/20'}`}>
                                      {newSupplier.categories.includes(cat) && <CheckCircle2 size={12} />}
                                  </div>
                                  <span className="truncate pr-4">{cat}</span>
                                </button>
                                
                                {isAuthority && (
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (window.confirm(`¿Eliminar la especialidad "${cat}" de forma global? Esta acción limpiará la etiqueta de todos los proveedores.`)) {
                                        deleteCategory(cat);
                                      }
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Eliminar Especialidad"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                             </div>
                           ))}

                           {showOtherInput ? (
                             <div className="col-span-2 flex gap-2 animate-in slide-in-from-top-2 duration-300">
                               <input 
                                 autoFocus
                                 type="text" 
                                 value={otherInput}
                                 onChange={e => setOtherInput(e.target.value)}
                                 placeholder="NUEVA ESPECIALIDAD..."
                                 className="flex-1 bg-white/5 border border-blue-500/30 rounded-2xl px-4 text-[0.65rem] font-black uppercase text-white outline-none"
                                 onKeyDown={async e => {
                                   if (e.key === 'Enter') {
                                     const normalized = otherInput.trim().toUpperCase();
                                     await addCategory(normalized);
                                     toggleCategory(normalized);
                                     setOtherInput('');
                                     setShowOtherInput(false);
                                   }
                                 }}
                               />
                               <button 
                                 onClick={async () => {
                                   const normalized = otherInput.trim().toUpperCase();
                                   await addCategory(normalized);
                                   toggleCategory(normalized);
                                   setOtherInput('');
                                   setShowOtherInput(false);
                                 }}
                                 className="px-4 py-3 bg-blue-600 text-white rounded-2xl text-[0.65rem] font-black"
                               >
                                 OK
                               </button>
                               <button 
                                 onClick={() => { setShowOtherInput(false); setOtherInput(''); }}
                                 className="px-4 py-3 bg-white/5 text-slate-500 rounded-2xl text-[0.65rem] font-black"
                               >
                                 X
                               </button>
                             </div>
                           ) : (
                             <button 
                              onClick={() => setShowOtherInput(true)}
                              className="col-span-2 flex items-center justify-center gap-2 p-3 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-[0.65rem] font-black uppercase text-slate-500 hover:border-blue-500/30 hover:text-blue-400 transition-all"
                             >
                               <Plus size={14} /> OTRA ESPECIALIDAD
                             </button>
                           )}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Nombre Comercial</label>
                           <input type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-blue-500/50 outline-none font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <input type="text" value={newSupplier.nit} onChange={e => setNewSupplier({...newSupplier, nit: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" placeholder="NIT" />
                           <input type="text" value={newSupplier.contact_person} onChange={e => setNewSupplier({...newSupplier, contact_person: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" placeholder="Contacto" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Correo</label>
                           <input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Teléfono</label>
                           <input type="tel" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500/50 outline-none" />
                        </div>
                     </div>
                  </div>
                  <button onClick={async () => {
                    try {
                      if (editingSupplier) await updateSupplier(editingSupplier.id, newSupplier);
                      else await addSupplier(newSupplier);
                      setShowAddSupplier(false); handleAction('success');
                    } catch(err:any) { alert(err.message); }
                  }} className="w-full mt-10 py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl">GUARDAR PROVEEDOR</button>
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
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">{editingItem ? 'Actualizar Faltante' : 'Reportar Faltante'}</h3>
                     <button title="Cerrar" onClick={() => setShowAddItem(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><Plus className="rotate-45" size={24} /></button>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label htmlFor="product_name" className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Producto</label>
                        <input id="product_name" type="text" value={newItem.product_name} onChange={e => setNewItem({...newItem, product_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white" />
                     </div>
                      <div className="space-y-2">
                        <label htmlFor="category" className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Grupo de Abastecimiento</label>
                        <select 
                           id="category" 
                           value={newItem.category} 
                           onChange={e => setNewItem({...newItem, category: e.target.value.trim().toUpperCase()})} 
                           className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white outline-none"
                        >
                           <option value="GENERAL" className="bg-slate-800 uppercase">GENERAL</option>
                           {allCategories.filter(c => c !== 'GENERAL').map(cat => (
                             <option key={cat} value={cat} className="bg-slate-800 text-white">{cat}</option>
                           ))}
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label htmlFor="quantity" className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Cantidad Solicitada</label>
                           <input id="quantity" type="text" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white" />
                        </div>
                        <div className="space-y-2">
                           <label htmlFor="priority" className="text-[0.6rem] font-black uppercase tracking-widest text-slate-500 ml-2">Prioridad</label>
                           <select id="priority" value={newItem.priority} onChange={e => setNewItem({...newItem, priority: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white outline-none">
                              <option value="baja" className="bg-slate-800">BAJA</option>
                              <option value="media" className="bg-slate-800">MEDIA</option>
                              <option value="alta" className="bg-slate-800">ALTA</option>
                           </select>
                        </div>
                     </div>
                     <button onClick={async () => {
                        try {
                           if (editingItem) {
                              await updateMissingItem(editingItem.id, newItem);
                           } else {
                              const role = user?.role || 'Colaborador';
                              await addMissingItem({
                                ...newItem,
                                supplier_id: undefined,
                                requested_by: user?.id || '',
                                requested_by_name: user?.full_name || user?.username || ''
                              } as any, role);
                              
                              if (role === 'Consultora de Ventas') {
                                notifySupervisorOfNewRequest(newItem.product_name);
                              }
                           }
                           setShowAddItem(false); handleAction('success');
                           setEditingItem(null);
                        } catch(err:any) { alert(err.message); }
                     }} className="w-full mt-6 py-4 bg-blue-600 text-white font-black text-xs uppercase rounded-2xl">
                       {editingItem ? 'ACTUALIZAR FALTANTE' : 'REGISTRAR FALTANTE'}
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SupplierCard({ supplier, onClick, onDelete, canDelete }: { supplier: Supplier, onClick: () => void, onDelete: (id: string) => void, canDelete: boolean }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 cursor-pointer relative overflow-hidden group">
      <div className="relative z-10" onClick={onClick}>
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-black text-white uppercase group-hover:text-blue-400 transition-colors">{supplier.name}</h3>
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Users size={20} /></div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {supplier.categories && supplier.categories.map(cat => (
            <span key={cat} className="px-3 py-1 bg-slate-900 text-slate-400 rounded-xl text-[0.55rem] font-black uppercase tracking-widest border border-white/5">{cat}</span>
          ))}
        </div>
        <div className="space-y-2 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 text-[0.7rem] text-slate-500 font-bold uppercase"><Phone size={14} /> {supplier.phone}</div>
          <div className="flex items-center gap-3 text-[0.7rem] text-slate-500 font-bold uppercase"><Mail size={14} /> {supplier.email || 'N/A'}</div>
          <div className="flex items-center gap-3 text-[0.7rem] text-slate-500 font-bold uppercase"><MapPin size={14} /> {supplier.address || 'Principal'}</div>
        </div>
      </div>

      {canDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`¿ELIMINAR DEFINITIVAMENTE AL PROVEEDOR "${supplier.name}"? Esta acción no se puede deshacer.`)) {
              onDelete(supplier.id);
            }
          }}
          className="absolute bottom-6 right-6 p-4 bg-red-500/10 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all border border-red-500/10 hover:bg-red-500 hover:text-white"
          title="Eliminar Proveedor"
        >
          <Trash2 size={20} />
        </button>
      )}
    </motion.div>
  );
}

function MissingItemRow({ item, onApprove, onDelete, onProcess, onReactivate, isAdmin, userRole, onClick }: { 
  item: MissingItem, 
  onApprove: (id: string) => void, 
  onDelete: (id: string) => void, 
  onProcess: (id: string) => void,
  onReactivate: (item: MissingItem) => void,
  isAdmin: boolean, 
  userRole: string,
  onClick: () => void 
}) {
  const priorityColors = { alta: 'text-rose-500', media: 'text-amber-500', baja: 'text-blue-500' };
  const isHistory = item.lifecycle_status === 'completed';
  const isPending = item.lifecycle_status === 'pending';
  
  const canManage = isAdmin || userRole === 'Director General (CEO)';
  const canDelete = isAdmin || userRole === 'Director General (CEO)' || userRole === 'Supervisora Puntos de Venta' || userRole === 'Administrador maestro';

  return (
    <motion.div onClick={onClick} className={`bg-white/[0.02] border border-white/5 rounded-[32px] p-6 flex flex-col sm:flex-row items-center gap-6 cursor-pointer hover:bg-white/[0.04] transition-all relative ${isHistory ? 'opacity-70 grayscale-[0.5]' : ''}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.priority === 'alta' ? 'bg-rose-500' : item.priority === 'media' ? 'bg-amber-500' : 'bg-blue-500'}`} />
      <div className="flex-1 w-full text-left">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[0.5rem] font-black uppercase">{item.brand}</span>
          <span className={`text-[0.5rem] font-black uppercase ${priorityColors[item.priority]}`}>URGENCIA {item.priority}</span>
          {isPending && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[0.5rem] font-black uppercase flex items-center gap-1"><Clock size={10} /> Por Aprobar</span>}
        </div>
        <h4 className="text-lg font-black text-white uppercase">{item.product_name}</h4>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-white/5 text-blue-400 rounded-xl text-[0.55rem] font-black uppercase tracking-widest shadow-sm">
            <Tag size={10} /> {item.category?.toUpperCase() || 'GENERAL'}
          </span>
          
          <span className="flex items-center gap-2 text-white/90 text-[0.6rem] font-black uppercase bg-white/5 px-3 py-1 rounded-xl border border-white/5">
            <Package size={12} className="text-blue-500" /> {item.quantity} <span className="text-slate-500">SOLICITADO</span>
          </span>

          {isHistory && item.completed_by_name && (
            <span className="flex items-center gap-2 text-emerald-500 text-[0.6rem] font-black uppercase bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
              <CheckCircle2 size={12} /> Adquirido por {item.completed_by_name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {!isHistory ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {isPending ? (
              canManage && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); triggerHaptic('success'); onApprove(item.id); }} 
                    className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-[0.6rem] font-black uppercase flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
                    title="Aprobar Solicitud"
                  >
                    <CheckCircle2 size={14} /> Aprobar
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (window.confirm('¿Seguro que deseas RECHAZAR esta solicitud? Se eliminará permanentemente.')) onDelete(item.id); 
                    }} 
                    className="px-5 py-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[0.6rem] font-black uppercase flex items-center gap-2 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5"
                    title="Rechazar Solicitud"
                  >
                    <Trash2 size={14} /> Rechazar
                  </button>
                </>
              )
            ) : (
              canManage && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onProcess(item.id); }} 
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[0.6rem] font-black uppercase flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                  title="Procesar Adquisición"
                >
                  <Package size={14} /> Procesado
                </button>
              )
            )}
            
            {canDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); triggerHaptic('warning'); onDelete(item.id); }} 
                className="p-3 bg-white/5 text-slate-500 hover:text-rose-500 rounded-2xl transition-all"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onReactivate(item); }} 
              className="px-4 py-2 bg-blue-500 text-slate-900 rounded-xl text-[0.6rem] font-black uppercase flex items-center gap-2 hover:bg-blue-400 transition-all"
              title="Re-solicitar este insumo"
            >
              <Plus size={14} /> Re-activar
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[0.6rem] font-black uppercase border border-emerald-500/10">
              <CheckCircle2 size={14} /> Adquirido
            </div>
            {canDelete && (
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  triggerHaptic('warning'); 
                  if (window.confirm('¿ELIMINAR ESTE REGISTRO DEL HISTÓRICO? Esta acción no se puede deshacer.')) {
                    onDelete(item.id);
                  }
                }} 
                className="p-3 bg-white/5 text-slate-500 hover:text-rose-500 rounded-2xl transition-all border border-white/5"
                title="Eliminar del Historial"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ message, icon }: { message: string, icon: React.ReactNode }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-600 bg-white/[0.01] border border-dashed border-white/10 rounded-[40px]">
      <div className="opacity-20 mb-4">{icon}</div>
      <p className="text-[0.6rem] font-black uppercase tracking-widest">{message}</p>
    </div>
  );
}

function InventorySkeleton() {
  return <div className="max-w-4xl mx-auto px-4 pt-8 animate-pulse text-slate-600">Conectando con base de suministros...</div>;
}
