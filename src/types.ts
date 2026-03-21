export type UserRole = 'customer' | 'shop_owner' | 'admin' | 'manager' | 'accountant' | 'inventory' | 'owner';
export type SubscriptionPlan = 'basic' | 'pro' | 'premium' | 'featured';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface User {
  id: string;
  user_id: string;
  email: string;
  role: UserRole;
  name: string;
  language?: string;
  shop_id?: string;
  status?: string;
  wallet_id?: string;
  createdAt: string;
}

export interface MultiLangString {
  en: string;
  am?: string;
  om?: string;
  ti?: string;
  so?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  shopId: string;
  shopName?: string;
  imageUrl?: string;
}

export interface Sale {
  id?: string;
  saleId?: string; // Backward compatibility
  shop_id: string;
  shopId?: string; // Backward compatibility
  items: {
    productId: string;
    productName?: string; // Backward compatibility
    name: string;
    price: number;
    quantity: number;
    costPrice?: number; // Backward compatibility
    vatRate?: number; // Backward compatibility
    vatAmount?: number; // Backward compatibility
  }[];
  subtotal?: number; // Backward compatibility
  discount?: number; // Backward compatibility
  vatAmount?: number; // Backward compatibility
  total_amount: number;
  totalAmount?: number; // Backward compatibility
  totalCost?: number; // Backward compatibility
  totalProfit?: number; // Backward compatibility
  payment_method: 'cash' | 'sbr' | 'telebirr' | 'mobile_money';
  paymentMethod?: string; // Backward compatibility
  amountPaid?: number; // Backward compatibility
  changeAmount?: number; // Backward compatibility
  timestamp: string;
  createdAt?: string; // Backward compatibility
  cashier_id: string;
  cashierName?: string; // Backward compatibility
  customerId?: string; // Backward compatibility
  customerName?: string; // Backward compatibility
  customerPhone?: string; // Backward compatibility
}

export interface Shop {
  id: string;
  shopId: string;
  shopName?: string; // Backward compatibility
  ownerId: string;
  ownerUid?: string;
  ownerName?: string;
  name: string;
  description: string;
  category: string;
  place_id?: string; // Linked to Scouts
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  address?: string; // Backward compatibility
  phone?: string; // Backward compatibility
  email?: string; // Backward compatibility
  contact: {
    phone: string;
    email: string;
  };
  photos: string[];
  logoUrl?: string; // Backward compatibility
  bannerUrl?: string; // Backward compatibility
  verified_status: boolean;
  plan: SubscriptionPlan;
  subscriptionPlan?: SubscriptionPlan; // Backward compatibility
  subscriptionStatus?: string; // Backward compatibility
  subscriptionExpiryDate?: string; // Backward compatibility
  isMarketplaceEnabled?: boolean;
  isVatEnabled?: boolean;
  vatRate?: number;
  vatType?: 'inclusive' | 'exclusive';
  currency?: string;
  status?: string;
  slug?: string; // Backward compatibility
  createdAt: string;
  profitCalculationMethod?: string; // Backward compatibility
  onlineStoreEnabled?: boolean; // Backward compatibility
}

export interface Product {
  id: string;
  productId?: string; // Backward compatibility
  shopId: string;
  shopName?: string; // Backward compatibility
  name: MultiLangString | string;
  description: MultiLangString | string;
  price: number;
  costPrice: number;
  stock: number;
  quantity: number; // For cart/order items
  vatInclusive: boolean;
  vatRate?: number; // Backward compatibility
  vatType?: string; // Backward compatibility
  category: string;
  images: string[];
  imageUrl?: string; // Backward compatibility
  barcode?: string;
  qrCode?: string;
  isPublishedToMarketplace?: boolean;
  slug?: string; // Backward compatibility
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: MultiLangString | string;
  price: number;
  quantity: number;
  shopId: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderId?: string; // Backward compatibility
  orderNumber?: string; // Backward compatibility
  user_id: string;
  customerId?: string; // Backward compatibility
  customerName?: string; // Backward compatibility
  customer_name?: string; // Backward compatibility
  customerPhone?: string; // Backward compatibility
  customer_phone?: string; // Backward compatibility
  customerAddress?: string; // Backward compatibility
  customer_address?: string; // Backward compatibility
  shop_id: string;
  shopId?: string; // Backward compatibility
  products: OrderItem[];
  items?: OrderItem[]; // Backward compatibility
  total_price: number;
  total_amount?: number; // Backward compatibility
  totalAmount?: number; // Backward compatibility
  payment_method: 'SBR' | 'cash' | 'mobile_money' | 'telebirr' | 'bank_transfer' | 'sbr' | 'cod';
  paymentMethod?: string; // Backward compatibility
  paymentStatus?: string; // Backward compatibility
  payment_status?: string; // Backward compatibility
  status: OrderStatus;
  orderStatus?: OrderStatus; // Backward compatibility
  delivery_id?: string; // Linked to Runner Link
  delivery_type?: 'runner' | 'pickup';
  note?: string; // Backward compatibility
  createdAt: string;
  updatedAt?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance_sbr: number;
  balance_birr: number;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  shop_id: string;
  plan: SubscriptionPlan;
  cost_sbr: number;
  duration_days: number;
  active_status: boolean;
  expiryDate: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  user_id: string;
  shop_id?: string;
  product_id?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  runner_id?: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoff: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered';
  live_location?: {
    lat: number;
    lng: number;
  };
  updatedAt: string;
}

export interface SiteSettings {
  id: string;
  name: string;
  siteName?: string; // Backward compatibility
  description: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  primaryColor?: string; // Backward compatibility
  updatedAt: string;
}

export interface Branch {
  id: string;
  branchId?: string; // Backward compatibility
  shop_id: string;
  name: string;
  location: string;
  address?: string; // Backward compatibility
  phone: string;
  manager_id?: string;
  managerName?: string; // Backward compatibility
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Customer {
  id: string;
  customerId?: string; // Backward compatibility
  shop_id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  total_spent: number;
  orders_count: number;
  purchaseCount?: number; // Backward compatibility
  loyaltyPoints?: number; // Backward compatibility
  last_visit?: string;
  lastPurchaseDate?: string; // Backward compatibility
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  costPrice: number;
  vatRate: number;
  vatAmount: number;
  vatType?: string; // Backward compatibility
}

export interface Receipt {
  id: string;
  receiptId?: string; // Backward compatibility
  saleId: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  cashierName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  vatAmount: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
  timestamp: string;
  createdAt?: string; // Backward compatibility
}
