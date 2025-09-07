INSERT INTO items (object_type,title,summary,source_name,source_url,publish_date,pathways,engagement_levels,keywords,is_online,coverage,city,county,state,zip,ocd_id,fips_county,lat,lon,geom,access_guide,resources,policy,responsible)
VALUES
('event','City Budget Hearing','Speak during public comment','The Change Lab','https://www.thechangelab.net/resourcescenter/city-budget-hearing','2025-09-05',
  ARRAY['Governance, Rights and Democracy'], ARRAY['Informed','Involved'], ARRAY['budget','hearing','houston'],
  false,'city','Houston','Harris County','TX','77002','ocd-division/country:us/state:tx/place:houston','48201',29.7604,-95.3698,ST_SetSRID(ST_MakePoint(-95.3698,29.7604),4326),
  '{"steps":["Arrive early","Fill speaker card"],"time_commitment":"2h"}',
  '{"items":[{"label":"Agenda","url":"https://example.org/agenda.pdf","type":"agenda"}]}',
  '{"level":"city","hearings":["FY26 Budget"],"committees":["Budget & Fiscal Affairs"]}',
  '{"officials":[{"name":"District C Council Member","role":"City Council","level":"city","website":"https://www.houstontx.gov"}]}');

INSERT INTO items (object_type,title,summary,source_name,source_url,publish_date,pathways,engagement_levels,keywords,is_online,coverage,zip)
VALUES
('ecourse','Bridging Across Difference—Starter','Self-paced intro to dialogue skills','Partner Org','https://partner.org/course/bridge-101','2025-08-01',
  ARRAY['Community, Culture and Belonging'], ARRAY['Informed','Involved'], ARRAY['dialogue','skills'],
  true,'online','77002');
