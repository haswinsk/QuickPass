import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, ordersAPI, organizationsAPI, uploadAPI, paymentsAPI } from '../api/client';
import { signInWithGoogle, firebaseSignOut } from '../config/firebase';
import { openRazorpayCheckout, loadRazorpayScript, RazorpaySuccessResponse } from '../config/razorpay';
import { SessionManager } from '../config/api';
import { Toast } from '../components/Toast';

// Types
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'organization_admin' | 'super_admin';
  organizationId?: string;
}

interface Organization {
  _id: string;
  organizationName: string;
  organizationType: 'xerox_stationery' | 'canteen';
  email: string;
  phone: string;
  address: string;
  logo: string;
  description: string;
  isApproved: boolean;
  createdAt: string;
}

interface Canteen {
  _id: string;
  organizationId: string;
  name: string;
  menu: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  image?: string;
}

interface Order {
  _id: string;
  organizationId: string;
  organizationName: string;
  canteenId?: string;
  canteenName?: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderType: 'xerox' | 'stationery' | 'canteen';
  fileURL?: string;
  fileName?: string;
  fileSize?: string;
  copies?: number;
  printType?: 'color' | 'bw';
  items?: Array<{ name: string; price: number; quantity: number }>;
  quantity: number;
  paymentType: 'online' | 'cod';
  paymentStatus: 'Paid' | 'Pay on Pickup';
  orderStatus: 'Preparing' | 'Ready' | 'Collected';
  tokenNumber: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  category: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentUser: User | null;
  token: string | null;
  organizations: Organization[];
  canteens: Canteen[];
  orders: Order[];
  usersList: User[];
  inventories: Record<string, InventoryItem[]>;
  cart: CartItem[];
  cartOrgId: string | null;
  cartCanteenId: string | null;
  isLoading: boolean;

  // Auth
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  registerStudent: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerOrg: (data: any) => Promise<{ success: boolean; error?: string }>;

  // Cart operations
  addToCart: (item: { id: string; name: string; price: number }, orgId: string, canteenId?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;

  // Student Actions with Razorpay
  placeXeroxOrder: (data: {
    orgId: string;
    fileData: { name: string; size: string; content: string; file?: File };
    copies: number;
    printType: 'color' | 'bw';
    paymentType: 'online' | 'cod';
    paymentStatus: 'Paid' | 'Pay on Pickup';
    paymentId?: string;
  }) => Promise<{ success: boolean; order?: Order; error?: string }>;

  placeStationeryOrder: (data: {
    orgId: string;
    paymentType: 'online' | 'cod';
    paymentStatus: 'Paid' | 'Pay on Pickup';
    paymentId?: string;
  }) => Promise<{ success: boolean; order?: Order; error?: string }>;

  placeCanteenOrder: (data: {
    orgId: string;
    canteenId: string;
    paymentId: string;
  }) => Promise<{ success: boolean; order?: Order; error?: string }>;

  // Razorpay
  initiateRazorpayPayment: (amount: number, description: string) => Promise<RazorpaySuccessResponse | null>;

  // Admin Actions
  updateOrderStatus: (orderId: string, status: 'Preparing' | 'Ready' | 'Collected') => Promise<boolean>;
  manageInventoryItem: (orgId: string, item: InventoryItem) => void;
  removeInventoryItem: (orgId: string, itemId: string) => void;
  createNewCanteen: (orgId: string, name: string) => Promise<Canteen | null>;
  deleteCanteen: (canteenId: string, orgId: string) => Promise<void>;
  updateMenu: (canteenId: string, menu: MenuItem[]) => void;

  // Super Admin Actions
  approveOrg: (orgId: string) => void;
  deleteOrg: (orgId: string) => void;
  deleteUser: (userId: string) => void;

  // Utility
  resetDatabase: () => void;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList] = useState<User[]>([]);
  const [inventories, setInventories] = useState<Record<string, InventoryItem[]>>({});

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOrgId, setCartOrgId] = useState<string | null>(null);
  const [cartCanteenId, setCartCanteenId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showNotification = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message: msg, type });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Load approved organizations (public)
      try {
        const orgs = await organizationsAPI.getOrganizations();
        console.log('Loaded organizations:', orgs);
        setOrganizations(orgs);

        // Load inventories for all organizations from MongoDB
        if (orgs.length > 0) {
          try {
            if (token) {
              const canteenPromises = orgs.map(async (org: Organization) => {
                try {
                  return await organizationsAPI.getCanteens(org._id);
                } catch (error) {
                  console.error(`Error loading canteens for ${org._id}:`, error);
                  return [];
                }
              });

              const canteenResults = await Promise.allSettled(canteenPromises);
              const allCanteens: Canteen[] = [];
              canteenResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                  const value = result.value as any;
                  if (Array.isArray(value)) {
                    allCanteens.push(...value);
                  }
                }
              });
              setCanteens(allCanteens);
            }

            const inventoryPromises = orgs.map(async (org: Organization) => {
              try {
                const inv = await organizationsAPI.getInventory(org._id);
                console.log(`Inventory for ${org._id} (${org.organizationName}):`, inv);
                return { orgId: org._id, items: inv?.items || [] };
              } catch (error) {
                console.error(`Error loading inventory for ${org._id}:`, error);
                return { orgId: org._id, items: [] };
              }
            });

            const inventoryResults = await Promise.allSettled(inventoryPromises);
            const inventoryMap: Record<string, InventoryItem[]> = {};
            inventoryResults.forEach((result) => {
              if (result.status === 'fulfilled') {
                const { orgId, items } = result.value;
                inventoryMap[orgId] = items;
              }
            });
            console.log('Final inventory map from MongoDB:', inventoryMap);
            setInventories(inventoryMap);
          } catch (error) {
            console.error('Error loading inventories from MongoDB:', error);
          }
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
        setOrganizations([]);
      }

      // Load orders only if authenticated
      if (token) {
        try {
          const orders = await ordersAPI.getOrders();
          setOrders(orders);

          // Load all organizations only if super admin
          if (currentUser?.role === 'super_admin') {
            try {
              const allOrgs = await organizationsAPI.getAllOrganizations();
              setOrganizations(allOrgs);
            } catch (error) {
              console.error('Error loading all organizations:', error);
            }
          }
        } catch (error) {
          console.error('Error loading orders:', error);
          setOrders([]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    console.log('AppContext useEffect - mounting');
    loadRazorpayScript();

    // Restore session using SessionManager
    const savedToken = SessionManager.getToken();
    const savedUser = SessionManager.getUser();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(savedUser as unknown as User);
      localStorage.setItem('auth_token', savedToken);
    }

    // Load public data
    console.log('Loading initial data...');
    loadData();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const result = await authAPI.login(email, pass);
      setIsLoading(false);
      if (result.success && result.user && result.token) {
        setCurrentUser(result.user);
        setToken(result.token);
        SessionManager.setToken(result.token);
        SessionManager.setUser(result.user);
        localStorage.setItem('auth_token', result.token);
        showNotification(`Welcome back, ${result.user.name}!`, 'success');
        loadData();
        return { success: true };
      }
      return { success: false, error: 'Authentication failed.' };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Authentication failed.' };
    }
  };

  const loginWithGoogleFn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result) {
        setIsLoading(false);
        return { success: false, error: 'Google sign-in was cancelled or failed.' };
      }

      const { user: firebaseUser } = result;
      const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student';
      const email = firebaseUser.email || '';

      const apiResult = await authAPI.loginWithGoogle(email, name);
      setIsLoading(false);
      
      if (apiResult.success && apiResult.user && apiResult.token) {
        setCurrentUser(apiResult.user);
        setToken(apiResult.token);
        SessionManager.setToken(apiResult.token);
        SessionManager.setUser(apiResult.user);
        localStorage.setItem('auth_token', apiResult.token);
        loadData();
        showNotification(`Signed in as ${name} via Google!`, 'success');
        return { success: true };
      }

      return { success: false, error: 'Failed to create or find user account.' };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Google sign-in failed.' };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
    } catch {
      // Firebase sign-out may fail if not signed in via Firebase
    }
    setCurrentUser(null);
    setToken(null);
    SessionManager.clearSession();
    localStorage.removeItem('auth_token');
    setCart([]);
    setCartOrgId(null);
    setCartCanteenId(null);
    showNotification('You have been signed out.', 'info');
  };

  const registerStudent = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const result = await authAPI.registerStudent(name, email, pass);
      setIsLoading(false);
      if (result.success) {
        showNotification('Registration successful! You can now log in.', 'success');
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Registration failed.' };
    }
  };

  const registerOrg = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await authAPI.registerOrganization(data);
      setIsLoading(false);
      if (result.success) {
        loadData();
        showNotification(`Organization "${data.orgName}" registered successfully! Awaiting approval.`, 'success');
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Registration failed.' };
    }
  };

  // Razorpay Integration with Backend Verification
  const initiateRazorpayPayment = useCallback(async (amount: number, description: string): Promise<RazorpaySuccessResponse | null> => {
    try {
      // Create order on backend
      const orderResult = await paymentsAPI.createOrder(amount, 'INR', `order_${Date.now()}`);
      
      if (!orderResult.success || !orderResult.order) {
        showNotification('Failed to create payment order', 'error');
        return null;
      }

      return new Promise((resolve) => {
        openRazorpayCheckout({
          amount,
          name: 'Campus QuickPass',
          description,
          orderId: orderResult.order.id,
          prefill: {
            name: currentUser?.name || '',
            email: currentUser?.email || '',
          },
          onSuccess: async (response: RazorpaySuccessResponse) => {
            // Verify payment on backend
            const verifyResult = await paymentsAPI.verifyPayment(
              response.razorpay_order_id || '',
              response.razorpay_payment_id || '',
              response.razorpay_signature || ''
            );

            if (verifyResult.success) {
              resolve(response);
            } else {
              showNotification('Payment verification failed', 'error');
              resolve(null);
            }
          },
          onFailure: () => {
            resolve(null);
          },
        });
      });
    } catch (error: any) {
      showNotification(error.message || 'Payment initiation failed', 'error');
      return null;
    }
  }, [currentUser, showNotification]);

  // Cart operations
  const addToCart = (item: { id: string; name: string; price: number }, orgId: string, canteenId?: string) => {
    if (cartOrgId !== orgId || (canteenId && cartCanteenId !== canteenId)) {
      setCart([{ ...item, quantity: 1 }]);
      setCartOrgId(orgId);
      setCartCanteenId(canteenId || null);
      showNotification(`Started new cart — added ${item.name}`, 'info');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
    showNotification(`Added ${item.name} to cart`, 'success');
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const filtered = prev.filter(i => i.id !== itemId);
      if (filtered.length === 0) {
        setCartOrgId(null);
        setCartCanteenId(null);
      }
      return filtered;
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(itemId); return; }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setCart([]);
    setCartOrgId(null);
    setCartCanteenId(null);
  };

  // Student orders
  const placeXeroxOrder = async (data: {
    orgId: string;
    fileData: { name: string; size: string; content: string; file?: File };
    copies: number;
    printType: 'color' | 'bw';
    paymentType: 'online' | 'cod';
    paymentStatus: 'Paid' | 'Pay on Pickup';
    paymentId?: string;
  }) => {
    if (!currentUser) return { success: false, error: 'Must be logged in.' };
    setIsLoading(true);
    try {
      let fileURL = data.fileData.content;
      
      // Upload file to Cloudinary if a File object is provided
      if (data.fileData.file) {
        const uploadResult = await uploadAPI.uploadFile(data.fileData.file);
        if (uploadResult.success && uploadResult.url) {
          fileURL = uploadResult.url;
        }
      }

      const result = await ordersAPI.placeXeroxOrder({
        orgId: data.orgId,
        fileData: {
          name: data.fileData.name,
          size: data.fileData.size,
          content: fileURL
        },
        copies: data.copies,
        printType: data.printType,
        paymentType: data.paymentType,
        paymentStatus: data.paymentStatus,
        paymentId: data.paymentId
      });
      setIsLoading(false);
      if (result.success && result.order) {
        loadData();
        showNotification(`Xerox Order Placed! Token: ${result.order.tokenNumber}`, 'success');
        return { success: true, order: result.order };
      }
      return { success: false, error: 'Order placement failed' };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Order placement failed.' };
    }
  };

  const placeStationeryOrder = async (data: {
    orgId: string;
    paymentType: 'online' | 'cod';
    paymentStatus: 'Paid' | 'Pay on Pickup';
    paymentId?: string;
  }) => {
    if (!currentUser) return { success: false, error: 'Must be logged in.' };
    if (cart.length === 0) return { success: false, error: 'Cart is empty.' };
    setIsLoading(true);
    try {
      const result = await ordersAPI.placeStationeryOrder({
        orgId: data.orgId,
        items: cart,
        paymentType: data.paymentType,
        paymentStatus: data.paymentStatus,
        paymentId: data.paymentId
      });
      setIsLoading(false);
      if (result.success && result.order) {
        clearCart();
        loadData();
        showNotification(`Stationery Order Placed! Token: ${result.order.tokenNumber}`, 'success');
        return { success: true, order: result.order };
      }
      return { success: false, error: 'Order placement failed' };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Order placement failed.' };
    }
  };

  const placeCanteenOrder = async (data: {
    orgId: string;
    canteenId: string;
    paymentId: string;
  }) => {
    if (!currentUser) return { success: false, error: 'Must be logged in.' };
    if (cart.length === 0) return { success: false, error: 'Cart is empty.' };
    setIsLoading(true);
    try {
      const result = await ordersAPI.placeCanteenOrder({
        orgId: data.orgId,
        canteenId: data.canteenId,
        items: cart,
        paymentId: data.paymentId
      });
      setIsLoading(false);
      if (result.success && result.order) {
        clearCart();
        loadData();
        showNotification(`Canteen Order Placed! Token: ${result.order.tokenNumber}`, 'success');

        // Audio notification
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        } catch {}

        return { success: true, order: result.order };
      }
      return { success: false, error: 'Order placement failed' };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Order placement failed.' };
    }
  };

  // Admin Actions
  const updateOrderStatus = async (orderId: string, status: 'Preparing' | 'Ready' | 'Collected') => {
    try {
      await ordersAPI.updateOrderStatus(orderId, status);
      loadData();
      showNotification(`Order updated to "${status}"`, 'success');
      return true;
    } catch (error) {
      showNotification('Failed to update order', 'error');
      return false;
    }
  };

  const manageInventoryItem = async (orgId: string, item: InventoryItem) => {
    try {
      const inventory = await organizationsAPI.getInventory(orgId);
      const items = inventory?.items || [];
      const existingIndex = items.findIndex((i: InventoryItem) => i.id === item.id);
      if (existingIndex !== -1) {
        items[existingIndex] = item;
      } else {
        items.push(item);
      }
      await organizationsAPI.updateInventory(orgId, items);
      
      console.log('Updated items array:', items);
      console.log('Updating inventory for orgId:', orgId);
      
      // Update state immediately for UI
      setInventories(prev => {
        console.log('Previous inventories:', prev);
        const newInventories = {
          ...prev,
          [orgId]: items
        };
        console.log('New inventories:', newInventories);
        return newInventories;
      });
      
      showNotification(`Inventory "${item.name}" updated`, 'success');
    } catch (error) {
      console.error('Error managing inventory:', error);
      showNotification('Failed to update inventory', 'error');
    }
  };

  const removeInventoryItem = async (orgId: string, itemId: string) => {
    try {
      const inventory = await organizationsAPI.getInventory(orgId);
      const items = inventory?.items?.filter((i: InventoryItem) => i.id !== itemId) || [];
      await organizationsAPI.updateInventory(orgId, items);
      
      // Reload inventory for this organization only
      const updatedInv = await organizationsAPI.getInventory(orgId);
      setInventories(prev => ({
        ...prev,
        [orgId]: updatedInv?.items || []
      }));
      
      showNotification('Item removed from inventory', 'info');
    } catch (error) {
      console.error('Error removing inventory item:', error);
      showNotification('Failed to remove item', 'error');
    }
  };

  const createNewCanteen = async (orgId: string, name: string) => {
    try {
      const response = await organizationsAPI.addCanteen(orgId, { name });
      const freshCanteen = response?.canteen || response;
      if (freshCanteen?._id) {
        setCanteens(prev => [...prev, freshCanteen]);
      }
      loadData();
      showNotification(`New Canteen "${name}" created`, 'success');
      return freshCanteen;
    } catch (error) {
      showNotification('Failed to create canteen', 'error');
      return null;
    }
  };

  const deleteCanteen = async (canteenId: string, orgId: string) => {
    try {
      await organizationsAPI.deleteCanteen(canteenId, orgId);
      setCanteens(prev => prev.filter(canteen => canteen._id !== canteenId));
      loadData();
      showNotification('Pavilion deleted', 'info');
    } catch (error) {
      showNotification('Failed to delete pavilion', 'error');
    }
  };

  const updateMenu = async (canteenId: string, menu: MenuItem[]) => {
    try {
      await organizationsAPI.updateCanteenMenu(canteenId, menu);
      loadData();
      showNotification('Menu updated successfully', 'success');
    } catch (error) {
      showNotification('Failed to update menu', 'error');
    }
  };

  // Super Admin
  const approveOrg = async (orgId: string) => {
    try {
      await organizationsAPI.approveOrganization(orgId);
      loadData();
      showNotification('Organization approved', 'success');
    } catch (error) {
      showNotification('Failed to approve organization', 'error');
    }
  };

  const deleteOrg = async (orgId: string) => {
    try {
      await organizationsAPI.deleteOrganization(orgId);
      loadData();
      showNotification('Organization deleted', 'error');
    } catch (error) {
      showNotification('Failed to delete organization', 'error');
    }
  };

  const deleteUser = () => {
    showNotification('User deletion not implemented in API yet', 'info');
  };

  const resetDatabase = () => {
    showNotification('Database reset not available with real DB', 'info');
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      token,
      organizations,
      canteens,
      orders,
      usersList,
      inventories,
      cart,
      cartOrgId,
      cartCanteenId,
      isLoading,
      login,
      loginWithGoogle: loginWithGoogleFn,
      logout,
      registerStudent,
      registerOrg,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      placeXeroxOrder,
      placeStationeryOrder,
      placeCanteenOrder,
      initiateRazorpayPayment,
      updateOrderStatus,
      manageInventoryItem,
      removeInventoryItem,
      createNewCanteen,
      deleteCanteen,
      updateMenu,
      approveOrg,
      deleteOrg,
      deleteUser,
      resetDatabase,
      showNotification,
    }}>
      {children}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
