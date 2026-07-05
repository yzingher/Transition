-- Project Ledger core schema (PRD §6).
-- Mirrors the file-based registries in /data; those files remain the canonical
-- seed until ingestion goes live. Apply with: pnpm supabase db push

create extension if not exists "pgcrypto";

-- Every document we rely on. A source is immutable once verified: the sha256
-- pins exactly what was retrieved (P1).
create table sources (
    id            text primary key,
    type          text not null,
    title         text not null,
    publisher     text,
    url           text,
    retrieved_at  timestamptz,
    sha256        text,
    storage_path  text,                     -- Supabase storage object for the retrieved artefact
    status        text not null default 'placeholder'
                  check (status in ('placeholder', 'verified')),
    notes         text,
    created_at    timestamptz not null default now(),
    constraint verified_sources_are_pinned
        check (status <> 'verified' or (sha256 is not null and retrieved_at is not null))
);

-- Councils, departments, regulators, providers; ownership graph via parent_id.
create table entities (
    id                      text primary key,
    name                    text not null,
    kind                    text not null
                            check (kind in ('council', 'department', 'regulator', 'public-body', 'provider', 'trust')),
    companies_house_number  text,
    parent_id               text references entities (id),
    aliases                 jsonb not null default '[]',
    fictional               boolean not null default false,
    notes                   text,
    created_at              timestamptz not null default now()
);

-- Atomic extracted facts. LLMs extract; the extraction method + prompt hash is
-- part of the provenance chain. Values are never edited: supersede instead.
create table claims (
    id             text primary key,
    statement      text not null,
    value_low      numeric not null,
    value_mid      numeric not null,
    value_high     numeric not null,
    unit           text not null,
    entity_id      text references entities (id),
    period         text not null,
    source_id      text not null references sources (id),
    method         jsonb not null,          -- {kind, prompt_hash, model, ...}
    confidence     text not null check (confidence in ('none', 'low', 'medium', 'high')),
    status         text not null default 'unverified'
                   check (status in ('unverified', 'verified', 'superseded')),
    verified_by    text,
    superseded_by  text references claims (id),
    notes          text,
    created_at     timestamptz not null default now(),
    constraint value_ordered check (value_low <= value_mid and value_mid <= value_high),
    constraint verified_claims_are_signed check (status <> 'verified' or verified_by is not null)
);

-- Versioned model definitions. The YAML in /models is canonical; rows here are
-- published snapshots so deltas can pin an exact version.
create table cost_models (
    id           text not null,
    version      text not null,
    title        text not null,
    sector       text not null,
    unit         text not null,
    status       text not null default 'draft' check (status in ('draft', 'review', 'published')),
    definition   jsonb not null,             -- full parsed YAML
    p10          numeric,
    p50          numeric,
    p90          numeric,
    created_at   timestamptz not null default now(),
    primary key (id, version)
);

-- FOI request lifecycle. The 20-working-day clock fields drive the persistent
-- worker's escalation logic (pipelines/src/pipelines/foi/clock.py).
create table foi_requests (
    id                 uuid primary key default gen_random_uuid(),
    authority_id       text not null references entities (id),
    batch              text,                 -- human-approved batch identifier (P5/P6: no bulk blasts)
    subject            text not null,
    body               text not null,
    status             text not null default 'draft'
                       check (status in ('draft', 'approved', 'sent', 'acknowledged',
                                         'responded', 'internal_review', 'ico_complaint', 'closed')),
    wdtk_id            text,                 -- WhatDoTheyKnow request id (public by default, P5)
    sent_at            date,
    response_due       date,                 -- 20 working days from receipt (FOIA s10)
    responded_at       date,
    classification     text
                       check (classification in ('full', 'partial', 's12_cost_refusal',
                                                 's43_commercial_refusal', 's14_vexatious', 'silence')),
    review_due         date,
    outcome            text,
    correspondence     jsonb not null default '[]',
    created_at         timestamptz not null default now()
);

-- Should-cost vs does-cost, classified by mechanism (the fix differs per class).
create table deltas (
    id                     uuid primary key default gen_random_uuid(),
    cost_model_id          text not null,
    cost_model_version     text not null,
    buyer_id               text not null references entities (id),
    does_cost_claim_id     text not null references claims (id),
    period                 text not null,
    should_cost_p10        numeric not null,
    should_cost_p50        numeric not null,
    should_cost_p90        numeric not null,
    does_cost              numeric not null,
    unit                   text not null,
    classification         text not null default 'unexplained'
                           check (classification in ('scarcity_pricing', 'procurement_failure',
                                                     'regulatory_gold_plating', 'excess_margin',
                                                     'fraud_error', 'unexplained')),
    gross_delta            numeric,          -- conservative: does_cost - should_cost_p90 (P3)
    recoverable            numeric,
    recovery_curve         jsonb,            -- [{year, amount, binding_constraint}]
    notes                  text,
    created_at             timestamptz not null default now(),
    foreign key (cost_model_id, cost_model_version) references cost_models (id, version)
);

-- Publishable units. The publication gate (P1/P4/P6) is enforced in CI against
-- /published; this table records the same state for the live site.
create table findings (
    id                    text primary key,
    title                 text not null,
    body_path             text not null,     -- path in /published
    delta_ids             jsonb not null default '[]',
    claim_ids             jsonb not null default '[]',
    status                text not null default 'draft'
                          check (status in ('draft', 'review', 'published')),
    right_of_reply        jsonb,             -- [{entity_id, sent_at, deadline, response_verbatim}]
    reviewed_by           text,
    published_at          timestamptz,
    created_at            timestamptz not null default now(),
    constraint published_findings_are_signed
        check (status <> 'published' or (reviewed_by is not null and published_at is not null))
);

create index claims_source_idx on claims (source_id);
create index claims_entity_idx on claims (entity_id);
create index foi_requests_authority_idx on foi_requests (authority_id);
create index foi_requests_due_idx on foi_requests (response_due) where status in ('sent', 'acknowledged');
create index deltas_buyer_idx on deltas (buyer_id);
