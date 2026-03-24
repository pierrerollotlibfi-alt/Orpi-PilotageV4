import { useState, useMemo } from "react";
import { useApp } from "../App";
import {
  AppShell, KpiCard, BadgeStatut, BadgeType, BadgeNiveau,
  Modal, MandatForm, PeriodSelector, inPeriod,
  fmt, fmtDate, diffDays, todayStr, avatarColor
} from "./Shared";

const MEDAL = ["🥇","🥈","🥉"];

export default function ManagerApp() {
  const { currentUser, users, agences, mandats, setMandats, locations, setLocations, gestion, setGestion, setUsers, inviterAgent, invitations, objectifs, setObjectifs } = useApp();
  const [tab, setTab] = useState("dashboard");
  const [showMandatForm, setShowMandatForm] = useState(false);
  const [editingMandat, setEditingMandat]   = useState(null);
  const [showLocForm,   setShowLocForm]     = useState(false);
  const [editingLoc,    setEditingLoc]      = useState(null);
  const [showGestForm,  setShowGestForm]    = useState(false);
  const [editingGest,   setEditingGest]     = useState(null);
  const [showInviteAgent, setShowInviteAgent] = useState(false);
  const [period, setPeriod]       = useState("year");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]     = useState("");
  const [filterAgent, setFilterAgent]   = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterType, setFilterType]     = useState("");
  const [inviteResult, setInviteResult] = useState(null);
  const [showObjectifModal, setShowObjectifModal] = useState(false);
  const [editingObjectifAgent, setEditingObjectifAgent] = useState(null);

  const agenceId = currentUser.agenceId;
  const agence   = agences.find(a => a.id === agenceId);
  const agents   = users.filter(u => u.role==="agent" && u.agenceId===agenceId && u.actif);
  const myMandats   = mandats.filter(m => m.agenceId === agenceId);
  const myLocations = locations.filter(l => l.agenceId === agenceId);
  const myGestion   = gestion.filter(g => g.agenceId === agenceId && g.actif);

  // ── STATS TRANSACTION ──
  const active    = myMandats.filter(m=>m.statut==="mandat");
  const compromis = myMandats.filter(m=>m.statut==="compromis");
  const vendus    = myMandats.filter(m=>m.statut==="vendu");
  const caStock       = active.reduce((s,m)=>s+m.commission,0);
  const caSigne       = compromis.reduce((s,m)=>s+m.commission,0);
  const caEncaissable = compromis.filter(m=>m.clausesSuspensivesLevees).reduce((s,m)=>s+m.commission,0);
  const caRealise     = vendus.reduce((s,m)=>s+m.commission,0);
  const lt1m = active.filter(m=>diffDays(m.dateMandat,todayStr)<=30);
  const lt3m = active.filter(m=>diffDays(m.dateMandat,todayStr)<=90);
  const lt6m = active.filter(m=>diffDays(m.dateMandat,todayStr)<=180);
  const gt6m = active.filter(m=>diffDays(m.dateMandat,todayStr)>180);
  const nbExclusifs = active.filter(m=>m.typeMandat==="exclusif").length;
  const nbSimples   = active.filter(m=>m.typeMandat==="simple").length;
  const upcomingSig = compromis.filter(m=>m.dateSignature).sort((a,b)=>new Date(a.dateSignature)-new Date(b.dateSignature));

  // ── STATS LOCATION ──
  const locTrouvees  = myLocations.filter(l=>l.locataireTrouve);
  const locEnCours   = myLocations.filter(l=>!l.locataireTrouve);
  const caLocation   = locTrouvees.reduce((s,l)=>s+l.commission,0);

  // ── STATS GESTION LOCATIVE ──
  const caGestionMensuel = myGestion.reduce((s,g)=>s+g.commissionMensuelle,0);
  const caGestionAnnuel  = caGestionMensuel * 12;

  // Classement
  const periodMandats = useMemo(()=>myMandats.filter(m=>{
    const ref=m.statut==="vendu"?m.dateSignature:m.dateMandat;
    return inPeriod(ref,period,customFrom,customTo);
  }),[myMandats,period,customFrom,customTo]);

  const ranking = agents.map(a=>{
    const myM=periodMandats.filter(m=>m.agentId===a.id);
    const vend=myM.filter(m=>m.statut==="vendu");
    const comp=myM.filter(m=>m.statut==="compromis");
    const act=myM.filter(m=>m.statut==="mandat");
    const myL=myLocations.filter(l=>l.agentId===a.id&&l.locataireTrouve);
    return {
      ...a,
      caRealise: vend.reduce((s,m)=>s+m.commission,0),
      caSigne:   comp.reduce((s,m)=>s+m.commission,0),
      caEncaissable:comp.filter(m=>m.clausesSuspensivesLevees).reduce((s,m)=>s+m.commission,0),
      caStock:   act.reduce((s,m)=>s+m.commission,0),
      caLocation:myL.reduce((s,l)=>s+l.commission,0),
      nbVendus:vend.length, nbCompromis:comp.length, nbMandats:act.length,
      exclusifs:myM.filter(m=>m.typeMandat==="exclusif").length,
      nbLocations:myL.length,
    };
  }).sort((a,b)=>b.caRealise-a.caRealise);
  const maxCa = Math.max(...ranking.map(r=>r.caRealise),1);

  const filteredMandats = useMemo(()=>myMandats.filter(m=>{
    if(filterAgent&&m.agentId!==filterAgent) return false;
    if(filterStatut&&m.statut!==filterStatut) return false;
    if(filterType&&m.typeMandat!==filterType) return false;
    return true;
  }),[myMandats,filterAgent,filterStatut,filterType]);

  const saveMandat = (form) => {
    const data={...form,agenceId,id:editingMandat?.id||"m-"+Date.now()};
    setMandats(prev=>{ const ex=prev.find(m=>m.id===data.id); return ex?prev.map(m=>m.id===data.id?data:m):[...prev,data]; });
    setShowMandatForm(false); setEditingMandat(null);
  };
  const deleteMand = (id)=>{ if(window.confirm("Supprimer ce mandat ?")) setMandats(prev=>prev.filter(m=>m.id!==id)); };

  const saveLoc = (form) => {
    const data={...form,agenceId,id:editingLoc?.id||"loc-"+Date.now(),commission:Number(form.commission),loyer:Number(form.loyer)};
    setLocations(prev=>{ const ex=prev.find(l=>l.id===data.id); return ex?prev.map(l=>l.id===data.id?data:l):[...prev,data]; });
    setShowLocForm(false); setEditingLoc(null);
  };
  const deleteLoc = (id)=>{ if(window.confirm("Supprimer ?")) setLocations(prev=>prev.filter(l=>l.id!==id)); };

  const saveGest = (form) => {
    const loyer=Number(form.loyer), pct=Number(form.commissionPct);
    const data={...form,agenceId,id:editingGest?.id||"g-"+Date.now(),loyer,commissionPct:pct,commissionMensuelle:Math.round(loyer*pct/100)};
    setGestion(prev=>{ const ex=prev.find(g=>g.id===data.id); return ex?prev.map(g=>g.id===data.id?data:g):[...prev,data]; });
    setShowGestForm(false); setEditingGest(null);
  };
  const deleteGest = (id)=>{ if(window.confirm("Supprimer ?")) setGestion(prev=>prev.filter(g=>g.id!==id)); };

  const handleInvite = (agentData) => {
    const result = inviterAgent(agentData, agenceId);
    setInviteResult(result);
  };

  const navItems = [
    { id:"dashboard",    icon:"📊", label:"Dashboard",        active:tab==="dashboard",    onClick:()=>setTab("dashboard") },
    { type:"section", label:"TRANSACTION" },
    { id:"mandats",      icon:"📋", label:"Mandats",          active:tab==="mandats",      onClick:()=>setTab("mandats"),      badge:active.length },
    { id:"compromis",    icon:"🤝", label:"Compromis",        active:tab==="compromis",    onClick:()=>setTab("compromis"),    badge:compromis.length },
    { id:"classement",   icon:"🏆", label:"Classement",       active:tab==="classement",   onClick:()=>setTab("classement") },
    { type:"section", label:"GESTION LOCATIVE" },
    { id:"location",     icon:"🏠", label:"Location",         active:tab==="location",     onClick:()=>setTab("location"),     badge:myLocations.length },
    { id:"gestion",      icon:"🔑", label:"Gestion locative", active:tab==="gestion",      onClick:()=>setTab("gestion"),      badge:myGestion.length },
    { type:"section", label:"ÉQUIPE" },
    { id:"equipe",       icon:"👥", label:"Agents co",        active:tab==="equipe",       onClick:()=>setTab("equipe"),       badge:agents.length },
    { id:"invitations",  icon:"📧", label:"Invitations",      active:tab==="invitations",  onClick:()=>setTab("invitations") },
  ];

  const topActions = (
    <div style={{display:"flex",gap:8}}>
      {(tab==="mandats"||tab==="dashboard") && <button className="btn btn-primary btn-sm" onClick={()=>{setEditingMandat(null);setShowMandatForm(true);}}>+ Mandat</button>}
      {tab==="location" && <button className="btn btn-primary btn-sm" onClick={()=>{setEditingLoc(null);setShowLocForm(true);}}>+ Location</button>}
      {tab==="gestion"  && <button className="btn btn-primary btn-sm" onClick={()=>{setEditingGest(null);setShowGestForm(true);}}>+ Bien en gestion</button>}
      {tab==="equipe"   && <button className="btn btn-primary btn-sm" onClick={()=>setShowInviteAgent(true)}>+ Inviter agent</button>}
    </div>
  );

  return (
    <AppShell navItems={navItems} title={agence?.nom||"Dashboard"} actions={topActions}>

      {/* ══ DASHBOARD ══ */}
      {tab==="dashboard" && <>
        {/* LIGNE TRANSACTION */}
        <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontWeight:800,color:"var(--navy)",fontSize:11,letterSpacing:1,textTransform:"uppercase"}}>🏢 Transaction</span>
          <div style={{flex:1,height:1,background:"var(--g200)"}}/>
        </div>
        <div className="kpi-grid" style={{marginBottom:18}}>
          <KpiCard label="CA Stock mandats"    value={fmt(caStock)}       color="var(--purple)" icon="📦" sub={`${nbExclusifs} excl. · ${nbSimples} simples`} trend={7}/>
          <KpiCard label="CA Signé compromis"  value={fmt(caSigne)}       color="var(--amber)"  icon="✍️" sub={`${compromis.length} compromis actifs`}        trend={5}/>
          <KpiCard label="CA Encaissable"      value={fmt(caEncaissable)} color="var(--green)"  icon="💰" sub="Clauses suspensives levées"                    trend={12}/>
          <KpiCard label="CA Réalisé ventes"   value={fmt(caRealise)}     color="var(--red)"    icon="🏆" sub={`${vendus.length} ventes actées`}               trend={18}/>
        </div>
        <div className="kpi-grid" style={{gridTemplateColumns:"repeat(4,1fr)",marginBottom:22}}>
          <KpiCard label="Mandats actifs"      value={active.length}      color="var(--blue)"   sub={`${lt1m.length}<1m · ${gt6m.length}>6m`}/>
          <KpiCard label="Mandats exclusifs"   value={nbExclusifs}        color="var(--red)"    sub={`${Math.round(nbExclusifs/Math.max(active.length,1)*100)}% du stock`}/>
          <KpiCard label="Sous compromis"      value={compromis.length}   color="var(--amber)"  sub={`${upcomingSig.length} signatures planif.`}/>
          <KpiCard label="Taux transformation" value={`${Math.round(vendus.length/Math.max(vendus.length+active.length+compromis.length,1)*100)}%`} color="var(--green)" trend={3}/>
        </div>

        {/* LIGNE GESTION LOCATIVE */}
        <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontWeight:800,color:"var(--navy)",fontSize:11,letterSpacing:1,textTransform:"uppercase"}}>🏠 Gestion Locative</span>
          <div style={{flex:1,height:1,background:"var(--g200)"}}/>
        </div>
        <div className="kpi-grid" style={{marginBottom:22}}>
          <KpiCard label="Mandats location"    value={myLocations.length} color="var(--blue)"   icon="📋" sub={`${locTrouvees.length} locataires trouvés`}/>
          <KpiCard label="CA Location (commissions)" value={fmt(caLocation)} color="var(--amber)" icon="🏠" sub={`${locEnCours.length} en recherche`} trend={8}/>
          <KpiCard label="Biens en gestion"    value={myGestion.length}   color="var(--navy)"   icon="🔑" sub="Gestion locative active"/>
          <KpiCard label="Comm. mensuelle GLI" value={fmt(caGestionMensuel)} color="var(--green)" icon="💶" sub={`${fmt(caGestionAnnuel)} / an`} trend={5}/>
        </div>

        {/* Signatures + ancienneté */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16}}>
          <div className="card">
            <div className="card-header"><span className="card-title">📅 Signatures à venir</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Réf</th><th>Type</th><th className="hide-mobile">Adresse</th><th>Agent</th><th>Comm.</th><th>CS</th><th>Délai</th></tr></thead>
                <tbody>
                  {upcomingSig.slice(0,6).map(m=>{
                    const agent=agents.find(a=>a.id===m.agentId);
                    const j=diffDays(todayStr,m.dateSignature);
                    return (<tr key={m.id}>
                      <td><b style={{color:"var(--navy)",fontSize:12}}>{m.ref}</b></td>
                      <td><BadgeType typeMandat={m.typeMandat}/></td>
                      <td className="hide-mobile" style={{fontSize:11,maxWidth:130}}>{m.adresse}</td>
                      <td style={{fontSize:12,fontWeight:600}}>{agent?.nom||"—"}</td>
                      <td style={{fontWeight:800,color:"var(--green)",fontSize:12}}>{fmt(m.commission)}</td>
                      <td>{m.clausesSuspensivesLevees?<span>✅</span>:<span style={{color:"var(--g300)"}}>—</span>}</td>
                      <td><span style={{background:j<=30?"#FEF3C7":j<=60?"#EFF6FF":"#F0FDF4",color:j<=30?"#D97706":j<=60?"#2563EB":"#059669",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:800}}>J-{j}</span></td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">⏱ Ancienneté & Type</span></div>
            <div className="card-body">
              {[{label:"< 1 mois",count:lt1m.length,color:"var(--green)"},{label:"1-3 mois",count:lt3m.length-lt1m.length,color:"var(--blue)"},{label:"3-6 mois",count:lt6m.length-lt3m.length,color:"var(--amber)"},{label:"> 6 mois",count:gt6m.length,color:"#EF4444"}].map(r=>(
                <div key={r.label} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,color:"var(--g700)",fontWeight:600}}>{r.label}</span>
                    <span style={{fontSize:12,fontWeight:800,color:r.color}}>{r.count}</span>
                  </div>
                  <div className="progress-wrap"><div className="progress-bar" style={{width:`${active.length>0?r.count/active.length*100:0}%`,background:r.color}}/></div>
                </div>
              ))}
              <div style={{borderTop:"1px solid var(--g100)",paddingTop:12,marginTop:8}}>
                {[{label:"Exclusifs",count:nbExclusifs,color:"var(--red)"},{label:"Simples",count:nbSimples,color:"var(--g400)"}].map(r=>(
                  <div key={r.label} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:12,fontWeight:600,color:"var(--g700)"}}>{r.label}</span>
                      <span style={{fontSize:12,fontWeight:800,color:r.color}}>{r.count}</span>
                    </div>
                    <div className="progress-wrap"><div className="progress-bar" style={{width:`${active.length>0?r.count/active.length*100:0}%`,background:r.color}}/></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 locations en cours */}
        {locEnCours.length > 0 && (
          <div className="card">
            <div className="card-header"><span className="card-title">🔴 Locations sans locataire ({locEnCours.length})</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Réf</th><th>Adresse</th><th>Agent</th><th>Loyer</th><th>Commission</th></tr></thead>
                <tbody>
                  {locEnCours.map(l=>{
                    const agent=agents.find(a=>a.id===l.agentId);
                    return (<tr key={l.id}>
                      <td><b style={{color:"var(--navy)",fontSize:12}}>{l.ref}</b></td>
                      <td style={{fontSize:12}}>{l.adresse}</td>
                      <td style={{fontSize:12,fontWeight:600}}>{agent?.nom||"—"}</td>
                      <td style={{fontWeight:700}}>{fmt(l.loyer)}/mois</td>
                      <td style={{fontWeight:800,color:"var(--amber)"}}>{fmt(l.commission)}</td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>}

      {/* ══ MANDATS ══ */}
      {tab==="mandats" && <>
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <select className="form-select" style={{width:"auto",minWidth:160}} value={filterAgent} onChange={e=>setFilterAgent(e.target.value)}>
            <option value="">Tous les agents</option>
            {agents.map(a=><option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
          <select className="form-select" style={{width:"auto"}} value={filterStatut} onChange={e=>setFilterStatut(e.target.value)}>
            <option value="">Tous statuts</option><option value="mandat">Mandat</option><option value="compromis">Compromis</option><option value="vendu">Vendu</option>
          </select>
          <select className="form-select" style={{width:"auto"}} value={filterType} onChange={e=>setFilterType(e.target.value)}>
            <option value="">Simple & Exclusif</option><option value="exclusif">Exclusif</option><option value="simple">Simple</option>
          </select>
          <span style={{color:"var(--g400)",fontSize:13}}>{filteredMandats.length} résultat(s)</span>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Réf</th><th>Type</th><th className="hide-mobile">Adresse</th><th>Agent</th><th className="hide-mobile">Niv.</th><th>Prix</th><th>Comm.</th><th>Statut</th><th className="hide-mobile">Mandat</th><th className="hide-mobile">Expiration</th><th className="hide-mobile">Compromis</th><th className="hide-mobile">Signature</th><th>CS</th><th></th></tr></thead>
              <tbody>
                {filteredMandats.map((m,i)=>{
                  const agent=agents.find(a=>a.id===m.agentId);
                  const exp=m.dateExpiration&&diffDays(todayStr,m.dateExpiration)<=14&&m.statut==="mandat";
                  return (<tr key={m.id}>
                    <td><b style={{color:"var(--navy)",fontSize:12}}>{m.ref}</b></td>
                    <td><BadgeType typeMandat={m.typeMandat}/></td>
                    <td className="hide-mobile" style={{fontSize:11,maxWidth:130}}>{m.adresse}</td>
                    <td style={{fontSize:12,fontWeight:600}}>{agent?.nom||"—"}</td>
                    <td className="hide-mobile">{agent&&<BadgeNiveau niveau={agent.niveau}/>}</td>
                    <td style={{fontSize:12}}>{fmt(m.prix)}</td>
                    <td style={{fontWeight:800,color:"var(--green)",fontSize:12}}>{fmt(m.commission)}</td>
                    <td><BadgeStatut statut={m.statut}/></td>
                    <td className="hide-mobile" style={{fontSize:11}}>{fmtDate(m.dateMandat)}</td>
                    <td className="hide-mobile"><span style={{fontSize:11,color:exp?"#EF4444":"inherit",fontWeight:exp?800:"normal"}}>{exp&&"⚠️ "}{fmtDate(m.dateExpiration)}</span></td>
                    <td className="hide-mobile" style={{fontSize:11}}>{fmtDate(m.dateCompromis)}</td>
                    <td className="hide-mobile" style={{fontSize:11}}>{fmtDate(m.dateSignature)}</td>
                    <td>{m.clausesSuspensivesLevees?<span>✅</span>:<span style={{color:"var(--g300)"}}>—</span>}</td>
                    <td><div style={{display:"flex",gap:4}}><button className="btn btn-secondary btn-sm" onClick={()=>{setEditingMandat(m);setShowMandatForm(true);}}>✏️</button><button className="btn btn-danger btn-sm" onClick={()=>deleteMand(m.id)}>🗑</button></div></td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* ══ COMPROMIS ══ */}
      {tab==="compromis" && <>
        <div className="kpi-grid-3">
          <KpiCard label="CA total signé" value={fmt(caSigne)} color="var(--amber)" icon="✍️" sub={`${compromis.length} compromis actifs`}/>
          <KpiCard label="CA encaissable" value={fmt(caEncaissable)} color="var(--green)" icon="💰" sub="Clauses suspensives levées"/>
          <KpiCard label="CA en attente CS" value={fmt(caSigne-caEncaissable)} color="var(--g400)" icon="⏳" sub="CS non encore levées"/>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🤝 Suivi des compromis ({compromis.length})</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Réf</th><th>Type</th><th className="hide-mobile">Adresse</th><th>Agent</th><th>Commission</th><th className="hide-mobile">Compromis</th><th className="hide-mobile">Signature</th><th>Délai</th><th>CS</th><th>Statut comm.</th></tr></thead>
              <tbody>
                {compromis.map(m=>{
                  const agent=agents.find(a=>a.id===m.agentId);
                  const j=m.dateSignature?diffDays(todayStr,m.dateSignature):null;
                  return (<tr key={m.id}>
                    <td><b style={{color:"var(--navy)"}}>{m.ref}</b></td>
                    <td><BadgeType typeMandat={m.typeMandat}/></td>
                    <td className="hide-mobile" style={{fontSize:11,maxWidth:140}}>{m.adresse}</td>
                    <td style={{fontWeight:600,fontSize:12}}>{agent?.nom}</td>
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
      </>}

      {/* ══ CLASSEMENT ══ */}
      {tab==="classement" && <>
        <PeriodSelector value={period} onChange={setPeriod} customFrom={customFrom} customTo={customTo} onCustomFrom={setCustomFrom} onCustomTo={setCustomTo}/>
        <div className="card">
          <div className="card-header"><span className="card-title">🏆 Classement CA cumulé</span><span style={{fontSize:12,color:"var(--g400)"}}>{ranking.length} agents</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Agent</th><th className="hide-mobile">Niveau</th><th>Mandats</th><th className="hide-mobile">Excl.</th><th>Comp.</th><th>Ventes</th><th className="hide-mobile">Locations</th><th className="hide-mobile">CA Stock</th><th className="hide-mobile">CA Signé</th><th className="hide-mobile">CA Encaiss.</th><th>CA Réalisé ↓</th><th className="hide-mobile">Progression</th></tr></thead>
              <tbody>
                {ranking.map((a,i)=>(
                  <tr key={a.id} style={{background:i===0?"#FFF8F8":"inherit"}}>
                    <td style={{fontSize:20}}>{MEDAL[i]||`${i+1}`}</td>
                    <td><div style={{display:"flex",alignItems:"center",gap:8}}><div className="avatar" style={{background:avatarColor(a.nom),width:32,height:32,fontSize:12}}>{a.avatar||a.nom[0]}</div><div><div style={{fontWeight:700,fontSize:13}}>{a.nom}</div><div style={{fontSize:11,color:"var(--g400)"}}>{a.email}</div></div></div></td>
                    <td className="hide-mobile"><BadgeNiveau niveau={a.niveau}/></td>
                    <td style={{fontWeight:700,color:"var(--blue)",textAlign:"center"}}>{a.nbMandats}</td>
                    <td className="hide-mobile" style={{fontWeight:700,color:"var(--red)",textAlign:"center"}}>{a.exclusifs}</td>
                    <td style={{fontWeight:700,color:"var(--amber)",textAlign:"center"}}>{a.nbCompromis}</td>
                    <td style={{fontWeight:700,color:"var(--green)",textAlign:"center"}}>{a.nbVendus}</td>
                    <td className="hide-mobile" style={{fontWeight:700,color:"var(--blue)",textAlign:"center"}}>{a.nbLocations}</td>
                    <td className="hide-mobile" style={{fontSize:12,color:"var(--purple)",fontWeight:700}}>{fmt(a.caStock)}</td>
                    <td className="hide-mobile" style={{fontSize:12,color:"var(--amber)",fontWeight:700}}>{fmt(a.caSigne)}</td>
                    <td className="hide-mobile"><span style={{background:a.caEncaissable>0?"#F0FDF4":"var(--g100)",color:a.caEncaissable>0?"#059669":"var(--g400)",padding:"3px 9px",borderRadius:8,fontSize:12,fontWeight:800}}>{fmt(a.caEncaissable)}</span></td>
                    <td style={{fontWeight:900,color:"var(--navy)",fontSize:14}}>{fmt(a.caRealise)}</td>
                    <td className="hide-mobile" style={{minWidth:110}}><div style={{display:"flex",alignItems:"center",gap:6}}><div className="progress-wrap" style={{flex:1}}><div className="progress-bar" style={{width:`${Math.round(a.caRealise/maxCa*100)}%`,background:i===0?"var(--red)":i===1?"var(--amber)":"var(--blue)"}}/></div><span style={{fontSize:10,color:"var(--g400)",minWidth:28}}>{Math.round(a.caRealise/maxCa*100)}%</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* ══ LOCATION ══ */}
      {tab==="location" && <>
        <div className="kpi-grid-3" style={{marginBottom:18}}>
          <KpiCard label="Mandats location total" value={myLocations.length} color="var(--blue)" icon="📋" sub={`${locTrouvees.length} locataires trouvés`}/>
          <KpiCard label="En recherche de locataire" value={locEnCours.length} color="var(--amber)" icon="🔍" sub="À placer en priorité"/>
          <KpiCard label="CA commissions location" value={fmt(caLocation)} color="var(--green)" icon="💶" sub={`${locTrouvees.length} locations signées`} trend={8}/>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🏠 Mandats de location ({myLocations.length})</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Réf</th><th>Adresse</th><th>Agent</th><th>Loyer/mois</th><th>Commission</th><th>Locataire</th><th>Prénom Nom</th><th className="hide-mobile">Téléphone</th><th className="hide-mobile">Email</th><th>Date sign.</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {myLocations.map(l=>{
                  const agent=agents.find(a=>a.id===l.agentId);
                  return (<tr key={l.id}>
                    <td><b style={{color:"var(--navy)",fontSize:12}}>{l.ref}</b></td>
                    <td style={{fontSize:11,maxWidth:130}}>{l.adresse}</td>
                    <td style={{fontSize:12,fontWeight:600}}>{agent?.nom||"—"}</td>
                    <td style={{fontWeight:700}}>{fmt(l.loyer)}</td>
                    <td style={{fontWeight:800,color:"var(--green)"}}>{fmt(l.commission)}</td>
                    <td style={{fontSize:12}}>{l.locataireTrouve?`${l.locatairePrenom} ${l.locataireNom}`:"—"}</td>
                    <td style={{fontSize:11}}>{l.locataireTrouve?l.locatairePrenom+" "+l.locataireNom:"—"}</td>
                    <td className="hide-mobile" style={{fontSize:11}}>{l.locataireTel||"—"}</td>
                    <td className="hide-mobile" style={{fontSize:11}}>{l.locataireMail||"—"}</td>
                    <td style={{fontSize:11}}>{fmtDate(l.dateSignature)}</td>
                    <td>
                      {l.locataireTrouve
                        ? <span className="badge" style={{background:"#F0FDF4",color:"#059669"}}>✅ Trouvé</span>
                        : <span className="badge" style={{background:"#FEF3C7",color:"#D97706"}}>🔍 En cours</span>}
                    </td>
                    <td><div style={{display:"flex",gap:4}}><button className="btn btn-secondary btn-sm" onClick={()=>{setEditingLoc(l);setShowLocForm(true);}}>✏️</button><button className="btn btn-danger btn-sm" onClick={()=>deleteLoc(l.id)}>🗑</button></div></td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* ══ GESTION LOCATIVE ══ */}
      {tab==="gestion" && <>
        <div className="kpi-grid-3" style={{marginBottom:18}}>
          <KpiCard label="Biens en gestion" value={myGestion.length} color="var(--navy)" icon="🔑" sub="Portefeuille actif"/>
          <KpiCard label="Commission mensuelle" value={fmt(caGestionMensuel)} color="var(--green)" icon="💶" sub="Récurrent mensuel" trend={5}/>
          <KpiCard label="Commission annuelle" value={fmt(caGestionAnnuel)} color="var(--purple)" icon="📈" sub="Projection 12 mois"/>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔑 Portefeuille de gestion locative ({myGestion.length} biens)</span>
            <span style={{fontSize:13,fontWeight:700,color:"var(--green)"}}>Total mensuel : {fmt(caGestionMensuel)}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Réf</th><th>Adresse</th><th>Propriétaire</th><th>Agent</th><th>Loyer</th><th>Taux %</th><th>Comm./mois</th><th className="hide-mobile">Début gestion</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {myGestion.map(g=>{
                  const agent=agents.find(a=>a.id===g.agentId);
                  return (<tr key={g.id}>
                    <td><b style={{color:"var(--navy)",fontSize:12}}>{g.ref}</b></td>
                    <td style={{fontSize:11,maxWidth:140}}>{g.adresse}</td>
                    <td style={{fontSize:12,fontWeight:600}}>{g.proprietairePrenom} {g.proprietaireNom}</td>
                    <td style={{fontSize:12}}>{agent?.nom||"—"}</td>
                    <td style={{fontWeight:700}}>{fmt(g.loyer)}</td>
                    <td style={{fontWeight:700,color:"var(--blue)"}}>{g.commissionPct}%</td>
                    <td style={{fontWeight:900,color:"var(--green)",fontSize:14}}>{fmt(g.commissionMensuelle)}</td>
                    <td className="hide-mobile" style={{fontSize:11}}>{fmtDate(g.dateDebutGestion)}</td>
                    <td><span className="badge" style={{background:"#F0FDF4",color:"#059669"}}>✅ Actif</span></td>
                    <td><div style={{display:"flex",gap:4}}><button className="btn btn-secondary btn-sm" onClick={()=>{setEditingGest(g);setShowGestForm(true);}}>✏️</button><button className="btn btn-danger btn-sm" onClick={()=>deleteGest(g.id)}>🗑</button></div></td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:"12px 16px",background:"var(--g50)",borderTop:"1px solid var(--g100)",display:"flex",justifyContent:"flex-end",gap:24}}>
            <span style={{fontSize:13,color:"var(--g500)"}}>Loyers gérés : <b style={{color:"var(--navy)"}}>{fmt(myGestion.reduce((s,g)=>s+g.loyer,0))}/mois</b></span>
            <span style={{fontSize:13,color:"var(--g500)"}}>Commissions totales : <b style={{color:"var(--green)"}}>{fmt(caGestionMensuel)}/mois · {fmt(caGestionAnnuel)}/an</b></span>
          </div>
        </div>
      </>}

      {/* ══ EQUIPE ══ */}
      {tab==="equipe" && (
        <>
          {/* Cartes KPI objectifs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:18}}>
            {agents.filter(a=>a.invitationAcceptee).map(a=>{
              const annee = new Date().getFullYear();
              const obj = objectifs.find(o=>o.agentId===a.id && o.annee===annee);
              const caReal = myMandats.filter(m=>m.agentId===a.id&&m.statut==="vendu").reduce((s,m)=>s+m.commission,0);
              const pct = obj ? Math.min(Math.round(caReal/obj.montantHT*100),100) : null;
              const barColor = pct==null?"var(--g300)":pct>=100?"var(--green)":pct>=70?"var(--amber)":"var(--red)";
              return (
                <div key={a.id} style={{background:"#fff",borderRadius:12,padding:"14px 16px",border:"0.5px solid var(--g100)",boxShadow:"0 1px 8px #0001"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div className="avatar" style={{background:avatarColor(a.nom),width:30,height:30,fontSize:11}}>{a.avatar||a.nom[0]}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:13,color:"var(--navy)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.nom}</div>
                      <BadgeNiveau niveau={a.niveau}/>
                    </div>
                    <button
                      onClick={()=>{setEditingObjectifAgent(a);setShowObjectifModal(true);}}
                      title="Définir l'objectif"
                      style={{background:"var(--g100)",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,fontWeight:700,color:"var(--g500)",flexShrink:0}}
                    >🎯</button>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:"var(--g500)",fontWeight:600}}>CA réalisé HT</span>
                    <span style={{fontSize:13,fontWeight:800,color:"var(--navy)"}}>{fmt(caReal)}</span>
                  </div>
                  {obj ? (
                    <>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{fontSize:11,color:"var(--g500)",fontWeight:600}}>Objectif HT {new Date().getFullYear()}</span>
                        <span style={{fontSize:12,fontWeight:700,color:"var(--g700)"}}>{fmt(obj.montantHT)}</span>
                      </div>
                      <div style={{height:8,background:"var(--g100)",borderRadius:4,overflow:"hidden",marginBottom:4}}>
                        <div style={{height:"100%",width:`${pct}%`,background:barColor,borderRadius:4,transition:"width .5s"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontSize:11,color:"var(--g400)"}}>Progression</span>
                        <span style={{fontSize:12,fontWeight:800,color:barColor}}>{pct}%</span>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={()=>{setEditingObjectifAgent(a);setShowObjectifModal(true);}}
                      style={{width:"100%",background:"var(--g50)",border:"1px dashed var(--g300)",borderRadius:7,padding:"7px",cursor:"pointer",fontSize:11,fontWeight:700,color:"var(--g500)",marginTop:4}}
                    >+ Définir un objectif annuel</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tableau agents */}
          <div className="card">
            <div className="card-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span className="card-title">👥 Agents commerciaux</span>
              <button className="btn btn-primary btn-sm" onClick={()=>setShowInviteAgent(true)}>+ Inviter un agent</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Agent</th><th>Email</th><th>Niveau</th><th>Invitation</th>
                  <th>Mandats</th><th>Locations</th>
                  <th>CA Réalisé HT</th><th>Objectif HT</th><th>Progression</th><th>Statut</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {agents.map(a=>{
                    const annee = new Date().getFullYear();
                    const aM = myMandats.filter(m=>m.agentId===a.id);
                    const aL = myLocations.filter(l=>l.agentId===a.id);
                    const caReal = aM.filter(m=>m.statut==="vendu").reduce((s,m)=>s+m.commission,0);
                    const obj = objectifs.find(o=>o.agentId===a.id && o.annee===annee);
                    const pct = obj ? Math.min(Math.round(caReal/obj.montantHT*100),100) : null;
                    const barColor = pct==null?"var(--g300)":pct>=100?"var(--green)":pct>=70?"var(--amber)":"var(--red)";
                    return (<tr key={a.id}>
                      <td><div style={{display:"flex",alignItems:"center",gap:8}}><div className="avatar" style={{background:avatarColor(a.nom),width:30,height:30,fontSize:11}}>{a.avatar||a.nom[0]}</div><span style={{fontWeight:700,fontSize:13}}>{a.nom}</span></div></td>
                      <td style={{fontSize:11}}>{a.email}</td>
                      <td><BadgeNiveau niveau={a.niveau}/></td>
                      <td><span className="badge" style={{background:a.invitationAcceptee?"#F0FDF4":"#FFFBEB",color:a.invitationAcceptee?"#059669":"#B45309"}}>{a.invitationAcceptee?"✅ Activé":"⏳ En attente"}</span></td>
                      <td style={{fontWeight:700,color:"var(--blue)",textAlign:"center"}}>{aM.filter(m=>m.statut==="mandat").length}</td>
                      <td style={{fontWeight:700,color:"var(--navy)",textAlign:"center"}}>{aL.length}</td>
                      <td style={{fontWeight:800,color:"var(--navy)"}}>{fmt(caReal)}</td>
                      <td>
                        {obj
                          ? <span style={{fontWeight:700,color:"var(--g700)"}}>{fmt(obj.montantHT)}</span>
                          : <button className="btn btn-secondary btn-sm" onClick={()=>{setEditingObjectifAgent(a);setShowObjectifModal(true);}}>+ Définir</button>
                        }
                      </td>
                      <td style={{minWidth:120}}>
                        {pct != null ? (
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{flex:1,height:7,background:"var(--g100)",borderRadius:3,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${pct}%`,background:barColor,borderRadius:3}}/>
                            </div>
                            <span style={{fontSize:11,fontWeight:800,color:barColor,minWidth:32}}>{pct}%</span>
                          </div>
                        ) : <span style={{fontSize:11,color:"var(--g400)"}}>—</span>}
                      </td>
                      <td><span className="badge" style={{background:"#F0FDF4",color:"#059669"}}>Actif</span></td>
                      <td><div style={{display:"flex",gap:4}}>
                        <button className="btn btn-secondary btn-sm" title="Modifier objectif" onClick={()=>{setEditingObjectifAgent(a);setShowObjectifModal(true);}}>🎯</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>setUsers(prev=>prev.map(u=>u.id===a.id?{...u,actif:false}:u))}>Désactiver</button>
                      </div></td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══ INVITATIONS ══ */}
      {tab==="invitations" && <InvitationsManager agenceId={agenceId} onInvite={()=>setShowInviteAgent(true)}/>}

      {/* MODALS */}
      {showMandatForm && <MandatForm initial={editingMandat||{}} agents={agents} onSave={saveMandat} onClose={()=>{setShowMandatForm(false);setEditingMandat(null);}}/>}
      {showLocForm    && <LocationForm initial={editingLoc||{}} agents={agents} onSave={saveLoc} onClose={()=>{setShowLocForm(false);setEditingLoc(null);}}/>}
      {showGestForm   && <GestionForm  initial={editingGest||{}} agents={agents} onSave={saveGest} onClose={()=>{setShowGestForm(false);setEditingGest(null);}}/>}
      {showInviteAgent && <InviteAgentModal onClose={()=>{setShowInviteAgent(false);setInviteResult(null);}} onInvite={handleInvite} result={inviteResult}/>}
      {showObjectifModal && editingObjectifAgent && (
        <ObjectifModal
          agent={editingObjectifAgent}
          agenceId={agenceId}
          objectifs={objectifs}
          setObjectifs={setObjectifs}
          onClose={()=>{setShowObjectifModal(false);setEditingObjectifAgent(null);}}
        />
      )}
    </AppShell>
  );
}

// ─── LOCATION FORM ────────────────────────────────────────────────────────────
function LocationForm({ initial={}, agents, onSave, onClose }) {
  const [f,setF] = useState({ ref:"",adresse:"",loyer:"",commission:"",agentId:"",dateSignature:"",locataireNom:"",locatairePrenom:"",locataireTel:"",locataireMail:"",locataireTrouve:false,...initial });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <Modal title={initial.id?"✏️ Modifier location":"➕ Nouvelle location"} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={()=>onSave(f)}>{initial.id?"Enregistrer":"Créer"}</button></>}>
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Référence</label><input className="form-input" value={f.ref} onChange={e=>set("ref",e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Agent commercial</label>
          <select className="form-select" value={f.agentId} onChange={e=>set("agentId",e.target.value)}>
            <option value="">— Choisir —</option>{agents.map(a=><option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
        </div>
        <div className="form-group" style={{gridColumn:"1/-1"}}><label className="form-label">Adresse du bien</label><input className="form-input" value={f.adresse} onChange={e=>set("adresse",e.target.value)} placeholder="Ex: 5 Rue de la Paix, Amiens"/></div>
        <div className="form-group"><label className="form-label">Loyer mensuel (€)</label><input className="form-input" type="number" value={f.loyer} onChange={e=>set("loyer",e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Commission (€)</label><input className="form-input" type="number" value={f.commission} onChange={e=>set("commission",e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Date de signature</label><input className="form-input" type="date" value={f.dateSignature||""} onChange={e=>set("dateSignature",e.target.value)}/></div>
        <div className="form-group"></div>
      </div>
      <div style={{borderTop:"1px solid var(--g100)",paddingTop:16,marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,cursor:"pointer"}} onClick={()=>set("locataireTrouve",!f.locataireTrouve)}>
          <input type="checkbox" checked={!!f.locataireTrouve} readOnly style={{width:16,height:16,cursor:"pointer"}}/>
          <span style={{fontWeight:700,color:"var(--navy)",fontSize:14}}>Locataire trouvé</span>
        </div>
        {f.locataireTrouve && (
          <div className="form-grid-2">
            <div className="form-group"><label className="form-label">Prénom</label><input className="form-input" value={f.locatairePrenom} onChange={e=>set("locatairePrenom",e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={f.locataireNom} onChange={e=>set("locataireNom",e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={f.locataireTel} onChange={e=>set("locataireTel",e.target.value)} placeholder="06 XX XX XX XX"/></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={f.locataireMail} onChange={e=>set("locataireMail",e.target.value)}/></div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── GESTION FORM ─────────────────────────────────────────────────────────────
function GestionForm({ initial={}, agents, onSave, onClose }) {
  const [f,setF] = useState({ ref:"",adresse:"",loyer:"",commissionPct:8,proprietaireNom:"",proprietairePrenom:"",agentId:"",dateDebutGestion:"",actif:true,...initial });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const commCalc = Math.round((Number(f.loyer)||0)*(Number(f.commissionPct)||0)/100);
  return (
    <Modal title={initial.id?"✏️ Modifier bien en gestion":"➕ Nouveau bien en gestion"} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={()=>onSave(f)}>{initial.id?"Enregistrer":"Créer"}</button></>}>
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Référence</label><input className="form-input" value={f.ref} onChange={e=>set("ref",e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Agent responsable</label>
          <select className="form-select" value={f.agentId} onChange={e=>set("agentId",e.target.value)}>
            <option value="">— Choisir —</option>{agents.map(a=><option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
        </div>
        <div className="form-group" style={{gridColumn:"1/-1"}}><label className="form-label">Adresse du bien</label><input className="form-input" value={f.adresse} onChange={e=>set("adresse",e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Prénom propriétaire</label><input className="form-input" value={f.proprietairePrenom} onChange={e=>set("proprietairePrenom",e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Nom propriétaire</label><input className="form-input" value={f.proprietaireNom} onChange={e=>set("proprietaireNom",e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Loyer mensuel (€)</label><input className="form-input" type="number" value={f.loyer} onChange={e=>set("loyer",e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Taux de commission (%)</label>
          <select className="form-select" value={f.commissionPct} onChange={e=>set("commissionPct",Number(e.target.value))}>
            <option value={5}>5%</option><option value={6}>6%</option><option value={7}>7%</option><option value={8}>8%</option><option value={9}>9%</option><option value={10}>10%</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Début de gestion</label><input className="form-input" type="date" value={f.dateDebutGestion||""} onChange={e=>set("dateDebutGestion",e.target.value)}/></div>
        <div className="form-group">
          <label className="form-label">Commission mensuelle calculée</label>
          <div style={{padding:"10px 13px",background:"#F0FDF4",borderRadius:8,fontWeight:900,fontSize:18,color:"var(--green)"}}>{fmt(commCalc)}</div>
        </div>
      </div>
    </Modal>
  );
}

// ─── INVITATIONS MANAGER ──────────────────────────────────────────────────────
function InvitationsManager({ agenceId, onInvite }) {
  const { invitations, users } = useApp();
  const [showEmail, setShowEmail] = useState(null);
  const myInv = invitations.filter(i=>{ const u=users.find(x=>x.id===i.userId); return u?.agenceId===agenceId; });
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">📧 Invitations envoyées</span>
        <button className="btn btn-primary btn-sm" onClick={onInvite}>+ Inviter un agent</button>
      </div>
      {myInv.length===0 ? (
        <div className="card-body" style={{textAlign:"center",color:"var(--g400)",padding:40}}>
          <div style={{fontSize:40,marginBottom:12}}>📭</div>
          <div style={{fontWeight:700}}>Aucune invitation envoyée</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Email</th><th>Agent</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {myInv.map(inv=>{
                const u=users.find(x=>x.id===inv.userId);
                const link=`${window.location.origin}${window.location.pathname}?invite=${inv.token}`;
                return (<tr key={inv.token}>
                  <td style={{fontSize:12}}>{inv.email}</td>
                  <td style={{fontWeight:600}}>{u?.nom||"—"}</td>
                  <td style={{fontSize:12}}>{fmtDate(inv.createdAt?.slice(0,10))}</td>
                  <td><span className="badge" style={{background:inv.used?"#F0FDF4":"#FFFBEB",color:inv.used?"#059669":"#B45309"}}>{inv.used?"✅ Activé":"⏳ En attente"}</span></td>
                  <td>
                    <div style={{display:"flex",gap:6}}>
                      {!inv.used && (
                        <button className="btn btn-secondary btn-sm" onClick={()=>{
                          navigator.clipboard.writeText(link).then(()=>alert("✅ Lien copié !")).catch(()=>prompt("Copiez ce lien :",link));
                        }}>📋 Lien</button>
                      )}
                      {inv.emailMessage && (
                        <button className="btn btn-secondary btn-sm" onClick={()=>setShowEmail(inv)}>📧 Email</button>
                      )}
                    </div>
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      )}
      {showEmail && (
        <Modal title="📧 Message d'invitation généré" onClose={()=>setShowEmail(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={()=>setShowEmail(null)}>Fermer</button>
            <button className="btn btn-primary" onClick={()=>{navigator.clipboard.writeText(showEmail.emailMessage).then(()=>alert("✅ Message copié !")).catch(()=>{})}}>📋 Copier le message</button>
          </>}
          wide>
          <div style={{background:"var(--g50)",borderRadius:10,padding:16,border:"1px solid var(--g200)"}}>
            <pre style={{fontFamily:"var(--font)",fontSize:13,color:"var(--g700)",whiteSpace:"pre-wrap",lineHeight:1.7}}>{showEmail.emailMessage}</pre>
          </div>
          <div className="alert alert-warning" style={{marginTop:12}}>
            ⚠️ Copiez ce message et envoyez-le manuellement à l'agent par email ou WhatsApp.
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── INVITE AGENT MODAL ───────────────────────────────────────────────────────
function InviteAgentModal({ onClose, onInvite, result }) {
  const [f,setF] = useState({nom:"",email:"",niveau:"junior"});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  if (result) return (
    <Modal title="✅ Invitation créée" onClose={onClose} footer={<button className="btn btn-primary" onClick={onClose}>Fermer</button>} wide>
      <div style={{textAlign:"center",padding:"10px 0 16px"}}>
        <div style={{fontSize:44,marginBottom:12}}>🎉</div>
        <p style={{fontWeight:700,color:"var(--navy)",fontSize:16,marginBottom:6}}>Invitation créée avec succès !</p>
      </div>
      <div className="alert alert-info">🔗 Lien d'activation à envoyer à l'agent :</div>
      <div style={{background:"var(--g50)",borderRadius:9,padding:"10px 14px",border:"1px solid var(--g200)",wordBreak:"break-all",fontSize:12,color:"var(--navy)",marginBottom:14}}>
        {result.link}
      </div>
      <button className="btn btn-secondary" style={{marginBottom:16}} onClick={()=>navigator.clipboard.writeText(result.link).then(()=>alert("✅ Lien copié !")).catch(()=>prompt("",result.link))}>
        📋 Copier le lien
      </button>
      <div style={{marginTop:8}}>
        <div style={{fontWeight:700,color:"var(--navy)",marginBottom:8,fontSize:13}}>📧 Message d'invitation prêt à envoyer :</div>
        <div style={{background:"var(--g50)",borderRadius:10,padding:14,border:"1px solid var(--g200)",maxHeight:240,overflowY:"auto"}}>
          <pre style={{fontFamily:"var(--font)",fontSize:12,color:"var(--g700)",whiteSpace:"pre-wrap",lineHeight:1.7}}>{result.emailMessage}</pre>
        </div>
        <button className="btn btn-primary" style={{marginTop:10,width:"100%"}} onClick={()=>navigator.clipboard.writeText(result.emailMessage).then(()=>alert("✅ Message copié ! Collez-le dans votre email ou WhatsApp.")).catch(()=>alert("Copiez le message manuellement"))}>
          📋 Copier le message complet
        </button>
      </div>
    </Modal>
  );
  return (
    <Modal title="📧 Inviter un agent commercial" onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={()=>onInvite(f)} disabled={!f.nom||!f.email}>Envoyer l'invitation</button></>}>
      <div className="alert alert-info">📧 Un message d'invitation sera généré automatiquement avec le lien d'activation.</div>
      <div className="form-group"><label className="form-label">Nom complet</label><input className="form-input" value={f.nom} onChange={e=>set("nom",e.target.value)} placeholder="Prénom Nom"/></div>
      <div className="form-group"><label className="form-label">Adresse email</label><input className="form-input" type="email" value={f.email} onChange={e=>set("email",e.target.value)} placeholder="agent@orpi-amiens.fr"/></div>
      <div className="form-group"><label className="form-label">Niveau</label>
        <div className="toggle-group">
          <button className={`toggle-btn ${f.niveau==="junior"?"active-simp":""}`} onClick={()=>set("niveau","junior")}>🌱 Junior</button>
          <button className={`toggle-btn ${f.niveau==="senior"?"active-excl":""}`} onClick={()=>set("niveau","senior")}>🏆 Senior</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── OBJECTIF MODAL ───────────────────────────────────────────────────────────
function ObjectifModal({ agent, agenceId, objectifs, setObjectifs, onClose }) {
  const annee = new Date().getFullYear();
  const existing = objectifs.find(o => o.agentId === agent.id && o.annee === annee);
  const [montant, setMontant] = useState(existing?.montantHT || "");
  const [error, setError] = useState("");

  const save = () => {
    const val = Number(montant);
    if (!val || val <= 0) { setError("Veuillez saisir un montant valide"); return; }
    setObjectifs(prev => {
      const exists = prev.find(o => o.agentId === agent.id && o.annee === annee);
      if (exists) return prev.map(o => o.agentId===agent.id && o.annee===annee ? {...o, montantHT:val} : o);
      return [...prev, { agentId:agent.id, agenceId, annee, montantHT:val }];
    });
    onClose();
  };

  return (
    <Modal
      title={`🎯 Objectif annuel — ${agent.nom}`}
      onClose={onClose}
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary" onClick={save}>Enregistrer</button>
      </>}
    >
      <div className="alert alert-info" style={{marginBottom:16}}>
        Définissez l'objectif annuel de CA commissions HT pour <strong>{agent.nom}</strong> ({annee}).
        Cet objectif est visible par le manager uniquement et sert à calculer la progression de l'agent.
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group">
        <label className="form-label">Objectif CA commissions HT — {annee} (€)</label>
        <input
          className="form-input"
          type="number"
          placeholder="Ex : 35000"
          value={montant}
          onChange={e => { setMontant(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && save()}
          autoFocus
        />
      </div>
      {montant && Number(montant) > 0 && (
        <div style={{background:"var(--g50)",borderRadius:10,padding:"12px 16px",border:"1px solid var(--g200)"}}>
          <div style={{fontSize:13,color:"var(--g700)",marginBottom:4}}>Aperçu de la progression actuelle :</div>
          {(() => {
            const caReal = 0; // sera calculé dynamiquement
            const pct = 0;
            return (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,height:10,background:"var(--g200)",borderRadius:5,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:"var(--red)",borderRadius:5}}/>
                </div>
                <span style={{fontSize:13,fontWeight:800,color:"var(--navy)"}}>
                  Objectif : {Number(montant).toLocaleString("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0})} HT
                </span>
              </div>
            );
          })()}
        </div>
      )}
    </Modal>
  );
}
