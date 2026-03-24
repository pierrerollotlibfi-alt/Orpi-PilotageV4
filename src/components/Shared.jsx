// ─── HELPERS PARTAGÉS ────────────────────────────────────────────────────────
export const fmt = (n) => n != null
  ? n.toLocaleString("fr-FR", { style:"currency", currency:"EUR", maximumFractionDigits:0 }) + " HT"
  : "—";

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export const diffDays = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export const todayStr = new Date().toISOString().slice(0,10);

export const AVATAR_COLORS = ["#E63946","#F59E0B","#3B82F6","#10B981","#8B5CF6","#EC4899","#06B6D4","#84CC16"];

export function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < (str||"").length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
export function OrpiLogo({ size = 36 }) {
  return (
    <img
      src="/logo-orpi-declic.png"
      alt="Orpi Déclic Immo"
      style={{ height: size * 1.4, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}

// ─── SIDEBAR LAYOUT ──────────────────────────────────────────────────────────
import { useState } from "react";
import { useApp } from "../App";

export function AppShell({ navItems, children, title, actions }) {
  const { currentUser, handleLogout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      {/* Overlay mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <OrpiLogo size={30} />
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            item.type === "section"
              ? <div key={item.label} style={{ padding:"10px 14px 4px", fontSize:10, color:"rgba(255,255,255,0.3)", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" }}>{item.label}</div>
              : <button
                  key={item.id}
                  className={`nav-item ${item.active ? "active" : ""}`}
                  onClick={() => { item.onClick(); setSidebarOpen(false); }}
                >
                  <span className="icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge != null && (
                    <span style={{ marginLeft:"auto", background:"rgba(255,255,255,0.2)", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:700 }}>
                      {item.badge}
                    </span>
                  )}
                </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 6px" }}>
            <div className="avatar" style={{ background: avatarColor(currentUser?.nom), width:34, height:34, fontSize:12 }}>
              {currentUser?.avatar || currentUser?.nom?.charAt(0)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#fff", fontWeight:700, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentUser?.nom}</div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, textTransform:"capitalize" }}>{currentUser?.role}</div>
            </div>
            <button onClick={handleLogout} title="Déconnexion"
              style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:16, padding:4 }}>
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 style={{ fontSize:17, fontWeight:800, color:"var(--navy)" }}>{title}</h1>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {actions}
            <div style={{ display:"flex", alignItems:"center", gap:8 }} className="hide-mobile">
              <div className="avatar" style={{ background: avatarColor(currentUser?.nom), width:32, height:32, fontSize:11 }}>
                {currentUser?.avatar || currentUser?.nom?.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--navy)", lineHeight:1.2 }}>{currentUser?.nom}</div>
                <div style={{ fontSize:10, color:"var(--gray-400)", textTransform:"capitalize" }}>{currentUser?.role}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, sub, trend, color = "var(--navy)", icon, objectif, realise }) {
  const up = trend > 0, dn = trend < 0;
  const pct = (objectif && realise != null) ? Math.min(Math.round(realise / objectif * 100), 100) : null;
  const barColor = pct == null ? color : pct >= 100 ? "var(--green)" : pct >= 70 ? "var(--amber)" : "var(--red)";
  return (
    <div className="kpi-card" style={{ borderLeftColor: color }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div className="kpi-label">{label}</div>
        {icon && <span style={{ fontSize:18 }}>{icon}</span>}
      </div>
      <div className="kpi-value">{value}</div>
      {sub   && <div className="kpi-sub">{sub}</div>}
      {trend != null && (
        <div className="kpi-trend" style={{ color: up ? "var(--green)" : dn ? "#EF4444" : "var(--gray-400)" }}>
          {up ? "▲" : dn ? "▼" : "—"} {Math.abs(trend)}% vs préc.
        </div>
      )}
      {pct != null && (
        <div style={{ marginTop:6 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, fontWeight:700, marginBottom:3 }}>
            <span style={{ color:"var(--g500)" }}>Objectif {fmt(objectif)}</span>
            <span style={{ color: barColor }}>{pct}%</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-bar" style={{ width:`${pct}%`, background: barColor }}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BADGE STATUT ─────────────────────────────────────────────────────────────
const STATUT_CFG = {
  mandat:    { label:"Mandat",    color:"#1D4ED8", bg:"#EFF6FF" },
  compromis: { label:"Compromis", color:"#B45309", bg:"#FFFBEB" },
  vendu:     { label:"Vendu",     color:"#059669", bg:"#ECFDF5" },
};
export function BadgeStatut({ statut }) {
  const c = STATUT_CFG[statut] || { label:statut, color:"#64748B", bg:"#F1F5F9" };
  return <span className="badge" style={{ background:c.bg, color:c.color, border:`1px solid ${c.color}22` }}>{c.label.toUpperCase()}</span>;
}

// ─── BADGE TYPE MANDAT ────────────────────────────────────────────────────────
export function BadgeType({ typeMandat }) {
  const excl = typeMandat === "exclusif";
  return <span className="badge" style={{ background: excl?"#FEF2F2":"var(--gray-100)", color: excl?"var(--red)":"var(--gray-500)", border:`1px solid ${excl?"var(--red)":"var(--gray-300)"}44` }}>{excl ? "⭐ EXCLUSIF" : "SIMPLE"}</span>;
}

// ─── BADGE NIVEAU ─────────────────────────────────────────────────────────────
export function BadgeNiveau({ niveau }) {
  const senior = niveau === "senior";
  return <span className="badge" style={{ background: senior?"#FEF3C7":"#EFF6FF", color: senior?"#D97706":"#2563EB" }}>{senior ? "🏆 Senior" : "🌱 Junior"}</span>;
}

// ─── PERIOD SELECTOR ─────────────────────────────────────────────────────────
export function PeriodSelector({ value, onChange, customFrom, customTo, onCustomFrom, onCustomTo }) {
  const opts = [["month","Ce mois"],["quarter","Trimestre"],["year","Cette année"],["all","Tout"]];
  return (
    <div className="period-bar">
      <span style={{ fontWeight:700, color:"var(--navy)", fontSize:12 }}>📅</span>
      {opts.map(([k,l]) => (
        <button key={k} className={`period-btn ${value===k?"active":""}`} onClick={()=>onChange(k)}>{l}</button>
      ))}
      <button className={`period-btn ${value==="custom"?"active":""}`} onClick={()=>onChange("custom")}>Perso</button>
      {value === "custom" && <>
        <input type="date" value={customFrom} onChange={e=>onCustomFrom(e.target.value)}
          style={{ border:"1px solid var(--gray-200)", borderRadius:6, padding:"4px 8px", fontSize:12, fontFamily:"var(--font)" }}/>
        <span style={{ color:"var(--gray-400)", fontSize:12 }}>→</span>
        <input type="date" value={customTo} onChange={e=>onCustomTo(e.target.value)}
          style={{ border:"1px solid var(--gray-200)", borderRadius:6, padding:"4px 8px", fontSize:12, fontFamily:"var(--font)" }}/>
      </>}
    </div>
  );
}

export function inPeriod(dateStr, period, customFrom, customTo) {
  if (!dateStr || period === "all") return true;
  const d = new Date(dateStr), t = new Date();
  if (period === "month")   return d.getMonth()===t.getMonth() && d.getFullYear()===t.getFullYear();
  if (period === "quarter") return d.getFullYear()===t.getFullYear() && Math.floor(d.getMonth()/3)===Math.floor(t.getMonth()/3);
  if (period === "year")    return d.getFullYear()===t.getFullYear();
  if (period === "custom")  return (!customFrom||dateStr>=customFrom) && (!customTo||dateStr<=customTo);
  return true;
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: wide ? 700 : 560 }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--gray-400)", lineHeight:1 }}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── MANDAT FORM ─────────────────────────────────────────────────────────────
export function MandatForm({ initial = {}, agents, onSave, onClose }) {
  const [f, setF] = useState({
    ref:"", typeMandat:"simple", adresse:"", prix:"", commission:"",
    statut:"mandat", agentId:"", dateMandat:todayStr,
    dateExpiration:"", dateCompromis:"", dateSignature:"",
    clausesSuspensivesLevees: false,
    ...initial
  });
  const set = (k, v) => setF(p => ({...p, [k]:v}));

  return (
    <Modal title={initial.id ? "✏️ Modifier le mandat" : "➕ Nouveau mandat"} onClose={onClose}
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave({...f, prix:Number(f.prix), commission:Number(f.commission)})}>
          {initial.id ? "Enregistrer" : "Créer le mandat"}
        </button>
      </>}
    >
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Référence</label>
          <input className="form-input" value={f.ref} onChange={e=>set("ref",e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label">Type de mandat</label>
          <div className="toggle-group" style={{marginTop:5}}>
            <button className={`toggle-btn ${f.typeMandat==="simple"?"active-simp":""}`} onClick={()=>set("typeMandat","simple")}>📄 Simple</button>
            <button className={`toggle-btn ${f.typeMandat==="exclusif"?"active-excl":""}`} onClick={()=>set("typeMandat","exclusif")}>⭐ Exclusif</button>
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Adresse</label>
        <input className="form-input" value={f.adresse} onChange={e=>set("adresse",e.target.value)} placeholder="Ex: 12 Rue Saint-Leu, Amiens"/>
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Prix de vente (€)</label>
          <input className="form-input" type="number" value={f.prix} onChange={e=>set("prix",e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label">Commission (€)</label>
          <input className="form-input" type="number" value={f.commission} onChange={e=>set("commission",e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label">Statut</label>
          <select className="form-select" value={f.statut} onChange={e=>set("statut",e.target.value)}>
            <option value="mandat">Mandat</option>
            <option value="compromis">Compromis</option>
            <option value="vendu">Vendu</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Agent commercial</label>
          <select className="form-select" value={f.agentId} onChange={e=>set("agentId",e.target.value)}>
            <option value="">— Choisir —</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.nom} ({a.niveau})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date de mandat</label>
          <input className="form-input" type="date" value={f.dateMandat||""} onChange={e=>set("dateMandat",e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label">Date d'expiration</label>
          <input className="form-input" type="date" value={f.dateExpiration||""} onChange={e=>set("dateExpiration",e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label">Date compromis</label>
          <input className="form-input" type="date" value={f.dateCompromis||""} onChange={e=>set("dateCompromis",e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label">Signature prévisionnelle</label>
          <input className="form-input" type="date" value={f.dateSignature||""} onChange={e=>set("dateSignature",e.target.value)}/>
        </div>
      </div>
      {(f.statut==="compromis"||f.statut==="vendu") && (
        <div className="alert alert-success" style={{cursor:"pointer"}} onClick={()=>set("clausesSuspensivesLevees",!f.clausesSuspensivesLevees)}>
          <input type="checkbox" checked={!!f.clausesSuspensivesLevees} readOnly style={{width:16,height:16,cursor:"pointer"}}/>
          Clauses suspensives levées — commission encaissable
        </div>
      )}
    </Modal>
  );
}
