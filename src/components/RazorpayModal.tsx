import React, { useState } from 'react';
import { CreditCard, Smartphone, ShieldCheck, X } from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  amount: number;
  merchantName: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
  onClose: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  amount,
  merchantName,
  onSuccess,
  onFailure,
  onClose
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'nb'>('upi');
  const [upiId, setUpiId] = useState('student@okaxis');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate Razorpay Gateway Response Delay
    await new Promise(r => setTimeout(r, 1500));
    setIsProcessing(false);
    
    // Simulate 95% success rate or direct success trigger
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 11).toUpperCase();
    onSuccess(paymentId);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#1C2434] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-wide">Razorpay Checkout</h3>
              <p className="text-xs text-slate-400">Paying: {merchantName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount bar */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-500 uppercase">Amount to Pay</span>
          <span className="text-2xl font-bold text-slate-900">₹{amount.toFixed(2)}</span>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-xs text-slate-400 mb-4 uppercase font-semibold">Select Payment Method</p>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setSelectedMethod('upi')}
              className={`p-2.5 border rounded-lg flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                selectedMethod === 'upi'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span>UPI / QR</span>
            </button>

            <button
              onClick={() => setSelectedMethod('card')}
              className={`p-2.5 border rounded-lg flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                selectedMethod === 'card'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Card</span>
            </button>

            <button
              onClick={() => setSelectedMethod('nb')}
              className={`p-2.5 border rounded-lg flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                selectedMethod === 'nb'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span className="text-lg font-bold">🏛️</span>
              <span>NetBanking</span>
            </button>
          </div>

          {/* Form input based on selection */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-5 min-h-[90px] flex flex-col justify-center">
            {selectedMethod === 'upi' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Enter Virtual Payment Address (VPA)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="student@okaxis"
                    className="flex-1 bg-white border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Example: user@upi, mobile@ybl</p>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      maxLength={3}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'nb' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Select Bank</label>
                <select className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>State Bank of India (SBI)</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Punjab National Bank</option>
                </select>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm shadow-md"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Transaction...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Pay ₹{amount.toFixed(2)}</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                onFailure("Payment cancelled by student.");
                onClose();
              }}
              disabled={isProcessing}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              Cancel Payment & Return
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-slate-400">
            <span className="text-[10px]">Secure 256-bit SSL encrypted connection verified by Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
};
