import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useOrders, SERVICE_TYPES, ServiceOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompressor';
import { uploadFile, base64ToBlob } from '@/lib/supabase';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: ServiceOrder; // For edit mode
}

const COUNTRY_CODES = [
  { code: '+1', name: 'USA/Canadá' },
  { code: '+20', name: 'Egipto' },
  { code: '+27', name: 'Sudáfrica' },
  { code: '+31', name: 'Países Bajos' },
  { code: '+32', name: 'Bélgica' },
  { code: '+33', name: 'Francia' },
  { code: '+34', name: 'España' },
  { code: '+39', name: 'Italia' },
  { code: '+44', name: 'Reino Unido' },
  { code: '+49', name: 'Alemania' },
  { code: '+51', name: 'Perú' },
  { code: '+52', name: 'México' },
  { code: '+53', name: 'Cuba' },
  { code: '+54', name: 'Argentina' },
  { code: '+55', name: 'Brasil' },
  { code: '+56', name: 'Chile' },
  { code: '+57', name: 'Colombia' },
  { code: '+58', name: 'Venezuela' },
  { code: '+591', name: 'Bolivia' },
  { code: '+593', name: 'Ecuador' },
  { code: '+595', name: 'Paraguay' },
  { code: '+598', name: 'Uruguay' },
  { code: '+81', name: 'Japón' },
  { code: '+86', name: 'China' }
].sort((a, b) => parseInt(a.code.replace('+', '')) - parseInt(b.code.replace('+', '')));

export default function CreateOrderModal({ isOpen, onClose, initialOrder }: CreateOrderModalProps) {
  const { createOrder, updateOrder } = useOrders();
  const { user } = useAuth();
  
  const activeResponsible = user?.user_metadata?.fullName || user?.username || user?.email || 'Usuario';

  const [customerName, setCustomerName] = useState('');
  const [customerPhoneCode, setCustomerPhoneCode] = useState('+57');
  const [customerPhoneNum, setCustomerPhoneNum] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(Date.now() + 86400000 * 3), 'yyyy-MM-dd'));
  const [deliveryTime, setDeliveryTime] = useState('17:00');

  const [paymentStatus, setPaymentStatus] = useState<'pendiente' | 'abono' | 'pagado'>('pendiente');
  const [totalCost, setTotalCost] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialOrder) {
        setCustomerName(initialOrder.customerName);
        const match = initialOrder.customerPhone.match(/^(\+\d+)\s(.*)$/);
        if (match) {
          setCustomerPhoneCode(match[1]);
          setCustomerPhoneNum(match[2]);
        } else {
          setCustomerPhoneCode('+57');
          setCustomerPhoneNum(initialOrder.customerPhone);
        }
        setSelectedServices(initialOrder.services);
        setNotes(initialOrder.notes);
        const [dD, dT] = initialOrder.deliveryDate.split('T');
        setDeliveryDate(dD || format(new Date(), 'yyyy-MM-dd'));
        setDeliveryTime(dT || '17:00');
        setPaymentStatus(initialOrder.paymentStatus);
        setTotalCost(initialOrder.totalCost);
        setDepositAmount(initialOrder.depositAmount);
        setPhotos(initialOrder.photos || []);
      } else {
        setCustomerName('');
        setCustomerPhoneCode('+57');
        setCustomerPhoneNum('');
        setSelectedServices([]);
        setNotes('');
        setDeliveryDate(format(new Date(Date.now() + 86400000 * 3), 'yyyy-MM-dd'));
        setDeliveryTime('17:00');
        setPaymentStatus('pendiente');
        setTotalCost(0);
        setDepositAmount(0);
        setPhotos([]);
      }
    }
  }, [isOpen, initialOrder]);

  if (!isOpen) return null;

  const toggleService = (svc: string) => {
    setSelectedServices(prev => 
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const newFiles = Array.from(e.target.files);
    const remainingSlots = 12 - photos.length;

    if (remainingSlots <= 0) {
      alert('Máximo 12 imágenes alcanzado.');
      e.target.value = '';
      return;
    }

    const filesToProcess = newFiles.slice(0, remainingSlots);
    setUploadingPhotos(true);

    try {
      for (const file of filesToProcess) {
        const compressedBase64 = await compressImage(file);
        const blob = base64ToBlob(compressedBase64);
        
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const filePath = `${user.id}/${fileName}`;
        
        const publicUrl = await uploadFile('order-photos', filePath, blob);
        setPhotos(prev => [...prev, publicUrl]);
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Error al subir una o más imágenes.');
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || selectedServices.length === 0) return;
    const fullPhone = `${customerPhoneCode} ${customerPhoneNum}`;
    const orderData = {
      customerName,
      customerPhone: fullPhone,
      services: selectedServices,
      notes,
      responsible: activeResponsible,
      deliveryDate: `${deliveryDate}T${deliveryTime}`,
      paymentStatus,
      totalCost,
      depositAmount: paymentStatus === 'abono' ? depositAmount : (paymentStatus === 'pagado' ? totalCost : 0),
      photos
    };
    if (initialOrder) {
      await updateOrder(initialOrder.id, orderData);
    } else {
      await createOrder(orderData);
    }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-color-secondary)', border: '1px solid var(--glass-border)', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{initialOrder ? `Editar ${initialOrder.id}` : 'Nueva Orden de Servicio'}</h3>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cliente</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="Nombre completo" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '1rem' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Celular</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <select value={customerPhoneCode} onChange={e => setCustomerPhoneCode(e.target.value)} style={{ width: '80px', padding: '12px 4px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.9rem', cursor: 'pointer' }}>
                  {COUNTRY_CODES.map(c => <option key={c.code} value={c.code} style={{color: 'black'}}>{c.code}</option>)}
                </select>
                <input type="tel" value={customerPhoneNum} onChange={e => setCustomerPhoneNum(e.target.value.replace(/[^0-9]/g, ''))} required placeholder="300XXXXXXX" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '1rem' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Servicios (Selecciona 1 o más)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SERVICE_TYPES.map(svc => {
                const isSelected = selectedServices.includes(svc);
                return (
                  <button key={svc} type="button" onClick={() => toggleService(svc)} style={{ padding: '8px 12px', borderRadius: '16px', fontSize: '0.85rem', border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--glass-border)'}`, background: isSelected ? 'var(--accent-glow)' : 'transparent', color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)', cursor: 'pointer' }}>
                    {isSelected && '✓ '}{svc}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fecha Entrega</label>
              <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '1rem', colorScheme: 'dark' }} />
            </div>
            <div style={{ flex: '0 0 100px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hora</label>
              <input type="time" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '1rem', colorScheme: 'dark' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Imágenes y Recursos ({photos.length}/12)</label>
              <label style={{ fontSize: '0.8rem', color: 'var(--accent-color)', cursor: 'pointer', padding: '6px 12px', background: 'var(--accent-glow)', borderRadius: '8px', border: '1px solid var(--accent-color)' }}>
                {uploadingPhotos ? 'Subiendo...' : '📷 Agregar Imagen'}
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploadingPhotos} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
                  <img src={p} alt={`Adjunto ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  <button type="button" onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -4, right: -4, background: 'red', color: 'white', borderRadius: '50%', border: 'none', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Notas de la Orden</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas..." rows={2} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical' }} />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '16px' }} disabled={uploadingPhotos}>
            {initialOrder ? 'Guardar Cambios' : 'Generar Orden'}
          </button>
        </form>
      </div>
    </div>
  );
}
