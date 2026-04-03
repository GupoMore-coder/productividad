export default function ImageZoomModal({ src, onClose }: { src: string, onClose: () => void }) {
  if (!src) return null;

  return (
    <div 
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.92)', 
        backdropFilter: 'blur(15px)', 
        zIndex: 20000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px',
        cursor: 'zoom-out',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{ 
          position: 'relative',
          maxWidth: '95vw',
          maxHeight: '90vh',
          boxShadow: '0 0 50px rgba(0,0,0,0.5)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '15px', 
            right: '15px', 
            width: '40px', 
            height: '40px', 
            borderRadius: '20px', 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)', 
            color: 'white', 
            fontSize: '24px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          ✕
        </button>
        
        <img 
          src={src} 
          alt="Zoom" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '90vh', 
            objectFit: 'contain',
            borderRadius: '12px',
            backgroundColor: '#1a1622'
          }} 
        />
        
        <div style={{ padding: '12px 20px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 500 }}>
           Vista en alta resolución
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
