/* Génère public/academy/library.json à partir des fichiers réellement présents.
   Lancé automatiquement au build (voir package.json > scripts > build).
   => Il suffit de déposer un fichier dans public/academy/ : il apparaît dans l'app. */
import fs from 'fs';
import path from 'path';

try {
  const DIR = path.resolve(process.cwd(), 'public/academy');
  if (!fs.existsSync(DIR)) { console.warn('[academy] dossier introuvable, étape ignorée'); process.exit(0); }

  const files = fs.readdirSync(DIR).filter(f => {
    if (f.startsWith('.')) return false;
    if (f.toLowerCase() === 'library.json') return false;
    try { return fs.statSync(path.join(DIR, f)).isFile(); } catch { return false; }
  });
  files.sort((a, b) => a.localeCompare(b, 'fr'));

  const CATS = [
    { id:'entretien',    label:'Entretien, conseil & présentation', emoji:'🎯' },
    { id:'prospection',  label:'Prospection & RDV',                 emoji:'📞' },
    { id:'objections',   label:'Objections',                        emoji:'🛡️' },
    { id:'calculs',      label:'Calculs & outils',                  emoji:'🧮' },
    { id:'iaf',          label:'Cours IAF & examens',               emoji:'🎓' },
    { id:'succession',   label:'Succession & donation',             emoji:'📜' },
    { id:'prevoyance',   label:'Prévoyance (AVS / LPP / 2e pilier)', emoji:'🇨🇭' },
    { id:'per',          label:'PER, retraite & assurance vie',     emoji:'🏦' },
    { id:'frontalier',   label:'Frontaliers, CMU & santé',          emoji:'🛂' },
    { id:'invest',       label:'Investissement',                    emoji:'📊' },
    { id:'productivite', label:'Productivité',                      emoji:'🚀' },
    { id:'clients',      label:'Documents clients & administratif', emoji:'🗂️' },
    { id:'culture',      label:'Culture générale & fiscalité',      emoji:'📚' },
    { id:'autres',       label:'Autres documents',                  emoji:'📁' },
  ];

  const noAcc = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

  function categorize(name) {
    const n = noAcc(name.toLowerCase());
    if (/succession|pacte-?success|donation|conference-suisse-impots|cas-pratique/.test(n)) return 'succession';
    if (/objection|coldcall|cold ?call/.test(n)) return 'objections';
    if (/systeme.*retraite|schema.*systeme|retraite suisse/.test(n)) return 'prevoyance';
    if (/\biaf\b|moyens-auxiliaires|directives-iaf|bases-objectifs|planification-liquidites|journee-intro|checklist-donnees|slides-planification/.test(n)) return 'iaf';
    if (/examen|qcm/.test(n)) return 'iaf';
    if (/calcul|formules|nominale-reelle|hp10b2|recueil|bases-calcul/.test(n)) return 'calculs';
    if (/frontalier|helsana|\bcmu\b|lamal|urssaf|droit ?option|droit d.?option|depart suisse|k14|\blsv\b/.test(n)) return 'frontalier';
    if (/factsheet|investissement|\bisr\b/.test(n)) return 'invest';
    if (/productivite/.test(n)) return 'productivite';
    if (/prospection|argumentaire ?call|5 outils|rendez-?vous/.test(n)) return 'prospection';
    if (/\bper\b|swisslife|slperin|pilotage|transfert.*per|transfert entrant|epargne swisslife|assurance ?vie|souscription|essentiel-produit|plaquette-swisslife|check-?list-transferts|demande.?de.?transfert/.test(n)) return 'per';
    if (/\blpp\b|rentes 1er|1er et 2|2eme pilier|assurances de personnes|assurances sociales|\bavs\b/.test(n)) return 'prevoyance';
    if (/presentation wallswiss|fondamentaux|plan de conseil|accueil client/.test(n)) return 'entretien';
    if (/client|courrier type|formulaire|bareme|commission/.test(n)) return 'clients';
    if (/lcb-?ft|ordonnance|deductions|allocations familiales|impots|fiscal/.test(n)) return 'culture';
    return 'autres';
  }

  const TAGS = /\b(academy|info|outil|client|exercices?)\b\s*-?\s*/gi;
  function titleOf(name) {
    let t = name.replace(/\.[a-z0-9]+$/i, '');
    t = t.replace(/\s*\(\d+\)\s*$/, '').replace(/\s*\[\d+\]\s*$/, '');
    t = t.replace(/^\d{3,5}-/, '');
    t = t.replace(/^\d{1,2}\s*[-.]\s*/, '');
    t = t.replace(TAGS, ' ');
    t = t.replace(/[-_]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    t = t.replace(/^[-\s]+/, '').replace(/[-\s]+$/, '').trim();
    if (t) t = t.charAt(0).toUpperCase() + t.slice(1);
    return t || name.replace(/\.[a-z0-9]+$/i, '');
  }

  const seen = new Set();
  function slugOf(name) {
    let s = noAcc(name.replace(/\.[a-z0-9]+$/i, '').toLowerCase())
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 54) || 'doc';
    let base = s, i = 2;
    while (seen.has(s)) s = base + '-' + (i++);
    seen.add(s);
    return s;
  }

  const TYPE_MAP = { jpg:'image', jpeg:'image', png:'image', gif:'image', webp:'image' };
  const typeOf = (name) => { const e = (name.split('.').pop() || '').toLowerCase(); return TYPE_MAP[e] || e; };

  const docs = files.map(f => ({ id: slugOf(f), cat: categorize(f), type: typeOf(f), title: titleOf(f), desc: '', file: f }));
  const used = new Set(docs.map(d => d.cat));
  const cats = CATS.filter(c => used.has(c.id));

  const out = { generatedAt: 'build', count: docs.length, cats, docs };
  fs.writeFileSync(path.join(DIR, 'library.json'), JSON.stringify(out, null, 2));
  console.log('[academy] library.json généré :', docs.length, 'documents,', cats.length, 'catégories');
} catch (e) {
  console.warn('[academy] génération du manifeste ignorée :', (e && e.message) || e);
}
process.exit(0);
