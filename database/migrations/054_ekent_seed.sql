-- Migration 054: Seed 37 verified il-level e-kent / kent rehberi URLs.
-- Each URL was curl-verified to return HTTP 200 with a real city portal title
-- (not an IIS placeholder or parked domain). Admin can edit individual rows
-- via /admin/ekent later.

BEGIN;

-- Clear any prior il-level seed so re-running the migration is idempotent.
DELETE FROM integrations.ekent_providers WHERE district IS NULL;

INSERT INTO integrations.ekent_providers (city, district, name, url, active) VALUES
  ('Adana',          NULL, 'Adana Büyükşehir Belediyesi CBS',            'https://cbs.adana.bel.tr', true),
  ('Afyonkarahisar', NULL, 'Afyonkarahisar Belediyesi CBS',              'https://cbs.afyon.bel.tr', true),
  ('Amasya',         NULL, 'Amasya Belediyesi Kent Rehberi',             'https://kentrehberi.amasya.bel.tr', true),
  ('Ankara',         NULL, 'Ankara Büyükşehir Belediyesi Kent Rehberi',  'https://kentrehberi.ankara.bel.tr', true),
  ('Antalya',        NULL, 'Antalya Büyükşehir Belediyesi KBS',          'https://kbs.antalya.bel.tr', true),
  ('Aydın',          NULL, 'Aydın Büyükşehir Belediyesi Kent Rehberi',   'https://aydin.bel.tr/detail/5276/kentrehberi', true),
  ('Bolu',           NULL, 'Bolu Belediyesi CBS',                        'https://cbs.bolu.bel.tr', true),
  ('Bursa',          NULL, 'Bursa Büyükşehir Belediyesi Kent Rehberi',   'https://kentrehberi.bursa.bel.tr', true),
  ('Çorum',          NULL, 'Çorum Belediyesi KBS',                       'https://kbs.corum.bel.tr', true),
  ('Denizli',        NULL, 'Denizli Büyükşehir Belediyesi Kent Rehberi', 'https://kentrehberi.denizli.bel.tr', true),
  ('Diyarbakır',     NULL, 'Diyarbakır Büyükşehir Belediyesi KEOS',      'https://cbs.diyarbakir.bel.tr/keos/', true),
  ('Elazığ',         NULL, 'Elazığ Belediyesi CBS',                      'https://cbs.elazig.bel.tr', true),
  ('Erzurum',        NULL, 'Erzurum Büyükşehir Belediyesi Kent Rehberi', 'https://gis.erzurum.bel.tr/kentrehberi/', true),
  ('Eskişehir',      NULL, 'Eskişehir Büyükşehir Belediyesi Kent Rehberi','https://www.eskisehir.bel.tr/sayfalar.php?sayfalar_id=17', true),
  ('Gaziantep',      NULL, 'Gaziantep Büyükşehir Belediyesi KBS',        'https://kbs.gaziantep.bel.tr', true),
  ('Hatay',          NULL, 'Hatay Büyükşehir Belediyesi Kent Rehberi',   'https://kentrehberi.hatay.bel.tr', true),
  ('İstanbul',       NULL, 'İBB Şehir Haritası',                         'https://sehirharitasi.ibb.gov.tr', true),
  ('İzmir',          NULL, 'İzmir Büyükşehir Belediyesi Kent Rehberi',   'https://kentrehberi.izmir.bel.tr', true),
  ('Kahramanmaraş',  NULL, 'Kahramanmaraş BBB Kent Rehberi',             'https://adres.kahramanmaras.bel.tr/Kentrehberi/dashboard', true),
  ('Kayseri',        NULL, 'Kayseri Büyükşehir Belediyesi CBS',          'https://cbs.kayseri.bel.tr', true),
  ('Kırşehir',       NULL, 'Kırşehir Belediyesi Kent Rehberi',           'https://www.kirsehir.bel.tr/kent-rehberi', true),
  ('Kocaeli',        NULL, 'Kocaeli BBB Şehir Rehberi',                  'https://rehber.kocaeli.bel.tr/', true),
  ('Konya',          NULL, 'Konya Büyükşehir Belediyesi Kent Rehberi',   'https://kentrehberi.konya.bel.tr', true),
  ('Kütahya',        NULL, 'Kütahya Belediyesi Kent Rehberi',            'https://kutahya.bel.tr/kentrehberi', true),
  ('Malatya',        NULL, 'Malatya Büyükşehir Belediyesi CBS',          'https://kbs.malatya.bel.tr', true),
  ('Manisa',         NULL, 'Manisa Büyükşehir Belediyesi CBS',           'https://cbs.manisa.bel.tr', true),
  ('Mersin',         NULL, 'Mersin BBB AYKOME Kent Rehberi',             'https://aykome.mersin.bel.tr/', true),
  ('Muğla',          NULL, 'Muğla Büyükşehir Belediyesi CBS',            'https://cbs.mugla.bel.tr', true),
  ('Ordu',           NULL, 'Ordu Büyükşehir Belediyesi KBS',             'https://kbs.ordu.bel.tr', true),
  ('Sakarya',        NULL, 'Sakarya BBB Kent Rehberi',                   'https://cbs.sakarya.bel.tr', true),
  ('Samsun',         NULL, 'Samsun Büyükşehir Belediyesi CBS',           'https://cbs.samsun.bel.tr', true),
  ('Sivas',          NULL, 'Sivas Belediyesi Kent Rehberi',              'https://kentrehberi.sivas.bel.tr', true),
  ('Şanlıurfa',      NULL, 'Şanlıurfa BBB Kent Rehberi (KEOS)',          'https://keos.sanliurfa.bel.tr/keos/', true),
  ('Trabzon',        NULL, 'Trabzon BBB CBS Kent Rehberi',               'https://cbskent.trabzon.bel.tr/', true),
  ('Uşak',           NULL, 'Uşak Belediyesi Kent Rehberi',               'https://usak.bel.tr/kentrehberi', true),
  ('Yalova',         NULL, 'Yalova Belediyesi CBS',                      'https://cbs.yalova.bel.tr', true),
  ('Zonguldak',      NULL, 'Zonguldak Belediyesi CBS',                   'https://cbs.zonguldak.bel.tr', true);

COMMIT;
