/* token-generator.js — Infinity Research Token Generator
   Procedurally generates realistic-looking interdisciplinary academic papers
   by mixing terminology from multiple scientific and mathematical domains. */

const TokenGenerator = (() => {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickN(arr, n) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }
  function rand(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
  function randF(lo, hi, dp) {
    dp = dp === undefined ? 1 : dp;
    return parseFloat((Math.random() * (hi - lo) + lo).toFixed(dp));
  }

  // ── Domain term banks ──────────────────────────────────────────────────────
  const DOMAINS = {
    quantum: {
      label: 'quantum computing',
      terms: [
        'quantum circuit depth', 'quantum volume', 'variational ansatz', 'surface codes',
        'topological qubit', 'Gaussian quantum computing', 'quantum error correction',
        'quantum entanglement', 'quantum annealing', 'quantum coherence time', 'decoherence',
        'Hamiltonian simulation', 'quantum key distribution', 'quantum supremacy',
        'qubit coherence time', 'superposition state', 'Bloch sphere trajectory',
        'quantum gate fidelity', 'paramagnetic resonance', 'fault-tolerant quantum gate',
        'homomorphic ciphertext', 'topological surface state',
      ],
      keywords: [
        'quantum circuit depth', 'quantum volume', 'topological qubit', 'decoherence',
        'variational ansatz', 'quantum coherence time', 'quantum gate fidelity',
      ],
    },
    materials: {
      label: 'materials science',
      terms: [
        'surface adsorption energy', 'Miller index plane', 'Bragg diffraction peak',
        'work function shift', 'phonon dispersion curve', 'crystal lattice parameter',
        'dislocation density', 'grain boundary energy', 'vacancy formation energy',
        'stacking fault energy', 'surface reconstruction pattern', 'work-hardening exponent',
        'fracture toughness', 'elastic modulus tensor', 'van der Waals heterostructure',
        'superlattice period', 'nanocomposite matrix', 'powder diffraction pattern',
        'structure factor amplitude', 'sp² hybridisation orbital', 'Stone–Wales defect',
        'enthalpy of formation', 'graphitic domain', 'intermetallic phase',
        'reciprocal lattice vector', 'unit cell volume',
      ],
      keywords: [
        'Miller index plane', 'Bragg diffraction peak', 'dislocation density',
        'fracture toughness', 'elastic modulus tensor', 'Stone–Wales defect',
        'grain boundary energy', 'sp² hybridisation orbital',
      ],
    },
    crypto: {
      label: 'cryptography',
      terms: [
        'commitment scheme', 'elliptic curve group', 'Merkle tree root', 'SHA-256 hash digest',
        'collision-resistant function', 'digital signature scheme', 'zero-knowledge proof',
        'trapdoor permutation', 'Chinese remainder theorem', 'information-theoretically secure',
        'lattice basis reduction', 'modular arithmetic', 'discrete logarithm',
        'elliptic-curve scalar multiplication', 'p-adic norm', 'zero-knowledge succinct argument',
        'semantic security', 'homomorphic encryption', 'post-quantum cryptography',
        'ring learning with errors', 'Byzantine fault tolerance',
      ],
      keywords: [
        'commitment scheme', 'collision-resistant', 'digital signature scheme',
        'Merkle tree root', 'elliptic-curve scalar multiplication', 'discrete logarithm',
        'lattice basis reduction',
      ],
    },
    nano: {
      label: 'nanotechnology',
      terms: [
        'quantum dot photoluminescence', 'carbon nanotube chirality vector',
        'nanoparticle size distribution', 'monolayer coverage', 'core-shell morphology',
        'single-walled carbon nanotube', 'graphene nanoribbon', 'metallic nanoparticle',
        'nanopore translocation signal', 'colloidal self-assembly', 'plasmonic nanostructure',
        'two-dimensional material', 'self-assembly driving force', 'fullerene cage',
        'quantum confinement energy', 'fluorescence resonance energy transfer',
      ],
      keywords: [
        'core-shell morphology', 'nanoparticle size distribution', 'monolayer coverage',
        'van der Waals heterostructure', 'nanopore translocation signal',
        'self-assembly driving force', 'fluorescence resonance energy transfer',
      ],
    },
    astro: {
      label: 'astrophysics',
      terms: [
        'neutron star equation of state', 'Schwarzschild radius', 'pulsar timing residual',
        'gravitational wave strain', 'stellar evolution model', 'planetary nebula shell',
        'main-sequence lifetime', 'supernova progenitor mass', 'dark matter halo density profile',
        'white dwarf cooling track', 'stellar opacity coefficient', 'accretion disc luminosity',
        'asymptotic giant branch', 'magnetar spin-down rate', 'neutron star merger',
        'r-process nucleosynthesis yield', 'cosmic microwave background anisotropy',
        'thermonuclear astrophysics', 'electron-degenerate matter',
      ],
      keywords: [
        'neutron star equation of state', 'gravitational wave strain', 'pulsar timing residual',
        'Schwarzschild radius', 'white dwarf cooling track', 'supernova progenitor mass',
        'asymptotic giant branch',
      ],
    },
    fluid: {
      label: 'fluid dynamics',
      terms: [
        'turbulent boundary layer thickness', 'wake deficit', 'cavitation threshold pressure',
        'vortex shedding frequency', 'detonation wave speed', 'Reynolds number',
        'Mach number regime', 'Kolmogorov length scale', 'turbulent kinetic energy',
        'soot formation pathway', 'flame temperature gradient', 'NOₓ emission index',
        'laminar burning velocity', 'combustion instability mode', 'lift-to-drag ratio',
        'ion acoustic instability', 'Carnot efficiency limit', 'thermal protection ablation rate',
      ],
      keywords: [
        'turbulent boundary layer thickness', 'wake deficit', 'cavitation threshold pressure',
        'vortex shedding frequency', 'detonation wave speed', 'NOₓ emission index',
        'laminar burning velocity', 'combustion instability mode',
      ],
    },
    thermo: {
      label: 'thermodynamics',
      terms: [
        'heat capacity anomaly', 'thermoelectric figure of merit', 'Faradaic efficiency',
        'entropy production rate', 'exergy destruction', 'isentropic compression',
        'free energy landscape', 'Gibbs free energy landscape', 'Seebeck coefficient',
        'reaction enthalpy', 'phase diagram boundary', 'Carnot efficiency limit',
        'ignition delay time', 'chemical kinetics mechanism', 'thermal conductivity tensor',
        'Lawson criterion value',
      ],
      keywords: [
        'heat capacity anomaly', 'thermoelectric figure of merit', 'Faradaic efficiency',
        'entropy production rate', 'isentropic compression', 'Seebeck coefficient',
        'phase diagram boundary',
      ],
    },
    numberTheory: {
      label: 'number theory',
      terms: [
        'Riemann zeta function', 'quadratic residue', 'Chinese remainder theorem',
        'prime factorisation', 'Dirichlet L-function', 'elliptic curve point',
        'modular arithmetic', 'Euler totient function', 'Gaussian prime',
        'algebraic number field', 'Riemann hypothesis zero', 'p-adic valuation',
        'knot polynomial', 'spectral graph eigenvalue', 'Shannon entropy rate',
        'rate-distortion function', 'topological invariant', 'Betti number',
        'homotopy group', 'Banach fixed-point', 'symplectic structure',
      ],
      keywords: [
        'Riemann zeta function', 'quadratic residue', 'Chinese remainder theorem',
        'prime factorisation', 'Dirichlet L-function', 'Betti number',
        'knot polynomial', 'spectral graph eigenvalue',
      ],
    },
    biochem: {
      label: 'biochemistry',
      terms: [
        'secondary metabolite profile', 'chitin cell-wall composition', 'ATP hydrolysis',
        'NADH oxidoreductase complex', 'receptor binding affinity', 'enzyme kinetics constant',
        'substrate channelling', 'cofactor binding affinity', 'IC50 inhibition constant',
        'post-translational modification', 'protein folding energy landscape',
        'reactive oxygen species', 'ribosomal translocation', 'codon usage bias',
        'CRISPR-Cas9 guide RNA', 'mRNA polyadenylation', 'chromatin remodelling complex',
        'molecular motor efficiency', 'protein–protein interaction network',
        'phosphoproteome dynamics', 'adenosine triphosphate hydrolysis',
        'patch-clamp electrophysiology', 'gene regulatory network motif',
        'epigenetic methylation mark', 'telomere length regulation',
        'secretome composition', 'phosphorylation cascade', 'ubiquitin-proteasome pathway',
        'cytoskeletal tension', 'single-molecule trajectory', 'neurotransmitter diffusion coefficient',
        'neural signal transduction pathway', 'mass spectrometry proteome',
      ],
      keywords: [
        'receptor binding affinity', 'ATP hydrolysis', 'IC50 inhibition constant',
        'reactive oxygen species', 'secondary metabolite profile',
        'telomere length regulation', 'secretome composition',
      ],
    },
    solidState: {
      label: 'solid state physics',
      terms: [
        'phonon scattering rate', 'band gap engineering', 'surface plasmon resonance wavelength',
        'Fermi level pinning', 'density of states at Fermi energy', 'effective mass tensor',
        'spin Hall effect', 'anomalous Hall conductivity', 'magnetoresistance ratio',
        'charge density wave order parameter', 'orbital magnetic moment',
        'thermoelectric power factor', 'electron cyclotron resonance', 'body-centred cubic structure',
        'face-centred cubic lattice', 'Mott insulator transition', 'carrier mobility tensor',
        'Fermi level alignment', 'Peierls distortion', 'piezoelectric coefficient',
        'topological surface state', 'plasma oscillation frequency',
      ],
      keywords: [
        'phonon scattering rate', 'surface plasmon resonance wavelength',
        'electron cyclotron resonance', 'spin Hall effect', 'band gap engineering',
        'density of states at Fermi energy', 'Fermi level alignment',
        'carrier mobility tensor',
      ],
    },
    polymer: {
      label: 'polymer chemistry',
      terms: [
        'block copolymer microphase separation', 'living polymerisation',
        'amphiphilic copolymer', 'thermoresponsive polymer', 'ring-opening metathesis',
        'molar mass distribution', 'glass transition temperature', 'viscoelastic relaxation',
        'chain entanglement density', 'crystallisation kinetics', 'hyperbranched polymer',
        'radius of gyration',
      ],
      keywords: [
        'block copolymer microphase separation', 'living polymerisation',
        'glass transition temperature', 'thermoresponsive polymer',
        'chain entanglement density', 'radius of gyration',
      ],
    },
    electro: {
      label: 'electrochemistry',
      terms: [
        'cyclic voltammogram', 'anodic oxidation', 'electrochemical impedance spectrum',
        'overpotential reduction', 'Tafel slope', 'charge transfer resistance',
        'double layer capacitance', 'redox potential', 'electrocatalytic active site density',
        'corrosion inhibition', 'lithium intercalation', 'oxygen evolution reaction',
        'Butler–Volmer equation',
      ],
      keywords: [
        'cyclic voltammogram', 'Faradaic efficiency', 'overpotential reduction',
        'anodic oxidation', 'electrocatalytic active site density', 'Butler–Volmer equation',
      ],
    },
    nuclear: {
      label: 'nuclear fusion',
      terms: [
        'plasma confinement time', 'plasma beta parameter', 'thermonuclear fusion',
        'ELM burst energy', 'neoclassical tearing mode', 'magnetohydrodynamic wave',
        'ignition threshold', 'fusion cross-section', 'Alfvén eigenmode',
        'plasma oscillation frequency', 'Debye shielding length', 'divertor heat flux',
        'Lawson criterion value', 'tokamak aspect ratio',
      ],
      keywords: [
        'plasma confinement time', 'plasma beta parameter', 'neoclassical tearing mode',
        'magnetohydrodynamic wave', 'Debye shielding length', 'ELM burst energy',
        'divertor heat flux',
      ],
    },
    metallurgy: {
      label: 'metallurgy',
      terms: [
        'Hall–Petch relationship', 'work-hardening exponent', 'fracture toughness',
        'grain boundary energy', 'martensitic phase transformation', 'creep rupture life',
        'powder diffraction pattern', 'Langmuir probe characteristic',
        'intermetallic phase', 'fatigue crack growth', 'precipitation hardening',
        'carbide dissolution kinetics',
      ],
      keywords: [
        'Hall–Petch relationship', 'work-hardening exponent', 'grain boundary energy',
        'martensitic phase transformation', 'creep rupture life', 'fracture toughness',
      ],
    },
    mathematics: {
      label: 'mathematics',
      terms: [
        'Betti number', 'symplectic structure', 'topological invariant',
        'Banach fixed-point', 'Euler characteristic', 'de Rham cohomology',
        'algebraic K-theory', 'homotopy group', 'modular form', 'Galois representation',
        'Riemann hypothesis zero', 'knot polynomial', 'spectral graph eigenvalue',
        'Shannon entropy rate', 'rate-distortion function',
      ],
      keywords: [
        'Betti number', 'symplectic structure', 'knot polynomial',
        'spectral graph eigenvalue', 'homotopy group', 'topological invariant',
        'Riemann hypothesis zero',
      ],
    },
    selenology: {
      label: 'selenology',
      terms: [
        'lunar mantle convection', 'tidal locking timescale', 'mare basalt stratigraphy',
        'polar water-ice deposit', 'orbital resonance lock', 'regolith gardening rate',
        'impact basin formation', 'lunar regolith composition', 'Love number',
        'volatile-rich terrain', 'impact-generated ejecta',
      ],
      keywords: [
        'orbital resonance lock', 'mare basalt stratigraphy', 'tidal locking timescale',
        'lunar regolith composition', 'polar water-ice deposit',
      ],
    },
    pharmacology: {
      label: 'pharmacology',
      terms: [
        'therapeutic index', 'blood-brain barrier permeability', 'bioavailability coefficient',
        'dose-response curve', 'ADMET profile', 'pharmacokinetic modelling',
        'receptor occupancy', 'half-life clearance', 'off-target binding affinity',
        'metabolic stability', 'P-glycoprotein efflux ratio',
      ],
      keywords: [
        'therapeutic index', 'blood-brain barrier permeability', 'bioavailability coefficient',
        'ADMET profile', 'dose-response curve', 'pharmacokinetic modelling',
      ],
    },
    mycology: {
      label: 'mycology',
      terms: [
        'ergot alkaloid', 'mycorrhizal network hyphal anastomosis', 'sporocarp morphology',
        'ectomycorrhizal symbiosis', 'biotrophic growth', 'dikaryotic mycelium',
        'wood-decay enzyme', 'phosphorylation cascade', 'saprotrophic decomposition',
        'necrotrophic infection', 'endophytic colonisation',
      ],
      keywords: [
        'sporocarp morphology', 'ergot alkaloid', 'mycorrhizal network',
        'ectomycorrhizal symbiosis', 'dikaryotic mycelium', 'wood-decay enzyme',
      ],
    },
    aerospace: {
      label: 'aerospace',
      terms: [
        'ion thruster efficiency', 'thermal protection ablation rate', 're-entry heat flux',
        'orbital decay rate', 'specific impulse', 'drag coefficient profile',
        'aerobraking manoeuvre', 'geostationary transfer orbit',
      ],
      keywords: [
        'ion thruster efficiency', 'thermal protection ablation rate', 're-entry heat flux',
        'specific impulse', 'drag coefficient profile',
      ],
    },
    planetaryScience: {
      label: 'planetary science',
      terms: [
        'chondrite composition', 'accretion timescale', 'volatile delivery mechanism',
        'impact melt fraction', 'mantle differentiation', 'core–mantle boundary flux',
        'atmospheric escape rate', 'planetary albedo', 'Love number',
      ],
      keywords: [
        'chondrite composition', 'accretion timescale', 'impact melt fraction',
        'planetary albedo', 'Love number',
      ],
    },
  };

  const ALL_DOMAIN_KEYS = Object.keys(DOMAINS);

  // ── Field-tag pairs (2 shown in the "IF: X.X · f1, f2" line) ─────────────
  const FIELD_TAG_PAIRS = {
    quantum:        ['quantum computing', 'cryptography'],
    materials:      ['materials science', 'crystallography'],
    crypto:         ['cryptography', 'quantum computing'],
    nano:           ['nanotechnology', 'photonics'],
    astro:          ['astrophysics', 'nuclear fusion'],
    fluid:          ['fluid dynamics', 'aerospace'],
    thermo:         ['thermodynamics', 'combustion chemistry'],
    numberTheory:   ['number theory', 'mathematics'],
    biochem:        ['biochemistry', 'molecular biology'],
    solidState:     ['solid state physics', 'polymer chemistry'],
    polymer:        ['polymer chemistry', 'materials science'],
    electro:        ['electrochemistry', 'materials science'],
    nuclear:        ['nuclear fusion', 'plasma physics'],
    metallurgy:     ['metallurgy', 'electrochemistry'],
    mathematics:    ['mathematics', 'topology'],
    selenology:     ['selenology', 'planetary science'],
    pharmacology:   ['pharmacology', 'molecular biology'],
    mycology:       ['mycology', 'biochemistry'],
    aerospace:      ['aerospace', 'fluid dynamics'],
    planetaryScience: ['planetary science', 'selenology'],
  };

  // ── Journals ───────────────────────────────────────────────────────────────
  const JOURNALS = [
    { name: 'Nature Nanotechnology',                 if: 18.5, prefix: 'nature' },
    { name: 'Science Advances',                      if: 18.5, prefix: 'sciadv' },
    { name: 'Advanced Materials',                    if: 9.2,  prefix: 'acs'    },
    { name: 'Nanoscale',                             if: 18.5, prefix: 'acsnano'},
    { name: 'ACS Nano',                              if: 15.8, prefix: 'acsnano'},
    { name: 'Physical Review Letters',               if: 8.9,  prefix: 'prl'    },
    { name: 'Nature Materials',                      if: 22.3, prefix: 'prl'    },
    { name: 'Advanced Functional Materials',         if: 9.2,  prefix: 'acs'    },
    { name: 'Angewandte Chemie International Edition', if: 11.7, prefix: 'wiley'},
    { name: 'ACS Catalysis',                         if: 9.8,  prefix: 'sciadv' },
    { name: 'Journal of Materials Chemistry A',      if: 7.4,  prefix: 'rsc'    },
    { name: 'npj Computational Materials',           if: 10.1, prefix: 'nature' },
    { name: 'Physical Chemistry Chemical Physics',   if: 6.2,  prefix: 'rsc'    },
    { name: 'Computational Materials Science',       if: 18.5, prefix: 'sciadv' },
    { name: 'Acta Materialia',                       if: 9.2,  prefix: 'natmat' },
    { name: 'IEEE Transactions on Quantum Engineering', if: 7.3, prefix: 'ieee' },
    { name: 'Journal of the American Chemical Society', if: 9.2, prefix: 'jacs' },
    { name: 'Nature Biotechnology',                  if: 18.5, prefix: 'advmat' },
    { name: 'Biomacromolecules',                     if: 6.1,  prefix: 'acs'    },
    { name: 'Journal of Applied Physics',            if: 5.2,  prefix: 'jap'    },
    { name: 'Quantum Science and Technology',        if: 8.4,  prefix: 'qst'    },
    { name: 'Carbon',                                if: 7.1,  prefix: 'carbon' },
  ];

  // ── Authors ────────────────────────────────────────────────────────────────
  const FIRST_NAMES = [
    'Wei', 'Mei-Ling', 'Xiao', 'Yuki', 'Kenji', 'Satoshi', 'Jae-Won',
    'Priya', 'Rahul', 'Ananya', 'Aleksei', 'Natasha', 'Ivan',
    'Lena', 'Hans', 'Elena', 'Elena V.', 'Carlos', 'Maria',
    'Amara', 'Kwame', 'Hannah', 'Fatima', 'James', 'Sarah',
    'Michael', 'Emma', 'Lucas', 'Ingrid', 'Björn', 'Yusuf',
    'Aisha', 'Takeshi', 'Hiroshi', 'Olga', 'Naomi', 'Emre',
    'Rafael', 'Thomas', 'Jin-Woo', 'James K.',
  ];
  const LAST_NAMES = [
    'Zhang', 'Zhou', 'Tanaka', 'Nakamura', 'Kim', 'Park', 'Chen',
    'Krishnamurthy', 'Patel', 'Sharma', 'Volkov', 'Petrov',
    'Müller', 'Schmidt', 'García', 'Rodrigues', 'Osei', 'Obi-Okwu',
    'Al-Rashid', 'Williams', 'Singh', 'Thompson', 'Davis', 'Martinez',
    'Anderson', 'Johnson', 'Brown', 'Wilson', 'Moore', 'Taylor',
    'Larsson', 'Nielsen', 'Kowalski', 'Dubois', 'Rossi', 'Bauer',
    'Svensson', 'Torres', 'Asante', 'Brauer', 'Sokolov', 'Petrenko',
    'Watanabe', 'Yilmaz', 'Takahashi',
  ];
  const TITLES = ['Prof.', 'Dr.', 'Prof. Dr.'];

  function makeAuthor() {
    return `${pick(TITLES)} ${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  }

  // ── Reference author formats ───────────────────────────────────────────────
  const REF_SURNAMES = [
    'Zhang', 'Williams', 'Patel', 'Chen', 'Kim', 'Tanaka', 'Osei',
    'Müller', 'Al-Rashid', 'Volkov', 'Singh', 'Nakamura', 'Park',
  ];
  const REF_INITIALS = ['Y.', 'B.', 'A.', 'X.', 'J. H.', 'Y.', 'H.', 'R.', 'A.', 'A. K.', 'P.', 'T.', 'J.'];
  const REF_JOURNALS = [
    'Nature Nanotechnology', 'Advanced Materials', 'ACS Nano', 'Physical Review Letters',
    'Nature Materials', 'Nanoscale', 'ACS Catalysis', 'Journal of Materials Chemistry A',
    'Angewandte Chemie International Edition', 'npj Computational Materials',
    'Computational Materials Science', 'Acta Materialia', 'Carbon',
    'Proceedings of the National Academy of Sciences', 'Science Advances',
    'Journal of the American Chemical Society', 'Physical Chemistry Chemical Physics',
    'IEEE Transactions on Quantum Engineering', 'Quantum Science and Technology',
    'Advanced Functional Materials', 'Biomacromolecules', 'Journal of Applied Physics',
    'Nature Biotechnology',
  ];

  function makeRef(n) {
    const i = Math.floor(Math.random() * REF_SURNAMES.length);
    const co = Math.random();
    let authors;
    if (co < 0.35) {
      const j = (i + 1) % REF_SURNAMES.length;
      authors = `${REF_SURNAMES[i]}, ${REF_INITIALS[i]} & ${REF_SURNAMES[j]}, ${REF_INITIALS[j]}`;
    } else {
      authors = `${REF_SURNAMES[i]}, ${REF_INITIALS[i]} et al.`;
    }
    const year = rand(2019, 2025);
    const vol  = rand(100, 500);
    const page = rand(1000, 9999);
    const id   = rand(10000, 99999);
    return `[${n}] ${authors} ${pick(REF_JOURNALS)} ${vol}, ${page} (${year}). doi:10.xxxx/ref.${year}.${id}`;
  }

  // ── Title templates ────────────────────────────────────────────────────────
  const TITLE_ADJ = [
    'High-Performance', 'Synergistic', 'Weakly coupled', 'Strongly correlated',
    'Defect-engineered', 'Topologically protected', 'Quantum-Enhanced', 'Ultrafast',
    'Multifunctional', 'Hierarchical', 'Gaussian', 'Anomalous', 'Emergent',
    'Reversible', 'Scalable', 'Chiral', 'Isotropic', 'Anisotropic',
    'Mesoscopic', 'Asymmetric', 'Nonlinear', 'Stochastic', 'Ferroelectric',
    'Paramagnetic', 'Superhydrophobic', 'Colossal', 'Robust', 'Epigenetic',
    'Collision-resistant', 'Rich', 'Symplectic', 'Convective', 'Turbulent',
    'Relativistic', 'Bifunctional', 'Amphiphilic',
  ];

  function applyTitleTemplate(adj, t1, t2, t3, fieldLabel) {
    const tpl = rand(0, 8);
    switch (tpl) {
      case 0: return `${adj} ${t1} and ${t2} in ${pick(TITLE_ADJ)} ${t3} Matrices`;
      case 1: return `${adj} ${t1}: ${t2} ${t3} Synthesis and Characterisation`;
      case 2: return `${adj} Control of ${t1} for Advanced ${fieldLabel} Applications`;
      case 3: return `${adj} ${t1} Coupling in ${pick(TITLE_ADJ)} ${fieldLabel} Architectures`;
      case 4: return `Mechanisms of ${t1} in ${adj} ${fieldLabel} Networks`;
      case 5: return `${adj} ${t1} in ${pick(TITLE_ADJ)}-atom ${fieldLabel} Systems`;
      case 6: return `Role of ${t1} in Governing ${adj} ${t2} Behaviour in ${fieldLabel}`;
      case 7: return `${adj} ${t1} via ${t2}: Implications for ${fieldLabel}`;
      default: return `${adj} Enhancement of ${t1} through ${t2} in ${t3} Frameworks`;
    }
  }

  // ── Section templates ──────────────────────────────────────────────────────
  const ABSTRACT_ADJ = [
    'carbon-oxygen', 'defect-engineered', 'ferroelectric', 'Gaussian', 'surface-enhanced',
    'topologically protected', 'hyperbranched', 'isentropic', 'variational', 'diffusion',
  ];
  const DOMAIN_ADJ = [
    'inert', 'amorphous', 'semiflexible', 'coprime', 'biotrophic', 'turbulent',
    'irreversible', 'primordial', 'antisense', 'enzymatic', 'isotropic',
  ];

  function genAbstract(pools, terms) {
    const t1 = pick(terms), t2 = pick(terms.filter(x => x !== t1));
    const t3 = pick(terms.filter(x => x !== t1 && x !== t2));
    const t4 = pick(terms);
    const pct = randF(70, 200).toFixed(1);
    const analysis = pick(['phonon scattering rate', 'molar mass distribution', 'Peierls distortion',
      'powder diffraction pattern', 'Banach fixed-point', 'knot polynomial', 'decoherence rate',
      'chemical kinetics mechanism', 'Carnot efficiency limit']);
    const fieldLabel = DOMAINS[pools[0]].label;
    const tpl = rand(0, 5);
    switch (tpl) {
      case 0:
        return `Our results reveal a previously uncharacterised correlation between ${t1} and ${t2}, ` +
          `with broad implications for fundamental science and next-generation technology. ` +
          `The ${pick(ABSTRACT_ADJ)} nature of the observed ${t3} was confirmed through high-resolution ` +
          `${analysis} analysis and first-principles calculations. ` +
          `These findings open new avenues for the rational design of topological ${t1}-based architectures.`;
      case 1:
        return `We report surface-enhanced properties of ${t1} in ${fieldLabel}. ` +
          `Specifically, we find that isentropic ${t2} enhances performance by up to ${pct}% relative ` +
          `to conventional approaches. Using irreversible ${t3} techniques, we demonstrate that ` +
          `topologically protected systems exhibit remarkable insulating behaviour under controlled conditions.`;
      case 2:
        return `These findings open new avenues for the rational design of turbulent ${t1}-based architectures. ` +
          `Our results reveal a previously uncharacterised correlation between ${t2} and ${t3}, ` +
          `with broad implications for fundamental science and next-generation technology. ` +
          `Using ${pick(ABSTRACT_ADJ)} crystalline lattice parameter techniques, we demonstrate that selective ` +
          `systems exhibit remarkable lean behaviour under controlled conditions.`;
      case 3:
        return `The ${pick(ABSTRACT_ADJ)} nature of the observed ${t1} was confirmed through high-resolution ` +
          `${analysis} analysis and first-principles calculations. ` +
          `Our results reveal a previously uncharacterised correlation between ${t2} and ${t3}, ` +
          `with broad implications for fundamental science and next-generation technology. ` +
          `We report ${pick(DOMAIN_ADJ)} properties of ${t4} in ${fieldLabel}.`;
      case 4:
        return `Using ${pick(ABSTRACT_ADJ)} ${t1} techniques, we demonstrate that collision-resistant systems ` +
          `exhibit remarkable cryptographically secure behaviour under controlled conditions. ` +
          `The hyperbranched nature of the observed ${t2} was confirmed through high-resolution ` +
          `${analysis} analysis and first-principles calculations. ` +
          `We report ${pick(DOMAIN_ADJ)} properties of ${t3} in ${fieldLabel}.`;
      default:
        return `Specifically, we find that fault-tolerant ${t1} enhances performance by up to ${pct}% ` +
          `relative to conventional approaches. The topologically protected nature of the observed ${t2} ` +
          `was confirmed through high-resolution ${analysis} analysis and first-principles calculations. ` +
          `These findings open new avenues for the rational design of impact-generated ${t3}-based architectures.`;
    }
  }

  const INTRO_CAPABILITIES = [
    'algebraic', 'decoherence-free', 'conjugated', 'metallic', 'semiconducting',
    'supercritical', 'carbon-oxygen', 'cryogenic', 'phosphorylated', 'lean',
    'necrotrophic', 'ferroelectric', 'magnetised', 'body-centred cubic',
  ];
  const INTRO_BEHAVIOUR = [
    'non-equilibrium', 'superhydrophobic', 'pharmacokinetic', 'ferroelectric',
    'paramagnetic', 'electron-degenerate', 'viscoelastic', 'enantioselective',
    'macroscopic', 'amorphous', 'regulatory', 'carbon-oxygen',
  ];
  const INTRO_SPECTROSCOPY = [
    'nanoparticle size distribution', 'nanopore translocation signal', 'substrate channelling',
    'ribosomal translocation', 'mycorrhizal network hyphal anastomosis', 'fluorescence resonance energy transfer',
    'Chinese remainder theorem', 'stellar opacity coefficient', 'entropy production rate',
    'trapdoor permutation', 'protein–protein interaction network', 'polar water-ice deposit',
  ];
  const INTRO_CHAR = [
    'convective', 'aromatic', 'decoherence-free', 'collision-resistant', 'surface-enhanced',
    'post-main-sequence', 'hyperbranched', 'endophytic', 'conjugated',
  ];

  function genIntro(pools, terms) {
    const fieldLabel = DOMAINS[pools[0]].label;
    const t1 = pick(terms), t2 = pick(terms.filter(x => x !== t1));
    const t3 = pick(terms.filter(x => x !== t1 && x !== t2));
    const adj = pick(INTRO_CAPABILITIES);
    return `The field of ${fieldLabel} has witnessed remarkable advances, driven by demand ` +
      `for ${adj} systems with unprecedented ${t1} capabilities [1,2]. Central to these ` +
      `developments is the ability to precisely control ${t2} at the ${adj} level—a challenge ` +
      `that has spurred extensive theoretical and experimental investigations [3–5]. In particular, ` +
      `the interplay between ${t3} and ${pick(terms)} has emerged as a critical factor governing ` +
      `macroscopic ${pick(INTRO_BEHAVIOUR)} behaviour [6]. Despite significant progress, the ` +
      `mechanistic origin of ${pick(terms)} phenomena remains poorly understood, limiting rational ` +
      `device engineering [7,8]. Here we address this gap through a comprehensive study combining ` +
      `${pick(INTRO_SPECTROSCOPY)} spectroscopy, computational modelling, and ` +
      `${pick(INTRO_CHAR)} characterisation.`;
  }

  const METHODS_ADJ = [
    'decoherence-free', 'collision-resistant', 'suborbital topological', 'superhydrophobic',
    'chiral', 'suprathermal', 'stoichiometric', 'semiconducting', 'convective', 'potent',
    'variational', 'enthalpic', 'electrocatalytic',
  ];
  const METHODS_MEAS = [
    'Coherent', 'Decoherence-free', 'Chiral', 'Anisotropic', 'Asymmetric',
    'Algebraic', 'Amorphous', 'Face-centred cubic', 'Gaussian', 'Quasi-static',
    'Resonant', 'Supercritical', 'Topological', 'Radiative', 'Coordinatively saturated',
  ];

  function genMethods(pools, terms) {
    const t1 = pick(terms), t2 = pick(terms), t3 = pick(terms);
    const res    = randF(0.05, 0.50);
    const cutoff = rand(400, 700);
    const nIter  = rand(100, 1000);
    return `All samples were prepared using a ${pick(METHODS_ADJ)} ${t1} synthesis protocol ` +
      `under inert atmosphere conditions (< 1 ppm O₂, < 0.5 ppm H₂O). Structural characterisation ` +
      `employed ${t2} analysis with a spatial resolution of ${res.toFixed(2)} nm. ` +
      `${pick(METHODS_MEAS)} measurements were conducted between 4 K and 873 K using a custom-built ` +
      `${t3} apparatus calibrated against NIST standards. Computational simulations used density ` +
      `functional theory (DFT) within the PBE exchange-correlation functional; plane-wave cutoff ` +
      `energy: ${cutoff} eV. Statistical analysis applied a bootstrapping methodology ` +
      `(n = ${nIter} iterations) at significance threshold p < 0.05.`;
  }

  const RESULTS_ADJ1 = [
    'prime', 'error-mitigated', 'weakly coupled', 'strongly correlated', 'enzymatic',
    'adiabatic', 'quantitative', 'turbo-coded', 'geostationary', 'isothermal',
    'hyperbranched', 'tidally locked', 'fibred',
  ];
  const RESULTS_ADJ2 = [
    'ductile', 'MHD-stable', 'ferroelectric', 'amphiphilic', 'ferromagnetic',
    'bifunctional', 'turbulent', 'monoclinic', 'glycosylated', 'quantum-confined',
    'superhydrophobic', 'defect-engineered', 'collisional',
  ];
  const RESULTS_ADJ3 = [
    'multifunctional', 'analytic', 'error-mitigated', 'stoichiometric',
    'superhydrophobic', 'semiconducting', 'biocompatible', 'amorphous',
    'premixed', 'thermonuclear', 'strongly correlated', 'self-healing', 'radiative',
  ];
  const RESULTS_INDEPENDENT = [
    'Faradaic efficiency', 'detonation wave speed', 'NADH oxidoreductase complex',
    'cyclic voltammogram', 'ellipsometric', 'topological surface state',
    'CRISPR-Cas9 guide RNA', 'single-molecule trajectory', 'electron cyclotron resonance',
    'epigenetic methylation mark', 'phonon dispersion curve', 'gene regulatory network motif',
    'phosphine ligand cone angle', 'independent plasma confinement time',
  ];
  const RESULTS_SHIFT = [
    'surface plasmon resonance wavelength', 'gravitational wave strain', 'receptor binding affinity',
    'thermoelectric power factor', 'Schwarzschild radius', 'commitment scheme',
    'phase diagram boundary', 'mRNA polyadenylation', 'ELM burst energy',
    'lift-to-drag ratio', 'membrane curvature elasticity', 'ergot alkaloid',
  ];

  function genResults(pools, terms) {
    const t1 = pick(terms), t2 = pick(terms.filter(x => x !== t1));
    const t3 = pick(terms);
    const r2  = randF(0.90, 0.99, 3);
    const fold = randF(10, 50, 1);
    const cv  = randF(2.0, 4.0, 1);
    return `The ${pick(RESULTS_ADJ1)} ${t1} exhibited a well-defined ${pick(RESULTS_ADJ2)} ` +
      `signature consistent with theoretical predictions. Quantitative analysis revealed a ` +
      `${pick(RESULTS_ADJ3)} dependence with R² = ${r2}. The ${pick(RESULTS_ADJ3)} regime ` +
      `showed a ${fold}-fold enhancement in ${t2} performance relative to the control. ` +
      `Cross-validation using independent ${pick(RESULTS_INDEPENDENT)} measurements confirmed ` +
      `reproducibility across five independent preparations (coefficient of variation < ${cv}%). ` +
      `Emergence of ${t3} at the critical threshold was accompanied by a characteristic ` +
      `${pick(RESULTS_SHIFT)} shift, providing direct spectroscopic evidence for the proposed mechanism.`;
  }

  const DISC_ADJ1 = [
    'cryptographically secure', 'superhydrophobic', 'supercritical', 'amphiphilic',
    'ferroelectric', 'magnetised', 'turbulent', 'quasi-static', 'electron-deficient',
    'decoherence-free', 'glycosylated', 'bifunctional', 'irreversible', 'antisense',
  ];
  const DISC_ADJ2 = [
    'passivated', 'amorphous', 'supercritical', 'post-quantum', 'saprophytic',
    'body-centred cubic', 'cathodic', 'topological', 'entropic', 'inert',
    'defect-engineered', 'simply connected', 'face-centred cubic',
  ];
  const DISC_ADJ3 = [
    'non-thermal', 'face-centred cubic', 'post-quantum', 'arithmetic', 'decoherence-free',
    'piezoelectric', 'monodisperse', 'semiconducting', 'metallic', 'isentropic', 'isotropic',
  ];
  const DISC_FABRICATION = [
    'anodic', 'arithmetic', 'supercritical', 'suborbital', 'MHD-stable', 'biocompatible',
    'turbulent', 'chiral', 'lossless', 'non-coding', 'biodegradable', 'suprathermal',
  ];
  const DISC_FUTURE = [
    'thermoresponsive', 'amphiphilic', 'post-translational', 'multi-component',
    'isotropic', 'bifunctional', 'neuromorphic', 'reusable', 'phosphorylated',
    'semiconducting', 'supermassive', 'light-weight', 'polycrystalline',
  ];

  function genDiscussion(pools, terms) {
    const t1 = pick(terms), t2 = pick(terms.filter(x => x !== t1));
    const t3 = pick(terms.filter(x => x !== t1 && x !== t2));
    const pct = randF(50, 350, 1);
    const fieldLabel = DOMAINS[pools[0]].label;
    const coupling = pick([
      'information-theoretically secure', 'degenerate', 'isothermal', 'ferromagnetic',
      'ectomycorrhizal', 'volatile-rich', 'face-centred cubic', 'strongly correlated',
      'nanoscale', 'semiconducting', 'electron-degenerate', 'thermoresponsive',
    ]);
    return `The observed ${pick(DISC_ADJ1)} behaviour can be rationalised within a framework ` +
      `accounting for ${t1}-mediated coupling between ${coupling} domains. ` +
      `Our findings align with recent reports on analogous ${fieldLabel} systems while extending ` +
      `understanding to the previously unexplored ${pick(DISC_ADJ2)} regime [9,10]. ` +
      `The ${pct}% enhancement in ${t2} substantially exceeds state-of-the-art benchmarks, ` +
      `suggesting ${pick(DISC_ADJ3)} ${t3} as a genuinely superior platform. ` +
      `From a practical standpoint, our ${pick(DISC_FABRICATION)} fabrication route is scalable ` +
      `and compatible with existing ${pick(terms)}-based manufacturing infrastructure. ` +
      `Future work should investigate long-term stability under operational conditions and ` +
      `extension to multi-component ${pick(DISC_FUTURE)} systems.`;
  }

  const CONCL_ADJ1 = [
    'strongly correlated', 'rich', 'robust', 'Gaussian', 'weakly coupled', 'emergent',
    'body-centred cubic', 'self-assembled', 'semiconducting', 'biotrophic', 'MHD-stable',
    'carbon-oxygen', 'post-quantum', 'cathodic', 'inert', 'piezoelectric',
  ];
  const CONCL_FRAMEWORK = [
    'aromatic', 'isotropic', 'premixed', 'topological', 'hierarchical', 'coprime',
    'stoichiometric', 'neuromorphic', 'ferroelectric', 'entropic', 'supermassive',
    'potent', 'semiconducting',
  ];
  const CONCL_MATERIAL = [
    'metallic', 'algebraic', 'organic', 'quantum', 'exotic', 'reusable', 'hexagonal close-packed',
    'antisense', 'σ-basic', 'tetragonal', 'electron-deficient',
  ];

  function genConclusion(pools, terms) {
    const t1 = pick(terms), t2 = pick(terms), t3 = pick(terms);
    return `We demonstrated ${pick(CONCL_ADJ1)} ${t1} in a novel material system through combined ` +
      `experimental and computational approaches. Mechanistic insights provide a foundation for ` +
      `rational design of next-generation ${pick(CONCL_MATERIAL)} ${t2}-based technologies. ` +
      `The ${pick(CONCL_FRAMEWORK)} framework introduced here is expected to stimulate further ` +
      `investigations at the intersection of ${t3} and ${pick(terms)} research.`;
  }

  // ── Keyword generation ─────────────────────────────────────────────────────
  function genKeywords(pools) {
    const kws = [];
    const seen = new Set();
    // First 4: technical terms from the selected pools
    for (const p of pools) {
      const pool = DOMAINS[p].keywords;
      for (const kw of pickN(pool, 2)) {
        if (!seen.has(kw)) { kws.push(kw); seen.add(kw); }
        if (kws.length >= 4) break;
      }
      if (kws.length >= 4) break;
    }
    // Last 3: field/domain labels
    const fieldLabels = pools.map(p => DOMAINS[p].label);
    for (const fl of fieldLabels) {
      if (!seen.has(fl) && kws.length < 7) { kws.push(fl); seen.add(fl); }
    }
    // Pad with more field labels if needed
    const extras = [
      'nanotechnology', 'cryptography', 'astrophysics', 'materials science',
      'aerospace', 'molecular biology', 'noble metal chemistry', 'carbon chemistry',
      'combustion chemistry', 'stellar evolution', 'bioelectronics', 'topology',
      'plasma physics', 'mycology', 'polymer chemistry',
    ];
    for (const e of extras) {
      if (kws.length >= 7) break;
      if (!seen.has(e)) { kws.push(e); seen.add(e); }
    }
    return kws.slice(0, 7);
  }

  // ── Main generate function ─────────────────────────────────────────────────
  function generate(spinNumber) {
    // Pick 3 domain pools
    const pools = pickN(ALL_DOMAIN_KEYS, 3);
    const allTerms = pools.flatMap(p => DOMAINS[p].terms);

    const journal  = pick(JOURNALS);
    const nAuthors = rand(2, 3);
    const authors  = Array.from({ length: nAuthors }, makeAuthor);

    const keywords  = genKeywords(pools);
    const fieldTags = FIELD_TAG_PAIRS[pools[0]] || [DOMAINS[pools[0]].label, DOMAINS[pools[1]].label];

    // Title
    const adj = pick(TITLE_ADJ);
    const t1  = pick(allTerms);
    const t2  = pick(allTerms.filter(x => x !== t1));
    const t3  = pick(allTerms.filter(x => x !== t1 && x !== t2));
    const title = applyTitleTemplate(adj, t1, t2, t3, DOMAINS[pools[0]].label);

    // Abstract & sections
    const abstract    = genAbstract(pools, allTerms);
    const intro       = genIntro(pools, allTerms);
    const methods     = genMethods(pools, allTerms);
    const results     = genResults(pools, allTerms);
    const discussion  = genDiscussion(pools, allTerms);
    const conclusion  = genConclusion(pools, allTerms);

    // References
    const refs = Array.from({ length: 10 }, (_, i) => makeRef(i + 1));

    // DOI
    const doi = `10.1038/${journal.prefix}.2026.${rand(10000, 99999)}`;

    // Spin score (only for wins; caller sets to 0 on no-win)
    const spinScore = rand(20, 70);

    return {
      spin: spinNumber,
      timestamp: new Date().toISOString(),
      title,
      authors,
      journal: journal.name,
      year: 2026,
      impactFactor: journal.if,
      doi,
      fieldTags,
      keywords,
      abstract,
      sections: { introduction: intro, methods, results, discussion, conclusion },
      references: refs,
      searchEnriched: Math.random() > 0.45,
      spinScore,
    };
  }

  return { generate };
})();
