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
  plan: 'basic' | 'pro' | 'premium';
  status: 'active' | 'suspended';
  createdAt: string;
  ownerUid: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  isMarketplaceEnabled?: boolean;
  isVatEnabled?: boolean;
  vatRate?: number;
  vatType?: 'inclusive' | 'exclusive';
  profitCalculationMethod?: 'markup' | 'margin';
  currency?: string;
}

export interface Product {
  productId: string;
  shopId: string;
  name: string;
  price: number;
  costPrice?: number;
  quantity: number;
  category: string;
  barcode?: string;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  slug?: string;
  shopName?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice?: number;
}

export interface Sale {
  saleId: string;
  shopId: string;
  items: SaleItem[];
  subtotal?: number;
  discount?: number;
  vatAmount?: number;
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
  imageUrl?: string;
  shopId?: string;
}

export interface Order {
  orderId: string;
  shopId: string;
  customerPhone: string;
  customerName?: string;
  customerAddress?: string;
  note?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod?: 'cod' | 'telebirr' | 'bank_transfer';
  createdAt: string;
  isMarketplaceOrder?: boolean;
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
  subtotal?: number;
  discount?: number;
  vatAmount?: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'mobile' | 'card';
  createdAt: string;
  shopName: string;
}

export interface Branch {
  branchId: string;
  shopId: string;
  name: string;
  address: string;
  phone: string;
  managerName: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface Staff {
  staffId: string;
  shopId: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  phone?: string;
  createdAt: string;
  status: 'active' | 'inactive';
}
