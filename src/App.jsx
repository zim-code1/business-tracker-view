import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from './supabaseClient';

// --- HELPER: Get Date Details ---
function getDateDetails() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[now.getDay()];
  const monthName = months[now.getMonth()];
  const dateNum = now.getDate();
  const year = now.getFullYear();
  
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const weekNum = Math.ceil(dayOfYear / 7);
  
  let dayCount = now.getDay(); 
  if (dayCount === 0) dayCount = 7;

  return {
    fullDate: `${dayName}, ${monthName} ${dateNum}, ${year}`,
    weekInfo: `Week #${weekNum}`,
    dayInfo: `Day #${dayCount}`,
    currentTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
}

function getSmartDate(dateStr) {
  const now = new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  const smartDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
  return smartDate.toISOString();
}

// --- MENU DATA ---
const MENU_ITEMS = {
  'Meal/Ulam': [
    { name: 'Egg', price: 15 }, { name: 'Fried Chicken', price: 50 }, { name: 'Chopsuey', price: 40 },
    { name: 'Gulay', price: 30 }, { name: 'Batchoy', price: 50 }, { name: 'Talong', price: 40 },
    { name: 'Plain Rice', price: 20 }, { name: 'Garlic Rice', price: 25 }, { name: 'Fried Rice', price: 25 },
    { name: 'Maggi-Egg', price: 55 }, { name: 'Maggi-Plain', price: 40 }, { name: 'Silog', price: 70 },
    { name: 'Bangus Silog', price: 75 }, { name: 'Pandesal', price: 6 }, { name: 'Mee-Goreng', price: 30 },
    { name: 'Arozz Caldo', price: 45 }, { name: 'Hotdog', price: 20 }, { name: 'Chorizo', price: 10 },
    { name: 'Sausage', price: 10 }, { name: 'Pancit-Canton (S)', price:  30}, { name: 'Pancit-Canton (L)', price: 40 },
  ],
  'Drinks': [
    { name: 'Coke Mismo', price: 30 }, { name: 'Coke Zero/Orig', price: 40 }, { name: 'Mountain Dew', price: 30 },
    { name: 'Royal', price: 30 }, { name: 'Sprite', price: 30 }, { name: 'Sting', price: 30 },
    { name: 'Mineral Water', price: 20 }, { name: 'Boss Coffee', price: 85 }, { name: 'Nescafe-Can', price: 45 },
    { name: 'Cali', price: 40 }, { name: 'Yakult', price: 12 }, { name: 'Dutchmilk', price: 30 },
    { name: 'Chuckie', price: 40 }, { name: 'Gatorade', price: 45 }, { name: 'Del-Monte Can', price: 40 },
    { name: 'Vitamilk', price: 40 }, { name: 'Kalamansi', price: 30 }, { name: 'Mogu-Mogu', price: 55 },
    { name: 'Nestea', price: 35 }, { name: 'Fit-N-Right', price: 40 }, { name: 'C2', price: 35 },
    { name: 'Minute-Maid', price: 40 }, { name: 'Hot Coffee Sachet', price: 15 }, { name: 'Nescafe Sachet', price: 10 },
    { name: 'Coffee-Mate', price: 10 }, { name: 'Ice-Coffee', price: 85}, { name: 'Soda', price: 55 },
    { name: 'Shake', price: 85 }, { name: 'Ice Cup (5)', price: 5 }, { name: 'Ice Cup (10)', price: 10 },
  ],
  'Curls/Merienda': [
    { name: 'Curls Big', price: 35 }, { name: 'Curls Medium', price: 25 }, { name: 'Curls Small', price: 15 },
    { name: 'Curls Mini', price: 10 }, { name: 'Tropex', price: 60 }, { name: 'French-Fries', price: 60 },
    { name: 'Tempura', price: 20 }, { name: 'Super-Crunch', price: 15 }, { name: 'Pillows', price: 15 },
    { name: 'Tempura', price: 20 }, { name: 'Cup Noodles', price: 30 }, { name: 'Jampong/Sotanghon Cup Noodles', price: 35 }, { name: 'Pandesal', price: 6 }, 
    { name: 'C2', price: 35 }, { name: 'Mango-Float', price: 120 }, { name: 'Quakers', price: 20 }, 
    { name: 'Nagaraya', price: 40 },{ name: 'Expo', price: 10 },
  ],
  'Biscuits/Candies': [
    { name: 'Rebisco', price: 10 }, { name: 'SkyFlakes', price: 10 }, { name: 'Fita', price: 15 },
    { name: 'Candy (3)', price: 5 }, { name: 'Flat-Tops', price: 3 }, { name: 'Hany', price: 2 },
    { name: 'Snickers', price: 55 }, { name: 'Kit-Kat', price: 20 }, { name: 'Kisses', price: 7 },
    { name: 'Overload', price: 30 }, { name: 'Reeses', price: 12 }, { name: 'Cadbury', price: 40 },
    { name: 'Revel Bar', price: 40 }, { name: 'Macaroons', price: 22 }, { name: 'Cookies', price: 30 },
    { name: 'Cloud-9', price: 15 }, { name: 'Cloud-9 Overload', price: 20 }, { name: 'Choco-Mucho', price: 15 },
  ],
  'Misc': [] 
};

function App() {
  // --- STATE ---
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [transactions, setTransactions] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]); 
  const [dateInfo, setDateInfo] = useState(getDateDetails());
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editType, setEditType] = useState(null);
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null });

  const [saleFormData, setSaleFormData] = useState({ name: '', price: '', quantity: '', category: 'Meal/Ulam' });
  const [paymentFormData, setPaymentFormData] = useState({ amount: '', notes: '' });
  const [expenseFormData, setExpenseFormData] = useState({ name: '', amount: '' });

  // --- AUTH ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Auto-Logout
  useEffect(() => {
    if (!session) return;
    let logoutTimer;
    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        alert("Session expired due to inactivity.");
        handleLogout();
      }, 1800000);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();
    return () => {
      clearTimeout(logoutTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [session]);

  // --- LOAD DATA ---
  useEffect(() => {
    if (session) {
      fetchTransactions();
      fetchLogs(); 
      const timer = setInterval(() => {
        setDateInfo(getDateDetails());
        fetchTransactions();
        fetchLogs();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [session, customDate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching tx:', error);
    else setTransactions(data);
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      const dayLogs = data.filter(log => {
        const logDate = new Date(log.created_at).toLocaleDateString('en-CA');
        return logDate === customDate;
      });
      setSystemLogs(dayLogs);
    }
  };

  const logAction = async (action, details) => {
    const timestamp = getSmartDate(customDate);
    await supabase.from('system_logs').insert([
      { action, details, created_at: timestamp }
    ]);
    fetchLogs();
  };

  const handleExportCSV = () => {
    const selectedDateStr = new Date(customDate).toDateString();
    const dataToExport = transactions.filter(tx => new Date(tx.created_at).toDateString() === selectedDateStr);
    if (dataToExport.length === 0) {
      alert("No data to export for this date.");
      return;
    }
    const headers = ["Date", "Time", "Type", "Item/Note", "Price", "Qty", "Total"];
    let grandTotal = 0;
    const rows = dataToExport.map(tx => {
      const date = new Date(tx.created_at).toLocaleDateString();
      const time = new Date(tx.created_at).toLocaleTimeString();
      const item = tx.type === 'payment' ? tx.notes : tx.name;
      const price = tx.price || 0;
      const qty = tx.quantity || 0;
      let lineTotal = 0;
      if (tx.type === 'sale') { lineTotal = price * qty; grandTotal += lineTotal; } 
      else if (tx.type === 'payment') { lineTotal = tx.amount; grandTotal += lineTotal; } 
      else if (tx.type === 'expense') { lineTotal = -tx.amount; grandTotal += lineTotal; }
      return [date, time, tx.type.toUpperCase(), `"${item}"`, price, qty, lineTotal];
    });
    const totalRow = ["", "", "", "GRAND TOTAL (NET PROFIT)", "", "", grandTotal];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(",")), totalRow.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${new Date(customDate).toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const initiateDelete = (id) => {
    setConfirmModal({ show: true, id: id });
  };

  const confirmDelete = async () => {
    const id = confirmModal.id;
    setConfirmModal({ show: false, id: null });
    const item = transactions.find(t => t.id === id);
    const itemName = item ? (item.name || item.notes) : 'Item';
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(transactions.filter(tx => tx.id !== id));
      if (editingId === id) cancelEdit();
      logAction('DELETE', `Deleted: ${itemName}`);
    } else {
      alert('Error deleting transaction');
    }
  };

  const cancelDelete = () => {
    setConfirmModal({ show: false, id: null });
  };

  const handleSaleInput = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setSaleFormData({ ...saleFormData, category: value, name: '', price: '' });
      return;
    }
    if (name === 'name' && saleFormData.category !== 'Misc') {
      const selectedItem = MENU_ITEMS[saleFormData.category].find(item => item.name === value);
      const newPrice = selectedItem ? selectedItem.price : '';
      setSaleFormData({ ...saleFormData, name: value, price: newPrice });
      return;
    }
    setSaleFormData({ ...saleFormData, [name]: value });
  };
  const handlePaymentInput = (e) => setPaymentFormData({ ...paymentFormData, [e.target.name]: e.target.value });
  const handleExpenseInput = (e) => setExpenseFormData({ ...expenseFormData, [e.target.name]: e.target.value });

  const handleEdit = (tx) => {
    setEditingId(tx.id);
    setEditType(tx.type);
    if (tx.type === 'sale') setSaleFormData({ name: tx.name, price: tx.price, quantity: tx.quantity, category: tx.category || 'Misc' });
    else if (tx.type === 'payment') setPaymentFormData({ amount: tx.amount, notes: tx.notes });
    else if (tx.type === 'expense') setExpenseFormData({ name: tx.name, amount: tx.amount });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditType(null);
    setSaleFormData({ name: '', price: '', quantity: '', category: 'Meal/Ulam' });
    setPaymentFormData({ amount: '', notes: '' });
    setExpenseFormData({ name: '', amount: '' });
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!saleFormData.name || !saleFormData.price || !saleFormData.quantity) return;
    const newQty = parseInt(saleFormData.quantity);
    if (editingId && editType === 'sale') {
      const oldTx = transactions.find(t => t.id === editingId);
      const oldQty = oldTx ? oldTx.quantity : 0;
      const diff = newQty - oldQty;
      const { error } = await supabase.from('transactions').update({ 
          name: saleFormData.name.trim(), price: parseFloat(saleFormData.price), quantity: newQty, category: saleFormData.category 
        }).eq('id', editingId);
      if (!error) {
        setTransactions(transactions.map(tx => tx.id === editingId ? { ...tx, ...saleFormData, price: parseFloat(saleFormData.price), quantity: newQty } : tx));
        let logDetail = `Updated ${saleFormData.name}`;
        if (oldTx && oldTx.name === saleFormData.name && diff !== 0) {
            const sign = diff > 0 ? '+' : '';
            logDetail = `${saleFormData.name} (${sign}${diff})`;
        } else if (oldTx && oldTx.name !== saleFormData.name) {
            logDetail = `Changed ${oldTx.name} to ${saleFormData.name}`;
        }
        logAction('EDIT', logDetail);
        cancelEdit();
      }
    } else {
      const selectedDateStr = new Date(customDate).toDateString();
      const existingItem = transactions.find(tx => 
        tx.type === 'sale' && tx.name === saleFormData.name.trim() && tx.price === parseFloat(saleFormData.price) && new Date(tx.created_at).toDateString() === selectedDateStr
      );
      if (existingItem) {
        const totalQty = existingItem.quantity + newQty;
        const { error } = await supabase.from('transactions').update({ quantity: totalQty }).eq('id', existingItem.id);
        if (!error) {
          setTransactions(transactions.map(tx => tx.id === existingItem.id ? { ...tx, quantity: totalQty } : tx));
          logAction('MERGE', `Added +${newQty} to ${saleFormData.name}`);
          setSaleFormData({ ...saleFormData, name: '', price: '', quantity: '' }); 
        }
      } else {
        const newTx = { 
          type: 'sale', name: saleFormData.name.trim(), price: parseFloat(saleFormData.price), quantity: newQty, category: saleFormData.category, 
          created_at: getSmartDate(customDate)
        };
        const { data, error } = await supabase.from('transactions').insert([newTx]).select();
        if (!error && data) {
          setTransactions([data[0], ...transactions]);
          logAction('ADD', `Sold ${saleFormData.name} (x${newQty})`);
          setSaleFormData({ ...saleFormData, name: '', price: '', quantity: '' }); 
        }
      }
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentFormData.amount) return;
    const newAmount = parseFloat(paymentFormData.amount);
    if (editingId && editType === 'payment') {
      const oldTx = transactions.find(t => t.id === editingId);
      const diff = newAmount - (oldTx ? oldTx.amount : 0);
      const { error } = await supabase.from('transactions').update({ amount: newAmount, notes: paymentFormData.notes.trim() || 'Utang Payment' }).eq('id', editingId);
      if (!error) {
        setTransactions(transactions.map(tx => tx.id === editingId ? { ...tx, amount: newAmount, notes: paymentFormData.notes } : tx));
        let logDetail = `Updated Payment: ${paymentFormData.notes}`;
        if (diff !== 0) {
             const sign = diff > 0 ? '+' : '';
             logDetail = `Payment ${paymentFormData.notes} (${sign}₱${diff})`;
        }
        logAction('EDIT', logDetail);
        cancelEdit();
      }
    } else {
      const newTx = { type: 'payment', amount: newAmount, notes: paymentFormData.notes.trim() || 'Utang Payment', created_at: getSmartDate(customDate) };
      const { data, error } = await supabase.from('transactions').insert([newTx]).select();
      if (!error && data) {
        setTransactions([data[0], ...transactions]);
        logAction('PAY', `Received ₱${newAmount} from ${paymentFormData.notes}`);
        setPaymentFormData({ amount: '', notes: '' });
      }
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseFormData.name || !expenseFormData.amount) return;
    const newAmount = parseFloat(expenseFormData.amount);
    if (editingId && editType === 'expense') {
      const oldTx = transactions.find(t => t.id === editingId);
      const diff = newAmount - (oldTx ? oldTx.amount : 0);
      const { error } = await supabase.from('transactions').update({ name: expenseFormData.name.trim(), amount: newAmount }).eq('id', editingId);
      if (!error) {
        setTransactions(transactions.map(tx => tx.id === editingId ? { ...tx, name: expenseFormData.name, amount: newAmount } : tx));
        let logDetail = `Updated Expense: ${expenseFormData.name}`;
        if (diff !== 0) {
             const sign = diff > 0 ? '+' : '';
             logDetail = `Expense ${expenseFormData.name} (${sign}₱${diff})`;
        }
        logAction('EDIT', logDetail);
        cancelEdit();
      }
    } else {
      const newTx = { type: 'expense', name: expenseFormData.name.trim(), amount: newAmount, created_at: getSmartDate(customDate) };
      const { data, error } = await supabase.from('transactions').insert([newTx]).select();
      if (!error && data) {
        setTransactions([data[0], ...transactions]);
        logAction('EXPENSE', `Logged Expense: ${expenseFormData.name}`);
        setExpenseFormData({ name: '', amount: '' });
      }
    }
  };

  const dashboardStats = useMemo(() => {
    const selectedDateStr = new Date(customDate).toDateString();
    return transactions.reduce((acc, tx) => {
      if (new Date(tx.created_at).toDateString() === selectedDateStr) {
        if (tx.type === 'sale') acc.revenue += (tx.price || 0) * (tx.quantity || 0);
        else if (tx.type === 'payment') acc.revenue += (tx.amount || 0);
        else if (tx.type === 'expense') acc.expenses += (tx.amount || 0);
      }
      return acc;
    }, { revenue: 0, expenses: 0 });
  }, [transactions, customDate]);

  const netProfit = dashboardStats.revenue - dashboardStats.expenses;

  const salesByCategory = useMemo(() => {
    const selectedDateStr = new Date(customDate).toDateString();
    return transactions.filter(tx => tx.type === 'sale' && new Date(tx.created_at).toDateString() === selectedDateStr).reduce((acc, tx) => {
      const cat = tx.category || 'Misc';
      if (!acc[cat]) acc[cat] = { total: 0, items: [] };
      acc[cat].total += (tx.price * tx.quantity);
      acc[cat].items.push(tx);
      return acc;
    }, {});
  }, [transactions, customDate]);

  // --- NEW: UTANG PAYMENTS FOR SELECTED DAY ---
  const paymentsToday = useMemo(() => {
    const selectedDateStr = new Date(customDate).toDateString();
    return transactions.filter(tx => tx.type === 'payment' && new Date(tx.created_at).toDateString() === selectedDateStr);
  }, [transactions, customDate]);

  // Calculate total payments for the header
  const totalPaymentsToday = paymentsToday.reduce((sum, tx) => sum + tx.amount, 0);

  const graphData = useMemo(() => {
    const grouped = transactions.reduce((acc, tx) => {
      const dateKey = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, revenue: 0, expenses: 0, profit: 0 };
      if (tx.type === 'sale') acc[dateKey].revenue += (tx.price * tx.quantity);
      else if (tx.type === 'payment') acc[dateKey].revenue += tx.amount;
      else if (tx.type === 'expense') acc[dateKey].expenses += tx.amount;
      return acc;
    }, {});
    return Object.values(grouped).map(day => {
      day.profit = day.revenue - day.expenses;
      return day;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [transactions]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesDate = new Date(tx.created_at).toDateString() === new Date(customDate).toDateString();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (tx.name && tx.name.toLowerCase().includes(searchLower)) || (tx.notes && tx.notes.toLowerCase().includes(searchLower));
    return matchesDate && matchesSearch;
  });

  if (loading) return <div className="loading-screen"><div className="spinner"></div><span>Loading...</span></div>;

  if (!session) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Business Tracker</h1>
          <p>Please sign in to continue</p>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="btn-sale" disabled={loading}>{loading ? 'Signing In...' : 'SIGN IN'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{ flex: 1 }}></div>
          <div style={{ textAlign: 'center', flex: 2 }}>
            <h1>{dateInfo.fullDate}</h1>
            <div className="sub-header">{dateInfo.weekInfo} • {dateInfo.currentTime}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
             <button onClick={handleLogout} style={{width: 'auto', padding: '5px 10px', fontSize: '12px', background: '#7f8c8d'}}>LOG OUT</button>
          </div>
        </div>
      </header>

      <div className="main-grid">
        <div className="left-panel">
          <div style={{ background: 'white', padding: '15px', borderRadius: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>📅 LOGGING DATE:</span>
            <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} style={{ width: 'auto', height: '35px', padding: '5px', fontWeight: 'bold' }} />
          </div>

          <div className="stats-row">
            <div className="stat-card main-stat">
              <div className="stat-label">NET PROFIT</div>
              <div className="stat-value" style={{ color: netProfit >= 0 ? '#007aff' : '#dc3545' }}>₱{netProfit.toFixed(2)}</div>
            </div>
            <div className="stat-card"><div className="stat-label">Revenue</div><div className="stat-value positive">₱{dashboardStats.revenue.toFixed(2)}</div></div>
            <div className="stat-card"><div className="stat-label">Expenses</div><div className="stat-value negative">₱{dashboardStats.expenses.toFixed(2)}</div></div>
          </div>

          <div className="forms-container">
            {editingId && (<div className="editing-banner"><span>Editing...</span><button onClick={cancelEdit} className="btn-cancel">CANCEL</button></div>)}
            {(!editingId || editType === 'sale') && (
            <div className={`form-section ${editingId && editType !== 'sale' ? 'disabled' : ''}`}>
              <h2>{editingId ? 'Update Sale' : 'Add Sale'}</h2>
              <form onSubmit={handleSaleSubmit}>
                <select name="category" value={saleFormData.category} onChange={handleSaleInput} disabled={editingId && editType !== 'sale'}>
                  <option value="Meal/Ulam">Meal / Ulam</option><option value="Drinks">Drinks</option><option value="Curls/Merienda">Curls / Merienda</option><option value="Biscuits/Candies">Biscuits / Candies</option><option value="Misc">Misc</option>
                </select>
                <div className="input-row-3">
                    {saleFormData.category === 'Misc' ? (
                      <input type="text" name="name" placeholder="Item Name" value={saleFormData.name} onChange={handleSaleInput} className="input-name" disabled={editingId && editType !== 'sale'} />
                    ) : (
                      <select name="name" value={saleFormData.name} onChange={handleSaleInput} className="input-name" disabled={editingId && editType !== 'sale'}>
                        <option value="">-- Select --</option>{MENU_ITEMS[saleFormData.category].map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
                      </select>
                    )}
                    <input type="number" name="price" placeholder="Price" value={saleFormData.price} onChange={handleSaleInput} step="0.01" className="input-price" disabled={saleFormData.category !== 'Misc' || (editingId && editType !== 'sale')} readOnly={saleFormData.category !== 'Misc'} style={saleFormData.category !== 'Misc' ? {backgroundColor: '#e9ecef'} : {}} />
                    <input type="number" name="quantity" placeholder="Qty" value={saleFormData.quantity} onChange={handleSaleInput} className="input-qty" disabled={editingId && editType !== 'sale'}/>
                </div>
                <button type="submit" className="btn-sale" disabled={editingId && editType !== 'sale'}>{editingId ? 'UPDATE' : 'ADD SALE'}</button>
              </form>
            </div>
            )}
            {(!editingId || editType !== 'sale') && (
            <div className="split-forms">
                {(!editingId || editType === 'expense') && (
                <div className="form-section">
                <h2>Expense</h2>
                <form onSubmit={handleExpenseSubmit}>
                    <input type="text" name="name" placeholder="Name" value={expenseFormData.name} onChange={handleExpenseInput} />
                    <input type="number" name="amount" placeholder="Amount" value={expenseFormData.amount} onChange={handleExpenseInput} />
                    <button type="submit" className="btn-expense">ADD EXPENSE</button>
                </form>
                </div>
                )}
                {(!editingId || editType === 'payment') && (
                <div className="form-section">
                <h2>Utang Payment</h2>
                <form onSubmit={handlePaymentSubmit}>
                    <input type="text" name="notes" placeholder="Customer" value={paymentFormData.notes} onChange={handlePaymentInput} />
                    <input type="number" name="amount" placeholder="Amount" value={paymentFormData.amount} onChange={handlePaymentInput} />
                    <button type="submit" className="btn-payment">LOG PAYMENT</button>
                </form>
                </div>
                )}
            </div>
            )}
          </div>
          
          <button className="btn-analysis" onClick={() => setShowAnalysis(!showAnalysis)}>{showAnalysis ? "HIDE ANALYSIS ▼" : "SHOW ANALYSIS ▲"}</button>
          {showAnalysis && (
            <div className="analysis-section">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <h3 style={{margin:0}}>Profit Trend</h3>
              </div>
              <div style={{ width: '100%', height: 200, marginBottom: '20px' }}>
                <ResponsiveContainer>
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#2ecc71" name="Revenue" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="expenses" stroke="#e74c3c" name="Expenses" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="profit" stroke="#007aff" name="Net Profit" strokeWidth={3} dot={true} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h3>Daily Report</h3>
              <div className="category-grid">
                {/* UTANG PAYMENTS CARD */}
                {paymentsToday.length > 0 && (
                  <div className="category-card" style={{borderColor: '#27ae60'}}>
                    <div className="cat-header" style={{background: '#eafaf1', color: '#27ae60'}}>
                      <span>Utang Payments</span>
                      <span className="cat-total">₱{totalPaymentsToday.toFixed(2)}</span>
                    </div>
                    <ul className="cat-list">
                      {paymentsToday.map(tx => (
                        <li key={tx.id}>
                          <span>{tx.notes}</span>
                          <span>₱{tx.amount.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* SALES CATEGORIES */}
                {Object.entries(salesByCategory).map(([catName, data]) => (
                  <div key={catName} className="category-card">
                    <div className="cat-header">
                      <span>{catName}</span>
                      <span className="cat-total">₱{data.total.toFixed(2)}</span>
                    </div>
                    <ul className="cat-list">
                      {data.items.map(item => (
                        <li key={item.id}>
                          <span>{item.name} <small>x{item.quantity}</small> <small style={{color:'#999', marginLeft:'4px'}}>(@ ₱{item.price})</small></span>
                          <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="right-panel">
          <div style={{flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottom: '1px solid #333'}}>
            <div className="terminal-header">
              <span className="terminal-dot red"></span><span className="terminal-dot yellow"></span><span className="terminal-dot green"></span>
              <span className="terminal-title">{dateInfo.dayInfo} • History</span>
              <input type="text" placeholder="Search..." className="terminal-search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="terminal-window">
              {filteredTransactions.length === 0 ? <div className="terminal-line system"> -- No transactions found.</div> : filteredTransactions.map(tx => (
                  <div key={tx.id} className={`terminal-line ${editingId === tx.id ? 'highlight-edit' : ''}`}>
                    <div className="term-actions">
                      <button className="action-btn edit" onClick={() => handleEdit(tx)}>✎</button>
                      <button className="action-btn del" onClick={() => initiateDelete(tx.id)}>×</button>
                    </div>
                    <span className="term-time">[{new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                    {tx.type === 'sale' && <><span className="term-cmd sale">SALE</span><span className="term-detail">{tx.name} (x{tx.quantity})</span><span className="term-val positive">+₱{(tx.price * tx.quantity).toFixed(2)}</span></>}
                    {tx.type === 'payment' && <><span className="term-cmd pay">PAY</span><span className="term-detail">{tx.notes}</span><span className="term-val positive">+₱{tx.amount.toFixed(2)}</span></>}
                    {tx.type === 'expense' && <><span className="term-cmd exp">EXP</span><span className="term-detail">{tx.name}</span><span className="term-val negative">-₱{tx.amount.toFixed(2)}</span></>}
                  </div>
                ))}
            </div>
          </div>

          <div style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: '4px solid #2d2d2d'}}>
            <div className="terminal-header" style={{background: '#252526'}}>
              <span className="terminal-title" style={{marginLeft:0}}>System Logs (Daily)</span>
            </div>
            <div className="terminal-window" style={{background: '#1e1e1e'}}>
              {systemLogs.length === 0 ? <div className="terminal-line system" style={{color:'#666'}}> -- No logs for this date.</div> : systemLogs.map(log => (
                <div key={log.id} className="terminal-line">
                  <span className="term-time" style={{color:'#888'}}>[{new Date(log.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]</span>
                  <span style={{color: '#aaa', fontSize: '0.8rem'}}>{log.action}: {log.details}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleExportCSV} className="btn-export">📄 EXPORT TO CSV</button>
        </div>
      </div>

      {confirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{marginTop:0, color: '#c0392b'}}>Confirm Deletion</h3>
            <p>Are you sure you want to delete this item?</p>
            <div className="modal-actions">
              <button className="btn-close" onClick={cancelDelete}>Cancel</button>
              <button className="btn-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;