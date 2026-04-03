import { z } from 'zod';

const colombianPhoneRegex = /^\+57\s?3[0-9]{9}$/;

export const OrderSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customerPhone: z.string().refine((val) => {
    if (val.startsWith('+57')) return colombianPhoneRegex.test(val);
    return true; 
  }, { message: 'Para Colombia (+57), el número debe comenzar por 3 y tener 10 dígitos.' }),
  services: z.array(z.string()).min(1, 'Debes seleccionar al menos un servicio'),
  notes: z.string(),
  deliveryDate: z.string().min(1, 'La fecha de entrega es obligatoria'),
  totalCost: z.number().min(0),
  depositAmount: z.number().min(0),
  paymentStatus: z.enum(['pendiente', 'abono', 'pagado']),
  photos: z.array(z.string()),
});

export const TaskSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string(),
  date: z.string().min(1, 'La fecha es obligatoria'),
  time: z.string().min(1, 'La hora es obligatoria'),
  priority: z.enum(['alta', 'media', 'baja']),
  group_ids: z.array(z.string()),
  isShared: z.boolean(),
  imageUrl: z.string().nullable(),
});

export type OrderFormData = z.infer<typeof OrderSchema>;
export type TaskFormData = z.infer<typeof TaskSchema>;
