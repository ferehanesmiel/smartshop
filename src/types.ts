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
  subscriptionStatus: 'active' | 'expired' | 'trial';
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  onlineStoreEnabled: boolean;
  status: 'active' | 'suspended';
  createdAt: string;
  ownerUid: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  category?: string;
  isMarketplaceEnabled?: boolean;
  isVatEnabled?: boolean;
  vatRate?: number;
  vatType?: 'inclusive' | 'exclusive';
  profitCalculationMethod?: 'markup' | 'margin';
  currency?: string;
  currentProductCount: number;
  currentUserCount: number;
  currentBranchCount: number;
}

export interface SubscriptionPlan {
  planId: string;
  planName: string;
  monthlyPrice: number;
  maxUsers: number;
  maxProducts: number;
  multiBranchEnabled: boolean;
  advancedReportsEnabled: boolean;
  onlineStoreEnabled: boolean;
  smsNotificationsEnabled: boolean;
  createdAt: string;
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
  slug: string;
  isPublishedToMarketplace?: boolean;
  shopName?: string;
  vatRate?: number;
  vatType?: 'inclusive' | 'exclusive';
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice?: number;
  vatRate?: number;
  vatType?: 'inclusive' | 'exclusive';
  vatAmount?: number;
  netPrice?: number;
  profit?: number;
}

export interface Sale {
  saleId: string;
  shopId: string;
  items: SaleItem[];
  subtotal?: number;
  discount?: number;
  vatAmount?: number;
  totalAmount: number;
  totalCost?: number;
  totalProfit?: number;
  paymentMethod: 'cash' | 'mobile' | 'card' | 'telebirr' | 'bank_transfer';
  amountPaid?: number;
  changeAmount?: number;
  customerPhone?: string;
  customerName?: string;
  cashierName?: string;
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
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'preparing';
  paymentMethod?: 'cod' | 'telebirr' | 'bank_transfer';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  createdAt: string;
  isMarketplaceOrder?: boolean;
  commissionAmount?: number;
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
  customerName?: string;
  cashierName?: string;
  items: SaleItem[];
  subtotal?: number;
  discount?: number;
  vatAmount?: number;
  totalAmount: number;
  totalCost?: number;
  totalProfit?: number;
  paymentMethod: 'cash' | 'mobile' | 'card' | 'telebirr' | 'bank_transfer';
  amountPaid?: number;
  changeAmount?: number;
  createdAt: string;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
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

export interface User {
  user_id: string;
  shop_id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cashier' | 'inventory' | 'accountant';
  status: 'active' | 'inactive';
  created_at: string;
}
