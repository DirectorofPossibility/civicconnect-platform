import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Pool } from 'pg';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || 't3',
  user: process.env.POSTGRES_USER || 't3',
  password: process.env.POSTGRES_PASSWORD || 't3pass',
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'error', error: String(e) });
  }
});

app.get('/geo/resolve', async (req, res) => {
  const zip = String(req.query.zip || '');
  if (!zip) return res.status(400).json({ error: 'zip is required' });
  if (zip === '77002') {
    return res.json({
      zip, place: 'Houston', county: 'Harris County', state: 'TX',
      lat: 29.7569, lon: -95.3657, fips_county: '48201',
      ocd_id: 'ocd-division/country:us/state:tx/place:houston',
      time_zone: 'America/Chicago'
    });
  }
  return res.json({ zip, place: 'Unknown', time_zone: 'America/Chicago' });
});

// Google Civic Information API integration with graceful fallback
app.get('/civic/representatives', async (req, res) => {
  const zip = String(req.query.zip || '');
  const address = String(req.query.address || '');
  const key = process.env.GOOGLE_CIVIC_API_KEY;
  const input = address || zip;
  if (!input) return res.status(400).json({ error: 'zip or address is required' });

  // If no key, fallback to stub
  if (!key) {
    const officials = (zip === '77002') ? [
      { name: 'Houston Mayor', role: 'City - Executive', level: 'city', website: 'https://www.houstontx.gov' },
      { name: 'District C Council Member', role: 'City Council', level: 'city', website: 'https://www.houstontx.gov' }
    ] : [];
    return res.json({ source: 'stub', officials, agencies: [] });
  }

  try {
    const url = new URL('https://civicinfo.googleapis.com/civicinfo/v2/representatives');
    url.searchParams.set('key', key);
    url.searchParams.set('address', input);
    // Optionally: url.searchParams.set('includeOffices', 'true');

    const r = await fetch(url.toString());
    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: 'civic api error', detail: txt.slice(0, 500) });
    }
    const data = await r.json();

    // Normalize
    const offices = data.offices || [];
    const officials = data.officials || [];
    const out = [];
    for (const office of offices) {
      const role = office.name;
      const level = (office.levels && office.levels[0]) || 'unknown';
      const indices = office.officialIndices || [];
      for (const idx of indices) {
        const o = officials[idx] || {};
        out.push({
          name: o.name,
          role,
          level,
          phone: (o.phones && o.phones[0]) || undefined,
          email: (o.emails && o.emails[0]) || undefined,
          website: (o.urls && o.urls[0]) || undefined
        });
      }
    }
    return res.json({ source: 'google_civic', officials: out, agencies: [] });
  } catch (e) {
    // Fallback on any error
    const fallback = (zip === '77002') ? [
      { name: 'Houston Mayor', role: 'City - Executive', level: 'city', website: 'https://www.houstontx.gov' }
    ] : [];
    return res.json({ source: 'fallback', officials: fallback, error: String(e) });
  }
});

// Minimal items and resources routes
app.post('/items', async (req, res) => {
  const i = req.body || {};
  if (!i.object_type || !i.title) return res.status(400).json({ error: 'object_type and title are required' });
  try {
    const q = `INSERT INTO items
      (object_type,title,summary,body_html,publish_date,pathways,sub_pathways,engagement_levels,keywords,images,
       access_guide,resources,policy,responsible,is_online,coverage,city,county,state,zip,ocd_id,fips_county,lat,lon,geom)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,ST_SetSRID(ST_MakePoint($25,$26),4326))
      RETURNING id`;
    const vals = [
      i.object_type, i.title, i.summary || null, i.body_html || null, i.publish_date || null,
      i.pathways || [], i.sub_pathways || [], i.engagement_levels || [], i.keywords || [], JSON.stringify(i.images || []),
      JSON.stringify(i.access_guide || {}), JSON.stringify(i.resources || {}), JSON.stringify(i.policy || {}), JSON.stringify(i.responsible || {}),
      !!i.is_online, i.coverage || 'online', i.city || null, i.county || null, i.state || null, i.zip || null, i.ocd_id || null, i.fips_county || null,
      Number(i.lon || 0), Number(i.lat || 0)
    ];
    const { rows } = await pool.query(q, vals);
    res.status(201).json({ id: rows[0].id });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/items/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/resources', async (req, res) => {
  const zip = String(req.query.zip || '');
  const types = String(req.query.types || '').split(',').filter(Boolean);
  const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 200);
  try {
    let where = [];
    let params = [];
    if (types.length) {
      where.push('object_type = ANY($1)');
      params.push(types);
    }
    if (zip) {
      where.push(`(zip = $${params.length+1} OR is_online = true)`);
      params.push(zip);
    }
    const sql = 'SELECT * FROM items ' + (where.length ? 'WHERE ' + where.join(' AND ') : '') + ' ORDER BY publish_date DESC NULLS LAST LIMIT $' + (params.length+1);
    params.push(limit);
    const { rows } = await pool.query(sql, params);
    res.json({ results: rows, facets: { object_type: {}, pathways: {}, engagement_levels: {} } });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`T3 API listening on :${port}`));
