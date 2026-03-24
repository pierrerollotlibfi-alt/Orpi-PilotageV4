import { useState } from "react";
import { useApp } from "../App";
import { AppShell, KpiCard, BadgeStatut, BadgeType, MandatForm, fmt, fmtDate, diffDays, todayStr, avatarColor } from "./Shared";

// ─── ANNEAU SVG (Donut Chart) ─────────────────────────────────────────────────
function DonutKpi({ pct, label, value, sub, color, size = 110 }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct, 100) / 100 * circ;
  const gap = circ - filled;
  const ringColor = pct >= 100 ? "#10B981" : pct >= 70 ? "#F59E0B" : pct > 0 ? color : "#E2E8F0";

  return (
    <div style={{
      background:"#fff", borderRadius:14, padding:"16px 14px",
      border:"0.5px solid var(--g100)", boxShadow:"0 1px 8px rgba(0,0,0,0.06)",
      display:"flex", flexDirection:"column", alignItems:"center", gap:8,
      flex:1, minWidth:120
    }}>
      <div style={{ position:"relative", width:size, height:size }}>
        <svg width={size} height={size} viewBox="0 0 96 96">
          {/* Fond */}
          <circle cx="48" cy="48" r={r} fill="none" stroke="#F1F5F9" strokeWidth="11"/>
          {/* Arc rempli */}
          <circle
            cx="48" cy="48" r={r} fill="none"
            stroke={ringColor} strokeWidth="11"
            strokeDasharray={`${filled} ${gap}`}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
            style={{ transition:"stroke-dasharray .7s ease, stroke .4s" }}
          />
        </svg>
        {/* Texte central */}
        <div style={{
          position:"absolute", inset:0,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          gap:1
        }}>
          <span style={{ fontSize:20, fontWeight:900, color: pct > 0 ? ringColor : "var(--g300)", lineHeight:1 }}>
            {pct > 0 ? `${Math.min(pct,100)}%` : "—"}
          </span>
          {pct >= 100 && <span style={{ fontSize:14 }}>🎉</span>}
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:10, color:"var(--g400)", fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:16, fontWeight:900, color:"var(--navy)", lineHeight:1 }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:"var(--g400)", marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AgentApp() {
  const { currentUser, users, agences, mandats, setMandats, locations, setLocations, gestion, objectifs } = useApp();
  const [tab,      setTab]     = useState("mandats");
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  const agenceId  = currentUser.agenceId;
  const agents    = users.filter(u => u.role==="agent" && u.agenceId===agenceId);
  const myMandats = mandats.filter(m => m.agentId===currentUser.id);
  const myLocs    = locations.filter(l => l.agentId===currentUser.id);
  const myGestion = gestion.filter(g => g.agentId===currentUser.id && g.actif);

  const active    = myMandats.filter(m => m.statut==="mandat");
  const compromis = myMandats.filter(m => m.statut==="compromis");
  const vendus    = myMandats.filter(m => m.statut==="vendu");
  const caStock   = active.reduce((s,m) => s+m.commission, 0);
  const caSigne   = compromis.reduce((s,m) => s+m.commission, 0);
  const caEnc     = compromis.filter(m => m.clausesSuspensivesLevees).reduce((s,m) => s+m.commission, 0);
  const caReal    = vendus.reduce((s,m) => s+m.commission, 0);
  const caLoc     = myLocs.filter(l => l.locataireTrouve).reduce((s,l) => s+l.commission, 0);
  const caGestMens= myGestion.reduce((s,g) => s+g.commissionMensuelle, 0);

  // ─── OBJECTIFS ───────────────────────────────────────────────────────────────
  const now      = new Date();
  const annee    = now.getFullYear();
  const moisIdx  = now.getMonth(); // 0-11
  const moisNom  = now.toLocaleDateString("fr-FR", { month:"long" });
  const moisPass = moisIdx + 1; // nombre de mois écoulés (incl. mois en cours)

  const monObjectif   = objectifs.find(o => o.agentId===currentUser.id && o.annee===annee);
  const objAnnuelHT   = monObjectif?.montantHT || 0;
  const objMensuelHT  = objAnnuelHT > 0 ? Math.round(objAnnuelHT / 12) : 0;

  // CA du mois en cours (mandats vendus ce mois)
  const debutMois = new Date(annee, moisIdx, 1).toISOString().slice(0,10);
  const caRealMois = vendus
    .filter(m => m.dateSignature && m.dateSignature >= debutMois)
    .reduce((s,m) => s+m.commission, 0);

  // Progression mensuelle vs objectif mensuel
  const pctMois   = objMensuelHT > 0 ? Math.round(caRealMois / objMensuelHT * 100) : 0;
  // Progression annuelle vs objectif annuel
  const pctAnnuel = objAnnuelHT  > 0 ? Math.round(caReal / objAnnuelHT * 100) : 0;
  // Progression vs objectif théorique à date (prorata mois écoulés)
  const objProrata = objMensuelHT * moisPass;
  const pctProrata = objProrata > 0 ? Math.round(caReal / objProrata * 100) : 0;

  const saveMandat = (form) => {
    const data = {...form, agentId:currentUser.id, agenceId, id:editing?.id||"m-"+Date.now()};
    setMandats(prev => { const ex=prev.find(m=>m.id===data.id); return ex?prev.map(m=>m.id===data.id?data:m):[...prev,data]; });
    setShowForm(false); setEditing(null);
  };

  const navItems = [
    { id:"mandats",   icon:"📋", label:"Mes mandats",   active:tab==="mandats",   onClick:()=>setTab("mandats"),   badge:active.length },
    { id:"compromis", icon:"🤝", label:"Mes compromis", active:tab==="compromis", onClick:()=>setTab("compromis"), badge:compromis.length },
    { id:"location",  icon:"🏠", label:"Mes locations", active:tab==="location",  onClick:()=>setTab("location"),  badge:myLocs.length },
    { id:"gestion",   icon:"🔑", label:"Ma gestion",    active:tab==="gestion",   onClick:()=>setTab("gestion"),   badge:myGestion.length },
    { id:"stats",     icon:"📊", label:"Mes stats",     active:tab==="stats",     onClick:()=>setTab("stats") },
  ];

  return (
    <AppShell navItems={navItems} title="Mon espace agent"
      actions={<button className="btn btn-primary btn-sm" onClick={()=>{setEditing(null);setShowForm(true);}}>+ Mandat</button>}>

      {/* ── KPI PIPELINE ── */}
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KpiCard label="CA Stock HT"       value={fmt(caStock)} color="var(--purple)" icon="📦" sub={`${active.length} mandats`}/>
        <KpiCard label="CA Signé HT"       value={fmt(caSigne)} color="var(--amber)"  icon="✍️" sub={`${compromis.length} compromis`}/>
        <KpiCard label="CA Encaissable HT" value={fmt(caEnc)}   color="var(--green)"  icon="💰" sub="Clauses levées"/>
        <KpiCard label="CA Réalisé HT"     value={fmt(caReal)}  color="var(--red)"    icon="🏆" sub={`${vendus.length} ventes`}/>
      </div>

      {/* ── OBJECTIFS ANNEAUX ── */}
      {monObjectif ? (
        <div style={{background:"#fff",borderRadius:14,padding:"18px 20px",marginBottom:16,border:"0.5px solid var(--g100)",boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
          {/* En-tête */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>🎯</span>
              <div>
                <div style={{fontWeight:800,color:"var(--navy)",fontSize:15}}>Mes objectifs {annee}</div>
                <div style={{fontSize:11,color:"var(--g400)"}}>Objectif annuel : {fmt(objAnnuelHT)} · Mensuel : {fmt(objMensuelHT)}/mois</div>
              </div>
            </div>
            <div style={{fontSize:12,color:"var(--g400)"}}>
              Mois en cours : <strong style={{color:"var(--navy)",textTransform:"capitalize"}}>{moisNom} {annee}</strong>
            </div>
          </div>

          {/* 3 anneaux */}
          <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
            <DonutKpi
              pct={pctMois}
              label={`Objectif ${moisNom}`}
              value={fmt(caRealMois)}
              sub={`/ ${fmt(objMensuelHT)}`}
              color="#E63946"
              size={120}
            />
            <DonutKpi
              pct={pctProrata}
              label="Vs prorata date"
              value={fmt(caReal)}
              sub={`/ ${fmt(objProrata)}`}
              color="#F59E0B"
              size={120}
            />
            <DonutKpi
              pct={pctAnnuel}
              label={`Objectif ${annee}`}
              value={fmt(caReal)}
              sub={`/ ${fmt(objAnnuelHT)}`}
              color="#8B5CF6"
              size={120}
            />
          </div>

          {/* Légende / message */}
          <div style={{marginTop:14,display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
            {[
              {label:"Mois en cours", pct:pctMois, target:objMensuelHT, real:caRealMois},
              {label:"Prorata à date", pct:pctProrata, target:objProrata, real:caReal},
              {label:"Objectif annuel", pct:pctAnnuel, target:objAnnuelHT, real:caReal},
            ].map(item => {
              const c = item.pct >= 100 ? "#059669" : item.pct >= 70 ? "#D97706" : "#DC2626";
              const bg = item.pct >= 100 ? "#F0FDF4" : item.pct >= 70 ? "#FFFBEB" : "#FEF2F2";
              const msg = item.pct >= 100 ? "🎉 Atteint !" : item.pct >= 70 ? "En bonne voie" : `Restant : ${fmt(Math.max(item.target - item.real, 0))}`;
              return (
                <div key={item.label} style={{background:bg,borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,color:c,textAlign:"center"}}>
                  {item.label} — {msg}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{background:"#FFFBEB",border:"1px dashed #FDE68A",borderRadius:12,padding:"12px 18px",marginBottom:16,fontSize:13,color:"#92400E",textAlign:"center"}}>
          🎯 Votre manager n'a pas encore défini votre objectif annuel. Contactez-le pour qu'il le configure.
        </div>
      )}

      {/* ── LOCATIONS / GESTION ── */}
      {(myLocs.length>0||myGestion.length>0) && (
        <div className="kpi-grid-2" style={{marginBottom:16}}>
          <KpiCard label="CA Locations HT"        value={fmt(caLoc)}      color="var(--blue)" icon="🏠" sub={`${myLocs.filter(l=>l.locataireTrouve).length} locataires trouvés`}/>
          <KpiCard label="Comm. gestion mensuelle" value={fmt(caGestMens)} color="var(--navy)" icon="🔑" sub={`${myGestion.length} biens gérés`}/>
        </div>
      )}

      {/* ── MANDATS ── */}
      {tab==="mandats" && (
        <div className="card">
          <div className="card-header"><span className="card-title">📋 Mes mandats ({myMandats.length})</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Réf</th><th>Type</th><th className="hide-mobile">Adresse</th>
                <th>Prix HT</th><th>Comm. HT</th><th>Statut</th>
                <th className="hide-mobile">Mandat</th><th className="hide-mobile">Expiration</th>
                <th className="hide-mobile">Compromis</th><th className="hide-mobile">Signature</th>
                <th>CS</th><th></th>
              </tr></thead>
              <tbody>
                {myMandats.map(m => {
                  const exp = m.dateExpiration && diffDays(todayStr,m.dateExpiration)<=14 && m.statut==="mandat";
                  return (<tr key={m.id}>
                    <td><b style={{color:"var(--navy)",fontSize:12}}>{m.ref}</b></td>
                    <td><BadgeType typeMandat={m.typeMandat}/></td>
                    <td className="hide-mobile" style={{fontSize:11,maxWidth:140}}>{m.adresse}</td>
                    <td style={{fontSize:12,fontWeight:600}}>{fmt(m.prix)}</td>
                    <td style={{fontWeight:800,color:"var(--green)"}}>{fmt(m.commission)}</td>
                    <td><BadgeStatut statut={m.statut}/></td>
                    <td className="hide-mobile" style={{fontSize:11}}>{fmtDate(m.dateMandat)}</td>
                    <td className="hide-mobile"><span style={{fontSize:11,color:exp?"#EF4444":"inherit",fontWeight:exp?800:"normal"}}>{exp&&"⚠️ "}{fmtDate(m.dateExpiration)}</span></td>
                    <td className="hide-mobile" style={{fontSize:11}}>{fmtDate(m.dateCompromis)}</td>
                    <td className="hide-mobile" style={{fontSize:11}}>{fmtDate(m.dateSignature)}</td>
                    <td>{m.clausesSuspensivesLevees?<span>✅</span>:<span style={{color:"var(--g300)"}}>—</span>}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={()=>{setEditing(m);setShowForm(true);}}>✏️</button></td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── COMPROMIS ── */}
      {tab==="compromis" && (
        <div className="card">
          <div className="card-header"><span className="card-title">🤝 Mes compromis ({compromis.length})</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Réf</th><th>Type</th><th className="hide-mobile">Adresse</th>
                <th>Comm. HT</th><th className="hide-mobile">Compromis</th>
                <th className="hide-mobile">Signature</th><th>Délai</th><th>CS</th><th>Statut comm.</th>
              </tr></thead>
              <tbody>
                {compromis.map(m => {
                  const j = m.dateSignature ? diffDays(todayStr,m.dateSignature) : null;
                  return (<tr key={m.id}>
                    <td><b style={{color:"var(--navy)"}}>{m.ref}</b></td>
                    <td><BadgeType typeMandat={m.typeMandat}/></td>
                    <td className="hide-mobile" style={{fontSize:11,maxWidth:150}}>{m.adresse}</td>
                    <td style={{fontWeight:800,color:"var(--green)"}}>{fmt(m.commission)}</td>
                    <td className="hide-mobile" style={{fontSize:11}}>{fmtDate(m.dateCompromis)}</td>
                    <td className="hide-mobile" style={{fontSize:11}}>{fmtDate(m.dateSignature)}</td>
                    <td>{j!==null&&<span style={{background:j<=30?"#FEF3C7":j<=60?"#EFF6FF":"#F0FDF4",color:j<=30?"#D97706":j<=60?"#2563EB":"#059669",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:800}}>J-{j}</span>}</td>
                    <td>{m.clausesSuspensivesLevees?<span className="badge" style={{background:"#F0FDF4",color:"#059669"}}>✅ Levées</span>:<span className="badge" style={{background:"#FFFBEB",color:"#B45309"}}>⏳ Attente</span>}</td>
                    <td>{m.clausesSuspensivesLevees?<span className="badge" style={{background:"#F0FDF4",color:"#059669"}}>💰 Encaissable</span>:<span className="badge" style={{background:"var(--g100)",color:"var(--g400)"}}>🔒 Bloqué</span>}</td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LOCATION ── */}
      {tab==="location" && (
        <div className="card">
          <div className="card-header"><span className="card-title">🏠 Mes locations ({myLocs.length})</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Réf</th><th className="hide-mobile">Adresse</th>
                <th>Loyer</th><th>Comm. HT</th><th>Locataire</th>
                <th className="hide-mobile">Téléphone</th><th className="hide-mobile">Email</th>
                <th>Date sign.</th><th>Statut</th>
              </tr></thead>
              <tbody>
                {myLocs.map(l => (
                  <tr key={l.id}>
                    <td><b style={{color:"var(--navy)",fontSize:12}}>{l.ref}</b></td>
                    <td className="hide-mobile" style={{fontSize:11,maxWidth:130}}>{l.adresse}</td>
                    <td style={{fontWeight:700}}>{fmt(l.loyer)}/m</td>
                    <td style={{fontWeight:800,color:"var(--green)"}}>{fmt(l.commission)}</td>
                    <td style={{fontSize:12}}>{l.locataireTrouve?`${l.locatairePrenom} ${l.locataireNom}`:"—"}</td>
                    <td className="hide-mobile" style={{fontSize:11}}>{l.locataireTel||"—"}</td>
                    <td className="hide-mobile" style={{fontSize:11}}>{l.locataireMail||"—"}</td>
                    <td style={{fontSize:11}}>{fmtDate(l.dateSignature)}</td>
                    <td>{l.locataireTrouve?<span className="badge" style={{background:"#F0FDF4",color:"#059669"}}>✅ Trouvé</span>:<span className="badge" style={{background:"#FEF3C7",color:"#D97706"}}>🔍 En cours</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GESTION ── */}
      {tab==="gestion" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔑 Mes biens en gestion ({myGestion.length})</span>
            <span style={{fontSize:13,fontWeight:700,color:"var(--green)"}}>{fmt(caGestMens)}/mois</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Réf</th><th className="hide-mobile">Adresse</th>
                <th>Propriétaire</th><th>Loyer</th><th>Taux</th><th>Comm. HT/mois</th>
                <th className="hide-mobile">Début</th>
              </tr></thead>
              <tbody>
                {myGestion.map(g => (
                  <tr key={g.id}>
                    <td><b style={{color:"var(--navy)",fontSize:12}}>{g.ref}</b></td>
                    <td className="hide-mobile" style={{fontSize:11,maxWidth:140}}>{g.adresse}</td>
                    <td style={{fontSize:12,fontWeight:600}}>{g.proprietairePrenom} {g.proprietaireNom}</td>
                    <td style={{fontWeight:700}}>{fmt(g.loyer)}</td>
                    <td style={{fontWeight:700,color:"var(--blue)"}}>{g.commissionPct}%</td>
                    <td style={{fontWeight:900,color:"var(--green)",fontSize:14}}>{fmt(g.commissionMensuelle)}</td>
                    <td className="hide-mobile" style={{fontSize:11}}>{fmtDate(g.dateDebutGestion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      {tab==="stats" && (
        <div className="card card-body">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div>
              <div style={{fontWeight:700,color:"var(--navy)",marginBottom:12,fontSize:13}}>Pipeline commissions HT</div>
              {[
                {label:"CA Stock",value:caStock,color:"var(--purple)"},
                {label:"CA Signé",value:caSigne,color:"var(--amber)"},
                {label:"CA Encaissable",value:caEnc,color:"var(--green)"},
                {label:"CA Réalisé",value:caReal,color:"var(--red)"},
              ].map(r => (
                <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--g100)"}}>
                  <span style={{fontSize:12,color:"var(--g700)",fontWeight:600}}>{r.label}</span>
                  <span style={{fontSize:14,fontWeight:800,color:r.color}}>{fmt(r.value)}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontWeight:700,color:"var(--navy)",marginBottom:12,fontSize:13}}>Location & Gestion</div>
              {[
                {label:"CA Locations HT",value:caLoc,color:"var(--blue)"},
                {label:"Comm. gestion/mois",value:caGestMens,color:"var(--navy)"},
                {label:"Comm. gestion/an",value:caGestMens*12,color:"var(--purple)"},
              ].map(r => (
                <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--g100)"}}>
                  <span style={{fontSize:12,color:"var(--g700)",fontWeight:600}}>{r.label}</span>
                  <span style={{fontSize:14,fontWeight:800,color:r.color}}>{fmt(r.value)}</span>
                </div>
              ))}
              {monObjectif && (
                <div style={{marginTop:14}}>
                  <div style={{fontWeight:700,color:"var(--navy)",marginBottom:8,fontSize:13}}>Objectifs annuels</div>
                  {[
                    {label:"Objectif annuel HT",value:objAnnuelHT,color:"var(--g700)"},
                    {label:"Objectif mensuel HT",value:objMensuelHT,color:"var(--g700)"},
                    {label:"CA réalisé mois",value:caRealMois,color:"var(--red)"},
                    {label:"Restant année",value:Math.max(objAnnuelHT-caReal,0),color:"var(--amber)"},
                  ].map(r => (
                    <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--g100)"}}>
                      <span style={{fontSize:12,color:"var(--g700)",fontWeight:600}}>{r.label}</span>
                      <span style={{fontSize:13,fontWeight:800,color:r.color}}>{fmt(r.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <MandatForm initial={editing||{}} agents={agents} onSave={saveMandat} onClose={()=>{setShowForm(false);setEditing(null);}}/>
      )}
    </AppShell>
  );
}
