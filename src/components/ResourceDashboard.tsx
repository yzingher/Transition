"use client";

import { GameState } from "@/engine/types";
import { projectNextChapter, ResourceFlow } from "@/engine/resourceLogic";

interface ResourceDashboardProps {
  state: GameState;
  onClose: () => void;
}

export default function ResourceDashboard({ state, onClose }: ResourceDashboardProps) {
  const projection = projectNextChapter(state);

  return (
    <div className="fixed inset-0 z-[80] bg-stone-950/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-[480px] mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sticky top-0 bg-stone-950/95 backdrop-blur-sm pb-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-stone-300">
            Resource Dashboard
          </h2>
          <button
            onClick={onClose}
            className="font-mono text-[11px] text-amber uppercase tracking-wider hover:text-amber-bright transition-colors"
          >
            Close ×
          </button>
        </div>

        {/* Indicator strip */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <IndicatorCell
            label="Unemployment"
            value={`${state.worldState.economicIndicators.unemploymentRate.toFixed(1)}%`}
          />
          <IndicatorCell
            label="GDP Growth"
            value={`${state.worldState.economicIndicators.gdpGrowth >= 0 ? "+" : ""}${state.worldState.economicIndicators.gdpGrowth.toFixed(1)}%`}
          />
          <IndicatorCell
            label="Gini"
            value={state.worldState.economicIndicators.giniCoefficient.toFixed(1)}
          />
          <IndicatorCell
            label="AI Adoption"
            value={`${state.worldState.economicIndicators.aiAdoptionRate.toFixed(0)}%`}
          />
          <IndicatorCell
            label="Talent Flow"
            value={`${state.worldState.economicIndicators.netTalentFlow >= 0 ? "+" : ""}${state.worldState.economicIndicators.netTalentFlow.toFixed(1)}`}
          />
          <IndicatorCell
            label="Public Trust"
            value={state.worldState.economicIndicators.publicTrustIndex.toFixed(0)}
          />
        </div>

        {/* Resources with flows */}
        <ResourceCard
          title="Budget"
          subtitle="£ billions, fiscal capacity"
          icon="£"
          color="#c4a95c"
          current={projection.budget.current}
          projected={projection.budget.projected}
          flows={projection.budget.flows}
        />
        <ResourceCard
          title="Talent"
          subtitle="Skilled people — allocated, not spent"
          icon="◆"
          color="#6b9e6b"
          current={projection.talent.current}
          projected={projection.talent.projected}
          flows={projection.talent.flows}
        />
        <ResourceCard
          title="Compute"
          subtitle="National AI infrastructure"
          icon="⬡"
          color="#8e9eb4"
          current={projection.compute.current}
          projected={projection.compute.projected}
          flows={projection.compute.flows}
        />

        {/* Active policies */}
        {state.activePolicies.length > 0 && (
          <div className="mt-5 p-3 rounded border border-stone-700/60 bg-stone-900/40">
            <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-2">
              Active Policies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {state.activePolicies.map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pending consequences teaser */}
        {state.pendingConsequences.length > 0 && (
          <div className="mt-4 p-3 rounded border border-amber/20 bg-amber/5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-amber/80 mb-1">
              Still Unfolding
            </p>
            <p className="text-xs text-stone-300">
              {state.pendingConsequences.length} consequence{state.pendingConsequences.length === 1 ? "" : "s"} from earlier decisions will arrive in future chapters.
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded border border-amber/50 bg-amber/10 text-amber font-mono text-xs uppercase tracking-wider hover:bg-amber/20 transition-colors"
        >
          Back to Triage
        </button>
      </div>
    </div>
  );
}

function IndicatorCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded border border-stone-800 bg-stone-900/40 text-center">
      <p className="font-mono text-[8px] uppercase tracking-widest text-stone-500 mb-0.5">
        {label}
      </p>
      <p className="font-mono text-sm text-stone-200 tabular-nums">{value}</p>
    </div>
  );
}

function ResourceCard({
  title,
  subtitle,
  icon,
  color,
  current,
  projected,
  flows,
}: {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  current: number;
  projected: number;
  flows: ResourceFlow[];
}) {
  const delta = projected - current;
  return (
    <div className="mb-3 p-3 rounded border border-stone-700/60 bg-stone-900/40">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg" style={{ color }}>
              {icon}
            </span>
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-stone-200">
              {title}
            </h3>
          </div>
          <p className="text-[10px] text-stone-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right">
          <span
            className="font-mono text-xl tabular-nums font-semibold"
            style={{ color }}
          >
            {Math.round(current)}
          </span>
          <div className="font-mono text-[10px] text-stone-500">
            → {Math.round(projected)} next
            <span
              className={
                delta > 0
                  ? "text-emerald-400 ml-1"
                  : delta < 0
                    ? "text-red-400 ml-1"
                    : "text-stone-500 ml-1"
              }
            >
              ({delta > 0 ? "+" : ""}
              {Math.round(delta)})
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-stone-800 flex flex-col gap-0.5">
        {flows.map((f, i) => (
          <div
            key={i}
            className="flex justify-between font-mono text-[10px]"
          >
            <span className="text-stone-400">{f.label}</span>
            <span
              className={
                f.value > 0
                  ? "text-emerald-400 tabular-nums"
                  : f.value < 0
                    ? "text-red-400 tabular-nums"
                    : "text-stone-400 tabular-nums"
              }
            >
              {f.value > 0 ? "+" : ""}
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
