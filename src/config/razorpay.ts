// Razorpay Checkout Integration Utility

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  amount: number; // Amount in INR (will be converted to paise)
  orderId?: string; // Optional order ID from backend
  name: string; // Merchant name
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onFailure: (error: string) => void;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

// Load Razorpay checkout.js script dynamically
let scriptLoaded = false;
let scriptLoading: Promise<boolean> | null = null;

export const loadRazorpayScript = (): Promise<boolean> => {
  if (scriptLoaded) return Promise.resolve(true);
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoading;
};

// Open Razorpay Checkout
export const openRazorpayCheckout = async (options: RazorpayOptions): Promise<void> => {
  const loaded = await loadRazorpayScript();

  if (!loaded || !window.Razorpay) {
    options.onFailure('Failed to load Razorpay SDK. Please check your internet connection.');
    return;
  }

  const rzpInstance = new window.Razorpay({
    key: RAZORPAY_KEY_ID,
    amount: Math.round(options.amount * 100), // Convert to paise
    currency: 'INR',
    name: options.name || 'Campus QuickPass',
    description: options.description,
    handler: (response: RazorpaySuccessResponse) => {
      options.onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        options.onFailure('Payment cancelled by user.');
      },
      escape: true,
      confirm_close: true,
    },
    prefill: {
      name: options.prefill?.name || '',
      email: options.prefill?.email || '',
      contact: options.prefill?.contact || '',
    },
    theme: {
      color: '#2563EB',
    },
  });

  rzpInstance.on('payment.failed', (response: any) => {
    options.onFailure(response.error?.description || 'Payment failed. Please try again.');
  });

  rzpInstance.open();
};
