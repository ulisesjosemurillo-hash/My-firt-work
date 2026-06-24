export enum SubscriptionTier {
  FREE = "FREE",
  PRO = "PRO",
  MASTER = "MASTER"
}

export enum Gender {
  MASCULINO = "MASCULINO",
  FEMENINO = "FEMENINO"
}

export interface Imputado {
  id: string;
  nombre: string;
  dni: string;
  nacionalidad: string;
  edad: string;
  estadoCivil: string;
  profesion: string;
  telefono: string;
  domicilio: string;
  nombrePadre: string;
  nombreMadre: string;
  fotoDni?: string; // base64 representation or placeholder
}

export interface Case {
  expediente: string;
  despacho: string;
  fecha: string;
  horaInicio: string;
  juez: string;
  secretario: string;
  tipoAudiencia: string;
  delito: string;
  victima: string;
  imputados: Imputado[];
  fiscales: string[];
  defensores: string[];
  defensaTipo: "Pública" | "Privada";
  acusadorPrivado?: string;
  resolucionPropuesta?: string;
  estado?: "Pendiente" | "Resuelto";
}

export interface AgendaEvent {
  id: string;
  exp: string;
  imputado: string;
  type: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: "verde" | "amarillo" | "rojo";
  motive?: string;
}

export interface AuditWarning {
  texto_erroneo: string;
  sugerencia: string;
  explicacion: string;
  color: "rojo" | "amarillo";
}

export interface RAGSource {
  title: string;
  url: string;
}

export interface RAGResponse {
  text: string;
  links: RAGSource[];
}
