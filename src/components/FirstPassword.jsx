import { useState } from "react";
import { OrpiLogo } from "./Shared";

// ─── PREMIER ACCÈS MANAGER ────────────────────────────────────────────────────
// Affiché quand un manager se connecte pour la 1ère fois (pas encore de mdp)
export default function FirstPassword({ user, onSuccess, onCancel }) {
  const [pwd,  setPwd]  = useState("");
  const [pwd2, setPwd2] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (pwd.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères"); return; }
    if (pwd !== pwd2)   { setError("Les mots de passe ne correspondent pas"); return; }
    onSuccess(pwd);
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(145deg, #1D3557 0%, #2a4a7a 50%, #E63946 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, fontFamily:"var(--font, system-ui, sans-serif)"
    }}>
      <div style={{
        background:"#fff", borderRadius:22, padding:"40px 36px",
        width:"100%", maxWidth:420,
        boxShadow:"0 40px 100px rgba(0,0,0,0.25)"
      }}>
        {/* Logo */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
          <div style={{ background:"#E63946", borderRadius:14, padding:"14px 24px", display:"inline-flex" }}>
            <img src="/logo-orpi-declic.png" alt="Orpi Déclic Immo"
              style={{ height:56, width:"auto", objectFit:"contain" }}/>
          </div>
        </div>

        {/* Bienvenue */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#1D3557", marginBottom:6 }}>
            Bienvenue, {user.nom} !
          </div>
          <div style={{ fontSize:14, color:"#64748B", lineHeight:1.6 }}>
            C'est votre première connexion.<br/>
            Choisissez votre mot de passe personnel pour accéder à votre espace.
          </div>
        </div>

        {/* Info compte */}
        <div style={{
          background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10,
          padding:"10px 14px", marginBottom:20,
          fontSize:13, color:"#1D4ED8", fontWeight:600
        }}>
          📧 Compte : {user.email}
        </div>

        {error && (
          <div style={{
            background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10,
            padding:"10px 14px", marginBottom:14,
            fontSize:13, color:"#DC2626", fontWeight:600
          }}>⚠️ {error}</div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 }}>
            Nouveau mot de passe (8 caractères minimum)
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(""); }}
            style={{
              width:"100%", border:"1.5px solid #E2E8F0", borderRadius:10,
              padding:"12px 14px", fontSize:15, boxSizing:"border-box", outline:"none",
              fontFamily:"inherit"
            }}
          />
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 }}>
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={pwd2}
            onChange={e => { setPwd2(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{
              width:"100%", border:"1.5px solid #E2E8F0", borderRadius:10,
              padding:"12px 14px", fontSize:15, boxSizing:"border-box", outline:"none",
              fontFamily:"inherit"
            }}
          />
        </div>

        <button
          onClick={submit}
          style={{
            width:"100%", background:"#E63946", border:"none",
            color:"#fff", padding:13, borderRadius:10,
            fontWeight:900, fontSize:15, cursor:"pointer",
            boxShadow:"0 4px 16px rgba(230,57,70,0.4)",
            fontFamily:"inherit"
          }}
        >
          Créer mon mot de passe et accéder →
        </button>

        <button
          onClick={onCancel}
          style={{
            width:"100%", background:"transparent", border:"none",
            color:"#94A3B8", padding:"10px", borderRadius:10,
            fontWeight:600, fontSize:13, cursor:"pointer", marginTop:8,
            fontFamily:"inherit"
          }}
        >
          ← Retour à la connexion
        </button>
      </div>
    </div>
  );
}
