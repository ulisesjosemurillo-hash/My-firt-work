import { X, Check } from "lucide-react";
import { SAAS_PLANS } from "../data";
import { SubscriptionTier } from "../types";

interface SaaSUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier) => void;
}

export default function SaaSUpgradeModal({
  isOpen,
  onClose,
  currentTier,
  onSelectTier,
}: SaaSUpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-10">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Escalabilidad Comercial SaaS
          </span>
          <h2 className="text-3xl font-bold text-white mt-3">Planes de Suscripción Justicia Rápida HN</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Optimiza tu desempeño en el Juzgado de Honduras. Integra RAG con leyes reales y mantén bajo estricto control los plazos de prisión preventiva.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAAS_PLANS.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const isBestValue = plan.id === SubscriptionTier.PRO;

            return (
              <div
                key={plan.id}
                className={`relative bg-slate-950 rounded-2xl p-6 border transition-all duration-300 flex flex-col ${
                  isBestValue
                    ? "border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10 shadow-lg scale-105 md:scale-105"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {isBestValue && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full shadow">
                    Más Vendido
                  </span>
                )}

                <div className="mb-6">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${plan.badgeColor}`}>
                    {plan.name}
                  </span>
                  <div className="flex items-baseline mt-4 mb-2">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    {plan.id !== SubscriptionTier.FREE && (
                      <span className="text-slate-500 text-xs ml-1">/ {plan.period}</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed min-h-[40px]">{plan.description}</p>
                </div>

                <div className="border-t border-slate-800/60 my-5"></div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-300 text-xs">
                      <span className="p-0.5 rounded-full bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    onSelectTier(plan.id);
                    onClose();
                  }}
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-xl text-center font-bold text-xs tracking-wider uppercase transition-all duration-350 ${
                    isCurrent
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800"
                      : isBestValue
                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 border border-amber-500"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  {isCurrent ? "Plan Activo" : "Seleccionar Plan"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8 pt-6 border-t border-slate-800">
          <p className="text-slate-500 text-[11px]">
            Todos los pagos están procesados por cifrado de nivel bancario. Licencia transferible de acuerdo a la Ley Judicial de Honduras.
          </p>
        </div>
      </div>
    </div>
  );
}
