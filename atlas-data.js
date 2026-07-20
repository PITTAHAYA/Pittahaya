(function () {
  "use strict";

  const isEnglish = /^en\b/i.test(document.documentElement.lang || "");
  const t = (spanish, english) => isEnglish ? english : spanish;

  function makeCompany(entry) {
    return Object.freeze(Object.assign({
      yearsOwned: null,
      capabilities: [],
      image: null,
      slug: null,
      confidential: true
    }, entry));
  }

  const companyFolios = Object.freeze([
    makeCompany({ id: "ATLAS-01", name: "Folio energetico andino", sector: "Energia", country: "Ecuador", region: "Andes - generacion distribuida", acquisitionYear: 1998, yearsOwned: 28, assetType: "Generacion critica", description: "Plataforma de continuidad electrica para corredores industriales andinos.", capabilities: ["Continuidad", "Mantenimiento mayor", "Contratos de largo plazo"] }),
    makeCompany({ id: "ATLAS-02", name: "Red litoral de transmision", sector: "Energia", country: "Chile", region: "Pacifico sur - transmision", acquisitionYear: 2001, yearsOwned: 25, assetType: "Red regulada", description: "Activo de transmision que sostiene demanda industrial costera.", capabilities: ["Redundancia", "Regulacion", "Demanda cautiva"] }),
    makeCompany({ id: "ATLAS-03", name: "Reserva termica de respaldo", sector: "Energia", country: "Mexico", region: "Bajio - capacidad firme", acquisitionYear: 2004, yearsOwned: 22, assetType: "Respaldo operativo", description: "Capacidad de respaldo para ciclos de alta demanda productiva.", capabilities: ["Disponibilidad", "Combustible", "Control operativo"] }),
    makeCompany({ id: "ATLAS-04", name: "Medicion industrial regulada", sector: "Energia", country: "Colombia", region: "Caribe industrial", acquisitionYear: 2008, yearsOwned: 18, assetType: "Infraestructura de medicion", description: "Plataforma de medicion y control para clientes industriales regulados.", capabilities: ["Datos criticos", "Facturacion", "Operacion 24/7"] }),
    makeCompany({ id: "ATLAS-05", name: "Microredes de continuidad", sector: "Energia", country: "Peru", region: "Operacion minera remota", acquisitionYear: 2014, yearsOwned: 12, assetType: "Energia distribuida", description: "Microredes disenadas para operaciones que no pueden detenerse.", capabilities: ["Autonomia", "Respaldo", "Ingenieria local"] }),
    makeCompany({ id: "ATLAS-06", name: "Almacenamiento operativo", sector: "Energia", country: "Estados Unidos", region: "Costa del Golfo", acquisitionYear: 2021, yearsOwned: 5, assetType: "Capacidad flexible", description: "Capacidad flexible para estabilidad de red y continuidad industrial.", capabilities: ["Baterias", "Servicios auxiliares", "Flexibilidad"] }),
    makeCompany({ id: "ATLAS-07", name: "Terminal multiproposito Pacifico", sector: "Maritimo & logistica", country: "Ecuador", region: "Puerto profundo", acquisitionYear: 1999, yearsOwned: 27, assetType: "Terminal esencial", description: "Terminal multiproposito para carga industrial y alimentos de exportacion.", capabilities: ["Operacion portuaria", "Calado", "Cadena logistica"] }),
    makeCompany({ id: "ATLAS-08", name: "Cadena fria portuaria", sector: "Maritimo & logistica", country: "Panama", region: "Hub refrigerado", acquisitionYear: 2003, yearsOwned: 23, assetType: "Logistica alimentaria", description: "Infraestructura de frio que reduce perdida y protege valor exportable.", capabilities: ["Frio", "Trazabilidad", "Rotacion"] }),
    makeCompany({ id: "ATLAS-09", name: "Remolcadores de bahia", sector: "Maritimo & logistica", country: "Paises Bajos", region: "Rotterdam", acquisitionYear: 2006, yearsOwned: 20, assetType: "Servicio portuario", description: "Flota de apoyo portuario en bahias de alta densidad operativa.", capabilities: ["Maniobra", "Seguridad", "Disponibilidad"] }),
    makeCompany({ id: "ATLAS-10", name: "Mantenimiento naval esencial", sector: "Maritimo & logistica", country: "Espana", region: "Mediterraneo occidental", acquisitionYear: 2010, yearsOwned: 16, assetType: "Astillero operativo", description: "Base de mantenimiento para flotas comerciales y servicios auxiliares.", capabilities: ["Reparacion", "Dique seco", "Mano de obra tecnica"] }),
    makeCompany({ id: "ATLAS-11", name: "Corredor fluvial interior", sector: "Maritimo & logistica", country: "Brasil", region: "Hidrovia industrial", acquisitionYear: 2017, yearsOwned: 9, assetType: "Transporte fluvial", description: "Operacion fluvial que conecta produccion interior con salida portuaria.", capabilities: ["Barcazas", "Granos", "Bajo costo"] }),
    makeCompany({ id: "ATLAS-12", name: "Deposito intermodal", sector: "Maritimo & logistica", country: "Singapur", region: "Asia-Pacifico", acquisitionYear: 2023, yearsOwned: 3, assetType: "Intermodal", description: "Nodo intermodal para redistribucion regional de carga critica.", capabilities: ["Aduana", "Patio", "Velocidad"] }),
    makeCompany({ id: "ATLAS-13", name: "Cantera industrial norte", sector: "Mineria & recursos", country: "Peru", region: "Andes centrales", acquisitionYear: 2000, yearsOwned: 26, assetType: "Aridos criticos", description: "Reserva de aridos para infraestructura regional de largo plazo.", capabilities: ["Reserva", "Permisos", "Demanda recurrente"] }),
    makeCompany({ id: "ATLAS-14", name: "Procesamiento de aridos", sector: "Mineria & recursos", country: "Canada", region: "Corredor oeste", acquisitionYear: 2005, yearsOwned: 21, assetType: "Procesamiento", description: "Planta de procesamiento con contratos estables de construccion civil.", capabilities: ["Trituracion", "Calidad", "Contratos marco"] }),
    makeCompany({ id: "ATLAS-15", name: "Servicios geologicos", sector: "Mineria & recursos", country: "Australia", region: "Cinturon mineral", acquisitionYear: 2009, yearsOwned: 17, assetType: "Inteligencia tecnica", description: "Equipo tecnico que reduce incertidumbre antes de desplegar capital.", capabilities: ["Due diligence", "Muestreo", "Modelos geologicos"] }),
    makeCompany({ id: "ATLAS-16", name: "Reserva mineral de transicion", sector: "Mineria & recursos", country: "Chile", region: "Norte grande", acquisitionYear: 2012, yearsOwned: 14, assetType: "Recursos criticos", description: "Participacion en reserva mineral asociada a electrificacion.", capabilities: ["Cobre", "Permisos", "Largo plazo"] }),
    makeCompany({ id: "ATLAS-17", name: "Agua industrial circular", sector: "Mineria & recursos", country: "Mexico", region: "Desierto industrial", acquisitionYear: 2019, yearsOwned: 7, assetType: "Reuso hidrico", description: "Sistema de reuso de agua para operacion minera y manufactura pesada.", capabilities: ["Tratamiento", "Recirculacion", "Licencia social"] }),
    makeCompany({ id: "ATLAS-18", name: "Insumos de operacion minera", sector: "Mineria & recursos", country: "Ecuador", region: "Andes", acquisitionYear: 2024, yearsOwned: 2, assetType: "Suministro esencial", description: "Distribucion tecnica de insumos para faenas que operan sin pausa.", capabilities: ["Inventario critico", "Campo", "Soporte tecnico"] }),
    makeCompany({ id: "ATLAS-19", name: "Fibra regional critica", sector: "Infraestructura", country: "Colombia", region: "Ciudades secundarias", acquisitionYear: 2002, yearsOwned: 24, assetType: "Conectividad", description: "Fibra regional para ciudades donde la redundancia aun es escasa.", capabilities: ["Anillos", "Ultima milla", "Contratos empresariales"] }),
    makeCompany({ id: "ATLAS-20", name: "Centros de datos soberanos", sector: "Infraestructura", country: "Estados Unidos", region: "Texas", acquisitionYear: 2011, yearsOwned: 15, assetType: "Computacion esencial", description: "Capacidad de computo para clientes que requieren control local.", capabilities: ["Energia", "Refrigeracion", "Seguridad fisica"] }),
    makeCompany({ id: "ATLAS-21", name: "Concesion vial secundaria", sector: "Infraestructura", country: "Ecuador", region: "Sierra productiva", acquisitionYear: 2013, yearsOwned: 13, assetType: "Movilidad regional", description: "Concesion vial que conecta produccion agricola e industria ligera.", capabilities: ["Peaje", "Mantenimiento", "Flujo productivo"] }),
    makeCompany({ id: "ATLAS-22", name: "Torres rurales", sector: "Infraestructura", country: "Peru", region: "Altiplano", acquisitionYear: 2016, yearsOwned: 10, assetType: "Telecomunicaciones", description: "Torres rurales con arrendamientos largos y baja rotacion.", capabilities: ["Cobertura", "Energia remota", "Operadores"] }),
    makeCompany({ id: "ATLAS-23", name: "Tratamiento hidrico", sector: "Infraestructura", country: "Espana", region: "Arco mediterraneo", acquisitionYear: 2020, yearsOwned: 6, assetType: "Agua urbana", description: "Planta compacta para tratamiento hidrico de municipios costeros.", capabilities: ["Agua", "Mantenimiento", "Cumplimiento"] }),
    makeCompany({ id: "ATLAS-24", name: "Plataforma logistica urbana", sector: "Infraestructura", country: "Brasil", region: "Sao Paulo", acquisitionYear: 2025, yearsOwned: 1, assetType: "Ultima milla", description: "Plataforma de distribucion urbana para bienes esenciales.", capabilities: ["Cercania", "Rotacion", "Ocupacion"] })
  ]);

  const englishCompanyCopy = Object.freeze({
    "ATLAS-01": { name: "Andean energy portfolio", sector: "Energy", country: "Ecuador", region: "Andes - distributed generation", assetType: "Critical generation", description: "Electrical continuity platform for Andean industrial corridors.", capabilities: ["Continuity", "Major maintenance", "Long-term contracts"] },
    "ATLAS-02": { name: "Coastal transmission network", sector: "Energy", country: "Chile", region: "South Pacific - transmission", assetType: "Regulated network", description: "Transmission asset supporting coastal industrial demand.", capabilities: ["Redundancy", "Regulation", "Captive demand"] },
    "ATLAS-03": { name: "Thermal backup reserve", sector: "Energy", country: "Mexico", region: "Bajío - firm capacity", assetType: "Operational backup", description: "Backup capacity for cycles of high productive demand.", capabilities: ["Availability", "Fuel", "Operating control"] },
    "ATLAS-04": { name: "Regulated industrial metering", sector: "Energy", country: "Colombia", region: "Industrial Caribbean", assetType: "Metering infrastructure", description: "Metering and control platform for regulated industrial clients.", capabilities: ["Critical data", "Billing", "24/7 operations"] },
    "ATLAS-05": { name: "Continuity microgrids", sector: "Energy", country: "Peru", region: "Remote mining operations", assetType: "Distributed energy", description: "Microgrids designed for operations that cannot stop.", capabilities: ["Autonomy", "Backup", "Local engineering"] },
    "ATLAS-06": { name: "Operational storage", sector: "Energy", country: "United States", region: "Gulf Coast", assetType: "Flexible capacity", description: "Flexible capacity for grid stability and industrial continuity.", capabilities: ["Batteries", "Ancillary services", "Flexibility"] },
    "ATLAS-07": { name: "Pacific multipurpose terminal", sector: "Maritime & logistics", country: "Ecuador", region: "Deepwater port", assetType: "Essential terminal", description: "Multipurpose terminal for industrial cargo and food exports.", capabilities: ["Port operations", "Draft", "Logistics chain"] },
    "ATLAS-08": { name: "Port cold chain", sector: "Maritime & logistics", country: "Panama", region: "Refrigerated hub", assetType: "Food logistics", description: "Cold-chain infrastructure that reduces loss and protects export value.", capabilities: ["Cold storage", "Traceability", "Turnover"] },
    "ATLAS-09": { name: "Harbour tugboats", sector: "Maritime & logistics", country: "Netherlands", region: "Rotterdam", assetType: "Port service", description: "Port-support fleet serving harbours with high operational density.", capabilities: ["Manoeuvring", "Safety", "Availability"] },
    "ATLAS-10": { name: "Essential marine maintenance", sector: "Maritime & logistics", country: "Spain", region: "Western Mediterranean", assetType: "Operating shipyard", description: "Maintenance base for commercial fleets and auxiliary services.", capabilities: ["Repair", "Dry dock", "Skilled workforce"] },
    "ATLAS-11": { name: "Inland waterway corridor", sector: "Maritime & logistics", country: "Brazil", region: "Industrial waterway", assetType: "River transport", description: "River operation connecting inland production with port access.", capabilities: ["Barges", "Grain", "Low cost"] },
    "ATLAS-12": { name: "Intermodal depot", sector: "Maritime & logistics", country: "Singapore", region: "Asia-Pacific", assetType: "Intermodal", description: "Intermodal node for regional redistribution of critical cargo.", capabilities: ["Customs", "Yard", "Speed"] },
    "ATLAS-13": { name: "Northern industrial quarry", sector: "Mining & resources", country: "Peru", region: "Central Andes", assetType: "Critical aggregates", description: "Aggregate reserves for long-term regional infrastructure.", capabilities: ["Reserves", "Permits", "Recurring demand"] },
    "ATLAS-14": { name: "Aggregate processing", sector: "Mining & resources", country: "Canada", region: "Western corridor", assetType: "Processing", description: "Processing plant with stable civil-construction contracts.", capabilities: ["Crushing", "Quality", "Framework agreements"] },
    "ATLAS-15": { name: "Geological services", sector: "Mining & resources", country: "Australia", region: "Mineral belt", assetType: "Technical intelligence", description: "Technical team reducing uncertainty before capital is deployed.", capabilities: ["Due diligence", "Sampling", "Geological models"] },
    "ATLAS-16": { name: "Transition mineral reserve", sector: "Mining & resources", country: "Chile", region: "Norte Grande", assetType: "Critical resources", description: "Interest in a mineral reserve associated with electrification.", capabilities: ["Copper", "Permits", "Long-term"] },
    "ATLAS-17": { name: "Circular industrial water", sector: "Mining & resources", country: "Mexico", region: "Industrial desert", assetType: "Water reuse", description: "Water-reuse system for mining operations and heavy manufacturing.", capabilities: ["Treatment", "Recirculation", "Social licence"] },
    "ATLAS-18": { name: "Mining operations supplies", sector: "Mining & resources", country: "Ecuador", region: "Andes", assetType: "Essential supply", description: "Technical distribution of supplies for continuously operating sites.", capabilities: ["Critical inventory", "Field operations", "Technical support"] },
    "ATLAS-19": { name: "Critical regional fibre", sector: "Infrastructure", country: "Colombia", region: "Secondary cities", assetType: "Connectivity", description: "Regional fibre for cities where redundancy remains scarce.", capabilities: ["Rings", "Last mile", "Enterprise contracts"] },
    "ATLAS-20": { name: "Sovereign data centres", sector: "Infrastructure", country: "United States", region: "Texas", assetType: "Essential computing", description: "Compute capacity for clients requiring local control.", capabilities: ["Energy", "Cooling", "Physical security"] },
    "ATLAS-21": { name: "Secondary road concession", sector: "Infrastructure", country: "Ecuador", region: "Productive highlands", assetType: "Regional mobility", description: "Road concession connecting agricultural production and light industry.", capabilities: ["Tolls", "Maintenance", "Productive flow"] },
    "ATLAS-22": { name: "Rural towers", sector: "Infrastructure", country: "Peru", region: "Altiplano", assetType: "Telecommunications", description: "Rural towers with long leases and low turnover.", capabilities: ["Coverage", "Remote power", "Operators"] },
    "ATLAS-23": { name: "Water treatment", sector: "Infrastructure", country: "Spain", region: "Mediterranean arc", assetType: "Urban water", description: "Compact water-treatment plant for coastal municipalities.", capabilities: ["Water", "Maintenance", "Compliance"] },
    "ATLAS-24": { name: "Urban logistics platform", sector: "Infrastructure", country: "Brazil", region: "São Paulo", assetType: "Last mile", description: "Urban distribution platform for essential goods.", capabilities: ["Proximity", "Turnover", "Occupancy"] }
  });

  const localizedCompanyFolios = isEnglish
    ? Object.freeze(companyFolios.map((company) => makeCompany(Object.assign({}, company, englishCompanyCopy[company.id]))))
    : companyFolios;

  window.ATLAS_CONTENT = Object.freeze({
    hero: Object.freeze({
      eyebrow: t("Grupo de capital privado · capital permanente", "Private capital group · permanent capital"),
      title: t("Las compañías que perduran no tienen prisa.", "Enduring companies are in no hurry."),
      summary: t("ATLAS es propietario, no intermediario. Adquirimos y sostenemos negocios esenciales durante décadas — no trimestres — a través de energía, infraestructura, marítimo y minería.", "ATLAS is an owner, not an intermediary. We acquire and sustain essential businesses for decades — not quarters — across energy, infrastructure, maritime, and mining.")
    }),
    thesis: Object.freeze({
      title: t("No perseguimos retornos. Perseguimos permanencia.", "We do not chase returns. We pursue permanence.")
    }),
    sectors: Object.freeze([
      Object.freeze({ id: "energia", number: "01", name: t("Energía", "Energy"), descriptor: t("Generación · transmisión", "Generation · transmission"), motion: "energy" }),
      Object.freeze({ id: "maritimo", number: "02", name: t("Marítimo & logística", "Maritime & logistics"), descriptor: t("Puertos · cadenas logísticas", "Ports · logistics networks"), motion: "maritime" }),
      Object.freeze({ id: "mineria", number: "03", name: t("Minería & recursos", "Mining & resources"), descriptor: t("Recursos críticos · reservas", "Critical resources · reserves"), motion: "mining" }),
      Object.freeze({ id: "infraestructura", number: "04", name: t("Infraestructura", "Infrastructure"), descriptor: t("Conectividad · servicios esenciales", "Connectivity · essential services"), motion: "infrastructure" })
    ]),
    metrics: Object.freeze([
      Object.freeze({ value: "$6.4", suffix: t("MM", "B"), label: t("Capital gestionado", "Capital managed") }),
      Object.freeze({ value: "24", suffix: "", label: t("Compañías en propiedad", "Companies owned") }),
      Object.freeze({ value: "33", suffix: t("años", "years"), label: t("Horizonte medio de tenencia", "Average holding horizon") }),
      Object.freeze({ value: "0", suffix: "", label: t("Ventas forzadas · en 33 años", "Forced sales · in 33 years") })
    ]),
    offices: Object.freeze([
      Object.freeze({ city: "Quito", role: t("Sede · Andes", "Headquarters · Andes") }),
      Object.freeze({ city: "Houston", role: t("Energía", "Energy") }),
      Object.freeze({ city: t("Róterdam", "Rotterdam"), role: t("Marítimo", "Maritime") }),
      Object.freeze({ city: t("Singapur", "Singapore"), role: t("Asia-Pacífico", "Asia-Pacific") })
    ]),
    companies: localizedCompanyFolios
  });
})();
