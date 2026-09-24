-- Delta Tire Fleet: initial schema
-- Tread depths are stored in 32nds of an inch. Dates are ISO text (YYYY-MM-DD).

CREATE TABLE carriers (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE units (
  id              INTEGER PRIMARY KEY,
  unit_number     TEXT NOT NULL UNIQUE,              -- e.g. "231", "RL203"
  unit_class      TEXT NOT NULL CHECK (unit_class IN ('tractor','trailer')),
  equipment_type  TEXT,                              -- Tractor, Semi-truck trailer, Chassis, ...
  carrier_id      INTEGER REFERENCES carriers(id),
  plate           TEXT,                              -- not unique: source data has duplicates
  vin             TEXT UNIQUE,
  axle_layout     TEXT NOT NULL,                     -- key into the app's layout config, e.g. tractor_6x4
  mvi_expiry      TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','out_of_service','retired')),
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_units_carrier ON units(carrier_id);
CREATE INDEX idx_units_class ON units(unit_class);

CREATE TABLE tires (
  id                  INTEGER PRIMARY KEY,
  serial_number       TEXT,
  dot_code            TEXT,                          -- full DOT string as printed
  dot_week            INTEGER CHECK (dot_week BETWEEN 1 AND 53),
  dot_year            INTEGER CHECK (dot_year BETWEEN 1990 AND 2100),
  brand               TEXT,
  model               TEXT,
  size                TEXT,                          -- e.g. 11R22.5
  tire_type           TEXT NOT NULL DEFAULT 'new' CHECK (tire_type IN ('new','retread')),
  original_tread_32   REAL,
  unit_id             INTEGER REFERENCES units(id),  -- NULL when not mounted
  position            TEXT,                          -- e.g. A1-L, A2-LO, A2-LI
  install_date        TEXT,
  status              TEXT NOT NULL DEFAULT 'mounted' CHECK (status IN ('mounted','in_stock','scrapped')),
  notes               TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((unit_id IS NULL) = (position IS NULL))
);
-- Only one tire can sit in a given position on a given unit
CREATE UNIQUE INDEX uq_tire_position ON tires(unit_id, position) WHERE unit_id IS NOT NULL;
CREATE INDEX idx_tires_unit ON tires(unit_id);

-- Every mount, removal and rotation, so each tire has a history
CREATE TABLE tire_moves (
  id              INTEGER PRIMARY KEY,
  tire_id         INTEGER NOT NULL REFERENCES tires(id),
  from_unit_id    INTEGER REFERENCES units(id),
  from_position   TEXT,
  to_unit_id      INTEGER REFERENCES units(id),
  to_position     TEXT,
  moved_at        TEXT NOT NULL DEFAULT (date('now')),
  reason          TEXT,                              -- install, rotation, removed_worn, damaged, ...
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_moves_tire ON tire_moves(tire_id);

CREATE TABLE inspections (
  id              INTEGER PRIMARY KEY,
  tire_id         INTEGER NOT NULL REFERENCES tires(id),
  unit_id         INTEGER REFERENCES units(id),      -- where the tire was at inspection time
  position        TEXT,
  inspected_at    TEXT NOT NULL DEFAULT (date('now')),
  tread_outer_32  REAL,
  tread_center_32 REAL,
  tread_inner_32  REAL,
  pressure_psi    REAL,
  condition       TEXT,                              -- ok, irregular_wear, cut, bulge, ...
  notes           TEXT,
  inspector       TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_insp_tire_date ON inspections(tire_id, inspected_at);

CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  REAL NOT NULL,
  label  TEXT
);

-- Defaults are editable in the app. Confirm tread minimums against current BC rules.
INSERT INTO settings (key, value, label) VALUES
  ('steer_critical_32',   4, 'Steer: at or below this is critical'),
  ('steer_warn_32',       6, 'Steer: at or below this is a warning'),
  ('drive_critical_32',   2, 'Drive: at or below this is critical'),
  ('drive_warn_32',       4, 'Drive: at or below this is a warning'),
  ('trailer_critical_32', 2, 'Trailer: at or below this is critical'),
  ('trailer_warn_32',     4, 'Trailer: at or below this is a warning'),
  ('age_warn_years',      5, 'Tire age warning (years from DOT date)'),
  ('age_critical_years', 10, 'Tire age critical (years from DOT date)'),
  ('mvi_warn_days',      30, 'Warn this many days before MVI expiry');

-- One row per mounted tire with its latest inspection and computed status.
-- The dashboard reads from this view.
CREATE VIEW v_tire_status AS
WITH latest AS (
  SELECT i.*,
         ROW_NUMBER() OVER (PARTITION BY i.tire_id ORDER BY i.inspected_at DESC, i.id DESC) AS rn
  FROM inspections i
),
s AS (
  SELECT
    MAX(CASE WHEN key='steer_critical_32'   THEN value END) AS steer_crit,
    MAX(CASE WHEN key='steer_warn_32'       THEN value END) AS steer_warn,
    MAX(CASE WHEN key='drive_critical_32'   THEN value END) AS drive_crit,
    MAX(CASE WHEN key='drive_warn_32'       THEN value END) AS drive_warn,
    MAX(CASE WHEN key='trailer_critical_32' THEN value END) AS trailer_crit,
    MAX(CASE WHEN key='trailer_warn_32'     THEN value END) AS trailer_warn,
    MAX(CASE WHEN key='age_warn_years'      THEN value END) AS age_warn,
    MAX(CASE WHEN key='age_critical_years'  THEN value END) AS age_crit
  FROM settings
),
base AS (
  SELECT
    t.id AS tire_id, t.serial_number, t.brand, t.model, t.size, t.tire_type,
    t.dot_week, t.dot_year, t.position,
    u.id AS unit_id, u.unit_number, u.unit_class, u.equipment_type, u.plate, u.mvi_expiry,
    c.name AS carrier,
    CASE
      WHEN u.unit_class = 'tractor' AND t.position LIKE 'A1-%' THEN 'steer'
      WHEN u.unit_class = 'tractor' THEN 'drive'
      ELSE 'trailer'
    END AS axle_role,
    l.inspected_at AS last_inspected,
    l.pressure_psi, l.condition,
    MIN(COALESCE(l.tread_outer_32, 99), COALESCE(l.tread_center_32, 99), COALESCE(l.tread_inner_32, 99)) AS min_tread_raw,
    CASE WHEN t.dot_year IS NOT NULL THEN
      ROUND((julianday('now') - julianday(date(t.dot_year || '-01-01', '+' || ((COALESCE(t.dot_week,1) - 1) * 7) || ' days'))) / 365.25, 1)
    END AS age_years
  FROM tires t
  JOIN units u ON u.id = t.unit_id
  LEFT JOIN carriers c ON c.id = u.carrier_id
  LEFT JOIN latest l ON l.tire_id = t.id AND l.rn = 1
  WHERE t.status = 'mounted' AND u.status = 'active'
),
calc AS (
  SELECT b.*,
    CASE WHEN b.min_tread_raw = 99 THEN NULL ELSE b.min_tread_raw END AS min_tread_32,
    CASE b.axle_role WHEN 'steer' THEN s.steer_crit WHEN 'drive' THEN s.drive_crit ELSE s.trailer_crit END AS crit_32,
    CASE b.axle_role WHEN 'steer' THEN s.steer_warn WHEN 'drive' THEN s.drive_warn ELSE s.trailer_warn END AS warn_32,
    s.age_warn, s.age_crit
  FROM base b CROSS JOIN s
)
SELECT
  tire_id, serial_number, brand, model, size, tire_type, dot_week, dot_year, age_years,
  unit_id, unit_number, unit_class, equipment_type, plate, mvi_expiry, carrier,
  position, axle_role, last_inspected, min_tread_32, pressure_psi, condition,
  CASE
    WHEN min_tread_32 IS NULL THEN 'no_data'
    WHEN min_tread_32 <= crit_32 THEN 'critical'
    WHEN min_tread_32 <= warn_32 THEN 'warning'
    ELSE 'ok'
  END AS tread_status,
  CASE
    WHEN age_years IS NULL THEN 'no_data'
    WHEN age_years >= age_crit THEN 'critical'
    WHEN age_years >= age_warn THEN 'warning'
    ELSE 'ok'
  END AS age_status,
  -- Overall: worst of tread and age. 3 = critical, 2 = warning, 1 = no data, 0 = ok
  MAX(
    CASE WHEN min_tread_32 IS NULL THEN 1 WHEN min_tread_32 <= crit_32 THEN 3 WHEN min_tread_32 <= warn_32 THEN 2 ELSE 0 END,
    CASE WHEN age_years IS NULL THEN 0 WHEN age_years >= age_crit THEN 3 WHEN age_years >= age_warn THEN 2 ELSE 0 END
  ) AS severity
FROM calc;
