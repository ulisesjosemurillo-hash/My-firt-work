import { Scale, Clock, ShieldAlert, Award, Calendar, FolderOpen, ArrowRight, TrendingUp } from "lucide-react";
import { HONDURAS_LEGAL_DEADLINES } from "../data";
import { AgendaEvent, SubscriptionTier } from "../types";

interface SaasDashboardProps {
  subscriptionTier: SubscriptionTier;
  onUpgradeClick: () => void;
  agendaEvents: AgendaEvent[];
  onEventClick: (event: AgendaEvent) => void;
  activeCasesCount: number;
}

export default function SaasDashboard({
  subscriptionTier,
  onUpgradeClick,
  agendaEvents,
  onEventClick,
  activeCasesCount,
}: SaasDashboardProps) {
  // Compute some dashboard indicators dynamically
  const upcomingHearings = agendaEvents.filter((e) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(e.date + "T00:00:00");
    return eventDate >= today;
  });

  const criticalAlerts = agendaEvents.filter((e) => e.status === "rojo").length;
  const warnings = agendaEvents.filter((e) => e.status === "amarillo").length;

  return (
    <div className="space-y-6">
      {/* SaaS Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 rounded-2xl p-6 border border-amber-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/10 text-amber-500 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border border-amber-500/20">
              {subscriptionTier === SubscriptionTier.MASTER
                ? "Licencia Juzgado Integrado"
                : subscriptionTier === SubscriptionTier.PRO
                ? "Suscripción JusticeTech Pro"
                : "Licencia Gratuita de Prueba"}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1.5 font-sans tracking-tight">
            Sala Judicial de Justicia Rápida
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Plataforma comercial unificada de audiencias, análisis penal y control de plazos cautelares de Honduras.
          </p>
        </div>

        <button
          type="button"
          onClick={onUpgradeClick}
          className="btn-accent px-4 py-2 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 shrink-0"
        >
          <Award className="w-4 h-4" />
          {subscriptionTier === SubscriptionTier.MASTER ? "Suscripción Enterprise" : "Subir de Nivel / Facturación"}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 p-5 rounded-2xl flex items-start gap-4 shadow-md hover:border-slate-800 transition-all">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Expedientes Activos
            </span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block">{activeCasesCount}</span>
            <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> Sincronizado local
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 p-5 rounded-2xl flex items-start gap-4 shadow-md hover:border-slate-800 transition-all">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Audiencias Señaladas
            </span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block">{agendaEvents.length}</span>
            <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
              {upcomingHearings.length} próximas programadas
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 p-5 rounded-2xl flex items-start gap-4 shadow-md hover:border-slate-800 transition-all">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Plazos Críticos
            </span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block">{criticalAlerts}</span>
            <span className="text-[9px] text-red-400 flex items-center gap-1 mt-1 font-mono">
              ● Requiere revisión inmediata
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 p-5 rounded-2xl flex items-start gap-4 shadow-md hover:border-slate-800 transition-all">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Alertas Moderadas
            </span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block">{warnings}</span>
            <span className="text-[9px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              Dentro de plazos regulares
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Law Deadlines & Case Docket */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        {/* Deadlines Monitor según Legislación de Honduras */}
        <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-500" />
              Saber Legal: Plazos Procesales Clave HN
            </h3>
            <span className="text-[9px] bg-slate-800 text-slate-400 py-0.5 px-2 rounded font-mono">
              Ordenamiento Penal
            </span>
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto custom-scroll pr-1.5">
            {HONDURAS_LEGAL_DEADLINES.map((deadline, idx) => {
              const statusColors =
                deadline.status === "crítico"
                  ? "bg-red-950 text-red-400 border-red-900/40"
                  : deadline.status === "moderado"
                  ? "bg-amber-950 text-amber-400 border-amber-900/30"
                  : "bg-slate-900 text-slate-400 border-slate-800";

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 ${statusColors} transition-all`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-xs">{deadline.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-black/30 rounded font-extrabold uppercase">
                      {deadline.term}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {deadline.description}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>{deadline.lawSource}</span>
                    <span className="capitalize">{deadline.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Agenda Alerts & Vencimientos */}
        <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              Alertas del Rol Judicial de Audiencias
            </h3>
            <span className="text-[9px] bg-slate-800 text-slate-400 py-0.5 px-2 rounded font-mono">
              Honduras Calendar
            </span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scroll pr-1.5 flex-grow">
            {agendaEvents.length === 0 ? (
              <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-2">
                <Calendar className="w-8 h-8 text-slate-600 animate-pulse" />
                <p className="text-xs">No hay audiencias agendadas en el sistema.</p>
                <p className="text-[10px] text-slate-600 max-w-xs leading-relaxed">
                  Crea expedientes o programa de forma manual en la agenda virtual para ver el control de alertas.
                </p>
              </div>
            ) : (
              agendaEvents.map((event) => {
                const statusColorClass =
                  event.status === "rojo"
                    ? "border-l-4 border-l-red-500 bg-red-950/30 text-red-200 border-red-900/20"
                    : event.status === "amarillo"
                    ? "border-l-4 border-l-yellow-500 bg-yellow-950/20 text-yellow-200 border-yellow-900/20"
                    : "border-l-4 border-l-emerald-500 bg-slate-900/60 text-slate-200 border-slate-800";

                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`p-3.5 rounded-xl border flex justify-between items-start cursor-pointer hover:scale-[1.01] hover:bg-slate-900/80 transition-all ${statusColorClass}`}
                  >
                    <div className="flex flex-col gap-1 w-3/4">
                      <span className="text-[11px] font-mono text-slate-400">Expediente: {event.exp || "S/EXP"}</span>
                      <span className="font-bold text-xs truncate max-w-[280px] text-white">
                        {event.imputado || "IMPUTADO INDETERMINADO"}
                      </span>
                      <span className="text-[10px] text-amber-500/95 font-medium">{event.type}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1 font-mono">
                      <span className="text-xs text-slate-100 font-bold">{event.date}</span>
                      <span className="text-[10px] text-slate-400 bg-black/40 px-2 py-0.5 rounded font-extrabold uppercase">
                        {event.time}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
