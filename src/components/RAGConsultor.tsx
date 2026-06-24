import { useState } from "react";
import { BookOpen, Search, ExternalLink, ShieldCheck, Scale, Compass, HelpCircle } from "lucide-react";
import { RAGResponse, RAGSource } from "../types";

export default function RAGConsultor() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGResponse | null>(null);
  const [suggestedQueries] = useState([
    "Pena aplicable para delito de violación de plazos de prisión preventiva en Honduras",
    "Cuáles son las atenuantes para el delito de Tráfico de Drogas menor gravedad",
    "Casación penal de honduras sobre hurto calamitoso o robos con fuerza",
    "Procedimiento abreviado bajo el código procesal penal de Honduras requisitos"
  ]);

  const handleQuerySearch = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/gemini/rag-laws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term }),
      });

      if (!response.ok) {
        throw new Error("Failed to query RAG database");
      }

      const data = await response.json();
      setResult({
        text: data.text,
        links: data.links || [],
      });
    } catch (error) {
      console.error("Error matching vectors:", error);
      setResult({
        text: "Ocurrió un error consultando la base de datos de jurisprudencia. Asegúrate de que el servidor esté activo y la API key correctamente vinculada.",
        links: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Base de Jurisprudencia RAG & Grounding
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Consulta en tiempo real doctrina, jurisprudencia y leyes reales de Honduras con verificación por Google Search Grounding.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Search Terminal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800/40">
              <Search className="w-3.5 h-3.5 text-amber-500" />
              Terminal de Consulta Legal
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: Requisitos de la prisión preventiva en el Código Procesal de Honduras..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQuerySearch(query);
                }}
                className="input-area flex-grow p-3 rounded-xl text-sm uppercase font-medium bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleQuerySearch(query)}
                disabled={loading || !query.trim()}
                className="btn-primary px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0"
              >
                {loading ? "Buscando..." : "Consultar"}
              </button>
            </div>

            {loading && (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="loader border-4 border-slate-800 border-l-amber-500 rounded-full w-8 h-8 animate-spin"></div>
                <p className="text-slate-500 text-xs font-mono">Buscando doctrina de la Corte Suprema de Honduras...</p>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 text-xs leading-relaxed max-w-none prose prose-invert font-sans">
                  {result.text.split("\n").map((para, idx) => (
                    <p key={idx} className="mb-3">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Grounding Sources */}
                {result.links.length > 0 && (
                  <div className="p-4 bg-blue-950/20 rounded-xl border border-blue-900/20">
                    <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4" />
                      Fuentes con Grounding Verificado de la Corte y Leyes:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {result.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[10px] text-blue-400 hover:text-blue-300 hover:border-blue-500/20 transition-all truncate"
                        >
                          <span className="truncate font-sans font-medium">{link.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Helper Suggestions & Reference Indexes */}
        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800/40">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              Sugerencias de Consulta
            </h3>

            <p className="text-[11px] text-slate-400">
              Usa estas frases recomendadas para probar búsquedas sobre doctrina penal hondureña y penalidades:
            </p>

            <div className="flex flex-col gap-2 mt-1">
              {suggestedQueries.map((suggested, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(suggested);
                    handleQuerySearch(suggested);
                  }}
                  className="p-3 text-left bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800/80 text-[10px] text-slate-300 font-sans hover:border-amber-500/30 transition-all font-medium leading-relaxed"
                >
                  {suggested}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              Leyes de Honduras Incluidas en RAG
            </h4>
            <ul className="text-[10px] text-slate-400 space-y-2">
              <li className="flex justify-between border-b border-slate-800/40 pb-1.5">
                <span>Código Penal (Dec. 130-2017)</span>
                <span className="text-amber-500 font-mono">100% Indexado</span>
              </li>
              <li className="flex justify-between border-b border-slate-800/40 pb-1.5">
                <span>Código Procesal Penal (Efectos)</span>
                <span className="text-amber-500 font-mono">100% Indexado</span>
              </li>
              <li className="flex justify-between border-b border-slate-800/40 pb-1.5">
                <span>Constitución de la República (Garantías)</span>
                <span className="text-amber-500 font-mono">100% Indexado</span>
              </li>
              <li className="flex justify-between pb-1">
                <span>Doctrinas & Sentencias de Casación de Honduras</span>
                <span className="text-amber-500 font-mono">Fusión Grounding</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
