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
  status: 'pending' | 'inProgress' | 'delivered' | 'cancelled';
  date: Date;
  orderNumber: string;
  deliveryAddress: string;
}
