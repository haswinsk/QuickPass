// Mock Database Simulator for Campus QuickPass SaaS Platform
// Simulates MongoDB collections, Express.js controllers, JWT auth, and sequential token generation.

export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'organization_admin' | 'super_admin';
  organizationId?: string;
  createdAt: string;
}

export interface Organization {
  _id: string;
  organizationName: string;
  organizationType: 'xerox_stationery' | 'canteen';
  email: string;
  phone: string;
  address: string;
  logo: string; // Base64 or image URL
  description: string;
  isApproved: boolean; // Super admin approval system
  createdAt: string;
}

export interface Canteen {
  _id: string;
  organizationId: string;
  name: string;
  menu: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  image?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  category: string;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  organizationId: string;
  organizationName: string;
  canteenId?: string; // Only for canteen orders
  canteenName?: string; // Only for canteen orders
  userId: string;
  userName: string;
  userEmail: string;
  orderType: 'xerox' | 'stationery' | 'canteen';
  // Xerox Fields
  fileURL?: string;
  fileName?: string;
  fileSize?: string;
  copies?: number;
  printType?: 'color' | 'bw';
  // Stationery / Canteen Fields
  items?: OrderItem[];
  quantity: number; // total quantity
  paymentType: 'online' | 'cod';
  paymentStatus: 'Paid' | 'Pay on Pickup';
  orderStatus: 'Preparing' | 'Ready' | 'Collected';
  tokenNumber: string;
  createdAt: string;
  razorpayPaymentId?: string;
}

// Initial Seed Data - Empty (Production-ready)
const DEFAULT_ORGANIZATIONS: Organization[] = [];

// Empty canteens collection
const DEFAULT_CANTEENS: Canteen[] = [];

// Empty inventory
const DEFAULT_INVENTORY: Record<string, InventoryItem[]> = {};

// Only super admin available for initial setup
const DEFAULT_USERS: User[] = [
  {
    _id: "user-superadmin",
    name: "Campus Chief Administrator",
    email: "admin@campus.edu",
    password: "password123",
    role: "super_admin",
    createdAt: new Date().toISOString()
  }
];

// Empty orders collection
const DEFAULT_ORDERS: Order[] = [];

// In-Memory Database instances loaded from LocalStorage
class MockDatabase {
  users: User[] = [];
  organizations: Organization[] = [];
  canteens: Canteen[] = [];
  inventories: Record<string, InventoryItem[]> = {};
  orders: Order[] = [];
  tokenCounters: Record<string, number> = {};

  constructor() {
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const versionStr = localStorage.getItem('qp_db_version');
      const currentVersion = '1.0.0-prod';
      
      // Clear old cache if version doesn't match
      if (versionStr !== currentVersion) {
        localStorage.clear();
        this.resetToDefaults();
        return;
      }

      const usersStr = localStorage.getItem('qp_users');
      const orgsStr = localStorage.getItem('qp_organizations');
      const canteensStr = localStorage.getItem('qp_canteens');
      const inventoryStr = localStorage.getItem('qp_inventories');
      const ordersStr = localStorage.getItem('qp_orders');
      const countersStr = localStorage.getItem('qp_token_counters');

      if (!usersStr || !orgsStr || !canteensStr || !ordersStr) {
        // Run seed
        this.resetToDefaults();
      } else {
        this.users = JSON.parse(usersStr);
        this.organizations = JSON.parse(orgsStr);
        this.canteens = JSON.parse(canteensStr);
        this.inventories = JSON.parse(inventoryStr || '{}');
        this.orders = JSON.parse(ordersStr);
        this.tokenCounters = JSON.parse(countersStr || '{}');
      }
    } catch (e) {
      console.error("Failed to load local DB, seeding default database.", e);
      this.resetToDefaults();
    }
  }

  saveToStorage() {
    localStorage.setItem('qp_db_version', '1.0.0-prod');
    localStorage.setItem('qp_users', JSON.stringify(this.users));
    localStorage.setItem('qp_organizations', JSON.stringify(this.organizations));
    localStorage.setItem('qp_canteens', JSON.stringify(this.canteens));
    localStorage.setItem('qp_inventories', JSON.stringify(this.inventories));
    localStorage.setItem('qp_orders', JSON.stringify(this.orders));
    localStorage.setItem('qp_token_counters', JSON.stringify(this.tokenCounters));
  }

  resetToDefaults() {
    this.users = [...DEFAULT_USERS];
    this.organizations = [...DEFAULT_ORGANIZATIONS];
    this.canteens = [...DEFAULT_CANTEENS];
    this.inventories = { ...DEFAULT_INVENTORY };
    this.orders = [...DEFAULT_ORDERS];
    
    // Token counters will be created as organizations are added
    this.tokenCounters = {};
    
    this.saveToStorage();
  }

  // Generate Token System
  // Rules: tokens must never duplicate, organization-specific, auto increment.
  // Xerox format: X-101, Stationery: S-101, Canteen: C1-101, C2-101 etc.
  getNextToken(orgId: string, orderType: 'xerox' | 'stationery' | 'canteen', canteenId?: string): string {
    let key = `${orgId}-${orderType}`;
    if (orderType === 'canteen' && canteenId) {
      key = `${orgId}-${canteenId}`;
    }

    const currentNum = this.tokenCounters[key] || 101;
    this.tokenCounters[key] = currentNum + 1;
    this.saveToStorage();

    if (orderType === 'xerox') {
      return `X-${currentNum}`;
    } else if (orderType === 'stationery') {
      return `S-${currentNum}`;
    } else if (orderType === 'canteen') {
      // Find canteen number index
      // E.g., C1, C2 based on canteen order in organization
      const orgCanteens = this.canteens.filter(c => c.organizationId === orgId);
      const index = orgCanteens.findIndex(c => c._id === canteenId);
      const canteenNum = index !== -1 ? (index + 1) : 1;
      return `C${canteenNum}-${currentNum}`;
    }
    return `T-${currentNum}`;
  }

  // Controllers / Auth Actions
  registerStudent(name: string, email: string, password: string): { success: boolean; user?: User; error?: string } {
    if (this.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "User already exists with this email address." };
    }

    const newUser: User = {
      _id: `user-${Date.now()}`,
      name,
      email,
      password, // In-memory/local storage plain-text acting as hashed
      role: 'student',
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveToStorage();
    return { success: true, user: newUser };
  }

  registerOrganization(data: {
    orgName: string;
    orgType: 'xerox_stationery' | 'canteen';
    email: string;
    phone: string;
    address: string;
    logo: string;
    description: string;
    adminName: string;
    adminEmail: string;
    adminPass: string;
  }): { success: boolean; organization?: Organization; adminUser?: User; error?: string } {
    
    // Check duplicates
    if (this.organizations.some(o => o.email.toLowerCase() === data.email.toLowerCase() || o.organizationName.toLowerCase() === data.orgName.toLowerCase())) {
      return { success: false, error: "An organization with this email or name already exists." };
    }
    if (this.users.some(u => u.email.toLowerCase() === data.adminEmail.toLowerCase())) {
      return { success: false, error: "An admin user already exists with this email." };
    }

    const orgId = `org-${Date.now()}`;
    const newOrg: Organization = {
      _id: orgId,
      organizationName: data.orgName,
      organizationType: data.orgType,
      email: data.email,
      phone: data.phone,
      address: data.address,
      logo: data.logo || (data.orgType === 'canteen' ? "🍱" : "✏️"),
      description: data.description,
      isApproved: false, // Must be approved by super admin
      createdAt: new Date().toISOString()
    };

    const newAdmin: User = {
      _id: `user-${Date.now() + 1}`,
      name: data.adminName,
      email: data.adminEmail,
      password: data.adminPass,
      role: 'organization_admin',
      organizationId: orgId,
      createdAt: new Date().toISOString()
    };

    // If canteen type, initialize at least one default canteen
    if (data.orgType === 'canteen') {
      const defaultCanteen: Canteen = {
        _id: `cant-${orgId}-1`,
        organizationId: orgId,
        name: "Canteen 1 (Main Hall)",
        menu: [
          { id: `m-${orgId}-1`, name: "Deluxe Combo Meal", price: 120, category: "Combo", isAvailable: true },
          { id: `m-${orgId}-2`, name: "Hot Tea / Milk Chai", price: 15, category: "Beverages", isAvailable: true },
          { id: `m-${orgId}-3`, name: "Samosa (Plate of 2)", price: 30, category: "Snacks", isAvailable: true }
        ]
      };
      this.canteens.push(defaultCanteen);
    } else {
      // Initialize basic stationery inventory
      this.inventories[orgId] = [
        { id: `inv-${orgId}-1`, name: "A4 Printing Paper (Pack of 100)", price: 90, stock: 250, isAvailable: true, category: "Paper" },
        { id: `inv-${orgId}-2`, name: "Exam Writing Pad", price: 65, stock: 80, isAvailable: true, category: "Stationery" },
        { id: `inv-${orgId}-3`, name: "Ballpoint Pen Black", price: 10, stock: 300, isAvailable: true, category: "Writing" }
      ];
    }

    this.organizations.push(newOrg);
    this.users.push(newAdmin);
    this.saveToStorage();

    return { success: true, organization: newOrg, adminUser: newAdmin };
  }

  // Google Sign-In Simulation
  loginWithGoogle(email: string, name: string): { success: boolean; user: User; token: string } {
    let user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Auto-create student user if they don't exist
      user = {
        _id: `user-${Date.now()}`,
        name: name,
        email: email,
        role: 'student',
        createdAt: new Date().toISOString()
      };
      this.users.push(user);
      this.saveToStorage();
    }

    // Generate JWT payload simulation
    const simulatedToken = this.generateSimulatedJWT(user);
    return { success: true, user, token: simulatedToken };
  }

  loginWithEmail(email: string, pass: string): { success: boolean; user?: User; token?: string; error?: string } {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    if (user.password !== pass) {
      return { success: false, error: "Invalid password credentials." };
    }

    // Generate JWT payload simulation
    const simulatedToken = this.generateSimulatedJWT(user);
    return { success: true, user, token: simulatedToken };
  }

  generateSimulatedJWT(user: User): string {
    // Generate JWT synchronously using the API_SECRET
    // Note: generateJWT is async, but we'll use a synchronous fallback for the mock
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      iat: now,
      exp: now + (60 * 60 * 24) // 24 hours expiry
    };
    
    const headerEncoded = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payloadEncoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // Generate a signature using the API secret (simple hash for sync context)
    const secret = 'FSCZWTHkSpUk8dJyBwNvTSx_Xo4';
    const input = `${headerEncoded}.${payloadEncoded}`;
    let hash = 0;
    const combined = input + secret;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const signature = Math.abs(hash).toString(16).padStart(8, '0');
    
    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  // Order Operations
  placeXeroxOrder(data: {
    userId: string;
    orgId: string;
    fileData: { name: string; size: string; content: string };
    copies: number;
    printType: 'color' | 'bw';
    paymentType: 'online' | 'cod';
    paymentStatus: 'Paid' | 'Pay on Pickup';
    paymentId?: string;
  }): { success: boolean; order?: Order; error?: string } {
    
    const user = this.users.find(u => u._id === data.userId);
    const org = this.organizations.find(o => o._id === data.orgId);
    if (!user || !org) {
      return { success: false, error: "User or Organization not found." };
    }

    // File validation simulation
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = data.fileData.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return { success: false, error: "Unsupported file type. Only PDF, JPG, and PNG are allowed." };
    }

    // Size validation - assume data.fileData.size is formatted e.g. "4.2 MB" or similar
    const sizeVal = parseFloat(data.fileData.size);
    if (data.fileData.size.includes('GB') || (data.fileData.size.includes('MB') && sizeVal > 5.0)) {
      return { success: false, error: "File too large. Maximum allowed file size is 5MB." };
    }

    const token = this.getNextToken(data.orgId, 'xerox');

    const newOrder: Order = {
      _id: `order-${Date.now()}`,
      organizationId: data.orgId,
      organizationName: org.organizationName,
      userId: data.userId,
      userName: user.name,
      userEmail: user.email,
      orderType: 'xerox',
      fileURL: data.fileData.content, // Base64 content
      fileName: data.fileData.name,
      fileSize: data.fileData.size,
      copies: data.copies,
      printType: data.printType,
      quantity: data.copies,
      paymentType: data.paymentType,
      paymentStatus: data.paymentStatus,
      orderStatus: 'Preparing',
      tokenNumber: token,
      createdAt: new Date().toISOString(),
      razorpayPaymentId: data.paymentId
    };

    this.orders.unshift(newOrder); // Add to beginning of queue
    this.saveToStorage();
    return { success: true, order: newOrder };
  }

  placeStationeryOrder(data: {
    userId: string;
    orgId: string;
    items: Array<{ id: string; name: string; price: number; quantity: number }>;
    paymentType: 'online' | 'cod';
    paymentStatus: 'Paid' | 'Pay on Pickup';
    paymentId?: string;
  }): { success: boolean; order?: Order; error?: string } {

    const user = this.users.find(u => u._id === data.userId);
    const org = this.organizations.find(o => o._id === data.orgId);
    if (!user || !org) {
      return { success: false, error: "User or Organization not found." };
    }

    if (data.items.length === 0) {
      return { success: false, error: "Cart is empty." };
    }

    // Validate inventory and deduct stock
    const orgInventory = this.inventories[data.orgId] || [];
    for (const item of data.items) {
      const invItem = orgInventory.find(i => i.id === item.id);
      if (!invItem) {
        return { success: false, error: `Item ${item.name} is no longer in stock.` };
      }
      if (invItem.stock < item.quantity) {
        return { success: false, error: `Insufficient stock for ${item.name}. Available: ${invItem.stock}` };
      }
    }

    // Deduct stock
    for (const item of data.items) {
      const invItem = orgInventory.find(i => i.id === item.id)!;
      invItem.stock -= item.quantity;
      if (invItem.stock === 0) {
        invItem.isAvailable = false;
      }
    }

    const token = this.getNextToken(data.orgId, 'stationery');
    const totalQty = data.items.reduce((sum, item) => sum + item.quantity, 0);

    const newOrder: Order = {
      _id: `order-${Date.now()}`,
      organizationId: data.orgId,
      organizationName: org.organizationName,
      userId: data.userId,
      userName: user.name,
      userEmail: user.email,
      orderType: 'stationery',
      items: data.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
      quantity: totalQty,
      paymentType: data.paymentType,
      paymentStatus: data.paymentStatus,
      orderStatus: 'Preparing',
      tokenNumber: token,
      createdAt: new Date().toISOString(),
      razorpayPaymentId: data.paymentId
    };

    this.orders.unshift(newOrder);
    this.saveToStorage();
    return { success: true, order: newOrder };
  }

  placeCanteenOrder(data: {
    userId: string;
    orgId: string;
    canteenId: string;
    items: Array<{ id: string; name: string; price: number; quantity: number }>;
    paymentId: string; // Mandatory online payment
  }): { success: boolean; order?: Order; error?: string } {

    const user = this.users.find(u => u._id === data.userId);
    const org = this.organizations.find(o => o._id === data.orgId);
    const canteen = this.canteens.find(c => c._id === data.canteenId);

    if (!user || !org || !canteen) {
      return { success: false, error: "User, Organization, or Canteen not found." };
    }

    if (data.items.length === 0) {
      return { success: false, error: "Cart is empty." };
    }

    // Check availability
    for (const item of data.items) {
      const menuItem = canteen.menu.find(m => m.id === item.id);
      if (!menuItem || !menuItem.isAvailable) {
        return { success: false, error: `Food item ${item.name} is currently unavailable.` };
      }
    }

    const token = this.getNextToken(data.orgId, 'canteen', data.canteenId);
    const totalQty = data.items.reduce((sum, i) => sum + i.quantity, 0);

    const newOrder: Order = {
      _id: `order-${Date.now()}`,
      organizationId: data.orgId,
      organizationName: org.organizationName,
      canteenId: data.canteenId,
      canteenName: canteen.name,
      userId: data.userId,
      userName: user.name,
      userEmail: user.email,
      orderType: 'canteen',
      items: data.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
      quantity: totalQty,
      paymentType: 'online',
      paymentStatus: 'Paid', // Mandated
      orderStatus: 'Preparing',
      tokenNumber: token,
      createdAt: new Date().toISOString(),
      razorpayPaymentId: data.paymentId
    };

    this.orders.unshift(newOrder);
    this.saveToStorage();
    return { success: true, order: newOrder };
  }

  // Update Status
  updateOrderStatus(orderId: string, status: 'Preparing' | 'Ready' | 'Collected'): boolean {
    const orderIndex = this.orders.findIndex(o => o._id === orderId);
    if (orderIndex === -1) return false;
    
    this.orders[orderIndex].orderStatus = status;
    if (status === 'Collected') {
      this.orders[orderIndex].paymentStatus = 'Paid'; // Force paid on collection
    }
    
    this.saveToStorage();
    return true;
  }

  // Update Inventory Item (Xerox / Stationery)
  updateInventoryItem(orgId: string, item: InventoryItem): boolean {
    if (!this.inventories[orgId]) {
      this.inventories[orgId] = [];
    }
    const index = this.inventories[orgId].findIndex(i => i.id === item.id);
    if (index !== -1) {
      this.inventories[orgId][index] = item;
    } else {
      this.inventories[orgId].push(item);
    }
    this.saveToStorage();
    return true;
  }

  deleteInventoryItem(orgId: string, itemId: string): boolean {
    if (!this.inventories[orgId]) return false;
    this.inventories[orgId] = this.inventories[orgId].filter(i => i.id !== itemId);
    this.saveToStorage();
    return true;
  }

  // Manage Canteens & Menus
  addCanteen(orgId: string, name: string): Canteen {
    const newCanteen: Canteen = {
      _id: `cant-${orgId}-${Date.now()}`,
      organizationId: orgId,
      name,
      menu: []
    };
    this.canteens.push(newCanteen);
    this.tokenCounters[`${orgId}-${newCanteen._id}`] = 101;
    this.saveToStorage();
    return newCanteen;
  }

  updateCanteenMenu(canteenId: string, menu: MenuItem[]): boolean {
    const index = this.canteens.findIndex(c => c._id === canteenId);
    if (index === -1) return false;
    this.canteens[index].menu = menu;
    this.saveToStorage();
    return true;
  }

  // Super Admin actions
  approveOrganization(orgId: string): boolean {
    const index = this.organizations.findIndex(o => o._id === orgId);
    if (index === -1) return false;
    this.organizations[index].isApproved = true;
    this.saveToStorage();
    return true;
  }

  deleteOrganization(orgId: string): boolean {
    this.organizations = this.organizations.filter(o => o._id !== orgId);
    this.canteens = this.canteens.filter(c => c.organizationId !== orgId);
    delete this.inventories[orgId];
    // Keep order history but remove organization references if needed or filter
    this.saveToStorage();
    return true;
  }

  deleteUser(userId: string): boolean {
    this.users = this.users.filter(u => u._id !== userId);
    this.saveToStorage();
    return true;
  }
}

export const db = new MockDatabase();
