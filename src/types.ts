export interface SiteSettings {
  siteName: string;
  primaryColor: string;
  heroHeadline: string;
  heroSubheadline: string;
  contactEmail: string;
  contactPhone: string;
}

export interface Shop {
  shopId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  subscriptionPlan: 'basic' | 'pro' | 'premium';
  status: 'active' | 'suspended';
  createdAt: string;
  ownerUid: string;
  slug: string;
}

export interface Product {
  productId: string;
  shopId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  barcode?: string;
  imageUrl?: string;
  description?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Sale {
  saleId: string;
  shopId: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'mobile' | 'card';
  customerPhone?: string;
  createdAt: string;
}

export interface Customer {
  customerId: string;
  shopId: string;
  name: string;
  phone: string;
  purchaseCount: number;
  loyaltyPoints: number;
  lastPurchaseDate?: string;
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
  customerName?: string;
  deliveryAddress?: string;
  note?: string;
  products: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  createdAt: string;
}

export interface Subscription {
  subscriptionId: string;
  shopId: string;
  planName: 'basic' | 'pro' | 'premium';
  startDate: string;
  endDate: string;
  paymentStatus: 'paid' | 'unpaid';
  subscriptionStatus: 'active' | 'expired';
}

export interface Admin {
  adminId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Receipt {
  receiptId: string;
  shopId: string;
  saleId: string;
  customerPhone?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'mobile' | 'card';
  createdAt: string;
  shopName: string;
}
