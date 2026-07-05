/**
 * Build-time loaders: the repo itself is the data source (decisions/0001).
 * Server components only — reads /models, /data, /published, /decisions
 * relative to the repo root (web/ is a workspace package one level down).
 */
import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

import type { CostModelDef } from "@/lib/engine";

const REPO_ROOT = join(process.cwd(), "..");

export interface Source {
  id: string;
  type: string;
  title: string;
  publisher: string | null;
  url: string | null;
  retrieved_at: string | null;
  sha256: string | null;
  status: "placeholder" | "verified";
  notes?: string;
}

export interface Claim {
  id: string;
  statement: string;
  value: { low: number; mid: number; high: number };
  unit: string;
  entity_id: string | null;
  period: string;
  source_id: string;
  method: { kind: string };
  confidence: string;
  status: "unverified" | "verified";
  verified_by: string | null;
  notes?: string;
}

export interface Entity {
  id: string;
  name: string;
  kind: string;
  fictional?: boolean;
}

export interface FindingMeta {
  id: string;
  title: string;
  status: "draft" | "review" | "published";
  models: string[];
  claims: string[];
  reviewed_by: string | null;
  dir: string;
  body: string;
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(REPO_ROOT, rel), "utf8")) as T;
}

export function loadSources(): Source[] {
  return readJson<{ sources: Source[] }>("data/sources.json").sources;
}

export function loadClaims(): Claim[] {
  return readJson<{ claims: Claim[] }>("data/claims.json").claims;
}

export function loadEntities(): Entity[] {
  return readJson<{ entities: Entity[] }>("data/entities.json").entities;
}

export function loadModels(): CostModelDef[] {
  const dir = join(REPO_ROOT, "models");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => parse(readFileSync(join(dir, f), "utf8")) as CostModelDef)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function loadModel(id: string): CostModelDef | null {
  return loadModels().find((m) => m.id === id) ?? null;
}

const FRONT_MATTER = /^---\n([\s\S]*?)\n---\n/;

export function loadFindings(): FindingMeta[] {
  const dir = join(REPO_ROOT, "published");
  const findings: FindingMeta[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const text = readFileSync(join(dir, entry.name, "finding.md"), "utf8");
    const match = FRONT_MATTER.exec(text);
    if (!match) continue;
    const fm = parse(match[1]) as Omit<FindingMeta, "dir" | "body">;
    findings.push({ ...fm, dir: entry.name, body: text.slice(match[0].length) });
  }
  return findings.sort((a, b) => b.dir.localeCompare(a.dir));
}

export interface Decision {
  file: string;
  title: string;
  body: string;
}

export function loadDecisions(): Decision[] {
  const dir = join(REPO_ROOT, "decisions");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file) => {
      const text = readFileSync(join(dir, file), "utf8");
      const title = text.match(/^# (.+)$/m)?.[1] ?? file;
      return { file, title, body: text };
    });
}
