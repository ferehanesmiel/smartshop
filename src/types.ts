export type UserRole = 'customer' | 'shop_owner' | 'admin' | 'manager' | 'accountant' | 'inventory' | 'owner';
export type SubscriptionPlan = 'Basic' | 'Pro' | 'Premium' | 'basic' | 'pro' | 'premium';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'pending' | 'paid' | 'failed';

export interface User {
  id: string;
  user_id: string;
  email: string;
  role: UserRole;
  name: string;
  language?: string;
  shop_id?: string;
  status?: string;
  createdAt: string;
}

export interface Shop {
  id: string;
  shopId: string;
  ownerId: string;
  ownerUid?: string;
  ownerName?: string;
  shopName: string;
  name: string;
  description: string;
  plan: SubscriptionPlan;
  subscriptionPlan: SubscriptionPlan;
  logoUrl?: string;
  bannerUrl?: string;
  category?: string;
  address?: string;
  phone?: string;
  email?: string;
  slug?: string;
  isMarketplaceEnabled?: boolean;
  isVatEnabled?: boolean;
  vatRate?: number;
  vatType?: 'inclusive' | 'exclusive';
  profitCalculationMethod?: 'margin' | 'markup';
  currency?: string;
  onlineStoreEnabled?: boolean;
  subscriptionStatus?: string;
  subscriptionExpiryDate?: string;
  status?: string;
  createdAt: string;
}

export interface MultiLangString {
  en: string;
  am: string;
  toLowerCase?: () => string;
}

export interface Product {
  id: string;
  productId: string;
  shopId: string;
  shopName?: string;
  name: any;
  description: any;
  price: number;
  costPrice: number;
  stock: number;
  quantity: number;
  vatInclusive: boolean;
  vatRate?: number;
  vatType?: 'inclusive' | 'exclusive';
  category: string;
  imageUrl?: string;
  bannerUrl?: string;
  barcode?: string;
  slug?: string;
  isPublishedToMarketplace?: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: any;
  price: number;
  quantity: number;
  shopId: string;
  shopName?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  shopId: string;
  items: OrderItem[];
  products?: OrderItem[];
  totalAmount: number;
  vatAmount: number;
  commissionAmount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  status?: string;
  note?: string;
  isMarketplaceOrder?: boolean;
  createdAt: string;
}

export interface CartItem extends OrderItem {}

export interface SiteSettings {
  name: string;
  description: string;
  siteName?: string;
}

export interface Branch {
  id: string;
  branchId: string;
  shopId: string;
  name: string;
  address?: string;
  phone?: string;
  managerName?: string;
  status?: string;
}

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints?: number;
  purchaseCount?: number;
  lastPurchaseDate?: string;
}

export interface Sale {
  id: string;
  saleId: string;
  total: number;
  totalAmount: number;
  subtotal: number;
  discount: number;
  vatAmount: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: string;
  cashierName?: string;
  customerName?: string;
  customerPhone?: string;
  amountPaid?: number;
  changeAmount?: number;
  items: SaleItem[];
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  costPrice: number;
  vatRate?: number;
  vatType?: string;
  netPrice?: number;
  vatAmount?: number;
  sellingPrice?: number;
  profit?: number;
  totalItemPrice?: number;
  totalItemVat?: number;
  totalItemNet?: number;
  totalItemProfit?: number;
  totalItemCost?: number;
}

export interface Receipt {
  id: string;
  receiptId: string;
  shopName?: string;
  customerPhone?: string;
  totalAmount: number;
  paymentMethod: string;
  cashierName?: string;
  items: any[];
  createdAt: string;
}
