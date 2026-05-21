// API Security Configuration
// Uses the API_SECRET for JWT signing, session verification, and secure operations

const API_SECRET = import.meta.env.VITE_API_SECRET;

// Generate HMAC-SHA256 signature (simulated for frontend-only app)
// In production, this would use crypto.createHmac on the backend
const generateSignature = async (payload: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(payload);

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback: simple hash simulation
    let hash = 0;
    const combined = payload + secret;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
};

// JWT Token structure
interface JWTHeader {
  alg: string;
  typ: string;
}

interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'organization_admin' | 'super_admin';
  organizationId?: string;
  iat: number;
  exp: number;
}

// Base64 URL encode
const base64UrlEncode = (data: string): string => {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Base64 URL decode
const base64UrlDecode = (str: string): string => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
};

// Generate a signed JWT token using the API secret
export const generateJWT = async (user: {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'organization_admin' | 'super_admin';
  organizationId?: string;
}): Promise<string> => {
  const header: JWTHeader = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    iat: now,
    exp: now + (60 * 60 * 24) // 24 hours
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;
  
  const signature = await generateSignature(signatureInput, API_SECRET);
  const signatureEncoded = base64UrlEncode(signature);

  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
};

// Verify and decode a JWT token
export const verifyJWT = async (token: string): Promise<JWTPayload | null> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    
    // Verify signature
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;
    const expectedSignature = await generateSignature(signatureInput, API_SECRET);
    const actualSignature = base64UrlDecode(signatureEncoded);

    if (expectedSignature !== actualSignature) {
      console.warn('JWT signature verification failed');
      return null;
    }

    // Decode payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadEncoded));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.warn('JWT token has expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

// Generate Razorpay order signature (for backend verification simulation)
export const generateRazorpaySignature = async (
  orderId: string,
  paymentId: string
): Promise<string> => {
  const payload = `${orderId}|${paymentId}`;
  return generateSignature(payload, API_SECRET);
};

// Verify Razorpay payment signature
export const verifyRazorpaySignature = async (
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> => {
  const expectedSignature = await generateRazorpaySignature(orderId, paymentId);
  return expectedSignature === signature;
};

// Session token management
export const SessionManager = {
  getToken: (): string | null => {
    return localStorage.getItem('qp_auth_token');
  },
  
  setToken: (token: string): void => {
    localStorage.setItem('qp_auth_token', token);
  },
  
  removeToken: (): void => {
    localStorage.removeItem('qp_auth_token');
  },
  
  getUser: (): JWTPayload | null => {
    const userStr = localStorage.getItem('qp_auth_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
  
  setUser: (user: any): void => {
    localStorage.setItem('qp_auth_user', JSON.stringify(user));
  },
  
  removeUser: (): void => {
    localStorage.removeItem('qp_auth_user');
  },
  
  clearSession: (): void => {
    localStorage.removeItem('qp_auth_token');
    localStorage.removeItem('qp_auth_user');
  }
};

export type { JWTPayload, JWTHeader };
