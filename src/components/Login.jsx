import { useState } from "react";

export default function Login({ onLogin }) {
  const [email,   setEmail]   = useState("");
  const [pwd,     setPwd]     = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!email) { setError("Veuillez saisir votre email"); return; }
    setLoading(true);
    setError("");
    setTimeout(() => {
      // Pour managers sans mdp : onLogin redirige vers FirstPassword sans erreur
      const err = onLogin(email, pwd);
      if (err) { setError(err); setLoading(false); }
      // Sinon la redirection est gérée par App
    }, 350);
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(145deg, #1D3557 0%, #2a4a7a 50%, #E63946 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, fontFamily:"system-ui, sans-serif"
    }}>
      {/* Décoration */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:-100, right:-100, width:400, height:400, borderRadius:"50%", background:"rgba(230,57,70,0.12)" }}/>
        <div style={{ position:"absolute", bottom:-80, left:-80, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }}/>
      </div>

      <div style={{
        background:"#fff", borderRadius:22, padding:"40px 36px",
        width:"100%", maxWidth:420,
        boxShadow:"0 40px 100px rgba(0,0,0,0.25)",
        position:"relative", zIndex:1
      }}>
        {/* Logo */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
          <div style={{ background:"#E63946", borderRadius:16, padding:"14px 28px", display:"inline-flex" }}>
            <img
              src="/logo-orpi-declic.png"
              alt="Orpi Déclic Immo"
              style={{ height:60, width:"auto", objectFit:"contain" }}
            />
          </div>
        </div>

        <h1 style={{ textAlign:"center", fontSize:20, fontWeight:800, color:"#1D3557", marginBottom:6 }}>
          Pilotage Commercial
        </h1>
        <p style={{ textAlign:"center", color:"#94A3B8", fontSize:13, marginBottom:28 }}>
          Connectez-vous à votre espace
        </p>

        {error && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#DC2626", fontWeight:600 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 }}>
            Adresse email
          </label>
          <input
            type="email"
            placeholder="votre@email.fr"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            autoComplete="email"
            style={{
              width:"100%", border:"1.5px solid #E2E8F0", borderRadius:10,
              padding:"12px 14px", fontSize:15, boxSizing:"border-box", outline:"none",
              fontFamily:"inherit"
            }}
          />
        </div>

        <div style={{ marginBottom:8 }}>
          <label style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 }}>
            Mot de passe
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            autoComplete="current-password"
            style={{
              width:"100%", border:"1.5px solid #E2E8F0", borderRadius:10,
              padding:"12px 14px", fontSize:15, boxSizing:"border-box", outline:"none",
              fontFamily:"inherit"
            }}
          />
        </div>

        {/* Astuce première connexion managers */}
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"8px 12px", marginBottom:16, fontSize:12, color:"#92400E" }}>
          💡 <b>Première connexion ?</b> Entrez votre email et laissez le mot de passe vide — vous serez invité à en créer un.
        </div>

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width:"100%", background:"#E63946", border:"none",
            color:"#fff", padding:13, borderRadius:10,
            fontWeight:900, fontSize:15, cursor:"pointer",
            boxShadow:"0 4px 16px rgba(230,57,70,0.4)",
            fontFamily:"inherit", opacity: loading ? 0.8 : 1
          }}
        >
          {loading ? "Connexion…" : "Se connecter →"}
        </button>

        {/* Accès démo agents */}
        <div style={{ marginTop:20, padding:"12px 14px", background:"#F8FAFC", borderRadius:10, fontSize:12, color:"#64748B", lineHeight:2, border:"1px solid #E2E8F0" }}>
          <div style={{ fontWeight:800, color:"#334155", marginBottom:4 }}>Accès de démonstration :</div>
          <div>🟠 <b>Agent senior :</b> s.martin@orpi-amiens.fr / martin2024</div>
          <div>🟢 <b>Agent junior :</b> t.dupont@orpi-amiens.fr / dupont2024</div>
        </div>

        <div style={{ marginTop:14, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <span style={{ fontSize:13 }}>💾</span>
          <span style={{ fontSize:12, color:"#10B981", fontWeight:700 }}>Données sauvegardées automatiquement</span>
        </div>
      </div>
    </div>
  );
}
