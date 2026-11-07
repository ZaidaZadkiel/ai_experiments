-- Schema for the greeter database. See REQUIREMENTS.md, "Data model".
-- Safe to run more than once: existing tables and data are kept.

CREATE TABLE IF NOT EXISTS names (
  -- Normalized name (FR-21); unique ignoring case for A to Z (FR-22).
  name TEXT PRIMARY KEY COLLATE NOCASE,
  -- ISO 8601 timestamp in UTC, such as 2026-11-04T15:30:00.000Z.
  last_time_seen TEXT,
  -- Consideration count; a new record starts at 1 (FR-18).
  considered INTEGER NOT NULL DEFAULT 1
);
