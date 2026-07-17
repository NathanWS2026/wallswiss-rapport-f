// ════════════════════════════════════════════════════════════════
//  AdminAgents.jsx — Panneau admin : valider les comptes, définir le
//  rôle (agent / manager) et rattacher un agent à un manager.
//  Reçoit C (couleurs) et S (styles) en props → rendu identique à l'app.
// ════════════════════════════════════════════════════════════════
import React from "react";

export default function AdminAgents({
  agents,
  adminEmail,
  onApprove,
  onSuspend,
  onSetRole,
  onSetManager,
  C,
  S,
}) {
  const list = (agents || []).filter((a) => a.email !== adminEmail);
  const managers = list.filter((a) => a.role === "manager");
  const pendingCount = list.filter((a) => a.status === "pending").length;

  // En attente d'abord, puis du plus récent au plus ancien
  const sorted = [...list].sort((a, b) => {
    const ap = a.status === "pending" ? 0 : 1;
    const bp = b.status === "pending" ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const badge = (status) => (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 999,
        background: status === "approved" ? "rgba(52,168,83,.12)" : "rgba(251,188,5,.16)",
        color: status === "approved" ? "#188038" : "#9A6700",
      }}
    >
      {status === "approved" ? "Validé" : "En attente"}
    </span>
  );

  return (
    <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: C.accent, margin: 0 }}>
          Gestion des conseillers
        </h2>
        <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>
          {pendingCount > 0
            ? `${pendingCount} compte(s) en attente de validation.`
            : "Aucun compte en attente."}
        </p>
      </div>

      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.cardSoft, textAlign: "left" }}>
              <th style={{ padding: "14px 16px", color: C.muted, fontWeight: 600 }}>Conseiller</th>
              <th style={{ padding: "14px 16px", color: C.muted, fontWeight: 600 }}>Rôle</th>
              <th style={{ padding: "14px 16px", color: C.muted, fontWeight: 600 }}>Manager de rattachement</th>
              <th style={{ padding: "14px 16px", color: C.muted, fontWeight: 600 }}>Statut</th>
              <th style={{ padding: "14px 16px", color: C.muted, fontWeight: 600, textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr key={a.id} style={{ borderTop: `1px solid ${C.line}` }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: C.text }}>{a.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <select
                    value={a.role || "agent"}
                    onChange={(e) => onSetRole(a.id, e.target.value)}
                    style={{ ...S.select, padding: "7px 10px", width: "auto" }}
                  >
                    <option value="agent">Agent</option>
                    <option value="manager">Manager</option>
                  </select>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {a.role === "manager" ? (
                    <span style={{ color: C.dim, fontSize: 12 }}>— (est manager)</span>
                  ) : (
                    <select
                      value={a.managerId || ""}
                      onChange={(e) => onSetManager(a.id, e.target.value)}
                      style={{ ...S.select, padding: "7px 10px", width: "auto" }}
                    >
                      <option value="">Aucun</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.email}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>{badge(a.status)}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  {a.status === "pending" ? (
                    <button onClick={() => onApprove(a.id)} style={{ ...S.btnP, padding: "8px 18px", fontSize: 12 }}>
                      Valider
                    </button>
                  ) : (
                    <button onClick={() => onSuspend(a.id)} style={{ ...S.btnS, padding: "8px 18px", fontSize: 12 }}>
                      Suspendre
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: "center", color: C.gray }}>
                  Aucun conseiller inscrit pour l'instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}