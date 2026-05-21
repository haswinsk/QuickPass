import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Organization, Canteen } from '../mockDB';
import { uploadAPI } from '../api/client';
import { Search, Printer, Utensils, ChevronRight, ShoppingBag, Plus, Minus, CreditCard, Ticket, Trash2, Store, MapPin, Upload, CheckCircle } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    organizations,
    canteens,
    orders,
    inventories,
    cart,
    cartOrgId,
    cartCanteenId,
    addToCart,
    updateCartQuantity,
    clearCart,
    placeXeroxOrder,
    placeStationeryOrder,
    placeCanteenOrder,
    initiateRazorpayPayment,
    showNotification
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'shops' | 'tokens'>('shops');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'canteen' | 'xerox_stationery'>('all');
  
  // Selected Shop Details
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen | null>(null);
  
  // Xerox Form state with Cloudinary URL
  const [xeroxFile, setXeroxFile] = useState<{ name: string; size: string; content: string; cloudinaryUrl?: string; publicId?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copies, setCopies] = useState<number>(1);
  const [printType, setPrintType] = useState<'color' | 'bw'>('bw');
  const [xeroxPayType, setXeroxPayType] = useState<'online' | 'cod'>('cod');
  
  // Stationery Form state
  const [stationeryPayType, setStationeryPayType] = useState<'online' | 'cod'>('cod');

  // Checkout loading state
  const [isCheckout, setIsCheckout] = useState(false);

  // Real Cloudinary File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Invalid file type. Only PDF, JPG, and PNG are allowed.', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('File size exceeds 10MB limit.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Upload to backend (which uploads to Cloudinary)
    try {
      const result = await uploadAPI.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url) {
        setXeroxFile({
          name: file.name,
          size: formatBytes(file.size),
          content: result.url,
          cloudinaryUrl: result.url,
          publicId: result.publicId
        });
        showNotification(`File "${file.name}" uploaded successfully to cloud!`, 'success');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      // Fallback to local base64 if backend upload fails
      const reader = new FileReader();
      reader.onloadend = () => {
        setXeroxFile({
          name: file.name,
          size: formatBytes(file.size),
          content: reader.result as string
        });
        showNotification(`File "${file.name}" uploaded (local mode)`, 'info');
      };
      reader.readAsDataURL(file);
    }

    setIsUploading(false);
    setTimeout(() => setUploadProgress(0), 1000);
  };

  // Helper function to format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const selectPresetFile = (name: string, size: string) => {
    setXeroxFile({
      name,
      size,
      content: `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/raw/upload/v1/sample.pdf`
    });
    showNotification(`Selected preset file: ${name}`, 'info');
  };

  // Filter organizations: Only approved ones
  const filteredOrgs = organizations
    .filter(org => org.isApproved)
    .filter(org => {
      const matchSearch = org.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          org.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'all' || org.organizationType === typeFilter;
      return matchSearch && matchType;
    });

  // Calculate cart totals
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Init checkout with real Razorpay
  const triggerCheckout = async (type: 'canteen' | 'xerox' | 'stationery') => {
    if (type === 'canteen') {
      if (cart.length === 0) return;
      setIsCheckout(true);
      const result = await initiateRazorpayPayment(cartTotal, `Food Order at ${selectedOrg?.organizationName || 'Campus Canteen'}`);
      setIsCheckout(false);
      if (result) {
        const res = await placeCanteenOrder({
          orgId: selectedOrg!._id,
          canteenId: selectedCanteen!._id,
          paymentId: result.razorpay_payment_id
        });
        if (res.success) {
          setActiveTab('tokens');
          setSelectedCanteen(null);
          setSelectedOrg(null);
        }
      }
    } else if (type === 'xerox') {
      if (!xeroxFile) {
        showNotification('Please select or upload a document first.', 'error');
        return;
      }
      const cost = (printType === 'color' ? 10 : 2) * copies;
      let paymentId: string | undefined;
      if (xeroxPayType === 'online') {
        setIsCheckout(true);
        const result = await initiateRazorpayPayment(cost, `Xerox Print: ${xeroxFile.name}`);
        setIsCheckout(false);
        if (!result) return;
        paymentId = result.razorpay_payment_id;
      }
      const res = await placeXeroxOrder({
        orgId: selectedOrg!._id,
        fileData: xeroxFile,
        copies,
        printType,
        paymentType: xeroxPayType,
        paymentStatus: xeroxPayType === 'online' ? 'Paid' : 'Pay on Pickup',
        paymentId
      });
      if (res.success) {
        setXeroxFile(null);
        setCopies(1);
        setActiveTab('tokens');
        setSelectedOrg(null);
      }
    } else if (type === 'stationery') {
      if (cart.length === 0) return;
      let paymentId: string | undefined;
      if (stationeryPayType === 'online') {
        setIsCheckout(true);
        const result = await initiateRazorpayPayment(cartTotal, `Stationery Order at ${selectedOrg?.organizationName || 'Campus Store'}`);
        setIsCheckout(false);
        if (!result) return;
        paymentId = result.razorpay_payment_id;
      }
      const res = await placeStationeryOrder({
        orgId: selectedOrg!._id,
        paymentType: stationeryPayType,
        paymentStatus: stationeryPayType === 'online' ? 'Paid' : 'Pay on Pickup',
        paymentId
      });
      if (res.success) {
        setActiveTab('tokens');
        setSelectedOrg(null);
      }
    }
  };

  // Get active student orders
  const myOrders = orders.filter(o => o.userId === currentUser?._id);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Top Banner */}
      <div className="bg-blue-600 text-white py-6 px-6 sm:px-12 shadow-inner">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Ticket className="w-6 h-6 text-blue-200" />
              <span>Campus QuickPass Hub</span>
            </h1>
            <p className="text-xs text-blue-100 mt-1">Hello, {currentUser?.name || "Student"} • Digital Queue Pass Manager</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setSelectedOrg(null); setSelectedCanteen(null); setActiveTab('shops'); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'shops' && !selectedOrg
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'bg-blue-700/60 hover:bg-blue-700 text-white'
              }`}
            >
              Browse Campus Shops
            </button>
            <button
              onClick={() => { setSelectedOrg(null); setSelectedCanteen(null); setActiveTab('tokens'); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold relative transition-all ${
                activeTab === 'tokens'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'bg-blue-700/60 hover:bg-blue-700 text-white'
              }`}
            >
              My Tokens
              {myOrders.filter(o => o.orderStatus !== 'Collected').length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4.5 h-4.5 rounded-full text-[9px] flex items-center justify-center font-bold border border-white">
                  {myOrders.filter(o => o.orderStatus !== 'Collected').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        
        {/* SHOP BROWSING TAB */}
        {activeTab === 'shops' && !selectedOrg && (
          <div className="space-y-6">
            
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search canteens, stationery stores, Xerox hubs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    typeFilter === 'all'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setTypeFilter('canteen')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    typeFilter === 'canteen'
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Canteens</span>
                </button>
                <button
                  onClick={() => setTypeFilter('xerox_stationery')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    typeFilter === 'xerox_stationery'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Xerox & Stationery</span>
                </button>
              </div>
            </div>

            {/* Shop Grid */}
            {filteredOrgs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                <Store className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-sm">No campus vendors found matching filters.</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting the search terms or login to verify active listings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrgs.map(org => (
                  <div
                    key={org._id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-6 space-y-4">
                      {/* Logo and Type Badge */}
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-sm">
                          {org.logo.startsWith('data:') ? (
                            <img src={org.logo} alt={org.organizationName} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            org.logo
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          org.organizationType === 'canteen'
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {org.organizationType === 'canteen' ? 'Canteen' : 'Xerox & Stationery'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {org.organizationName}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {org.description}
                        </p>
                      </div>

                      <div className="space-y-1 text-slate-400 font-medium text-[11px]">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{org.address}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {org.organizationType === 'canteen' ? '3 Canteen Sub-units' : 'Print & Store Items'}
                      </span>
                      
                      <button
                        onClick={() => { setSelectedOrg(org); clearCart(); }}
                        className="bg-white hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200 hover:border-blue-600 font-semibold px-3 py-1 rounded text-xs flex items-center gap-1 transition-all"
                      >
                        <span>Open Shop</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORG DETAIL PAGE (XEROX & STATIONERY OR CANTEENS LIST) */}
        {activeTab === 'shops' && selectedOrg && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Back to shops bar */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => { setSelectedOrg(null); setSelectedCanteen(null); clearCart(); }}
                className="text-slate-500 hover:text-slate-900 text-xs font-semibold flex items-center gap-1"
              >
                ← Back to Campus Vendors list
              </button>
              
              <span className="text-xs text-slate-400 font-mono">Tenant ID: {selectedOrg._id}</span>
            </div>

            {/* Shop Masthead */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 items-center">
              <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl shadow-md">
                {selectedOrg.logo.startsWith('data:') ? (
                  <img src={selectedOrg.logo} alt={selectedOrg.organizationName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  selectedOrg.logo
                )}
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{selectedOrg.organizationName}</h2>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider max-w-max mx-auto md:mx-0 ${
                    selectedOrg.organizationType === 'canteen' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedOrg.organizationType === 'canteen' ? 'Canteen Hub' : 'Print & Supplies'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedOrg.description}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-400 font-medium">
                  <span>📍 {selectedOrg.address}</span>
                  <span>📞 {selectedOrg.phone}</span>
                </div>
              </div>
            </div>

            {/* CANTEEN ORGANIZATION MODE */}
            {selectedOrg.organizationType === 'canteen' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Sub-canteens list */}
                <div className="lg:col-span-1 space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-orange-500" />
                    <span>Select Canteen Pavilion</span>
                  </h3>
                  
                  <div className="space-y-2">
                    {canteens
                      .filter(c => c.organizationId === selectedOrg._id)
                      .map((cant, idx) => (
                        <button
                          key={cant._id}
                          onClick={() => { setSelectedCanteen(cant); clearCart(); }}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                            selectedCanteen?._id === cant._id
                              ? 'border-orange-500 bg-orange-50/40 text-orange-950 shadow-sm font-bold'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-slate-400">Pavilion {idx + 1}</p>
                            <p className="text-sm">{cant.name}</p>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${selectedCanteen?._id === cant._id ? 'text-orange-500 translate-x-1' : 'text-slate-400'}`} />
                        </button>
                      ))}
                  </div>

                  {canteens.filter(c => c.organizationId === selectedOrg._id).length === 0 && (
                    <p className="text-xs text-slate-500 bg-white p-4 border border-dashed rounded-lg text-center">
                      No pavilions currently registered.
                    </p>
                  )}
                </div>

                {/* Sub-canteen Menu and Cart */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedCanteen ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-slate-950 text-base">{selectedCanteen.name} Menu</h3>
                          <p className="text-xs text-slate-500">Pick items to build your canteen pickup slip.</p>
                        </div>
                        
                        <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-200 rounded px-2.5 py-0.5 font-bold uppercase">
                          Canteen code: {selectedCanteen._id.split('-').pop()?.toUpperCase()}
                        </span>
                      </div>

                      {/* Food Items list */}
                      <div className="divide-y divide-slate-100">
                        {selectedCanteen.menu.map(item => (
                          <div key={item.id} className="py-4 flex justify-between items-center gap-4">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{item.category}</span>
                              </div>
                              <p className="text-sm font-bold text-slate-900">₹{item.price}</p>
                              {!item.isAvailable && (
                                <p className="text-[10px] text-red-500 font-semibold">❌ Sold Out / Unavailable</p>
                              )}
                            </div>
                            
                            <div>
                              {item.isAvailable ? (
                                <div className="flex items-center gap-2">
                                  {cart.find(i => i.id === item.id) ? (
                                    <div className="flex items-center gap-2.5 bg-slate-100 rounded-lg p-1 border border-slate-200">
                                      <button
                                        onClick={() => updateCartQuantity(item.id, (cart.find(i => i.id === item.id)?.quantity || 1) - 1)}
                                        className="w-6 h-6 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-xs font-bold transition-all text-slate-700 shadow-sm"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-xs font-bold text-slate-800 px-1">
                                        {cart.find(i => i.id === item.id)?.quantity}
                                      </span>
                                      <button
                                        onClick={() => addToCart(item, selectedOrg._id, selectedCanteen._id)}
                                        className="w-6 h-6 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-xs font-bold transition-all text-slate-700 shadow-sm"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => addToCart(item, selectedOrg._id, selectedCanteen._id)}
                                      className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-1.5 rounded text-xs transition-colors flex items-center gap-1 shadow-sm"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add to Cart</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  disabled
                                  className="bg-slate-100 text-slate-400 px-3 py-1.5 rounded text-xs border border-slate-200 cursor-not-allowed"
                                >
                                  Unavailable
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {selectedCanteen.menu.length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-6">
                            No menu items have been added to this canteen yet.
                          </p>
                        )}
                      </div>

                      {/* CART SUMMARY AND PAYMENT */}
                      {cart.length > 0 && cartOrgId === selectedOrg._id && cartCanteenId === selectedCanteen._id && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6 space-y-4 animate-in slide-in-from-bottom duration-200">
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <ShoppingBag className="w-4 h-4 text-orange-500" />
                            <span>Your Canteen Order Cart</span>
                          </h4>

                          <div className="space-y-2">
                            {cart.map(cartItem => (
                              <div key={cartItem.id} className="flex justify-between items-center text-xs text-slate-700">
                                <span>{cartItem.name} (x{cartItem.quantity})</span>
                                <span className="font-mono font-bold">₹{(cartItem.price * cartItem.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="border-t border-slate-200 my-2 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                              <span>Total Amount</span>
                              <span>₹{cartTotal.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-[10px] text-orange-800 space-y-1.5">
                            <p className="font-bold flex items-center gap-1">
                              <span>🔒</span>
                              <span>MANDATORY PRE-PAYMENT REQUIRED</span>
                            </p>
                            <p>Campus canteens enforce online payment checkouts to automate instant quick-pickup slips. Cash on pickup is not accepted for food orders.</p>
                          </div>

                          <button
                            onClick={() => triggerCheckout('canteen')}
                            disabled={isCheckout}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{isCheckout ? 'Processing...' : `Pay ₹${cartTotal} via Razorpay`}</span>
                          </button>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                      <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Select a Canteen Pavilion on the left.</p>
                      <p className="text-xs text-slate-400">View menu selections, customize quantities, and place pre-paid food pickup tokens.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* XEROX & STATIONERY ORGANIZATION MODE */}
            {selectedOrg.organizationType === 'xerox_stationery' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Module A: Xerox Document Upload Form */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Xerox Document Printing Service</h3>
                      <p className="text-xs text-slate-500">Upload assignment slides or exam prep files.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* File Upload Field with Cloudinary */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Upload Document 
                        <span className="text-blue-500 ml-1">(Cloudinary CDN)</span>
                      </label>
                      
                      {!xeroxFile ? (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative group ${
                            isUploading 
                              ? 'border-blue-400 bg-blue-50/50' 
                              : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isUploading}
                          />
                          
                          {isUploading ? (
                            <div className="space-y-3">
                              <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-blue-700">Uploading to Cloudinary...</p>
                                <div className="w-48 h-1.5 bg-blue-100 rounded-full mx-auto overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                                <p className="text-[10px] text-blue-500">{uploadProgress}%</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
                                <Upload className="w-6 h-6 text-white" />
                              </div>
                              <p className="text-sm font-bold text-slate-700">Click to browse or drag document</p>
                              <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, PNG • Max 5MB • Stored on Cloudinary CDN</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{xeroxFile.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] text-slate-400 font-mono">{xeroxFile.size}</p>
                                {xeroxFile.cloudinaryUrl && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Cloud Uploaded</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setXeroxFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* File presets shortcuts */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Or use a mock assignment preset for testing:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => selectPresetFile("EE_Lab_Manual_Ch3.pdf", "1.8 MB")}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded transition-colors"
                          >
                            EE_Lab_Manual.pdf
                          </button>
                          <button
                            onClick={() => selectPresetFile("Maths_Formulae_Sheet.png", "840 KB")}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded transition-colors"
                          >
                            Maths_Sheet.png
                          </button>
                          <button
                            onClick={() => selectPresetFile("Seminar_Presentation.pdf", "4.2 MB")}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded transition-colors"
                          >
                            Seminar_Pres.pdf
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quantity and Color/BW */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Copies Count</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={copies}
                          onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Print Color Scheme</label>
                        <select
                          value={printType}
                          onChange={(e) => setPrintType(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                        >
                          <option value="bw">Black & White (₹2.00 / page)</option>
                          <option value="color">Full Color (₹10.00 / page)</option>
                        </select>
                      </div>
                    </div>

                    {/* Xerox payment choice */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Select Payment Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setXeroxPayType('cod')}
                          className={`p-2 border rounded-lg text-center text-xs font-bold transition-all ${
                            xeroxPayType === 'cod'
                              ? 'border-blue-600 bg-blue-50 text-blue-800'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          💸 Pay on Pickup (COD)
                        </button>
                        <button
                          type="button"
                          onClick={() => setXeroxPayType('online')}
                          className={`p-2 border rounded-lg text-center text-xs font-bold transition-all ${
                            xeroxPayType === 'online'
                              ? 'border-blue-600 bg-blue-50 text-blue-800'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          💳 Pay Online Now
                        </button>
                      </div>
                    </div>

                    {/* Estimated xerox summary cost */}
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold uppercase text-[10px]">Estimated Price (assuming 1 page count):</span>
                      <strong className="text-slate-900 font-mono text-sm">₹{( (printType === 'color' ? 10 : 2) * copies ).toFixed(2)}</strong>
                    </div>

                    <button
                      onClick={() => triggerCheckout('xerox')}
                      disabled={!xeroxFile || isCheckout}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isCheckout ? 'Processing...' : 'Place Xerox Order (Get X-Token)'}</span>
                    </button>
                  </div>
                </div>

                {/* Module B: Stationery Items List & Cart */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Stationery & Lab Manuals Catalog</h3>
                      <p className="text-xs text-slate-500">Select supplies, lab records, files, or calculators.</p>
                    </div>
                  </div>

                  {/* Stationery items grid */}
                  <div className="divide-y divide-slate-100">
                    {(inventories[selectedOrg._id] || []).map(item => (
                      <div key={item.id} className="py-3 flex justify-between items-center gap-4 text-xs">
                        <div className="space-y-0.5 flex-grow">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded">{item.category}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-800">₹{item.price}</span>
                            <span className={`text-[10px] ${item.stock > 0 ? 'text-slate-400' : 'text-red-500 font-bold'}`}>
                              {item.stock > 0 ? `Stock: ${item.stock} left` : 'Out of Stock'}
                            </span>
                          </div>
                        </div>

                        <div>
                          {item.isAvailable && item.stock > 0 ? (
                            <div>
                              {cart.find(i => i.id === item.id) ? (
                                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                  <button
                                    onClick={() => updateCartQuantity(item.id, (cart.find(i => i.id === item.id)?.quantity || 1) - 1)}
                                    className="w-5 h-5 rounded bg-white hover:bg-slate-200 flex items-center justify-center font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-slate-800 px-1">
                                    {cart.find(i => i.id === item.id)?.quantity}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const curQty = cart.find(i => i.id === item.id)?.quantity || 0;
                                      if (curQty >= item.stock) {
                                        showNotification("Error: Cannot exceed available store inventory.", 'error');
                                        return;
                                      }
                                      addToCart(item, selectedOrg._id);
                                    }}
                                    className="w-5 h-5 rounded bg-white hover:bg-slate-200 flex items-center justify-center font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item, selectedOrg._id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded transition-colors text-[10px]"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1 text-[10px] font-semibold">Sold Out</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {(inventories[selectedOrg._id] || []).length === 0 && (
                      <p className="text-xs text-slate-400 py-6 text-center">No stationery products available at this shop.</p>
                    )}
                  </div>

                  {/* Cart segment */}
                  {cart.length > 0 && cartOrgId === selectedOrg._id && !cartCanteenId && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in slide-in-from-bottom duration-200">
                      <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                        <span>🛒</span>
                        <span>Stationery Order Summary</span>
                      </h4>

                      <div className="space-y-1.5 text-xs text-slate-700">
                        {cart.map(cartItem => (
                          <div key={cartItem.id} className="flex justify-between items-center">
                            <span>{cartItem.name} (x{cartItem.quantity})</span>
                            <span className="font-mono font-bold">₹{(cartItem.price * cartItem.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-slate-200 my-2 pt-2 flex justify-between font-bold text-slate-900">
                          <span>Total Amount</span>
                          <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Payment type */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-700">Payment Option</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setStationeryPayType('cod')}
                            className={`p-1.5 border rounded-lg text-center text-[10px] font-bold transition-all ${
                              stationeryPayType === 'cod'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            💸 Cash on Pickup
                          </button>
                          <button
                            type="button"
                            onClick={() => setStationeryPayType('online')}
                            className={`p-1.5 border rounded-lg text-center text-[10px] font-bold transition-all ${
                              stationeryPayType === 'online'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            💳 Razorpay Online
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => triggerCheckout('stationery')}
                        disabled={isCheckout}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isCheckout ? 'Processing...' : `Reserve Stationery (₹${cartTotal})`}</span>
                      </button>
                    </div>
                  )}

                </div>

              </div>
            )}
          </div>
        )}

        {/* ACTIVE STUDENTS TOKENS TAB */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Your Active & Previous Campus Tokens</h3>
                <p className="text-xs text-slate-500">Track preparation progress. Present tokens at vendor counters to collect.</p>
              </div>
              <button
                onClick={() => window.print()}
                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print All Passes</span>
              </button>
            </div>

            {myOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-sm">No tokens ordered yet.</p>
                <p className="text-xs text-slate-400 mt-1">Browse canteen food or xerox printing to generate queue tokens.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myOrders.map(order => (
                  <div
                    key={order._id}
                    className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    {/* Card Top: Token Code Banner */}
                    <div className="bg-[#1E293B] text-white p-4 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Campus QuickPass Slip</span>
                        <h4 className="text-xl font-mono font-black text-blue-300">{order.tokenNumber}</h4>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          order.orderStatus === 'Preparing' ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400' :
                          order.orderStatus === 'Ready' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Location & Merchant</p>
                        <p className="text-xs font-bold text-slate-800">{order.organizationName}</p>
                        {order.canteenName && (
                          <p className="text-[10px] text-slate-500 font-semibold">Pavilion: {order.canteenName}</p>
                        )}
                      </div>

                      {/* Items ordered summary */}
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Ordered Details</p>
                        {order.orderType === 'xerox' ? (
                          <div className="space-y-1 mt-0.5">
                            <p className="text-xs font-semibold text-slate-800 truncate">📄 {order.fileName}</p>
                            <p className="text-[10px] text-slate-500">
                              {order.copies} {order.copies === 1 ? 'copy' : 'copies'} • {order.printType === 'color' ? 'Full Color' : 'B&W'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0.5 mt-0.5">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                                <span>{item.name} (x{item.quantity})</span>
                                <span className="text-slate-400">₹{(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Payment Badge - Green vs Red requirement */}
                      {/* "Green -> Paid, Red -> Pay on Pickup" */}
                      <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Payment Method</p>
                          <p className="text-[10px] text-slate-600 font-semibold uppercase">{order.paymentType === 'online' ? 'Razorpay Gateway' : 'Pay on Collection'}</p>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer actions */}
                    <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Ordered {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      
                      {order.orderStatus === 'Ready' && (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <span>✓</span>
                          <span>Ready for Pickup</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Checkout Loading Overlay */}
      {isCheckout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-700">Processing Razorpay Payment...</p>
            <p className="text-xs text-slate-400">Please complete the payment in the Razorpay window.</p>
          </div>
        </div>
      )}

    </div>
  );
};
