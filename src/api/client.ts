import { SessionManager } from '../config/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://quickpass-8f83.onrender.com/api';

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = SessionManager.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  },

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint: string, data: any) {
    const headers: Record<string, string> = {};
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  async patch(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

export const authAPI = {
  async login(email: string, password: string) {
    return apiClient.post('/auth/login', { email, password });
  },

  async registerStudent(name: string, email: string, password: string) {
    return apiClient.post('/auth/register/student', { name, email, password });
  },

  async registerOrganization(data: any) {
    return apiClient.post('/auth/register/organization', data);
  },

  async loginWithGoogle(email: string, name: string) {
    return apiClient.post('/auth/google', { email, name });
  },
};

export const uploadAPI = {
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/upload', formData);
  },

  async deleteFile(publicId: string) {
    return apiClient.delete(`/upload/${publicId}`);
  },
};

export const paymentsAPI = {
  async createOrder(amount: number, currency: string = 'INR', receipt?: string) {
    return apiClient.post('/payments/create-order', { amount, currency, receipt });
  },

  async verifyPayment(razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) {
    return apiClient.post('/payments/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
  },

  async getPaymentDetails(paymentId: string) {
    return apiClient.get(`/payments/${paymentId}`);
  },
};

export const ordersAPI = {
  async getOrders() {
    return apiClient.get('/orders');
  },

  async placeXeroxOrder(data: any) {
    return apiClient.post('/orders/xerox', data);
  },

  async placeStationeryOrder(data: any) {
    return apiClient.post('/orders/stationery', data);
  },

  async placeCanteenOrder(data: any) {
    return apiClient.post('/orders/canteen', data);
  },

  async updateOrderStatus(orderId: string, status: string) {
    return apiClient.patch(`/orders/${orderId}/status`, { status });
  },
};

export const organizationsAPI = {
  async getOrganizations() {
    return apiClient.get('/organizations/approved');
  },

  async getAllOrganizations() {
    return apiClient.get('/organizations');
  },

  async getOrganization(id: string) {
    return apiClient.get(`/organizations/${id}`);
  },

  async getCanteens(orgId: string) {
    return apiClient.get(`/organizations/${orgId}/canteens`);
  },

  async approveOrganization(id: string) {
    return apiClient.patch(`/organizations/${id}/approve`, {});
  },

  async deleteOrganization(id: string) {
    return apiClient.delete(`/organizations/${id}`);
  },

  async addCanteen(orgId: string, data: { name: string }) {
    return apiClient.post(`/organizations/${orgId}/canteens`, data);
  },

  async deleteCanteen(canteenId: string, orgId: string) {
    return apiClient.delete(`/organizations/${orgId}/canteens/${canteenId}`);
  },

  async updateMenu(canteenId: string, menu: any) {
    return apiClient.patch(`/organizations/canteens/${canteenId}/menu`, { menu });
  },

  async updateCanteenMenu(canteenId: string, menu: any) {
    return apiClient.patch(`/organizations/canteens/${canteenId}/menu`, { menu });
  },

  async getInventory(orgId: string) {
    return apiClient.get(`/organizations/${orgId}/inventory`);
  },

  async updateInventory(orgId: string, items: any) {
    return apiClient.patch(`/organizations/${orgId}/inventory`, { items });
  },
};
