import { useState } from 'react';

const C = {
  primary: '#692102',
  primaryDark: '#4A1801',
  gold: '#A59568',
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: '#6B7280',
  lightGray: '#F3F2EF',
  mediumGray: '#E5E3DE',
  darkGray: '#374151',
};

const fontLink = document.createElement('link');
fontLink.href =
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

function computeProjections(data) {
  const initial = Number(data.montantInvestissement || 100000);
  const fee = Number(data.fraisSouscription || 3);
  const net = initial - (initial * fee) / 100;
  const rP = Number(data.tauxPessimiste || 3) / 100;
  const rR = Number(data.tauxRealiste || 6) / 100;
  const rO = Number(data.tauxOptimiste || 9) / 100;
  const years = [0, 3, 5, 8, 10, 15];
  return years.map((y) => ({
    year: y,
    pessimiste: Math.round(net * Math.pow(1 + rP, y)),
    realiste: Math.round(net * Math.pow(1 + rR, y)),
    optimiste: Math.round(net * Math.pow(1 + rO, y)),
  }));
}

function fmt(n) {
  return Number(n).toLocaleString('fr-CH');
}

// ────────────────────── SLIDE COMPONENTS ──────────────────────

const slideBase = {
  width: '100%',
  aspectRatio: '16/9',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: "'Montserrat', sans-serif",
  background: C.white,
};

const footer = (name) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 36,
      background: C.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
    }}
  >
    <span
      style={{
        color: C.white,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      A L'ATTENTION DE {name}
    </span>
    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
      WALLSWISS
    </span>
  </div>
);

const accentBar = () => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: 5,
      height: '100%',
      background: C.primary,
    }}
  />
);

const logoCorner = () => (
  <div
    style={{
      position: 'absolute',
      top: 20,
      right: 28,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        background: C.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 22h20L12 2z" fill={C.white} opacity="0.9" />
      </svg>
    </div>
  </div>
);

// Slide 1 — Cover
function SlideCover({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  return (
    <div
      style={{
        ...slideBase,
        background: `linear-gradient(155deg, ${C.primary} 0%, ${C.primaryDark} 55%, #2D0E01 100%)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '45%',
          height: '100%',
          background: 'rgba(255,255,255,0.03)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '8%',
          transform: 'translateY(-50%)',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            color: C.white,
            fontSize: 'clamp(28px, 4vw, 52px)',
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          Rapport <em style={{ color: C.gold }}>Financier</em>
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 'clamp(12px, 1.4vw, 16px)',
            marginTop: 12,
            fontWeight: 400,
          }}
        >
          Présentation de votre
          <br />
          analyse patrimoniale
        </div>
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              color: C.white,
              fontSize: 'clamp(12px, 1.2vw, 15px)',
              fontWeight: 600,
            }}
          >
            {data.conseiller || 'Louis Borne'}
          </div>
          <div
            style={{
              color: C.gold,
              fontSize: 'clamp(10px, 1vw, 12px)',
              fontWeight: 500,
            }}
          >
            {data.titreConseiller || 'Planificatrice financière'}
          </div>
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: 'clamp(9px, 0.8vw, 11px)',
            marginTop: 20,
            letterSpacing: '0.06em',
          }}
        >
          Votre voyage financier commence ici
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '48%',
          height: '100%',
          background: 'rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          opacity="0.12"
        >
          <rect
            x="10"
            y="10"
            width="100"
            height="100"
            stroke={C.white}
            strokeWidth="1"
          />
          <rect
            x="25"
            y="25"
            width="70"
            height="70"
            stroke={C.white}
            strokeWidth="1"
          />
          <line
            x1="10"
            y1="10"
            x2="25"
            y2="25"
            stroke={C.white}
            strokeWidth="0.5"
          />
          <line
            x1="110"
            y1="10"
            x2="95"
            y2="25"
            stroke={C.white}
            strokeWidth="0.5"
          />
          <line
            x1="10"
            y1="110"
            x2="25"
            y2="95"
            stroke={C.white}
            strokeWidth="0.5"
          />
          <line
            x1="110"
            y1="110"
            x2="95"
            y2="95"
            stroke={C.white}
            strokeWidth="0.5"
          />
        </svg>
      </div>
      <div style={{ position: 'absolute', top: 24, right: 28 }}>
        <div
          style={{
            width: 40,
            height: 40,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 22h20L12 2z" fill={C.gold} opacity="0.9" />
          </svg>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 2 — Table des matières
function SlideTOC({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  const items = [
    'Qui sommes-nous ?',
    'Votre situation et vos objectifs',
    'Pourquoi Swissquote est une banque fiable',
    'Avantages WallSwiss BY Swissquote',
    'Solution — Compte Titre',
    'Fonds NS (CH) Swiss Excellence DPM CHF',
    'Projections financières',
    'Avantages tarifaires WS Premium',
    'Comparatif bancaire',
    'Votre application de suivi SwissQuote',
    'Synthèse & Contact',
  ];
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div
        style={{
          padding: '48px 48px 56px 56px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            color: C.gold,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          TABLE DES MATIÈRES
        </div>
        <div
          style={{
            width: 60,
            height: 2,
            background: C.primary,
            marginBottom: 28,
          }}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 500,
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '7px 0',
                borderBottom: `1px solid ${C.lightGray}`,
              }}
            >
              <span
                style={{
                  color: C.primary,
                  fontSize: 13,
                  fontWeight: 700,
                  width: 24,
                  textAlign: 'right',
                }}
              >
                {i + 1}.
              </span>
              <span
                style={{ color: C.darkGray, fontSize: 12, fontWeight: 500 }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 3 — Qui sommes-nous
function SlideAbout({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  const stats = [
    { val: '+2000', label: 'CLIENTS' },
    { val: 'ACCRÉDITÉ', label: 'FINMA' },
    { val: '+10M CHF', label: 'SOUS GESTION' },
    { val: '+20', label: 'COLLABORATEURS' },
    { val: '+50', label: 'PARTENAIRES' },
    { val: '100%', label: 'SOLUTIONS PRAGMATIQUES' },
  ];
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div
        style={{
          padding: '48px 48px 56px 56px',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28,
            fontWeight: 700,
            color: C.primary,
            marginBottom: 4,
          }}
        >
          Qui <em>sommes-nous ?</em>
        </div>
        <div
          style={{
            color: C.gold,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          EN QUELQUES CHIFFRES
        </div>
        <div style={{ color: C.gray, fontSize: 13, marginBottom: 28 }}>
          Votre cabinet de planification financière à Genève.
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
            maxWidth: 520,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                background: C.primary,
                padding: '18px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: C.white, fontSize: 18, fontWeight: 800 }}>
                {s.val}
              </div>
              <div
                style={{
                  color: C.gold,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 4 — Situation personnelle
function SlideSituation({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div
        style={{
          padding: '48px 48px 56px 56px',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28,
            fontWeight: 700,
            color: C.primary,
            marginBottom: 28,
          }}
        >
          Résumé de <em>votre situation personnelle</em>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}
        >
          <div>
            <div
              style={{
                background: C.primary,
                color: C.white,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Votre situation
            </div>
            <div
              style={{
                border: `1px solid ${C.mediumGray}`,
                borderTop: 'none',
                padding: '16px 20px',
              }}
            >
              {[
                ['Âge', `${data.age} ans`],
                ['Situation', data.profession],
                ['Nationalité', data.nationalite],
                ['Statut', data.statut],
                ...(data.revenus
                  ? [['Revenus annuels', `CHF ${fmt(data.revenus)}.-`]]
                  : []),
              ].map(([k, v], i, arr) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '7px 0',
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${C.lightGray}` : 'none',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: C.gray }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div
              style={{
                background: C.primary,
                color: C.white,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Vos objectifs
            </div>
            <div
              style={{
                border: `1px solid ${C.mediumGray}`,
                borderTop: 'none',
                padding: '16px 20px',
              }}
            >
              {(data.objectifs || []).map((obj, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    padding: '6px 0',
                    borderBottom:
                      i < data.objectifs.length - 1
                        ? `1px solid ${C.lightGray}`
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      background: C.gold,
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, lineHeight: 1.5 }}>{obj}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 5 — Pourquoi Swissquote
function SlideSwissquote({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  const points = [
    "Swissquote est une banque suisse spécialisée dans l'investissement et les services financiers en ligne.",
    'Elle est réglementée en Suisse et supervisée par la FINMA, ce qui implique un cadre de contrôle strict.',
    "C'est un établissement reconnu, avec une structure solide et une présence bien établie sur le marché suisse.",
    "Les clients bénéficient d'une plateforme complète pour investir, tout en restant dans un environnement bancaire sécurisé.",
  ];
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div
        style={{
          padding: '48px 48px 56px 56px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 24,
            fontWeight: 700,
            color: C.primary,
            marginBottom: 4,
            textDecoration: 'underline',
            textDecorationColor: C.gold,
            textUnderlineOffset: 6,
          }}
        >
          Pourquoi Swissquote est une banque fiable
        </div>
        <div
          style={{
            width: '100%',
            height: 2,
            background: C.gold,
            margin: '20px 0 24px',
          }}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 14,
            maxWidth: 720,
          }}
        >
          {points.map((p, i) => (
            <div
              key={i}
              style={{
                background: C.lightGray,
                padding: '14px 20px',
                fontSize: 12.5,
                lineHeight: 1.7,
                color: C.darkGray,
                borderLeft: `3px solid ${C.gold}`,
              }}
            >
              {p}
            </div>
          ))}
          <div
            style={{
              background: C.lightGray,
              padding: '14px 20px',
              fontSize: 12.5,
              lineHeight: 1.7,
              borderLeft: `3px solid ${C.primary}`,
            }}
          >
            <span style={{ color: C.primary, fontWeight: 700 }}>
              En résumé, c'est une solution sérieuse, transparente et adaptée
              pour investir avec un acteur suisse de référence.
            </span>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 6 — Avantages WallSwiss BY Swissquote
function SlideAdvantages({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  const avantages = [
    {
      title: 'Sécurité & réglementation suisses',
      desc: "Banque suisse régulée par la FINMA, avec garantie des dépôts jusqu'à 100'000 CHF.",
    },
    {
      title: "Univers d'investissement le plus large",
      desc: 'Accès à plus de 3 millions de produits (actions, ETF, fonds, obligations, forex/CFD, crypto, etc.).',
    },
    {
      title: 'Heures étendues & Swiss DOTS',
      desc: 'Trading sur Swiss DOTS de 08:00 à 22:00, accès à SIX et aux marchés US/UE.',
    },
    { title: 'ETF compétitifs', desc: "Plus de 9'000 ETF disponibles." },
    {
      title: 'Tarification optimisée',
      desc: 'Tarifs négociés sur une sélection de valeurs clés pour des portefeuilles essentiels.',
    },
    {
      title: 'Crypto de niveau bancaire',
      desc: 'Achat/vente, staking, garde institutionnelle et échange crypto propriétaire (SQX).',
    },
    {
      title: 'Plateformes & outils',
      desc: 'Application multi-actifs, interface intuitive, centre de formation.',
    },
    {
      title: 'Support multilingue & équipe dédiée',
      desc: 'Assistance client dédiée, équipe institutionnelle dédiée.',
    },
  ];
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div
        style={{
          padding: '40px 48px 56px 48px',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 700,
            color: C.gold,
            marginBottom: 20,
            textDecoration: 'underline',
            textDecorationColor: C.gold,
            textUnderlineOffset: 6,
          }}
        >
          Avantages WallSwiss BY Swissquote pour l'investissement
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px 24px',
          }}
        >
          {avantages.map((a, i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  background: C.gold,
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.black,
                    marginBottom: 2,
                  }}
                >
                  {a.title}
                </div>
                <div style={{ fontSize: 10.5, color: C.gray, lineHeight: 1.5 }}>
                  {a.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 7 — Section divider
function SlideDivider({ data, number, title }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  return (
    <div
      style={{
        ...slideBase,
        background: `linear-gradient(155deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '48%',
          height: '100%',
          background: 'rgba(0,0,0,0.12)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '10%',
          transform: 'translateY(-50%)',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            color: C.white,
            fontSize: 'clamp(28px, 3.5vw, 46px)',
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {number}. Solution —<br />
          <em style={{ color: C.gold }}>{title}</em>
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: 12,
            marginTop: 16,
            letterSpacing: '0.06em',
          }}
        >
          Votre voyage financier commence ici
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 8 — La solution compte titre
function SlideCompteTitre({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  const bubbles = [
    'Épargne en cas de coup dur',
    'Financer un projet',
    "Disponibilité de l'épargne",
    'Complément de revenu pour la retraite',
    'Cadre fiscal avantageux',
    'Optimisation de la transmission',
  ];
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div
        style={{
          padding: '48px 48px 56px 56px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 700,
              color: C.primary,
              marginBottom: 20,
            }}
          >
            La solution <em>compte titre</em>
          </div>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.8,
              color: C.darkGray,
              margin: '0 0 12px',
            }}
          >
            Le compte-titres est une solution d'investissement flexible et
            performante, idéale pour{' '}
            <strong>faire fructifier votre capital en Suisse.</strong>
          </p>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.8,
              color: C.darkGray,
              margin: '0 0 12px',
            }}
          >
            Contrairement à d'autres solutions d'épargne, le compte-titres ne
            présente aucune contrainte de durée et permet d'accéder à un large
            choix d'actifs :{' '}
            <strong>
              actions, obligations, ETF, fonds d'investissement et produits
              dérivés.
            </strong>
          </p>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.8,
              color: C.darkGray,
              margin: 0,
            }}
          >
            En Suisse, il offre une fiscalité attractive, notamment en matière
            de plus-values mobilières et d'absence de prélèvements sociaux, tout
            en permettant <strong>une gestion libre ou déléguée.</strong>
          </p>
        </div>
        <div>
          <div
            style={{
              background: C.primary,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                color: C.white,
                fontSize: 15,
                fontWeight: 800,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              Couteau Suisse
              <br />
              de l'épargne
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                width: '100%',
              }}
            >
              {bubbles.map((b, i) => (
                <div
                  key={i}
                  style={{
                    background: C.gold,
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: C.white,
                    lineHeight: 1.4,
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 9 — NS (CH) FUNDS
function SlideFund({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  return (
    <div style={slideBase}>
      <div
        style={{
          padding: '36px 40px 56px',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            border: `2px solid ${C.gold}`,
            padding: '24px 28px',
            height: 'calc(100% - 36px)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>
              NS (CH) FUNDS — Swiss Excellence DPM CHF
            </div>
            <div style={{ fontSize: 11, color: C.gray }}>
              Fonds actions suisses — Synthèse institutionnelle
            </div>
          </div>
          <div
            style={{
              width: '100%',
              height: 1,
              background: C.gold,
              margin: '12px 0',
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 32px',
              fontSize: 11,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: C.gold,
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                Positionnement
              </div>
              {[
                'Fonds actions 100% Suisse',
                'Devise : CHF',
                'Benchmark : SLI Swiss Leader Index TR',
                'Objectif : Surperformance du marché suisse',
              ].map((t, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 6, marginBottom: 3 }}
                >
                  <span style={{ color: C.gold }}>—</span>
                  <span>{t}</span>
                </div>
              ))}
              <div
                style={{
                  fontWeight: 700,
                  color: C.gold,
                  marginTop: 10,
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                Performance
              </div>
              {[
                'Performance annualisée : 4,5%',
                'YTD 2025 : +8,40%',
                'Benchmark : +7,99%',
              ].map((t, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 6, marginBottom: 3 }}
                >
                  <span style={{ color: C.gold }}>—</span>
                  <span>{t}</span>
                </div>
              ))}
              <div
                style={{
                  fontWeight: 700,
                  color: C.gold,
                  marginTop: 10,
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                Structure de frais
              </div>
              {['Management fee : 1,50%', 'Performance fee : 10%'].map(
                (t, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', gap: 6, marginBottom: 3 }}
                  >
                    <span style={{ color: C.gold }}>—</span>
                    <span>{t}</span>
                  </div>
                )
              )}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: C.gold,
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                Profil de risque
              </div>
              {[
                'Volatilité annualisée : 13,2%',
                'Sharpe ratio : 0,26',
                'Beta : 0,99',
                'Corrélation indice : 0,99',
              ].map((t, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 6, marginBottom: 3 }}
                >
                  <span style={{ color: C.gold }}>—</span>
                  <span>{t}</span>
                </div>
              ))}
              <div
                style={{
                  fontWeight: 700,
                  color: C.gold,
                  marginTop: 10,
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                Principales positions
              </div>
              {[
                'Roche — 6,86%',
                'Novartis — 6,59%',
                'Nestlé — 5,89%',
                'UBS — 5,51%',
              ].map((t, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 6, marginBottom: 3 }}
                >
                  <span style={{ color: C.gold }}>—</span>
                  <span>{t}</span>
                </div>
              ))}
              <div
                style={{
                  fontWeight: 700,
                  color: C.gold,
                  marginTop: 10,
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                Lecture stratégique WallSwiss
              </div>
              {[
                'Exposition domestique CHF',
                'Qualité suisse défensive',
                'ESG intégré',
                "Complément idéal d'une allocation internationale USD",
              ].map((t, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 6, marginBottom: 3 }}
                >
                  <span style={{ color: C.primary, fontWeight: 700 }}>
                    &#10003;
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 10 — Projections
function SlideProjections({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  const rows = computeProjections(data);
  const montant = Number(data.montantInvestissement || 100000);
  const frais = Number(data.fraisSouscription || 3);
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div
        style={{
          padding: '48px 48px 56px 56px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 32,
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              fontWeight: 700,
              color: C.primary,
              marginBottom: 16,
            }}
          >
            Vos objectifs sur le <em>compte titre</em>
          </div>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.8,
              color: C.darkGray,
              margin: '0 0 12px',
            }}
          >
            Ici, nous vous conseillons d'optimiser votre trésorerie actuelle
            avec un compte titre chez <strong>SwissQuote</strong> sur la
            solution de placement avec un dépôt initial de{' '}
            <strong>CHF {fmt(montant)}.-</strong>
          </p>
          <p style={{ fontSize: 11, color: C.gray, margin: 0 }}>
            Nous appliquons des frais de souscription de {frais}% du montant
            investi soit {fmt((montant * frais) / 100)}.-
          </p>
          {/* Mini bar chart */}
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 6,
              height: 100,
            }}
          >
            {rows
              .filter((r) => r.year > 0)
              .map((r, i) => {
                const max = rows[rows.length - 1].optimiste;
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        height: 80,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: `${(r.pessimiste / max) * 80}px`,
                          background: C.mediumGray,
                        }}
                      />
                      <div
                        style={{
                          width: 8,
                          height: `${(r.realiste / max) * 80}px`,
                          background: C.gold,
                        }}
                      />
                      <div
                        style={{
                          width: 8,
                          height: `${(r.optimiste / max) * 80}px`,
                          background: C.primary,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 8, color: C.gray }}>
                      N+{r.year}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
        <div>
          <div
            style={{
              color: C.gold,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            PROJECTIONS FINANCIÈRES*
          </div>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}
          >
            <thead>
              <tr style={{ background: C.primary, color: C.white }}>
                <th
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontWeight: 600,
                  }}
                >
                  Années
                </th>
                <th
                  style={{
                    padding: '10px 14px',
                    textAlign: 'right',
                    fontWeight: 600,
                  }}
                >
                  Pessimiste {data.tauxPessimiste || 3}%
                </th>
                <th
                  style={{
                    padding: '10px 14px',
                    textAlign: 'right',
                    fontWeight: 600,
                  }}
                >
                  Réaliste {data.tauxRealiste || 6}%
                </th>
                <th
                  style={{
                    padding: '10px 14px',
                    textAlign: 'right',
                    fontWeight: 600,
                  }}
                >
                  Optimiste {data.tauxOptimiste || 9}%
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? C.lightGray : C.white }}
                >
                  <td
                    style={{
                      padding: '9px 14px',
                      fontWeight: 700,
                      color: C.primary,
                    }}
                  >
                    N+{r.year}
                  </td>
                  <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                    {fmt(r.pessimiste)}
                  </td>
                  <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                    {fmt(r.realiste)}
                  </td>
                  <td
                    style={{
                      padding: '9px 14px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: C.primary,
                    }}
                  >
                    {fmt(r.optimiste)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p
            style={{
              fontSize: 8,
              color: C.gray,
              marginTop: 8,
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            *L'illustration présentée ne constitue pas un indicateur fiable
            quant aux performances futures. Elle a seulement pour but
            d'illustrer les mécanismes de votre investissement.
          </p>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 11 — Avantages tarifaires
function SlideTarifs({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div
        style={{
          padding: '48px 48px 56px 48px',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 700,
            color: C.primary,
            marginBottom: 4,
            textDecoration: 'underline',
            textDecorationColor: C.gold,
            textUnderlineOffset: 6,
          }}
        >
          Avantages tarifaires WallSwiss — WS Premium
        </div>
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 28 }}>
          Conditions préférentielles "WS Premium" — présentation synthétique
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 640,
          }}
        >
          {[
            {
              label: 'Droits de garde',
              value: '0,10% de 0 à 1 M CHF',
              badge: 'max 200 CHF',
              sub: 'Puis 0,03% au-delà de 1 M (pricing sur-mesure possible > 1 M).',
            },
            {
              label: "Frais d'achat AMC",
              value: '0,25%',
              badge: 'min 50 CHF / transaction',
              sub: '',
            },
            {
              label: 'Taux de change',
              value: "0,40% jusqu'à 100 000 CHF",
              badge: '0,20% au-delà',
              sub: '',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                border: `1px solid ${C.mediumGray}`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: C.lightGray,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: C.darkGray }}
                >
                  {item.label}
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <span
                  style={{ fontSize: 16, fontWeight: 800, color: C.primary }}
                >
                  {item.value}
                </span>
                {item.badge && (
                  <span
                    style={{
                      marginLeft: 12,
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.primary,
                      border: `1px solid ${C.primary}`,
                      padding: '2px 8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {item.sub && (
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 4 }}>
                    {item.sub}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 9,
            color: C.gray,
            marginTop: 16,
            fontStyle: 'italic',
          }}
        >
          Tarification indicative à valider selon profil client, volume et
          configuration de portefeuille.
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 12 — Comparatif bancaire
function SlideComparatif({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  return (
    <div style={slideBase}>
      {logoCorner()}
      <div
        style={{
          padding: '48px 48px 56px 48px',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 700,
            color: C.primary,
            marginBottom: 4,
            textDecoration: 'underline',
            textDecorationColor: C.gold,
            textUnderlineOffset: 6,
          }}
        >
          Profil 2 — Patrimoine en croissance
        </div>
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 24 }}>
          Portefeuille 300 kCHF ; change annuel 60 kCHF ; achats d'AMC 20
          kCHF/an.
        </div>
        <table
          style={{
            width: '100%',
            maxWidth: 640,
            borderCollapse: 'collapse',
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  color: C.primary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${C.primary}`,
                }}
              >
                Banque
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  color: C.primary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${C.primary}`,
                }}
              >
                Garde (an)
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  color: C.primary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${C.primary}`,
                }}
              >
                Change (an)
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  color: C.primary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${C.primary}`,
                }}
              >
                AMC (an)
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  color: C.primary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${C.primary}`,
                }}
              >
                Total (an)
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                bank: 'WallSwiss / Swissquote',
                garde: 200,
                change: 240,
                amc: 50,
                total: 490,
              },
              {
                bank: 'Raiffeisen',
                garde: 750,
                change: 750,
                amc: 180,
                total: 1680,
              },
              { bank: 'UBS', garde: 1050, change: 1020, amc: 200, total: 2270 },
            ].map((r, i) => (
              <tr
                key={i}
                style={{
                  background: i === 0 ? 'rgba(105,33,2,0.04)' : 'transparent',
                }}
              >
                <td
                  style={{
                    padding: '12px 16px',
                    fontWeight: i === 0 ? 700 : 500,
                    color: i === 0 ? C.primary : C.black,
                    borderBottom: `1px solid ${C.lightGray}`,
                  }}
                >
                  {r.bank}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    color: C.primary,
                    fontWeight: 600,
                    borderBottom: `1px solid ${C.lightGray}`,
                  }}
                >
                  {r.garde}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    color: C.primary,
                    fontWeight: 600,
                    borderBottom: `1px solid ${C.lightGray}`,
                  }}
                >
                  {r.change}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    color: C.gold,
                    fontWeight: 600,
                    borderBottom: `1px solid ${C.lightGray}`,
                  }}
                >
                  {r.amc}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: 700,
                    color: i === 0 ? C.primary : C.black,
                    borderBottom: `1px solid ${C.lightGray}`,
                  }}
                >
                  {r.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            fontSize: 9,
            color: C.gray,
            marginTop: 16,
            fontStyle: 'italic',
          }}
        >
          Hypothèses : tarifs publics/partenaires ; à valider selon profil &
          package.
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 13 — Application SwissQuote
function SlideApp({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  return (
    <div style={slideBase}>
      {accentBar()}
      {logoCorner()}
      <div
        style={{
          padding: '48px 48px 56px 56px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 700,
              color: C.primary,
              marginBottom: 20,
            }}
          >
            Votre application de suivi <em>SwissQuote</em>
          </div>
          <div
            style={{
              color: C.gold,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            CENTRALISEZ L'ENSEMBLE DE VOS FINANCES EN UN SEUL ENDROIT
          </div>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.8,
              color: C.darkGray,
              margin: '0 0 12px',
            }}
          >
            Effectuez des opérations de trading, d'investissement et bancaires
            en <strong>toute sécurité</strong> et à des{' '}
            <strong>tarifs avantageux</strong>, grâce au principal acteur suisse
            de la banque en ligne.
          </p>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.8,
              color: C.darkGray,
              margin: 0,
            }}
          >
            Nos plateformes intuitives vous invitent à explorer un monde riche
            en opportunités. Et accédez à une <strong>vaste gamme</strong>{' '}
            d'informations et de programmes de formation.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '70%',
              aspectRatio: '9/16',
              background: C.darkGray,
              position: 'relative',
              border: `3px solid ${C.black}`,
              overflow: 'hidden',
              maxHeight: 280,
            }}
          >
            <div
              style={{
                background: C.primary,
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: C.white, fontSize: 9, fontWeight: 700 }}>
                Swissquote
              </span>
              <span style={{ color: C.gold, fontSize: 7 }}>Overview</span>
            </div>
            <div style={{ padding: 12 }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  padding: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 7, color: C.gold }}>Portefeuille</div>
                <div style={{ fontSize: 14, color: C.white, fontWeight: 800 }}>
                  CHF {fmt(data.montantInvestissement || 100000)}
                </div>
              </div>
              {[
                'Actions suisses  +3.2%',
                'ETF Global  +1.8%',
                'Crypto  +5.4%',
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 8,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <span>{item.split('  ')[0]}</span>
                  <span style={{ color: '#22C55E' }}>
                    {item.split('  ')[1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {footer(fullName)}
    </div>
  );
}

// Slide 14 — Contact
function SlideContact({ data }) {
  const fullName = `${data.prenom} ${(data.nom || '').toUpperCase()}`;
  return (
    <div
      style={{
        ...slideBase,
        background: `linear-gradient(155deg, ${C.primary} 0%, ${C.primaryDark} 60%, #2D0E01 100%)`,
      }}
    >
      <div
        style={{
          padding: '48px 56px 56px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.9,
              color: 'rgba(255,255,255,0.7)',
              margin: 0,
            }}
          >
            Gérer son patrimoine nécessite une approche personnalisée et
            stratégique. En optimisant sa fiscalité, en sécurisant son épargne
            et en faisant des choix d'investissement éclairés, il est possible
            de construire un patrimoine pérenne et adapté à ses projets de vie.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.white }}>
            {data.conseiller || 'Louis Borne'}
          </div>
          <div
            style={{
              color: C.gold,
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 20,
            }}
          >
            {data.titreConseiller || 'Conseillère en Gestion de Patrimoine'}
          </div>
          <div
            style={{
              width: 50,
              height: 2,
              background: C.gold,
              marginLeft: 'auto',
              marginBottom: 20,
            }}
          />
          <div
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 2,
            }}
          >
            {data.telephone || '+41.76.231.92.75'}
            <br />
            {data.email || 'l.borne@wallswiss.ch'}
            <br />
            Rue Kleberg 14, 1201 Genève
            <br />
            wallswiss.ch
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 44,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            color: 'rgba(255,255,255,0.15)',
            fontSize: 10,
            letterSpacing: '0.08em',
          }}
        >
          Votre partenaire en gestion de patrimoine
        </span>
      </div>
      {footer(fullName)}
    </div>
  );
}

// ────────────────────── PREVIEW MODAL ──────────────────────

function ReportPreview({ data, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    <SlideCover data={data} />,
    <SlideTOC data={data} />,
    <SlideAbout data={data} />,
    <SlideSituation data={data} />,
    <SlideSwissquote data={data} />,
    <SlideAdvantages data={data} />,
    <SlideDivider data={data} number={2} title="Compte Titre" />,
    <SlideCompteTitre data={data} />,
    <SlideFund data={data} />,
    <SlideProjections data={data} />,
    <SlideTarifs data={data} />,
    <SlideComparatif data={data} />,
    <SlideApp data={data} />,
    <SlideContact data={data} />,
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 200,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: C.black,
          padding: '10px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span
          style={{
            color: C.white,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}
        >
          APERCU — {data.prenom} {(data.nom || '').toUpperCase()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: C.gold, fontSize: 11 }}>
            {currentSlide + 1} / {slides.length}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: C.white,
              border: 'none',
              padding: '6px 16px',
              cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            FERMER
          </button>
        </div>
      </div>
      {/* Slide area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 60px',
          position: 'relative',
          minHeight: 0,
        }}
      >
        <button
          onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background:
              currentSlide === 0
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(255,255,255,0.08)',
            color: currentSlide === 0 ? 'rgba(255,255,255,0.2)' : C.white,
            border: 'none',
            width: 40,
            height: 40,
            cursor: currentSlide === 0 ? 'default' : 'pointer',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          &#8249;
        </button>
        <div
          style={{
            width: '100%',
            maxWidth: 960,
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          {slides[currentSlide]}
        </div>
        <button
          onClick={() =>
            setCurrentSlide((s) => Math.min(slides.length - 1, s + 1))
          }
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background:
              currentSlide === slides.length - 1
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(255,255,255,0.08)',
            color:
              currentSlide === slides.length - 1
                ? 'rgba(255,255,255,0.2)'
                : C.white,
            border: 'none',
            width: 40,
            height: 40,
            cursor: currentSlide === slides.length - 1 ? 'default' : 'pointer',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          &#8250;
        </button>
      </div>
      {/* Thumbnails */}
      <div
        style={{
          background: C.black,
          padding: '8px 24px',
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {slides.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrentSlide(i)}
            style={{
              width: 48,
              height: 28,
              background:
                i === currentSlide ? C.primary : 'rgba(255,255,255,0.06)',
              border:
                i === currentSlide
                  ? `1px solid ${C.gold}`
                  : '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: i === currentSlide ? C.white : 'rgba(255,255,255,0.35)',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────── FORM / MAIN APP ──────────────────────

const S = {
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: C.gray,
    marginBottom: 5,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: `1.5px solid ${C.mediumGray}`,
    fontSize: 13,
    fontFamily: "'Montserrat', sans-serif",
    color: C.black,
    background: C.white,
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: `1.5px solid ${C.mediumGray}`,
    fontSize: 13,
    fontFamily: "'Montserrat', sans-serif",
    color: C.black,
    background: C.white,
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  fg: { marginBottom: 16 },
  card: {
    background: C.white,
    padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    border: `1px solid ${C.mediumGray}`,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: C.primary,
    marginBottom: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  dot: { width: 8, height: 2, background: C.gold, flexShrink: 0 },
  btnP: {
    background: C.primary,
    color: C.white,
    border: 'none',
    padding: '12px 28px',
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  btnS: {
    background: C.white,
    color: C.primary,
    border: `2px solid ${C.primary}`,
    padding: '10px 24px',
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 13,
    fontWeight: 600,
  },
};

export default function WallSwissApp() {
  const [page, setPage] = useState('dashboard');
  const [step, setStep] = useState(0);
  const [reports, setReports] = useState([]);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    age: '',
    profession: '',
    nationalite: 'France',
    statut: 'Célibataire',
    revenus: '',
    objectifs: [],
    objectifCustom: '',
    montantInvestissement: '100000',
    fraisSouscription: '3',
    tauxPessimiste: '3',
    tauxRealiste: '6',
    tauxOptimiste: '9',
    conseiller: 'Louis Borne',
    titreConseiller: 'Planificatrice financière',
    telephone: '+41.76.231.92.75',
    email: 'l.borne@wallswiss.ch',
  });

  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleObj = (o) =>
    setForm((p) => ({
      ...p,
      objectifs: p.objectifs.includes(o)
        ? p.objectifs.filter((x) => x !== o)
        : [...p.objectifs, o],
    }));
  const addCustomObj = () => {
    if (form.objectifCustom.trim()) {
      setForm((p) => ({
        ...p,
        objectifs: [...p.objectifs, p.objectifCustom.trim()],
        objectifCustom: '',
      }));
    }
  };
  const handleSave = () => {
    setReports((p) => [...p, { ...form, id: Date.now() }]);
    setPreview(form);
    setPage('dashboard');
    setStep(0);
  };
  const resetForm = () =>
    setForm({
      nom: '',
      prenom: '',
      age: '',
      profession: '',
      nationalite: 'France',
      statut: 'Célibataire',
      revenus: '',
      objectifs: [],
      objectifCustom: '',
      montantInvestissement: '100000',
      fraisSouscription: '3',
      tauxPessimiste: '3',
      tauxRealiste: '6',
      tauxOptimiste: '9',
      conseiller: 'Louis Borne',
      titreConseiller: 'Planificatrice financière',
      telephone: '+41.76.231.92.75',
      email: 'l.borne@wallswiss.ch',
    });

  const defObj = [
    'Sécuriser son épargne',
    "Obtenir une réduction d'impôt (via l'optimisation fiscale Suisse)",
    'Améliorer la fiscalité des placements',
    "Mettre en place des sécurités (fonds d'urgence)",
    'Maintenir un standing de vie',
    'Préparer la retraite',
    'Optimiser la transmission de patrimoine',
    'Financer un projet immobilier',
  ];
  const stepLabels = [
    'Client',
    'Objectifs',
    'Investissement',
    'Conseiller',
    'Aperçu',
  ];

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}
          >
            <div style={S.card}>
              <div style={S.cardTitle}>
                <div style={S.dot} /> Identité
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div style={S.fg}>
                  <label style={S.label}>Prénom</label>
                  <input
                    style={S.input}
                    value={form.prenom}
                    onChange={(e) => u('prenom', e.target.value)}
                    placeholder="Philippe"
                  />
                </div>
                <div style={S.fg}>
                  <label style={S.label}>Nom</label>
                  <input
                    style={S.input}
                    value={form.nom}
                    onChange={(e) => u('nom', e.target.value)}
                    placeholder="EVEQUE"
                  />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div style={S.fg}>
                  <label style={S.label}>Âge</label>
                  <input
                    style={S.input}
                    type="number"
                    value={form.age}
                    onChange={(e) => u('age', e.target.value)}
                    placeholder="58"
                  />
                </div>
                <div style={S.fg}>
                  <label style={S.label}>Nationalité</label>
                  <input
                    style={S.input}
                    value={form.nationalite}
                    onChange={(e) => u('nationalite', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}>
                <div style={S.dot} /> Situation
              </div>
              <div style={S.fg}>
                <label style={S.label}>Profession</label>
                <input
                  style={S.input}
                  value={form.profession}
                  onChange={(e) => u('profession', e.target.value)}
                  placeholder="Caméraman"
                />
              </div>
              <div style={S.fg}>
                <label style={S.label}>Statut</label>
                <select
                  style={S.select}
                  value={form.statut}
                  onChange={(e) => u('statut', e.target.value)}
                >
                  {[
                    'Célibataire',
                    'Marié(e)',
                    'Divorcé(e)',
                    'Veuf/Veuve',
                    'Pacsé(e)',
                    'Union libre',
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div style={S.fg}>
                <label style={S.label}>Revenus annuels bruts (CHF)</label>
                <input
                  style={S.input}
                  type="number"
                  value={form.revenus}
                  onChange={(e) => u('revenus', e.target.value)}
                  placeholder="120000"
                />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div style={S.card}>
            <div style={S.cardTitle}>
              <div style={S.dot} /> Objectifs du client
            </div>
            <p
              style={{
                fontSize: 12,
                color: C.gray,
                marginBottom: 16,
                marginTop: 0,
              }}
            >
              Sélectionnez les objectifs correspondant à la situation de votre
              client.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
              }}
            >
              {defObj.map((obj) => {
                const active = form.objectifs.includes(obj);
                return (
                  <div
                    key={obj}
                    onClick={() => toggleObj(obj)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      border: `1.5px solid ${
                        active ? C.primary : C.mediumGray
                      }`,
                      background: active
                        ? 'rgba(105,33,2,0.04)'
                        : 'transparent',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: `2px solid ${
                          active ? C.primary : C.mediumGray
                        }`,
                        background: active ? C.primary : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {active && (
                        <span
                          style={{
                            color: C.white,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          &#10003;
                        </span>
                      )}
                    </div>
                    <span style={{ color: active ? C.primary : C.darkGray }}>
                      {obj}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              style={{ height: 1, background: C.mediumGray, margin: '20px 0' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                style={{ ...S.input, flex: 1 }}
                value={form.objectifCustom}
                onChange={(e) => u('objectifCustom', e.target.value)}
                placeholder="Ajouter un objectif personnalisé..."
                onKeyDown={(e) => e.key === 'Enter' && addCustomObj()}
              />
              <button
                style={{ ...S.btnS, padding: '8px 16px', whiteSpace: 'nowrap' }}
                onClick={addCustomObj}
              >
                + Ajouter
              </button>
            </div>
            {form.objectifs.filter((o) => !defObj.includes(o)).length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                {form.objectifs
                  .filter((o) => !defObj.includes(o))
                  .map((o, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 10px',
                        background: 'rgba(105,33,2,0.06)',
                        color: C.primary,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {o}{' '}
                      <span
                        style={{ cursor: 'pointer', opacity: 0.5 }}
                        onClick={() => toggleObj(o)}
                      >
                        x
                      </span>
                    </span>
                  ))}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}
          >
            <div style={S.card}>
              <div style={S.cardTitle}>
                <div style={S.dot} /> Paramètres d'investissement
              </div>
              <div style={S.fg}>
                <label style={S.label}>Montant initial (CHF)</label>
                <input
                  style={S.input}
                  type="number"
                  value={form.montantInvestissement}
                  onChange={(e) => u('montantInvestissement', e.target.value)}
                />
              </div>
              <div style={S.fg}>
                <label style={S.label}>Frais de souscription (%)</label>
                <input
                  style={S.input}
                  type="number"
                  step="0.5"
                  value={form.fraisSouscription}
                  onChange={(e) => u('fraisSouscription', e.target.value)}
                />
              </div>
              <div
                style={{ background: C.lightGray, padding: 14, marginTop: 8 }}
              >
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>
                  Montant net investi
                </div>
                <div
                  style={{ fontSize: 20, fontWeight: 700, color: C.primary }}
                >
                  CHF{' '}
                  {fmt(
                    (form.montantInvestissement || 0) -
                      ((form.montantInvestissement || 0) *
                        (form.fraisSouscription || 0)) /
                        100
                  )}
                  .-
                </div>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}>
                <div style={S.dot} /> Scénarios de rendement
              </div>
              <div style={S.fg}>
                <label style={S.label}>Taux pessimiste (%)</label>
                <input
                  style={S.input}
                  type="number"
                  step="0.5"
                  value={form.tauxPessimiste}
                  onChange={(e) => u('tauxPessimiste', e.target.value)}
                />
              </div>
              <div style={S.fg}>
                <label style={S.label}>Taux réaliste (%)</label>
                <input
                  style={S.input}
                  type="number"
                  step="0.5"
                  value={form.tauxRealiste}
                  onChange={(e) => u('tauxRealiste', e.target.value)}
                />
              </div>
              <div style={S.fg}>
                <label style={S.label}>Taux optimiste (%)</label>
                <input
                  style={S.input}
                  type="number"
                  step="0.5"
                  value={form.tauxOptimiste}
                  onChange={(e) => u('tauxOptimiste', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div style={{ ...S.card, maxWidth: 560 }}>
            <div style={S.cardTitle}>
              <div style={S.dot} /> Informations du conseiller
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div style={S.fg}>
                <label style={S.label}>Nom complet</label>
                <input
                  style={S.input}
                  value={form.conseiller}
                  onChange={(e) => u('conseiller', e.target.value)}
                />
              </div>
              <div style={S.fg}>
                <label style={S.label}>Titre</label>
                <input
                  style={S.input}
                  value={form.titreConseiller}
                  onChange={(e) => u('titreConseiller', e.target.value)}
                />
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div style={S.fg}>
                <label style={S.label}>Téléphone</label>
                <input
                  style={S.input}
                  value={form.telephone}
                  onChange={(e) => u('telephone', e.target.value)}
                />
              </div>
              <div style={S.fg}>
                <label style={S.label}>Email</label>
                <input
                  style={S.input}
                  value={form.email}
                  onChange={(e) => u('email', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div style={S.card}>
            <div style={S.cardTitle}>
              <div style={S.dot} /> Résumé avant génération
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16,
              }}
            >
              <div style={{ background: C.lightGray, padding: 18 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.gray,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  Client
                </div>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: C.primary }}
                >
                  {form.prenom} {form.nom}
                </div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>
                  {form.age} ans — {form.profession}
                </div>
                <div style={{ fontSize: 12, color: C.gray }}>
                  {form.statut} — {form.nationalite}
                </div>
              </div>
              <div style={{ background: C.lightGray, padding: 18 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.gray,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  Investissement
                </div>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: C.primary }}
                >
                  CHF {fmt(form.montantInvestissement)}.-
                </div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>
                  Frais: {form.fraisSouscription}%
                </div>
                <div style={{ fontSize: 12, color: C.gray }}>
                  {form.tauxPessimiste}% / {form.tauxRealiste}% /{' '}
                  {form.tauxOptimiste}%
                </div>
              </div>
              <div style={{ background: C.lightGray, padding: 18 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.gray,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  Objectifs
                </div>
                <div style={{ fontSize: 12, color: C.darkGray }}>
                  {form.objectifs.length} objectif
                  {form.objectifs.length > 1 ? 's' : ''}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.gray,
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {form.objectifs.slice(0, 3).join(' / ')}
                  {form.objectifs.length > 3 ? ' ...' : ''}
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 14,
                marginTop: 28,
              }}
            >
              <button style={S.btnS} onClick={() => setPreview(form)}>
                Aperçu du rapport
              </button>
              <button style={S.btnP} onClick={handleSave}>
                Générer et sauvegarder
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: C.lightGray,
        minHeight: '100vh',
        color: C.black,
      }}
    >
      <style>{`
        input:focus, select:focus { border-color: ${C.primary} !important; }
        ::placeholder { color: #B0ADA6; }
        button:hover { opacity: 0.9; }
        ::-webkit-scrollbar { width: 5px; height: 5px; } ::-webkit-scrollbar-thumb { background: ${C.mediumGray}; }
      `}</style>

      <header
        style={{
          background: C.primary,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 22h20L12 2z" fill={C.gold} />
              </svg>
            </div>
            <div>
              <div
                style={{
                  color: C.white,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                }}
              >
                WALLSWISS
              </div>
              <div
                style={{
                  color: C.gold,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Rapport Generator
              </div>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 2 }}>
            {[
              ['dashboard', 'Tableau de bord'],
              ['create', 'Créer un rapport'],
            ].map(([p, l]) => (
              <button
                key={p}
                onClick={() => {
                  setPage(p);
                  if (p === 'create') setStep(0);
                }}
                style={{
                  background:
                    page === p ? 'rgba(255,255,255,0.14)' : 'transparent',
                  color: page === p ? C.white : 'rgba(255,255,255,0.55)',
                  border: 'none',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 12,
                  fontWeight: page === p ? 600 : 500,
                  letterSpacing: '0.02em',
                }}
              >
                {l}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px' }}>
        {page === 'dashboard' &&
          (reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px' }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                style={{ marginBottom: 16, opacity: 0.2 }}
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  stroke={C.primary}
                  strokeWidth="1.5"
                />
                <line
                  x1="7"
                  y1="8"
                  x2="17"
                  y2="8"
                  stroke={C.primary}
                  strokeWidth="1"
                />
                <line
                  x1="7"
                  y1="12"
                  x2="14"
                  y2="12"
                  stroke={C.primary}
                  strokeWidth="1"
                />
                <line
                  x1="7"
                  y1="16"
                  x2="11"
                  y2="16"
                  stroke={C.primary}
                  strokeWidth="1"
                />
              </svg>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 24,
                  color: C.primary,
                  marginBottom: 8,
                }}
              >
                Aucun rapport créé
              </div>
              <p
                style={{
                  color: C.gray,
                  fontSize: 13,
                  marginBottom: 24,
                  maxWidth: 380,
                  margin: '0 auto 24px',
                }}
              >
                Commencez par créer votre premier rapport financier
                personnalisé.
              </p>
              <button
                style={S.btnP}
                onClick={() => {
                  setPage('create');
                  resetForm();
                }}
              >
                + Créer un rapport
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 28,
                      fontWeight: 700,
                      color: C.primary,
                      margin: 0,
                    }}
                  >
                    Mes rapports
                  </h2>
                  <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>
                    {reports.length} rapport{reports.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  style={S.btnP}
                  onClick={() => {
                    setPage('create');
                    resetForm();
                  }}
                >
                  + Nouveau rapport
                </button>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16,
                }}
              >
                {reports.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      ...S.card,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onClick={() => setPreview(r)}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: C.primary,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 10,
                        color: C.gold,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: 10,
                        marginTop: 4,
                      }}
                    >
                      Rapport Client
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: C.primary,
                        marginBottom: 4,
                      }}
                    >
                      {r.prenom} {(r.nom || '').toUpperCase()}
                    </div>
                    <div
                      style={{ fontSize: 12, color: C.gray, marginBottom: 14 }}
                    >
                      {r.profession} — {r.age} ans
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 12,
                        borderTop: `1px solid ${C.lightGray}`,
                      }}
                    >
                      <span style={{ fontSize: 11, color: C.gray }}>
                        CHF {fmt(r.montantInvestissement || 100000)}.-
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: C.primary,
                          fontWeight: 600,
                        }}
                      >
                        VOIR &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {page === 'create' && (
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 700,
                color: C.primary,
                margin: '0 0 4px',
              }}
            >
              Nouveau rapport
            </h2>
            <p style={{ color: C.gray, fontSize: 13, marginBottom: 24 }}>
              Remplissez les informations pour générer un rapport personnalisé.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 0,
                marginBottom: 28,
                background: C.white,
                border: `1px solid ${C.mediumGray}`,
                padding: 4,
              }}
            >
              {stepLabels.map((l, i) => (
                <div
                  key={i}
                  onClick={() => setStep(i)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px 6px',
                    fontSize: 11,
                    fontWeight: step === i ? 700 : 500,
                    color: step === i ? C.white : step > i ? C.primary : C.gray,
                    background: step === i ? C.primary : 'transparent',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    transition: 'all 0.2s',
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
            {renderStep()}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 24,
              }}
            >
              <button
                style={{
                  ...S.btnS,
                  opacity: step === 0 ? 0.35 : 1,
                  pointerEvents: step === 0 ? 'none' : 'auto',
                }}
                onClick={() => setStep((s) => s - 1)}
              >
                &larr; Précédent
              </button>
              {step < 4 && (
                <button style={S.btnP} onClick={() => setStep((s) => s + 1)}>
                  Suivant &rarr;
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {preview && (
        <ReportPreview data={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
