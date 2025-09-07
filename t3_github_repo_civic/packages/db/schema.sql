CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

DO $$ BEGIN
  CREATE TYPE object_type AS ENUM ('event','webinar','ecourse','news','story','workshop','book','game','quiz');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE engagement_level AS ENUM ('Get Started','Informed','Involved','Activated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE coverage_scope AS ENUM ('city','county','multi_county','state','multi_state','national','online');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_type object_type NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body_html TEXT,
  source_name TEXT,
  source_url TEXT,
  publish_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  pathways TEXT[] DEFAULT '{}',
  sub_pathways TEXT[] DEFAULT '{}',
  engagement_levels engagement_level[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  images JSONB DEFAULT '[]'::jsonb,
  access_guide JSONB DEFAULT '{}'::jsonb,
  resources JSONB DEFAULT '{}'::jsonb,
  policy JSONB DEFAULT '{}'::jsonb,
  responsible JSONB DEFAULT '{}'::jsonb,
  is_online BOOLEAN DEFAULT false,
  coverage coverage_scope DEFAULT 'online',
  city TEXT, county TEXT, state TEXT, zip TEXT,
  ocd_id TEXT, fips_county TEXT,
  lat DOUBLE PRECISION, lon DOUBLE PRECISION,
  geom geometry(Point, 4326),
  checksum TEXT, captured_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_type ON items(object_type);
CREATE INDEX IF NOT EXISTS idx_items_publish ON items(publish_date);
CREATE INDEX IF NOT EXISTS idx_items_geo ON items USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_items_city_state ON items(city, state);
CREATE INDEX IF NOT EXISTS idx_items_pathways ON items USING GIN (pathways);
CREATE INDEX IF NOT EXISTS idx_items_engagement ON items USING GIN (engagement_levels);
CREATE INDEX IF NOT EXISTS idx_items_keywords ON items USING GIN (keywords);
