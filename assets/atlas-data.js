(function () {
  "use strict";

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

  window.ATLAS_CONTENT = Object.freeze({
    hero: Object.freeze({
      eyebrow: "Grupo de capital privado · capital permanente",
      title: "Las compañías que perduran no tienen prisa.",
      summary: "ATLAS es propietario, no intermediario. Adquirimos y sostenemos negocios esenciales durante décadas — no trimestres — a través de energía, infraestructura, marítimo y minería."
    }),
    thesis: Object.freeze({
      title: "No perseguimos retornos. Perseguimos permanencia."
    }),
    sectors: Object.freeze([
      Object.freeze({ id: "energia", number: "01", name: "Energía", descriptor: "Generación · transmisión", motion: "energy" }),
      Object.freeze({ id: "maritimo", number: "02", name: "Marítimo & logística", descriptor: "Puertos · cadenas logísticas", motion: "maritime" }),
      Object.freeze({ id: "mineria", number: "03", name: "Minería & recursos", descriptor: "Recursos críticos · reservas", motion: "mining" }),
      Object.freeze({ id: "infraestructura", number: "04", name: "Infraestructura", descriptor: "Conectividad · servicios esenciales", motion: "infrastructure" })
    ]),
    metrics: Object.freeze([
      Object.freeze({ value: "$6.4", suffix: "MM", label: "Capital gestionado" }),
      Object.freeze({ value: "24", suffix: "", label: "Compañías en propiedad" }),
      Object.freeze({ value: "33", suffix: "años", label: "Horizonte medio de tenencia" }),
      Object.freeze({ value: "0", suffix: "", label: "Ventas forzadas · en 33 años" })
    ]),
    offices: Object.freeze([
      Object.freeze({ city: "Quito", role: "Sede · Andes" }),
      Object.freeze({ city: "Houston", role: "Energía" }),
      Object.freeze({ city: "Róterdam", role: "Marítimo" }),
      Object.freeze({ city: "Singapur", role: "Asia-Pacífico" })
    ]),
    companies: companyFolios
  });
})();
