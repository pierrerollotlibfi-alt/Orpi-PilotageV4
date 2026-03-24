import { useState, useEffect, useCallback, createContext, useContext } from "react";
import Login from "./components/Login";
import ManagerApp from "./components/ManagerApp";
import AgentApp from "./components/AgentApp";
import SetPassword from "./components/SetPassword";
import FirstPassword from "./components/FirstPassword";
import "./styles.css";

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const today = new Date();
const daysAgo   = (d) => new Date(today - d * 86400000).toISOString().slice(0,10);
const daysAhead = (d) => new Date(today.getTime() + d * 86400000).toISOString().slice(0,10);

// ─── UTILISATEURS INITIAUX ────────────────────────────────────────────────────
// Les 2 managers n'ont PAS de mot de passe → première connexion = création mdp
const INITIAL_USERS = [
  {
    id:"manager-1", nom:"Patrick Rollot", email:"p.rollot@orpi.com",
    password:null,  // pas de mdp → doit créer le sien à la 1ère connexion
    role:"manager", agenceId:"agence-1", actif:true,
    createdAt:daysAgo(365), avatar:"PR", premierAcces:true
  },
  {
    id:"manager-2", nom:"F. Carré", email:"f.carre@orpi.com",
    password:null,
    role:"manager", agenceId:"agence-1", actif:true,
    createdAt:daysAgo(365), avatar:"FC", premierAcces:true
  },
  { id:"agent-1", nom:"Sophie Martin",   email:"s.martin@orpi-amiens.fr",  password:"martin2024",   role:"agent", niveau:"senior", agenceId:"agence-1", actif:true, createdAt:daysAgo(200), avatar:"SM", invitationAcceptee:true, premierAcces:false },
  { id:"agent-2", nom:"Thomas Dupont",   email:"t.dupont@orpi-amiens.fr",  password:"dupont2024",   role:"agent", niveau:"junior", agenceId:"agence-1", actif:true, createdAt:daysAgo(150), avatar:"TD", invitationAcceptee:true, premierAcces:false },
  { id:"agent-3", nom:"Amélie Bertrand", email:"a.bertrand@orpi-amiens.fr",password:"bertrand2024", role:"agent", niveau:"senior", agenceId:"agence-1", actif:true, createdAt:daysAgo(180), avatar:"AB", invitationAcceptee:true, premierAcces:false },
  { id:"agent-4", nom:"Lucas Moreau",    email:"l.moreau@orpi-amiens.fr",  password:"moreau2024",   role:"agent", niveau:"junior", agenceId:"agence-1", actif:true, createdAt:daysAgo(90),  avatar:"LM", invitationAcceptee:true, premierAcces:false },
  { id:"agent-5", nom:"Claire Fontaine", email:"c.fontaine@orpi-amiens.fr",password:"fontaine2024", role:"agent", niveau:"senior", agenceId:"agence-1", actif:true, createdAt:daysAgo(120), avatar:"CF", invitationAcceptee:true, premierAcces:false },
];

const INITIAL_AGENCES = [
  { id:"agence-1", nom:"ORPI Déclic Immo Amiens", ville:"Amiens", adresse:"15 Rue des Trois Cailloux, 80000 Amiens", telephone:"03 22 71 00 00", email:"contact@orpi-amiens.fr", managerId:"manager-1", actif:true, createdAt:daysAgo(365) }
];

const INITIAL_MANDATS = [
  { id:"m1",  ref:"MAN-001", typeMandat:"exclusif", adresse:"12 Rue Saint-Leu, Amiens",      prix:285000, commission:8550,  statut:"mandat",    agentId:"agent-1", agenceId:"agence-1", dateMandat:daysAgo(15),  dateExpiration:daysAhead(75),  dateCompromis:null,        dateSignature:null,          clausesSuspensivesLevees:false },
  { id:"m2",  ref:"MAN-002", typeMandat:"simple",   adresse:"8 Bd de Belfort, Amiens",        prix:195000, commission:5850,  statut:"compromis", agentId:"agent-2", agenceId:"agence-1", dateMandat:daysAgo(45),  dateExpiration:daysAhead(45),  dateCompromis:daysAgo(10), dateSignature:daysAhead(80), clausesSuspensivesLevees:false },
  { id:"m3",  ref:"MAN-003", typeMandat:"exclusif", adresse:"45 Rue de Noyon, Amiens",        prix:340000, commission:10200, statut:"vendu",     agentId:"agent-3", agenceId:"agence-1", dateMandat:daysAgo(90),  dateExpiration:daysAhead(0),   dateCompromis:daysAgo(60), dateSignature:daysAhead(5),  clausesSuspensivesLevees:true  },
  { id:"m4",  ref:"MAN-004", typeMandat:"exclusif", adresse:"3 Place Gambetta, Amiens",       prix:420000, commission:12600, statut:"compromis", agentId:"agent-1", agenceId:"agence-1", dateMandat:daysAgo(30),  dateExpiration:daysAhead(60),  dateCompromis:daysAgo(5),  dateSignature:daysAhead(90), clausesSuspensivesLevees:true  },
  { id:"m5",  ref:"MAN-005", typeMandat:"simple",   adresse:"22 Rue Gresset, Amiens",         prix:167000, commission:5010,  statut:"mandat",    agentId:"agent-4", agenceId:"agence-1", dateMandat:daysAgo(5),   dateExpiration:daysAhead(85),  dateCompromis:null,        dateSignature:null,          clausesSuspensivesLevees:false },
  { id:"m6",  ref:"MAN-006", typeMandat:"simple",   adresse:"7 Allée des Acacias, Longueau",  prix:255000, commission:7650,  statut:"mandat",    agentId:"agent-2", agenceId:"agence-1", dateMandat:daysAgo(80),  dateExpiration:daysAhead(10),  dateCompromis:null,        dateSignature:null,          clausesSuspensivesLevees:false },
  { id:"m7",  ref:"MAN-007", typeMandat:"exclusif", adresse:"18 Rue de Paris, Amiens",        prix:310000, commission:9300,  statut:"compromis", agentId:"agent-5", agenceId:"agence-1", dateMandat:daysAgo(55),  dateExpiration:daysAhead(35),  dateCompromis:daysAgo(20), dateSignature:daysAhead(60), clausesSuspensivesLevees:false },
  { id:"m8",  ref:"MAN-008", typeMandat:"simple",   adresse:"29 Rue Victor Hugo, Amiens",     prix:189000, commission:5670,  statut:"vendu",     agentId:"agent-3", agenceId:"agence-1", dateMandat:daysAgo(120), dateExpiration:daysAgo(5),     dateCompromis:daysAgo(80), dateSignature:daysAgo(10),   clausesSuspensivesLevees:true  },
  { id:"m9",  ref:"MAN-009", typeMandat:"exclusif", adresse:"54 Rue Delambre, Amiens",        prix:375000, commission:11250, statut:"mandat",    agentId:"agent-5", agenceId:"agence-1", dateMandat:daysAgo(25),  dateExpiration:daysAhead(65),  dateCompromis:null,        dateSignature:null,          clausesSuspensivesLevees:false },
  { id:"m10", ref:"MAN-010", typeMandat:"simple",   adresse:"11 Impasse des Lilas, Rivery",   prix:210000, commission:6300,  statut:"compromis", agentId:"agent-4", agenceId:"agence-1", dateMandat:daysAgo(60),  dateExpiration:daysAhead(30),  dateCompromis:daysAgo(15), dateSignature:daysAhead(75), clausesSuspensivesLevees:false },
  { id:"m11", ref:"MAN-011", typeMandat:"exclusif", adresse:"6 Rue des Jacobins, Amiens",     prix:298000, commission:8940,  statut:"vendu",     agentId:"agent-1", agenceId:"agence-1", dateMandat:daysAgo(200), dateExpiration:daysAgo(80),    dateCompromis:daysAgo(150),dateSignature:daysAgo(30),   clausesSuspensivesLevees:true  },
  { id:"m12", ref:"MAN-012", typeMandat:"simple",   adresse:"33 Rue Vulfran Warmé, Amiens",   prix:145000, commission:4350,  statut:"vendu",     agentId:"agent-2", agenceId:"agence-1", dateMandat:daysAgo(180), dateExpiration:daysAgo(60),    dateCompromis:daysAgo(120),dateSignature:daysAgo(15),   clausesSuspensivesLevees:false },
  { id:"m13", ref:"MAN-013", typeMandat:"exclusif", adresse:"19 Bd du Port, Amiens",          prix:520000, commission:15600, statut:"compromis", agentId:"agent-5", agenceId:"agence-1", dateMandat:daysAgo(20),  dateExpiration:daysAhead(70),  dateCompromis:daysAgo(3),  dateSignature:daysAhead(95), clausesSuspensivesLevees:false },
  { id:"m14", ref:"MAN-014", typeMandat:"simple",   adresse:"47 Av de la République, Amiens", prix:175000, commission:5250,  statut:"mandat",    agentId:"agent-3", agenceId:"agence-1", dateMandat:daysAgo(10),  dateExpiration:daysAhead(80),  dateCompromis:null,        dateSignature:null,          clausesSuspensivesLevees:false },
  { id:"m15", ref:"MAN-015", typeMandat:"exclusif", adresse:"2 Rue du Maréchal Foch, Amiens", prix:390000, commission:11700, statut:"vendu",     agentId:"agent-1", agenceId:"agence-1", dateMandat:daysAgo(300), dateExpiration:daysAgo(120),   dateCompromis:daysAgo(200),dateSignature:daysAgo(60),   clausesSuspensivesLevees:true  },
];

const INITIAL_LOCATIONS = [
  { id:"loc1", ref:"LOC-001", adresse:"5 Rue Delambre, Amiens",        loyer:750,  commission:750,  agentId:"agent-1", agenceId:"agence-1", dateSignature:daysAgo(10),  locataireNom:"Martin",  locatairePrenom:"Jean",   locataireTel:"06 12 34 56 78", locataireMail:"j.martin@email.fr",  locataireTrouve:true  },
  { id:"loc2", ref:"LOC-002", adresse:"12 Bd Jules Verne, Amiens",     loyer:920,  commission:920,  agentId:"agent-2", agenceId:"agence-1", dateSignature:daysAgo(25),  locataireNom:"Petit",   locatairePrenom:"Marie",  locataireTel:"06 23 45 67 89", locataireMail:"m.petit@email.fr",   locataireTrouve:true  },
  { id:"loc3", ref:"LOC-003", adresse:"8 Rue Saint-Leu, Amiens",       loyer:650,  commission:650,  agentId:"agent-3", agenceId:"agence-1", dateSignature:null,         locataireNom:"",        locatairePrenom:"",       locataireTel:"",               locataireMail:"",                   locataireTrouve:false },
  { id:"loc4", ref:"LOC-004", adresse:"33 Rue de Noyon, Amiens",       loyer:1100, commission:1100, agentId:"agent-1", agenceId:"agence-1", dateSignature:daysAgo(5),   locataireNom:"Durand",  locatairePrenom:"Pierre", locataireTel:"07 34 56 78 90", locataireMail:"p.durand@email.fr",  locataireTrouve:true  },
  { id:"loc5", ref:"LOC-005", adresse:"21 Av Faidherbe, Amiens",       loyer:880,  commission:880,  agentId:"agent-4", agenceId:"agence-1", dateSignature:null,         locataireNom:"",        locatairePrenom:"",       locataireTel:"",               locataireMail:"",                   locataireTrouve:false },
  { id:"loc6", ref:"LOC-006", adresse:"14 Rue Victor Hugo, Amiens",    loyer:590,  commission:590,  agentId:"agent-5", agenceId:"agence-1", dateSignature:daysAgo(40),  locataireNom:"Bernard", locatairePrenom:"Sophie", locataireTel:"06 45 67 89 01", locataireMail:"s.bernard@email.fr", locataireTrouve:true  },
  { id:"loc7", ref:"LOC-007", adresse:"7 Rue des Jacobins, Amiens",    loyer:1350, commission:1350, agentId:"agent-2", agenceId:"agence-1", dateSignature:daysAgo(3),   locataireNom:"Lambert", locatairePrenom:"Thomas", locataireTel:"07 56 78 90 12", locataireMail:"t.lambert@email.fr", locataireTrouve:true  },
  { id:"loc8", ref:"LOC-008", adresse:"29 Bd Alsace-Lorraine, Amiens", loyer:780,  commission:780,  agentId:"agent-3", agenceId:"agence-1", dateSignature:null,         locataireNom:"",        locatairePrenom:"",       locataireTel:"",               locataireMail:"",                   locataireTrouve:false },
];

const INITIAL_GESTION = [
  { id:"g1",  ref:"GES-001", adresse:"5 Rue Delambre, Amiens",         proprietaireNom:"Leclerc",  proprietairePrenom:"André",    loyer:750,  commissionPct:8, commissionMensuelle:60,  agentId:"agent-1", agenceId:"agence-1", dateDebutGestion:daysAgo(365), actif:true },
  { id:"g2",  ref:"GES-002", adresse:"12 Bd Jules Verne, Amiens",      proprietaireNom:"Rousseau", proprietairePrenom:"Isabelle", loyer:920,  commissionPct:8, commissionMensuelle:74,  agentId:"agent-2", agenceId:"agence-1", dateDebutGestion:daysAgo(290), actif:true },
  { id:"g3",  ref:"GES-003", adresse:"3 Rue Gresset, Amiens",          proprietaireNom:"Moreau",   proprietairePrenom:"Paul",     loyer:680,  commissionPct:8, commissionMensuelle:54,  agentId:"agent-3", agenceId:"agence-1", dateDebutGestion:daysAgo(180), actif:true },
  { id:"g4",  ref:"GES-004", adresse:"18 Rue de Paris, Amiens",        proprietaireNom:"Simon",    proprietairePrenom:"Claire",   loyer:1200, commissionPct:7, commissionMensuelle:84,  agentId:"agent-1", agenceId:"agence-1", dateDebutGestion:daysAgo(420), actif:true },
  { id:"g5",  ref:"GES-005", adresse:"45 Av de la République, Amiens", proprietaireNom:"Michel",   proprietairePrenom:"Laurent",  loyer:850,  commissionPct:8, commissionMensuelle:68,  agentId:"agent-4", agenceId:"agence-1", dateDebutGestion:daysAgo(95),  actif:true },
  { id:"g6",  ref:"GES-006", adresse:"9 Rue Vulfran Warmé, Amiens",    proprietaireNom:"Garcia",   proprietairePrenom:"Marie",    loyer:560,  commissionPct:8, commissionMensuelle:45,  agentId:"agent-5", agenceId:"agence-1", dateDebutGestion:daysAgo(200), actif:true },
  { id:"g7",  ref:"GES-007", adresse:"22 Rue Maréchal Foch, Amiens",   proprietaireNom:"Dupuis",   proprietairePrenom:"Robert",   loyer:1450, commissionPct:7, commissionMensuelle:102, agentId:"agent-2", agenceId:"agence-1", dateDebutGestion:daysAgo(510), actif:true },
  { id:"g8",  ref:"GES-008", adresse:"11 Bd de Belfort, Amiens",       proprietaireNom:"Fournier", proprietairePrenom:"Nathalie", loyer:790,  commissionPct:8, commissionMensuelle:63,  agentId:"agent-3", agenceId:"agence-1", dateDebutGestion:daysAgo(60),  actif:true },
  { id:"g9",  ref:"GES-009", adresse:"37 Rue Saint-Leu, Amiens",       proprietaireNom:"Renard",   proprietairePrenom:"François", loyer:640,  commissionPct:8, commissionMensuelle:51,  agentId:"agent-5", agenceId:"agence-1", dateDebutGestion:daysAgo(320), actif:true },
  { id:"g10", ref:"GES-010", adresse:"6 Impasse des Lilas, Rivery",    proprietaireNom:"Blanc",    proprietairePrenom:"Hélène",   loyer:980,  commissionPct:7, commissionMensuelle:69,  agentId:"agent-1", agenceId:"agence-1", dateDebutGestion:daysAgo(140), actif:true },
];

const INITIAL_INVITATIONS = [];

// ─── OBJECTIFS ANNUELS PAR AGENT (définis par le manager) ─────────────────────
// montantHT = objectif CA commissions HT annuel
const INITIAL_OBJECTIFS = [
  { agentId:"agent-1", agenceId:"agence-1", annee:2025, montantHT:40000 },
  { agentId:"agent-2", agenceId:"agence-1", annee:2025, montantHT:25000 },
  { agentId:"agent-3", agenceId:"agence-1", annee:2025, montantHT:35000 },
  { agentId:"agent-4", agenceId:"agence-1", annee:2025, montantHT:20000 },
  { agentId:"agent-5", agenceId:"agence-1", annee:2025, montantHT:38000 },
];

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users,       setUsersRaw]    = useState(() => load("orpi_users_v4",     INITIAL_USERS));
  const [agences,     setAgencesRaw]  = useState(() => load("orpi_agences_v4",   INITIAL_AGENCES));
  const [mandats,     setMandatsRaw]  = useState(() => load("orpi_mandats_v4",   INITIAL_MANDATS));
  const [locations,   setLocsRaw]     = useState(() => load("orpi_locations_v4", INITIAL_LOCATIONS));
  const [gestion,     setGestRaw]     = useState(() => load("orpi_gestion_v4",   INITIAL_GESTION));
  const [invitations, setInvRaw]      = useState(() => load("orpi_invitations_v4", INITIAL_INVITATIONS));
  const [objectifs,   setObjRaw]      = useState(() => load("orpi_objectifs_v4",   INITIAL_OBJECTIFS));
  const [page,        setPage]        = useState("login"); // login | app | setpassword | firstpassword
  const [invToken,    setInvToken]    = useState(null);
  const [pendingUser, setPendingUser] = useState(null); // manager en attente de créer son mdp

  const setUsers      = useCallback((u) => { const v=typeof u==="function"?u(users):u;      setUsersRaw(v);   save("orpi_users_v4",v);      }, [users]);
  const setAgences    = useCallback((u) => { const v=typeof u==="function"?u(agences):u;    setAgencesRaw(v); save("orpi_agences_v4",v);    }, [agences]);
  const setMandats    = useCallback((u) => { const v=typeof u==="function"?u(mandats):u;    setMandatsRaw(v); save("orpi_mandats_v4",v);    }, [mandats]);
  const setLocations  = useCallback((u) => { const v=typeof u==="function"?u(locations):u;  setLocsRaw(v);    save("orpi_locations_v4",v);  }, [locations]);
  const setGestion    = useCallback((u) => { const v=typeof u==="function"?u(gestion):u;    setGestRaw(v);    save("orpi_gestion_v4",v);    }, [gestion]);
  const setInvitations= useCallback((u) => { const v=typeof u==="function"?u(invitations):u;setInvRaw(v);    save("orpi_invitations_v4",v);}, [invitations]);
  const setObjectifs  = useCallback((u) => { const v=typeof u==="function"?u(objectifs):u;   setObjRaw(v);    save("orpi_objectifs_v4",v);  }, [objectifs]);

  // Vérif token invitation dans URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (token) { setInvToken(token); setPage("setpassword"); }
  }, []);

  // ─── CONNEXION ───────────────────────────────────────────────────────────────
  const handleLogin = (email, password) => {
    const u = users.find(x => x.email.toLowerCase()===email.toLowerCase() && x.actif);
    if (!u) return "Email inconnu ou compte désactivé";

    // Manager sans mot de passe → première connexion, créer son mdp
    if (u.role === "manager" && u.premierAcces && !u.password) {
      setPendingUser(u);
      setPage("firstpassword");
      return null;
    }

    if (!u.password || u.password !== password) return "Mot de passe incorrect";
    if (u.role === "agent" && !u.invitationAcceptee) return "Votre compte est en attente d'activation";
    setCurrentUser(u); setPage("app"); return null;
  };

  const handleLogout = () => { setCurrentUser(null); setPage("login"); };

  // ─── PREMIER ACCÈS MANAGER — création mot de passe ───────────────────────────
  const handleFirstPassword = (password) => {
    const updated = { ...pendingUser, password, premierAcces: false };
    setUsers(prev => prev.map(u => u.id === pendingUser.id ? updated : u));
    setCurrentUser(updated);
    setPendingUser(null);
    setPage("app");
  };

  // ─── INVITATION AGENT ────────────────────────────────────────────────────────
  const inviterAgent = (agentData, agenceId) => {
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const agence = agences.find(a => a.id === agenceId);
    const newUser = {
      id:"agent-"+Date.now(), nom:agentData.nom, email:agentData.email,
      password:null, role:"agent", niveau:agentData.niveau||"junior",
      agenceId, actif:true, createdAt:new Date().toISOString().slice(0,10),
      avatar:agentData.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(),
      invitationAcceptee:false, premierAcces:true
    };
    const link = `${window.location.origin}${window.location.pathname}?invite=${token}`;
    const emailMessage = generateInvitationEmail(agentData.nom, agence?.nom, link);
    const inv = { token, userId:newUser.id, email:agentData.email, createdAt:new Date().toISOString(), used:false, emailMessage };
    setUsers(prev => [...prev, newUser]);
    setInvitations(prev => [...prev, inv]);
    return { success:true, link, token, emailMessage };
  };

  // ─── ACTIVATION COMPTE AGENT (via lien invitation) ────────────────────────────
  const activerCompte = (token, password) => {
    const inv = invitations.find(i => i.token===token && !i.used);
    if (!inv) return "Lien invalide ou expiré";
    setUsers(prev => prev.map(u => u.id===inv.userId
      ? {...u, password, invitationAcceptee:true, premierAcces:false}
      : u
    ));
    setInvitations(prev => prev.map(i => i.token===token ? {...i, used:true} : i));
    return null;
  };

  const ctx = {
    currentUser, users, agences, mandats, locations, gestion, invitations, objectifs,
    setUsers, setAgences, setMandats, setLocations, setGestion, setInvitations, setObjectifs,
    handleLogout, inviterAgent, activerCompte,
  };

  // ─── ROUTING ─────────────────────────────────────────────────────────────────
  // Activation compte via lien invitation
  if (page === "setpassword") return (
    <AppContext.Provider value={ctx}>
      <SetPassword
        token={invToken}
        onSuccess={() => { setPage("login"); window.history.replaceState({}, "", window.location.pathname); }}
      />
    </AppContext.Provider>
  );

  // Premier accès manager → créer son mot de passe
  if (page === "firstpassword" && pendingUser) return (
    <AppContext.Provider value={ctx}>
      <FirstPassword user={pendingUser} onSuccess={handleFirstPassword} onCancel={()=>setPage("login")}/>
    </AppContext.Provider>
  );

  if (page === "login" || !currentUser) return (
    <AppContext.Provider value={ctx}>
      <Login onLogin={handleLogin} />
    </AppContext.Provider>
  );

  return (
    <AppContext.Provider value={ctx}>
      {currentUser.role === "manager" && <ManagerApp />}
      {currentUser.role === "agent"   && <AgentApp />}
    </AppContext.Provider>
  );
}

// ─── EMAIL INVITATION ─────────────────────────────────────────────────────────
function generateInvitationEmail(nomAgent, nomAgence, link) {
  return `Objet : Invitation à rejoindre ${nomAgence || "ORPI Déclic Immo"} — Création de votre compte

Bonjour ${nomAgent},

Je suis heureux(se) de vous accueillir dans notre équipe au sein de ${nomAgence || "ORPI Déclic Immo Amiens"} !

Afin de vous donner accès à notre application de pilotage commercial, je vous invite à créer votre compte en cliquant sur le lien ci-dessous :

👉 ${link}

Ce lien vous permettra de :
• Définir votre mot de passe personnel et sécurisé
• Accéder à votre espace agent dès la première connexion
• Enregistrer et suivre vos mandats, compromis et ventes en temps réel

⚠️ Ce lien est personnel et valable pour une seule utilisation. Ne le partagez pas.

En cas de problème, n'hésitez pas à nous contacter directement.

Bienvenue dans l'équipe !

Cordialement,
La direction — ${nomAgence || "ORPI Déclic Immo Amiens"}
`;
}
