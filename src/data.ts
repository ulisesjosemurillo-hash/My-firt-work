import { SubscriptionTier } from "./types";

export interface SaasPlan {
  id: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  badgeColor: string;
}

export const SAAS_PLANS: SaasPlan[] = [
  {
    id: SubscriptionTier.FREE,
    name: "Plan Defensor Básico",
    price: "Gratuito",
    period: "para siempre",
    description: "Sistematización básica de actas para un usuario.",
    features: [
      "Hasta 3 transcripciones al mes",
      "Agenda Virtual de audiencias básica",
      "Auditoría básica de plazos de prisión",
      "Exportación en Word con formato simple"
    ],
    badgeColor: "bg-slate-600 text-slate-100"
  },
  {
    id: SubscriptionTier.PRO,
    name: "Plan JusticeTech Pro",
    price: "$79",
    period: "mes",
    description: "Para abogados penalistas y despachos en crecimiento.",
    features: [
      "Transcripciones en tiempo real ILIMITADAS",
      "Análisis de archivos Word y PDF (Requerimientos)",
      "Sistema OCR inteligente de DNI/Citaciones",
      "Búsqueda con Grounding en leyes reales (RAG)",
      "Hasta 25 auditorías de resoluciones al mes",
      "Soporte prioritario 24/7"
    ],
    badgeColor: "bg-amber-600 text-amber-50"
  },
  {
    id: SubscriptionTier.MASTER,
    name: "Plan Corporativo / Juzgados",
    price: "$299",
    period: "mes",
    description: "Licencia multi-usuario para Juzgados de Letras y Fiscalías.",
    features: [
      "Cuentas ilimitadas para Jueces, Secretarios y Defensores",
      "Sincronización total de la agenda del Juzgado en tiempo real",
      "Auditoría ilimitada basada en el Código Penal de Honduras",
      "Sistema de Alertas Críticas (Vencimiento de prisión preventiva)",
      "Asesor Legal de IA ilimitado con detección de contradicciones",
      "Exportación a plantilla oficial aprobada por el Poder Judicial"
    ],
    badgeColor: "bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold"
  }
];

export interface LawDeadline {
  name: string;
  term: string;
  description: string;
  lawSource: string;
  status: "crítico" | "moderado" | "informativo";
}

export const HONDURAS_LEGAL_DEADLINES: LawDeadline[] = [
  {
    name: "Término de la Inquisición",
    term: "24 Horas",
    description: "La policía debe poner al detenido a la orden de la autoridad judicial competente dentro de las 24 horas siguientes a su captura.",
    lawSource: "Constitución de la República, Art. 71",
    status: "crítico"
  },
  {
    name: "Audiencia de Declaración de Imputado",
    term: "Inmediato (dentro de las 24-48 horas)",
    description: "El juez debe celebrar la audiencia a la brevedad y decretar detención judicial para el término de la inquisición o libertad.",
    lawSource: "Código Procesal Penal, Art. 292",
    status: "crítico"
  },
  {
    name: "Plazo de la Detención Judicial para la Inquisición",
    term: "6 Días Máximo",
    description: "La detención para inquirir no podrá exceder de seis (6) días contados desde el momento del arresto. Antes de expirar este plazo debe celebrarse la Audiencia Inicial.",
    lawSource: "Constitución de la República, Art. 84",
    status: "crítico"
  },
  {
    name: "Prisión Preventiva Regular",
    term: "Hasta 2 Años",
    description: "No podrá exceder de un año en delitos menos graves y de dos años para delitos graves. Es prorrogable excepcionalmente por seis meses.",
    lawSource: "Código Procesal Penal, Art. 182",
    status: "moderado"
  },
  {
    name: "Audiencia Preliminar",
    term: "Dentro de los 60 días siguientes",
    description: "Posterior al auto de formal procesamiento, se señalará fecha para dilucidar la elevación a juicio público.",
    lawSource: "Código Procesal Penal, Art. 300",
    status: "informativo"
  }
];

export const SAMPLE_HONDURAN_PRESETS = [
  {
    title: "Casación N° 05-2023 - Homicidio Simple",
    keyword: "Homicidio",
    text: "Criterio de la Sala de lo Penal de la Corte Suprema de Honduras sobre la adecuación punitiva del dolo eventual en homicidio simple. Se rige por el Art. 192 del Código Penal, estableciendo una pena de entre quince (15) a veinte (20) años de prisión."
  },
  {
    title: "Casación N° 88-2022 - Tráfico de Drogas",
    keyword: "Drogas",
    text: "La Corte Suprema establece que para el delito de Tráfico de Drogas (Art. 311 Código Penal), la posesión facilitadora para el consumo de terceros es constitutiva de tráfico consumado, descartando la tentativa atípica."
  },
  {
    title: "Sentencia de Apelación - Prisión Cautelar",
    keyword: "Detención",
    text: "Doctrina constitucional de Habeas Corpus por exceso en el plazo de los seis días (Art. 84 de la Constitución). Se reitera que el cómputo de las 6 días corre de manera continua, incluyendo días considerados inhábiles administrativamente."
  }
];
