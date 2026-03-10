// src/App.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import {
  loginUser, logoutUser,
  getConsumers, addConsumer, deleteConsumer, updateConsumerStatus,
  getBillsForConsumer, getAllBills, addBill, markBillPaid,
  getSystemUsers
} from "./firebase/services";
import BillReceipt from "./components/BillReceipt";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ROLES = { admin: "admin", reader: "reader" };

// Role lookup by email (stored in Firestore systemUsers collection)
// Fallback: admin@bitwasa.com is always admin
const isAdminEmail = (email) =>
  email?.endsWith("@bitwasa.com") && email?.startsWith("admin");

// ── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: "#070f1d", fontFamily: "'Segoe UI', sans-serif", display: "flex", color: "#fff" },
  sidebar: {
    width: 240, background: "linear-gradient(180deg, #0d1f38 0%, #091525 100%)",
    borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column",
    position: "fixed", height: "100vh", zIndex: 100, overflowY: "auto"
  },
  main: { marginLeft: 240, flex: 1, padding: "32px", minHeight: "100vh" },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 },
  th: { padding: "12px 14px", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { padding: "13px 14px", color: "rgba(255,255,255,0.82)", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)" },
  label: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, boxSizing: "border-box" },
  btnPrimary: { padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #22d3a0, #0891b2)", color: "#0a1628", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  btnDanger: { padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#f87171", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  btnGhost: { padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnSm: { padding: "5px 11px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12 },
};

// ── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, loading, error }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0a1628 0%, #0d2240 60%, #0a3355 100%)",
      fontFamily: "'Segoe UI', sans-serif", position: "relative", overflow: "hidden"
    }}>
      <style>{`
        @keyframes float { from{transform:translateY(0)} to{transform:translateY(-18px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .lc input:focus { outline:none; border-color:#22d3a0!important; box-shadow: 0 0 0 3px rgba(34,211,160,0.15)!important; }
        .lc .login-btn:hover { transform:translateY(-2px); box-shadow: 0 8px 24px rgba(34,211,160,0.35)!important; }
      `}</style>

      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: "absolute", borderRadius: "50%",
          width: 80 + i * 40, height: 80 + i * 40,
          background: `rgba(34,211,160,${0.02 + i * 0.008})`,
          border: "1px solid rgba(34,211,160,0.07)",
          top: `${8 + i * 12}%`, left: `${5 + i * 14}%`,
          animation: `float ${5 + i}s ease-in-out infinite alternate`
        }} />
      ))}

      <div className="lc" style={{
        animation: "fadeUp 0.55s ease",
        background: "rgba(255,255,255,0.04)", backdropFilter: "blur(22px)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24,
        padding: "44px 40px", width: 400, maxWidth: "90vw",
        boxShadow: "0 28px 72px rgba(0,0,0,0.55)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%", margin: "0 auto 14px",
            background: "linear-gradient(135deg, #22d3a0, #0891b2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, boxShadow: "0 8px 28px rgba(34,211,160,0.28)"
          }}>💧</div>
          <div style={{ color: "#22d3a0", fontSize: 10, letterSpacing: 4, fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>
            Brgy. Bitoon · Del Carmen
          </div>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>BITWASA</h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, margin: "4px 0 0" }}>Water & Sanitation Association Portal</p>
        </div>

        {error && (
          <div style={{ background: "rgba(248,113,113,0.14)", border: "1px solid rgba(248,113,113,0.35)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, color: "#fca5a5", fontSize: 13, textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Enter your email" style={S.input} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={S.label}>Password</label>
          <div style={{ position: "relative" }}>
            <input value={pw} onChange={e => setPw(e.target.value)} type={show ? "text" : "password"}
              onKeyDown={e => e.key === "Enter" && onLogin(email, pw)}
              placeholder="Enter password" style={{ ...S.input, paddingRight: 42 }} />
            <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 15 }}>
              {show ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <button className="login-btn" onClick={() => onLogin(email, pw)} disabled={loading}
          style={{ ...S.btnPrimary, width: "100%", padding: "13px", fontSize: 15, opacity: loading ? 0.6 : 1, transition: "all 0.2s" }}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}

// ── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{
        background: "#0d1f38", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
        padding: 32, width: wide ? 620 : 460, maxWidth: "93vw", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 28px 72px rgba(0,0,0,0.6)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 17, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: type === "error" ? "rgba(239,68,68,0.92)" : "rgba(34,211,160,0.92)",
      color: type === "error" ? "#fff" : "#072012",
      padding: "11px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14,
      boxShadow: "0 8px 28px rgba(0,0,0,0.4)", backdropFilter: "blur(10px)"
    }}>
      {type === "error" ? "❌ " : "✅ "}{msg}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [consumers, setConsumers] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [consumerBills, setConsumerBills] = useState({});
  const [systemUsers, setSystemUsers] = useState([]);

  const [view, setView] = useState("dashboard");
  const [selectedConsumer, setSelectedConsumer] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showReadingModal, setShowReadingModal] = useState(null);
  const [showReceipt, setShowReceipt] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [addForm, setAddForm] = useState({ name: "", meterNo: "", purok: "1", contactNo: "" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const isAdmin = userRole === ROLES.admin;

  // ── AUTH LISTENER ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Determine role
        const role = isAdminEmail(u.email) ? ROLES.admin : ROLES.reader;
        setUserRole(role);
        await loadAll();
      } else {
        setUser(null);
        setUserRole(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, b] = await Promise.all([getConsumers(), getAllBills()]);
      setConsumers(c);
      setAllBills(b);
    } catch (e) { showToast("Failed to load data", "error"); }
    setLoading(false);
  };

  const loadConsumerBills = async (consumerId) => {
    if (consumerBills[consumerId]) return;
    const bills = await getBillsForConsumer(consumerId);
    setConsumerBills(prev => ({ ...prev, [consumerId]: bills }));
  };

  // ── LOGIN ──
  const handleLogin = async (email, pw) => {
    setLoginLoading(true); setLoginError("");
    try {
      await loginUser(email, pw);
    } catch (e) {
      setLoginError("Invalid email or password.");
    }
    setLoginLoading(false);
  };

  // ── ADD CONSUMER ──
  const handleAddConsumer = async () => {
    if (!addForm.name || !addForm.meterNo) { showToast("Fill all required fields", "error"); return; }
    setLoading(true);
    try {
      const nextNum = consumers.length + 1;
      const accountNo = `BIT-${String(nextNum).padStart(4, "0")}`;
      await addConsumer({
        name: addForm.name,
        address: `Purok ${addForm.purok}, Bitoon, Del Carmen`,
        accountNo,
        meterNo: addForm.meterNo,
        contactNo: addForm.contactNo,
        purok: addForm.purok,
      });
      await loadAll();
      setAddForm({ name: "", meterNo: "", purok: "1", contactNo: "" });
      setShowAddModal(false);
      showToast(`Consumer "${addForm.name}" added.`);
    } catch (e) { showToast("Failed to add consumer", "error"); }
    setLoading(false);
  };

  // ── DELETE CONSUMER ──
  const handleDelete = async (c) => {
    if (deleteConfirm !== c.accountNo) { showToast("Account number doesn't match", "error"); return; }
    setLoading(true);
    try {
      await deleteConsumer(c.id);
      await loadAll();
      setShowDeleteModal(null); setDeleteConfirm("");
      if (selectedConsumer?.id === c.id) { setSelectedConsumer(null); setView("consumers"); }
      showToast(`"${c.name}" deleted.`);
    } catch (e) { showToast("Delete failed", "error"); }
    setLoading(false);
  };

  // ── ADD BILL / READING ──
  const handleAddReading = async ({ consumer, reading, prevReading, amount, month, year, arrears }) => {
    setLoading(true);
    try {
      const readDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
      const dueDate = (() => {
        const d = new Date(); d.setDate(d.getDate() + 20);
        return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
      })();
      await addBill({
        consumerId: consumer.id,
        consumerName: consumer.name,
        accountNo: consumer.accountNo,
        meterNo: consumer.meterNo,
        address: consumer.address,
        prevReading: Number(prevReading),
        reading: Number(reading),
        consumption: Number(reading) - Number(prevReading),
        amount: Number(amount),
        arrears: Number(arrears) || 0,
        month,
        year,
        readDate,
        dueDate,
        billNo: `BIT-${year}-${Math.floor(Math.random() * 9000 + 1000)}`,
        paid: false,
      });
      setConsumerBills(prev => ({ ...prev, [consumer.id]: undefined }));
      await loadAll();
      setShowReadingModal(null);
      showToast("Meter reading saved.");
    } catch (e) { showToast("Failed to save reading", "error"); }
    setLoading(false);
  };

  // ── TOGGLE PAID ──
  const handleTogglePaid = async (billId, paid) => {
    await markBillPaid(billId, !paid);
    setAllBills(prev => prev.map(b => b.id === billId ? { ...b, paid: !paid } : b));
    setConsumerBills(prev => {
      const updated = {};
      Object.keys(prev).forEach(k => {
        if (prev[k]) updated[k] = prev[k].map(b => b.id === billId ? { ...b, paid: !paid } : b);
      });
      return { ...prev, ...updated };
    });
    showToast(`Bill marked ${!paid ? "paid" : "unpaid"}.`);
  };

  // ── COMPUTED ──
  const filtered = useMemo(() =>
    consumers.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.accountNo?.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase())
    ), [consumers, search]);

  const stats = useMemo(() => ({
    total: consumers.length,
    active: consumers.filter(c => c.status === "Active").length,
    unpaid: allBills.filter(b => !b.paid).length,
    collected: allBills.filter(b => b.paid).reduce((s, b) => s + (b.amount || 0), 0),
    billed: allBills.reduce((s, b) => s + (b.amount || 0), 0),
  }), [consumers, allBills]);

  const globalChartData = useMemo(() => {
    return MONTHS.map(m => {
      const monthBills = allBills.filter(b => b.month === m);
      return {
        month: m,
        total: monthBills.reduce((s, b) => s + (b.amount || 0), 0),
        collected: monthBills.filter(b => b.paid).reduce((s, b) => s + (b.amount || 0), 0),
      };
    });
  }, [allBills]);

  // ── RENDER ──
  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#070f1d", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#22d3a0", fontSize: 18, fontWeight: 700 }}>💧 Loading BITWASA…</div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} loading={loginLoading} error={loginError} />;

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "consumers", icon: "👥", label: "Consumers" },
    ...(isAdmin ? [{ id: "billing", icon: "🧾", label: "Billing" }] : []),
    { id: "graphs", icon: "📈", label: "Analytics" },
    ...(isAdmin ? [{ id: "accounts", icon: "🔐", label: "Accounts" }] : []),
  ];

  return (
    <div style={S.app}>
      <style>{`
        *{box-sizing:border-box;} html,body{margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .navbtn:hover{background:rgba(34,211,160,0.09)!important;color:#22d3a0!important;}
        .crow:hover{background:rgba(255,255,255,0.025)!important;}
        input:focus,select:focus{outline:none;border-color:#22d3a0!important;}
        .abtn:hover{opacity:0.8;transform:scale(1.04);}
      `}</style>

      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #22d3a0, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💧</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: "0.5px" }}>BITWASA</div>
              <div style={{ color: "#22d3a0", fontSize: 9.5, fontWeight: 700, letterSpacing: 1 }}>Brgy. Bitoon · Del Carmen</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "14px 10px" }}>
          {navItems.map(item => (
            <button key={item.id} className="navbtn"
              onClick={() => { setView(item.id); setSelectedConsumer(null); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 13px",
                borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 3,
                background: view === item.id ? "rgba(34,211,160,0.11)" : "transparent",
                color: view === item.id ? "#22d3a0" : "rgba(255,255,255,0.52)",
                fontWeight: view === item.id ? 700 : 500, fontSize: 13.5, textAlign: "left",
                borderLeft: view === item.id ? "3px solid #22d3a0" : "3px solid transparent",
                transition: "all 0.14s",
              }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
            <div style={{ color: isAdmin ? "#22d3a0" : "#60a5fa", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              {isAdmin ? "🛡 Admin" : "📋 Meter Reader"}
            </div>
          </div>
          <button onClick={() => logoutUser()} style={{ ...S.btnGhost, width: "100%", fontSize: 12 }}>Sign Out</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={S.main}>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
        {showReceipt && (
          <BillReceipt
            bill={showReceipt.bill}
            consumer={showReceipt.consumer}
            onClose={() => setShowReceipt(null)}
          />
        )}

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <div style={{ marginBottom: 26 }}>
              <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 27, margin: 0, letterSpacing: "-0.5px" }}>Dashboard</h1>
              <p style={{ color: "rgba(255,255,255,0.38)", margin: "4px 0 0", fontSize: 14 }}>Barangay Bitoon Water System — Live Overview</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 15, marginBottom: 24 }}>
              {[
                { label: "Total Consumers", value: stats.total, icon: "👥", color: "#22d3a0" },
                { label: "Active Connections", value: stats.active, icon: "✅", color: "#60a5fa" },
                { label: "Unpaid Bills", value: stats.unpaid, icon: "⚠️", color: "#fbbf24" },
                { label: "Total Collected", value: `₱${stats.collected.toLocaleString()}`, icon: "💰", color: "#a78bfa" },
              ].map((s, i) => (
                <div key={i} style={{ ...S.card, borderTop: `3px solid ${s.color}`, transition: "transform 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                      <div style={{ color: s.color, fontSize: 28, fontWeight: 900, marginTop: 6 }}>{s.value}</div>
                    </div>
                    <div style={{ fontSize: 26 }}>{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div style={S.card}>
                <h3 style={{ color: "#fff", fontWeight: 700, margin: "0 0 18px", fontSize: 14 }}>Monthly Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={globalChartData}>
                    <defs>
                      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3a0" stopOpacity={0.28}/>
                        <stop offset="95%" stopColor="#22d3a0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#0d1f38", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Area type="monotone" dataKey="total" stroke="#22d3a0" fill="url(#ga)" strokeWidth={2} name="Billed (₱)" />
                    <Area type="monotone" dataKey="collected" stroke="#60a5fa" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Collected (₱)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <h3 style={{ color: "#fff", fontWeight: 700, margin: "0 0 14px", fontSize: 14 }}>Recent Consumers</h3>
                {consumers.slice(0, 6).map(c => (
                  <div key={c.id} onClick={() => { setSelectedConsumer(c); setView("consumerDetail"); loadConsumerBills(c.id); }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 11 }}>{c.accountNo} · {c.address}</div>
                    </div>
                    <span style={{ background: c.status === "Active" ? "rgba(34,211,160,0.12)" : "rgba(248,113,113,0.12)", color: c.status === "Active" ? "#22d3a0" : "#f87171", padding: "2px 9px", borderRadius: 20, fontSize: 10.5, fontWeight: 700 }}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CONSUMERS ── */}
        {view === "consumers" && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div>
                <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 26, margin: 0 }}>Consumers</h1>
                <p style={{ color: "rgba(255,255,255,0.38)", margin: "3px 0 0", fontSize: 13 }}>{filtered.length} registered water consumers</p>
              </div>
              {isAdmin && <button style={S.btnPrimary} onClick={() => setShowAddModal(true)}>+ Add Consumer</button>}
            </div>
            <div style={{ ...S.card, marginBottom: 14, padding: "14px 18px" }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Search name, account no., or address…" style={{ ...S.input, background: "rgba(255,255,255,0.03)" }} />
            </div>
            <div style={S.card}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Account No.", "Name", "Address", "Meter No.", "Status", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="crow">
                      <td style={S.td}><span style={{ color: "#22d3a0", fontWeight: 700, fontFamily: "monospace" }}>{c.accountNo}</span></td>
                      <td style={S.td}><span style={{ fontWeight: 600 }}>{c.name}</span></td>
                      <td style={S.td}><span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{c.address}</span></td>
                      <td style={S.td}>{c.meterNo}</td>
                      <td style={S.td}>
                        <span style={{ background: c.status === "Active" ? "rgba(34,211,160,0.11)" : "rgba(248,113,113,0.11)", color: c.status === "Active" ? "#22d3a0" : "#f87171", padding: "2px 9px", borderRadius: 20, fontSize: 10.5, fontWeight: 700 }}>{c.status}</span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button className="abtn" onClick={() => { setSelectedConsumer(c); setView("consumerDetail"); loadConsumerBills(c.id); }}
                            style={{ ...S.btnSm, background: "rgba(34,211,160,0.12)", color: "#22d3a0", transition: "all 0.15s" }}>View</button>
                          <button className="abtn" onClick={() => setShowReadingModal(c)}
                            style={{ ...S.btnSm, background: "rgba(96,165,250,0.12)", color: "#60a5fa", transition: "all 0.15s" }}>+ Reading</button>
                          {isAdmin && <button className="abtn" onClick={() => { setShowDeleteModal(c); setDeleteConfirm(""); }}
                            style={{ ...S.btnSm, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", transition: "all 0.15s" }}>Delete</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.28)" }}>No consumers found.</div>}
            </div>
          </div>
        )}

        {/* ── CONSUMER DETAIL ── */}
        {view === "consumerDetail" && selectedConsumer && (() => {
          const c = consumers.find(x => x.id === selectedConsumer.id) || selectedConsumer;
          const bills = consumerBills[c.id] || [];
          const consumerAllBills = allBills.filter(b => b.consumerId === c.id);
          const displayBills = bills.length > 0 ? bills : consumerAllBills;

          return (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 22, flexWrap: "wrap" }}>
                <button style={S.btnGhost} onClick={() => { setView("consumers"); setSelectedConsumer(null); }}>← Back</button>
                <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 24, margin: 0 }}>{c.name}</h1>
                <span style={{ background: c.status === "Active" ? "rgba(34,211,160,0.12)" : "rgba(248,113,113,0.12)", color: c.status === "Active" ? "#22d3a0" : "#f87171", padding: "3px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{c.status}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18, marginBottom: 18 }}>
                <div style={S.card}>
                  <h3 style={{ color: "#22d3a0", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 14px" }}>Consumer Info</h3>
                  {[["Account No.", c.accountNo], ["Meter No.", c.meterNo], ["Address", c.address], ["Contact", c.contactNo || "N/A"], ["Connected", c.createdAt?.toDate?.()?.toLocaleDateString("en-PH") || "—"]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{k}</span>
                      <span style={{ color: "#fff", fontWeight: 600, fontSize: 12, textAlign: "right" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    <button style={S.btnPrimary} onClick={() => setShowReadingModal(c)}>+ Add Reading</button>
                    {isAdmin && <button style={S.btnDanger} onClick={() => { setShowDeleteModal(c); setDeleteConfirm(""); }}>Delete Consumer</button>}
                  </div>
                </div>
                <div style={S.card}>
                  <h3 style={{ color: "#fff", fontWeight: 700, margin: "0 0 16px", fontSize: 14 }}>Billing History Chart</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={displayBills.slice(0, 12).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0d1f38", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                      <Bar dataKey="amount" fill="#22d3a0" radius={[4,4,0,0]} name="Amount (₱)" />
                      <Bar dataKey="consumption" fill="#60a5fa" radius={[4,4,0,0]} name="Usage (m³)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={S.card}>
                <h3 style={{ color: "#fff", fontWeight: 700, margin: "0 0 16px", fontSize: 14 }}>Past Bills</h3>
                {displayBills.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 32 }}>No bills yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["Month/Year","Prev Reading","Curr Reading","Usage","Amount","Status","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {displayBills.map((b, i) => (
                        <tr key={b.id || i} className="crow">
                          <td style={S.td}>{b.month} {b.year}</td>
                          <td style={S.td}>{b.prevReading ?? "—"} m³</td>
                          <td style={S.td}>{b.reading} m³</td>
                          <td style={S.td}>{b.consumption ?? "—"} m³</td>
                          <td style={S.td}><span style={{ color: "#22d3a0", fontWeight: 700 }}>₱{(b.amount || 0).toLocaleString()}</span></td>
                          <td style={S.td}>
                            <span style={{ background: b.paid ? "rgba(34,211,160,0.11)" : "rgba(251,191,36,0.11)", color: b.paid ? "#22d3a0" : "#fbbf24", padding: "2px 9px", borderRadius: 20, fontSize: 10.5, fontWeight: 700 }}>
                              {b.paid ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td style={S.td}>
                            <div style={{ display: "flex", gap: 5 }}>
                              <button className="abtn" onClick={() => setShowReceipt({ bill: b, consumer: c })}
                                style={{ ...S.btnSm, background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)", transition: "all 0.15s" }}>🖨 Print</button>
                              {isAdmin && (
                                <button className="abtn" onClick={() => handleTogglePaid(b.id, b.paid)}
                                  style={{ ...S.btnSm, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s" }}>
                                  Mark {b.paid ? "Unpaid" : "Paid"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── BILLING ── */}
        {view === "billing" && isAdmin && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 26, margin: "0 0 6px" }}>Billing Overview</h1>
            <p style={{ color: "rgba(255,255,255,0.38)", margin: "0 0 22px", fontSize: 13 }}>All consumer billing records</p>
            <div style={S.card}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Consumer","Account","Month/Year","Reading","Amount","Arrears","Status","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {allBills.map((b, i) => (
                    <tr key={b.id || i} className="crow">
                      <td style={S.td}><span style={{ fontWeight: 600 }}>{b.consumerName}</span></td>
                      <td style={S.td}><span style={{ color: "#22d3a0", fontFamily: "monospace", fontSize: 12 }}>{b.accountNo}</span></td>
                      <td style={S.td}>{b.month} {b.year}</td>
                      <td style={S.td}>{b.reading} m³</td>
                      <td style={S.td}><span style={{ color: "#22d3a0", fontWeight: 700 }}>₱{(b.amount || 0).toLocaleString()}</span></td>
                      <td style={S.td}>{b.arrears > 0 ? <span style={{ color: "#fbbf24" }}>₱{b.arrears}</span> : "—"}</td>
                      <td style={S.td}>
                        <span style={{ background: b.paid ? "rgba(34,211,160,0.11)" : "rgba(251,191,36,0.11)", color: b.paid ? "#22d3a0" : "#fbbf24", padding: "2px 9px", borderRadius: 20, fontSize: 10.5, fontWeight: 700 }}>
                          {b.paid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button className="abtn" onClick={() => {
                            const c = consumers.find(x => x.id === b.consumerId) || { name: b.consumerName, accountNo: b.accountNo, meterNo: b.meterNo, address: b.address };
                            setShowReceipt({ bill: b, consumer: c });
                          }} style={{ ...S.btnSm, background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)", transition: "all 0.15s" }}>🖨 Print</button>
                          <button className="abtn" onClick={() => handleTogglePaid(b.id, b.paid)}
                            style={{ ...S.btnSm, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s" }}>
                            Mark {b.paid ? "Unpaid" : "Paid"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {view === "graphs" && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 26, margin: "0 0 6px" }}>Analytics</h1>
            <p style={{ color: "rgba(255,255,255,0.38)", margin: "0 0 22px", fontSize: 13 }}>System-wide and per-consumer insights</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
              <div style={S.card}>
                <h3 style={{ color: "#fff", fontWeight: 700, margin: "0 0 18px", fontSize: 14 }}>📊 Billed vs Collected</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={globalChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#0d1f38", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Legend wrapperStyle={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                    <Bar dataKey="total" fill="#22d3a0" radius={[4,4,0,0]} name="Billed (₱)" />
                    <Bar dataKey="collected" fill="#60a5fa" radius={[4,4,0,0]} name="Collected (₱)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <h3 style={{ color: "#fff", fontWeight: 700, margin: "0 0 18px", fontSize: 14 }}>📈 Collection Trend</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={globalChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#0d1f38", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Legend wrapperStyle={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                    <Line type="monotone" dataKey="total" stroke="#22d3a0" strokeWidth={2.5} dot={{ r: 3 }} name="Billed (₱)" />
                    <Line type="monotone" dataKey="collected" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 3 }} name="Collected (₱)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <h3 style={{ color: "#fff", fontWeight: 700, margin: "0 0 18px", fontSize: 14 }}>👤 Per Consumer Monthly Billing</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" type="category" allowDuplicatedCategory={false} stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#0d1f38", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  <Legend wrapperStyle={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                  {consumers.slice(0, 7).map((c, i) => {
                    const cols = ["#22d3a0","#60a5fa","#a78bfa","#fbbf24","#f87171","#34d399","#fb923c"];
                    const cBills = allBills.filter(b => b.consumerId === c.id);
                    return <Line key={c.id} data={cBills} type="monotone" dataKey="amount" stroke={cols[i]} strokeWidth={2} dot={false} name={c.name?.split(" ")[0]} />;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── ACCOUNTS ── */}
        {view === "accounts" && isAdmin && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 26, margin: "0 0 6px" }}>System Accounts</h1>
            <p style={{ color: "rgba(255,255,255,0.38)", margin: "0 0 22px", fontSize: 13 }}>Firebase Authentication manages user logins</p>
            <div style={{ ...S.card, marginBottom: 18 }}>
              <div style={{ background: "rgba(34,211,160,0.08)", border: "1px solid rgba(34,211,160,0.2)", borderRadius: 10, padding: "14px 18px" }}>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>
                  <b style={{ color: "#22d3a0" }}>🔐 Role Assignment:</b> Users whose email starts with <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 4 }}>admin@</code> and ends with <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 4 }}>@bitwasa.com</code> are automatically granted <b>Admin</b> access. All other authenticated users are <b>Meter Readers</b>.
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "10px 0 0" }}>
                  To add new users: go to <b>Firebase Console → Authentication → Add User</b>. Use <b>admin@bitwasa.com</b> for admins, or any other email for meter readers.
                </p>
              </div>
            </div>
            <div style={S.card}>
              <h3 style={{ color: "#fff", fontWeight: 700, margin: "0 0 16px", fontSize: 14 }}>Firestore Security Rules</h3>
              <pre style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16, color: "#22d3a0", fontSize: 12, overflowX: "auto", margin: 0 }}>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read
    match /consumers/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email.matches('admin@.*');
    }
    match /bills/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.token.email.matches('admin@.*');
    }
  }
}`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showAddModal && (
        <Modal title="➕ Add New Consumer" onClose={() => setShowAddModal(false)}>
          {[
            { label: "Full Name *", key: "name", placeholder: "e.g. Maria Santos", type: "text" },
            { label: "Meter Number *", key: "meterNo", placeholder: "e.g. M-10099", type: "text" },
            { label: "Contact No.", key: "contactNo", placeholder: "e.g. 09xx-xxx-xxxx", type: "text" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={S.label}>{f.label}</label>
              <input type={f.type} value={addForm[f.key]} onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder} style={S.input} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Purok</label>
            <select value={addForm.purok} onChange={e => setAddForm(p => ({ ...p, purok: e.target.value }))} style={S.input}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n} style={{ background: "#0d1f38" }}>Purok {n}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={S.btnGhost} onClick={() => setShowAddModal(false)}>Cancel</button>
            <button style={S.btnPrimary} onClick={handleAddConsumer} disabled={loading}>{loading ? "Saving…" : "Add Consumer"}</button>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal title="⚠️ Delete Consumer" onClose={() => { setShowDeleteModal(null); setDeleteConfirm(""); }}>
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 14, marginBottom: 18 }}>
            <p style={{ color: "#fca5a5", fontSize: 13, margin: 0 }}>Permanently delete <b>{showDeleteModal.name}</b> and all their billing history. This cannot be undone.</p>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={S.label}>Type account number to confirm: <b style={{ color: "#f87171" }}>{showDeleteModal.accountNo}</b></label>
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={showDeleteModal.accountNo}
              style={{ ...S.input, borderColor: deleteConfirm === showDeleteModal.accountNo ? "#22d3a0" : undefined }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={S.btnGhost} onClick={() => { setShowDeleteModal(null); setDeleteConfirm(""); }}>Cancel</button>
            <button style={{ ...S.btnDanger, opacity: deleteConfirm === showDeleteModal.accountNo ? 1 : 0.4 }}
              onClick={() => handleDelete(showDeleteModal)}>Delete Permanently</button>
          </div>
        </Modal>
      )}

      {showReadingModal && <ReadingModal consumer={showReadingModal} onClose={() => setShowReadingModal(null)} onSave={handleAddReading} loading={loading} S={S} />}
    </div>
  );
}

// ── READING MODAL ──────────────────────────────────────────────────────────
function ReadingModal({ consumer, onClose, onSave, loading, S }) {
  const [form, setForm] = useState({
    prevReading: "", reading: "", month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(), arrears: ""
  });
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (form.reading && form.prevReading && !isNaN(form.reading) && !isNaN(form.prevReading)) {
      const consumption = Number(form.reading) - Number(form.prevReading);
      if (consumption >= 0) {
        const basicCharge = 50;
        const ratePerCubic = 18;
        const sysLoss = consumption * ratePerCubic * 0.03;
        const envFee = 10;
        setAmount(String((basicCharge + consumption * ratePerCubic + sysLoss + envFee).toFixed(2)));
      }
    }
  }, [form.reading, form.prevReading]);

  const consumption = Number(form.reading) - Number(form.prevReading);

  return (
    <Modal title={`📋 Add Reading — ${consumer.name}`} onClose={onClose} wide>
      <div style={{ background: "rgba(34,211,160,0.08)", border: "1px solid rgba(34,211,160,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 18 }}>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Account: </span><span style={{ color: "#22d3a0", fontWeight: 700 }}>{consumer.accountNo}</span>
        <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 8px" }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Meter: </span><span style={{ color: "#fff", fontWeight: 600 }}>{consumer.meterNo}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={S.label}>Prev. Reading (m³)</label>
          <input type="number" value={form.prevReading} onChange={e => setForm(p => ({ ...p, prevReading: e.target.value }))} placeholder="Previous meter reading" style={S.input} />
        </div>
        <div>
          <label style={S.label}>Current Reading (m³)</label>
          <input type="number" value={form.reading} onChange={e => setForm(p => ({ ...p, reading: e.target.value }))} placeholder="Current meter reading" style={S.input} />
        </div>
        {form.reading && form.prevReading && consumption >= 0 && (
          <div style={{ gridColumn: "span 2", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Consumption: </span>
            <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 15 }}>{consumption} m³</span>
          </div>
        )}
        <div>
          <label style={S.label}>Month</label>
          <select value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} style={S.input}>
            {MONTHS.map(m => <option key={m} value={m} style={{ background: "#0d1f38" }}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Year</label>
          <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} style={S.input} />
        </div>
        <div>
          <label style={S.label}>Bill Amount (₱) <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 10 }}>auto-calculated</span></label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={S.input} />
        </div>
        <div>
          <label style={S.label}>Prior Balance / Arrears (₱)</label>
          <input type="number" value={form.arrears} onChange={e => setForm(p => ({ ...p, arrears: e.target.value }))} placeholder="0.00" style={S.input} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button style={S.btnGhost} onClick={onClose}>Cancel</button>
        <button style={S.btnPrimary} disabled={loading || !form.reading || !amount}
          onClick={() => onSave({ consumer, ...form, amount })}>
          {loading ? "Saving…" : "Save Reading"}
        </button>
      </div>
    </Modal>
  );
}
