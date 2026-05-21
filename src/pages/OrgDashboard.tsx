import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, InventoryItem } from '../mockDB';
import { Search, CheckCircle2, ChevronRight, ShoppingBag, Plus, Trash2, AlertCircle, TrendingUp, CheckCircle, Clock, Coffee, ShieldCheck } from 'lucide-react';

export const OrgDashboard: React.FC = () => {
  const {
    currentUser,
    organizations,
    canteens,
    orders,
    inventories,
    updateOrderStatus,
    manageInventoryItem,
    removeInventoryItem,
    createNewCanteen,
    deleteCanteen,
    updateMenu,
    showNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'profile'>('orders');
  
  // Scoped organization details
  const myOrg = organizations.find(o => o._id === currentUser?.organizationId);
  const isCanteenType = myOrg?.organizationType === 'canteen';
  
  console.log('OrgDashboard - myOrg:', myOrg);
  console.log('OrgDashboard - currentUser:', currentUser);
  console.log('OrgDashboard - inventories:', inventories);
  console.log('OrgDashboard - inventory for myOrg:', myOrg ? inventories[myOrg._id] : 'myOrg is undefined');

  // Filters state
  const [searchToken, setSearchToken] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Preparing' | 'Ready' | 'Collected'>('All');

  // Selected Canteen for menu editing (for Canteen type)
  const myCanteens = canteens.filter(c => c.organizationId === myOrg?._id);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>(myCanteens[0]?._id || '');
  const activeCanteen = myCanteens.find(c => c._id === selectedCanteenId);

  // New item forms state
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodPrice, setNewFoodPrice] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState('Snacks');
  
  const [newStatName, setNewStatName] = useState('');
  const [newStatPrice, setNewStatPrice] = useState('');
  const [newStatStock, setNewStatStock] = useState('');
  const [newStatCategory, setNewStatCategory] = useState('Writing');

  // Canteen Creation state
  const [canteenNameInput, setCanteenNameInput] = useState('');

  // Selected Canteen check
  const handleSelectCanteen = (cantId: string) => {
    setSelectedCanteenId(cantId);
  };

  // Scoped orders
  const myOrders = orders.filter(o => o.organizationId === myOrg?._id);

  // Filtered orders
  const filteredOrders = myOrders.filter(order => {
    const matchSearch = order.tokenNumber.toLowerCase().includes(searchToken.toLowerCase()) ||
                        order.userName.toLowerCase().includes(searchToken.toLowerCase()) ||
                        order.userEmail.toLowerCase().includes(searchToken.toLowerCase());
    
    const matchStatus = statusFilter === 'All' || order.orderStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  // Analytics for this organization
  const totalRevenue = myOrders
    .filter(o => o.paymentStatus === 'Paid')
    .reduce((sum, o) => {
      if (o.orderType === 'xerox') {
        const cost = (o.printType === 'color' ? 10 : 2) * (o.copies || 1);
        return sum + cost;
      } else {
        const orderSum = o.items?.reduce((s, item) => s + (item.price * item.quantity), 0) || 0;
        return sum + orderSum;
      }
    }, 0);

  const preparingCount = myOrders.filter(o => o.orderStatus === 'Preparing').length;
  const readyCount = myOrders.filter(o => o.orderStatus === 'Ready').length;
  const completedCount = myOrders.filter(o => o.orderStatus === 'Collected').length;

  // Add canteen pavilion
  const handleCreateCanteen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myOrg || !canteenNameInput) return;
    const fresh = await createNewCanteen(myOrg._id, canteenNameInput);
    if (fresh?._id) {
      setSelectedCanteenId(fresh._id);
      setCanteenNameInput('');
    }
  };

  // Add food item
  const handleAddFoodItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCanteen || !newFoodName || !newFoodPrice) return;
    
    const priceNum = parseFloat(newFoodPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showNotification("Error: Price must be a positive number.");
      return;
    }

    const newItem: MenuItem = {
      id: `m-food-${Date.now()}`,
      name: newFoodName,
      price: priceNum,
      category: newFoodCategory,
      isAvailable: true
    };

    const updatedMenu = [...activeCanteen.menu, newItem];
    updateMenu(activeCanteen._id, updatedMenu);
    
    setNewFoodName('');
    setNewFoodPrice('');
    setNewFoodCategory('Snacks');
  };

  const handleToggleFoodItem = (itemId: string) => {
    if (!activeCanteen) return;
    const updatedMenu = activeCanteen.menu.map(item => 
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    );
    updateMenu(activeCanteen._id, updatedMenu);
  };

  const handleDeleteFoodItem = (itemId: string) => {
    if (!activeCanteen) return;
    const updatedMenu = activeCanteen.menu.filter(item => item.id !== itemId);
    updateMenu(activeCanteen._id, updatedMenu);
  };

  // Add stationery item
  const handleAddStationery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myOrg || !newStatName || !newStatPrice || !newStatStock) return;

    const priceNum = parseFloat(newStatPrice);
    const stockNum = parseInt(newStatStock);

    if (isNaN(priceNum) || priceNum <= 0 || isNaN(stockNum) || stockNum < 0) {
      showNotification("Error: Please provide valid positive values.");
      return;
    }

    const newItem: InventoryItem = {
      id: `inv-stat-${Date.now()}`,
      name: newStatName,
      price: priceNum,
      stock: stockNum,
      isAvailable: stockNum > 0,
      category: newStatCategory
    };

    manageInventoryItem(myOrg._id, newItem);
    setNewStatName('');
    setNewStatPrice('');
    setNewStatStock('');
    setNewStatCategory('Writing');
  };

  const handleUpdateStock = (item: InventoryItem, delta: number) => {
    if (!myOrg) return;
    const nextStock = Math.max(0, item.stock + delta);
    const updatedItem = {
      ...item,
      stock: nextStock,
      isAvailable: nextStock > 0
    };
    manageInventoryItem(myOrg._id, updatedItem);
  };

  const handleToggleStationery = (item: InventoryItem) => {
    if (!myOrg) return;
    const updatedItem = {
      ...item,
      isAvailable: !item.isAvailable
    };
    manageInventoryItem(myOrg._id, updatedItem);
  };

  if (!myOrg) {
    return (
      <div className="bg-slate-50 min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Access Denied / Shop Not Found</h2>
          <p className="text-sm text-slate-500">
            This account is not associated with any registered shop, or your organization has not yet been approved by the campus super admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Dashboard Top Header */}
      <div className="bg-[#1E293B] text-white py-6 px-6 sm:px-12 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
              {myOrg.logo.startsWith('data:') ? (
                <img src={myOrg.logo} alt={myOrg.organizationName} className="w-full h-full object-cover rounded-lg" />
              ) : (
                myOrg.logo
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <span>{myOrg.organizationName} Admin Portal</span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                  {myOrg.organizationType === 'canteen' ? 'Canteen Hub' : 'Xerox & Stationery'}
                </span>
              </h1>
              <p className="text-xs text-slate-400">Welcome, {currentUser?.name} • Live queue dashboard</p>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Order Queue ({preparingCount + readyCount})
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {isCanteenType ? 'Manage Menu' : 'Manage Inventory'}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Shop Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        
        {/* Analytics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preparing</p>
              <p className="text-xl font-bold text-slate-900">{preparingCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ready / Uncollected</p>
              <p className="text-xl font-bold text-slate-900">{readyCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Collected (Total)</p>
              <p className="text-xl font-bold text-slate-900">{completedCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sales Revenue</p>
              <p className="text-xl font-bold text-slate-900">₹{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* ORDER QUEUE TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Filter controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-md">
                <input
                  type="text"
                  placeholder="Search token number (e.g. C1-101), student email, name..."
                  value={searchToken}
                  onChange={(e) => setSearchToken(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>

              <div className="flex gap-2 w-full md:w-auto overflow-auto justify-end">
                {(['All', 'Preparing', 'Ready', 'Collected'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      statusFilter === status
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {status} ({status === 'All' ? myOrders.length : myOrders.filter(o => o.orderStatus === status).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Orders list */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-sm">No tokens in this queue slice.</p>
                <p className="text-xs text-slate-400 mt-1">Incoming student orders will dynamically load here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div
                    key={order._id}
                    className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row justify-between"
                  >
                    {/* Token code block */}
                    <div className="bg-slate-900 text-white p-5 flex flex-col justify-center items-center md:w-40 border-r border-slate-800 shrink-0 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Queue Token</span>
                      <span className="text-2xl font-mono font-black text-blue-300 tracking-wide mt-1">{order.tokenNumber}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full mt-2 font-medium capitalize">
                        {order.orderType}
                      </span>
                    </div>

                    {/* Order metadata */}
                    <div className="p-5 flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      
                      {/* Customer / Time */}
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Student Customer</p>
                        <p className="text-xs font-bold text-slate-900">{order.userName}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{order.userEmail}</p>
                        <p className="text-[9px] text-slate-400">Placed: {new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>

                      {/* Items Details */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Service / Items</p>
                        {order.orderType === 'xerox' ? (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <span>📄</span>
                              <span className="truncate max-w-[150px]">{order.fileName}</span>
                            </p>
                            <div className="flex gap-2">
                              <span className="text-[10px] text-slate-500 font-medium">{order.copies} copies</span>
                              <span className="text-[10px] text-slate-500 font-medium">• {order.printType === 'color' ? 'Full Color' : 'B&W'}</span>
                            </div>
                            
                            {/* Multer file action simulation */}
                            <a
                              href={order.fileURL}
                              download={order.fileName}
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="Download uploaded xerox attachment"
                            >
                              <span>📥</span>
                              <span>Retrieve document ({order.fileSize})</span>
                            </a>
                          </div>
                        ) : (
                          <div className="space-y-0.5 max-h-[80px] overflow-y-auto">
                            {order.items?.map((item, idx) => (
                              <p key={idx} className="text-xs text-slate-700">
                                • {item.name} <strong className="text-slate-950 font-bold">x{item.quantity}</strong>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Payment and Billing details */}
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Payment & Bill</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                          <span className="text-xs text-slate-400 capitalize">({order.paymentType})</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          Total Bill: ₹{
                            order.orderType === 'xerox'
                              ? ((order.printType === 'color' ? 10 : 2) * (order.copies || 1))
                              : (order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0)
                          }
                        </p>
                        {order.razorpayPaymentId && (
                          <p className="text-[9px] text-slate-400 truncate">RPID: {order.razorpayPaymentId}</p>
                        )}
                      </div>

                    </div>

                    {/* Progress action controls */}
                    <div className="p-5 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 flex flex-row md:flex-col justify-center gap-2 w-full md:w-48 shrink-0">
                      {order.orderStatus === 'Preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Ready')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark as READY</span>
                        </button>
                      )}

                      {order.orderStatus === 'Ready' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Collected')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <span>🚚</span>
                          <span>Mark COLLECTED</span>
                        </button>
                      )}

                      {order.orderStatus === 'Collected' && (
                        <div className="text-slate-400 text-xs text-center py-2 font-semibold flex items-center justify-center gap-1">
                          <span>✓</span>
                          <span>Handed Over</span>
                        </div>
                      )}

                      {order.orderStatus !== 'Collected' && (
                        <span className="text-[10px] text-slate-400 text-center font-medium">
                          Status: <strong className="text-slate-600">{order.orderStatus}</strong>
                        </span>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* INVENTORY / MENU MANAGEMENT TAB */}
        {activeTab === 'catalog' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* CANTEEN CATALOG EDITING */}
            {isCanteenType ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Pavilions list and Canteen creation */}
                <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-6">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-orange-500" />
                    <span>Configure Sub-Canteens</span>
                  </h3>

                  <div className="space-y-2">
                    {myCanteens.map((cant) => (
                      <div
                        key={cant._id}
                        className={`w-full text-left p-3 rounded-lg border text-xs flex justify-between items-center gap-2 transition-all ${
                          selectedCanteenId === cant._id
                            ? 'border-orange-500 bg-orange-50/40 text-orange-950 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectCanteen(cant._id)}
                          className="flex-1 text-left flex justify-between items-center"
                        >
                          <span>{cant.name} ({cant.menu.length} items)</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete pavilion "${cant.name}"? This cannot be undone.`)) {
                              if (selectedCanteenId === cant._id) {
                                const nextCanteen = myCanteens.find(canteen => canteen._id !== cant._id);
                                setSelectedCanteenId(nextCanteen?._id || '');
                              }
                              deleteCanteen(cant._id, myOrg._id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                          title="Delete pavilion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleCreateCanteen} className="border-t border-slate-100 pt-4 space-y-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Add New Pavilion Unit</p>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Canteen 4 (Juice Bar)"
                        value={canteenNameInput}
                        onChange={(e) => setCanteenNameInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Pavilion</span>
                    </button>
                  </form>
                </div>

                {/* Right: Menu items list and item creation form */}
                <div className="lg:col-span-2 space-y-6">
                  {activeCanteen ? (
                    <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-6">
                      
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{activeCanteen.name} Menu Settings</h4>
                          <p className="text-xs text-slate-500">Configure prices, availability toggles, and food catalogs.</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {activeCanteen._id}</span>
                      </div>

                      {/* Add Food Item form */}
                      <form onSubmit={handleAddFoodItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-slate-50 p-4 border border-slate-100 rounded-lg">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="block text-[10px] font-semibold text-slate-700">Food Item Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Paneer Tikka Roll"
                            value={newFoodName}
                            onChange={(e) => setNewFoodName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold text-slate-700">Price (₹)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="80"
                            value={newFoodPrice}
                            onChange={(e) => setNewFoodPrice(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Item</span>
                        </button>
                      </form>

                      {/* Food menu list */}
                      <div className="space-y-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Menu Products ({activeCanteen.menu.length})</p>
                        
                        <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                          {activeCanteen.menu.map(item => (
                            <div key={item.id} className="p-3 flex justify-between items-center bg-white">
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <p className="font-bold text-slate-500">₹{item.price}</p>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFoodItem(item.id)}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                                    item.isAvailable
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      : 'bg-rose-50 border-rose-200 text-rose-800'
                                  }`}
                                >
                                  {item.isAvailable ? '● Available' : '○ Sold Out'}
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFoodItem(item.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {activeCanteen.menu.length === 0 && (
                            <p className="text-slate-400 p-6 text-center">Menu is empty. Add food items above to populate canteen catalog.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                      <Coffee className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Please register a Canteen pavilion first.</p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* XEROX & STATIONERY INVENTORY EDITING */
              <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base">Stationery Store Inventory Management</h3>
                  <p className="text-xs text-slate-500">Add notebooks, pens, drawing sheets, adjust counts and toggle availability.</p>
                </div>

                {/* Add product form */}
                <form onSubmit={handleAddStationery} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-slate-50 p-4 border border-slate-100 rounded-lg">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-slate-700">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Mini Drafter Kit"
                      value={newStatName}
                      onChange={(e) => setNewStatName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-slate-700">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="350"
                      value={newStatPrice}
                      onChange={(e) => setNewStatPrice(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-slate-700">Stock Count</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="40"
                      value={newStatStock}
                      onChange={(e) => setNewStatStock(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-xs shadow transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                </form>

                {/* Products stock sheet */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Shop Inventory Catalog ({ (inventories[myOrg._id] || []).length })</p>
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                    {(inventories[myOrg._id] || []).map(item => (
                      <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <div className="flex gap-4 text-slate-500 font-medium">
                            <span>Price: ₹{item.price}</span>
                            <span className={item.stock > 0 ? 'text-slate-400' : 'text-red-500 font-bold'}>
                              Stock: {item.stock} left
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          {/* Adjust stock buttons */}
                          <div className="flex items-center border border-slate-200 rounded overflow-hidden mr-2 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleUpdateStock(item, -10)}
                              className="px-2 py-1 hover:bg-slate-200 font-bold"
                              title="Decrease stock by 10"
                            >
                              -10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStock(item, -1)}
                              className="px-2 py-1 hover:bg-slate-200 font-bold"
                              title="Decrease stock by 1"
                            >
                              -1
                            </button>
                            <span className="px-2.5 font-bold text-slate-700">{item.stock}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateStock(item, 1)}
                              className="px-2 py-1 hover:bg-slate-200 font-bold"
                              title="Increase stock by 1"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStock(item, 10)}
                              className="px-2 py-1 hover:bg-slate-200 font-bold"
                              title="Increase stock by 10"
                            >
                              +10
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleStationery(item)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                              item.isAvailable && item.stock > 0
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                          >
                            {item.isAvailable && item.stock > 0 ? 'Active' : 'Disabled'}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeInventoryItem(myOrg._id, item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {(inventories[myOrg._id] || []).length === 0 && (
                      <p className="text-slate-400 p-6 text-center">Store inventory sheet is empty. Register products above.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* SHOP SETTINGS PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-6 animate-in fade-in duration-200 max-w-2xl">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Shop Registration Information</h3>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold uppercase border border-emerald-200">
                Approved & Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Shop Name</span>
                <p className="text-slate-800 font-semibold text-sm">{myOrg.organizationName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Shop Category Type</span>
                <p className="text-slate-800 font-semibold capitalize">{myOrg.organizationType}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Primary Contact Phone</span>
                <p className="text-slate-800 font-semibold">{myOrg.phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Shop Email</span>
                <p className="text-slate-800 font-semibold">{myOrg.email}</p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Campus Address Location</span>
                <p className="text-slate-800 font-semibold">{myOrg.address}</p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">About Description</span>
                <p className="text-slate-600 leading-relaxed">{myOrg.description}</p>
              </div>

              <div className="space-y-1 sm:col-span-2 border-t border-slate-100 pt-4">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Registered Admin Manager Account</span>
                <p className="text-slate-800 font-semibold mt-1">Name: {currentUser?.name}</p>
                <p className="text-slate-800">Email: {currentUser?.email}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-600 text-xs">
                <p className="font-bold text-slate-800">Multi-Tenant Platform Privacy Guarantee</p>
                <p>As a registered shop vendor, your database transactions, catalog items, canteens, and order queues are isolated. Only students connected to your unique token codes can submit invoices.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
