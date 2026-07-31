import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppService } from '../services/whatsappService';

describe('WhatsAppService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates direct WhatsApp link correctly', () => {
    const link = WhatsAppService.getDirectLink('573001234567', {
      customerName: 'Juan Perez',
      documentNumber: 'ORD-1234',
      total: 50000,
      type: 'orden',
      deliveryDate: '2026-08-15'
    });

    expect(link).toContain('https://wa.me/573001234567');
    expect(link).toContain('Juan%20Perez');
    expect(link).toContain('ORD-1234');
  });

  it('calls deregisterBackend and invokes edge function', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Limpieza de backend de WhatsApp realizada correctamente.'
      })
    });

    vi.stubGlobal('fetch', mockFetch);

    const result = await WhatsAppService.deregisterBackend();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });
});
