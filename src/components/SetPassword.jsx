import { useState } from "react";
import { useApp } from "../App";

// ─── ACTIVATION COMPTE AGENT via lien invitation ──────────────────────────────
export default function SetPassword({ token, onSuccess }) {
  const { activerCompte, invitations, users } = useApp();
  const [pwd,  setPwd]  = useState("");
  const [pwd2, setPwd2] = useState("");
  const [error, setError] = useState("");
  const [done,  setDone]  = useState(false);

  const inv  = invitations.find(i => i.token === token && !i.used);
  const user = inv ? users.find(u => u.id === inv.userId) : null;

  if (!inv) return (
    <div style={{ minHeight:"100vh", background:"#1D3557", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:18, padding:36, maxWidth:400, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <h2 style={{ color:"#1D3557", fontWeight:800, marginBottom:8 }}>Lien invalide</h2>
        <p style={{ color:"#64748B", fontSize:14, marginBottom:20 }}>
          Ce lien d'invitation est invalide ou a déjà été utilisé.<br/>Demandez un nouveau lien à votre manager.
        </p>
        <button
          onClick={() => { window.history.replaceState({}, "", window.location.pathname); onSuccess(); }}
          style={{ background:"#E63946", border:"none", color:"#fff", padding:"10px 24px", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:14 }}
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  );

  const submit = () => {
    if (pwd.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères"); return; }
    if (pwd !== pwd2)   { setError("Les mots de passe ne correspondent pas"); return; }
    const err = activerCompte(token, pwd);
    if (err) { setError(err); return; }
    setDone(true);
    setTimeout(onSuccess, 2500);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(145deg,#1D3557,#E63946)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:22, padding:"40px 36px", width:"100%", maxWidth:420, boxShadow:"0 40px 100px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
          <div style={{ background:"#E63946", borderRadius:14, padding:"14px 24px", display:"inline-flex" }}>
            <img src="/logo-orpi-declic.png" alt="Orpi Déclic Immo" style={{ height:56, width:"auto", objectFit:"contain" }}/>
          </div>
        </div>

        {done ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
            <h2 style={{ color:"#1D3557", fontWeight:800, fontSize:20, marginBottom:8 }}>Compte activé !</h2>
            <p style={{ color:"#64748B", fontSize:14 }}>
              Bienvenue <strong>{user?.nom}</strong> !<br/>Redirection vers la connexion…
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize:20, fontWeight:800, color:"#1D3557", marginBottom:6, textAlign:"center" }}>
              Créez votre mot de passe
            </h1>
            <p style={{ color:"#64748B", fontSize:13, marginBottom:20, textAlign:"center" }}>
              Bienvenue <strong>{user?.nom}</strong> !<br/>
              Choisissez un mot de passe pour activer votre compte.
            </p>

            <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#1D4ED8", fontWeight:600 }}>
              📧 {user?.email}
            </div>

            {error && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#DC2626", fontWeight:600 }}>⚠️ {error}</div>}

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 }}>Mot de passe (8 car. min.)</label>
              <input type="password" placeholder="••••••••" value={pwd}
                onChange={e=>{setPwd(e.target.value);setError("");}}
                style={{ width:"100%", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"12px 14px", fontSize:15, boxSizing:"border-box", outline:"none", fontFamily:"inherit" }}/>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 }}>Confirmer le mot de passe</label>
              <input type="password" placeholder="••••••••" value={pwd2}
                onChange={e=>{setPwd2(e.target.value);setError("");}}
                onKeyDown={e=>e.key==="Enter"&&submit()}
                style={{ width:"100%", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"12px 14px", fontSize:15, boxSizing:"border-box", outline:"none", fontFamily:"inherit" }}/>
            </div>

            <button onClick={submit}
              style={{ width:"100%", background:"#E63946", border:"none", color:"#fff", padding:13, borderRadius:10, fontWeight:900, fontSize:15, cursor:"pointer", boxShadow:"0 4px 16px rgba(230,57,70,0.4)", fontFamily:"inherit" }}>
              Activer mon compte →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
