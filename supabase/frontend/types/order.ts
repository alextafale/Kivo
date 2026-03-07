export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  restaurantName: string;
  restaurantImage: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  date: Date;
  orderNumber: string;
  deliveryAddress: string;

  userId: string;
  sucursalId: string | null;
  negocioId: string | null;
  repartidorId: string | null;
  domicilioId: string | null;
  notas: string | null;
  subtotal: number | null;
  descuento: number | null;
  costoEnvio: number | null;
  propina: number | null;
  tiempoEstimadoMin: number | null;
  canceladoEn: string | null;
  motivoCancelacion: string | null;
}
