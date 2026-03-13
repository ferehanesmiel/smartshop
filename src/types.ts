export interface Shop {
  shopId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  plan: 'free' | 'basic' | 'premium';
  createdAt: string;
  ownerUid: string;
  slug: string;
  status: 'active' | 'inactive';
}

export interface Product {
  productId: string;
  shopId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  saleId: string;
  shopId: string;
  items: SaleItem[];
  total: number;
  customerPhone?: string;
  createdAt: string;
}

export interface Customer {
  customerId: string;
  shopId: string;
  name: string;
  phone: string;
  purchaseHistory: string[]; // Sale IDs
  loyaltyPoints: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderId: string;
  shopId: string;
  customerPhone: string;
  customerName: string;
  products: OrderItem[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  total: number;
  createdAt: string;
}
