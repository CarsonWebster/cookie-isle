-- Newsletter signup data migration
-- Data from legacy coming-soon-page newsletter signups
-- Run with: npx wrangler d1 execute cookie-isle-db --remote --file=drizzle/newsletter-migration.sql

INSERT INTO newsletter (email, source, subscribed_at, subscribed, unsubscribe_token, unsubscribed_at)
VALUES
  ('chadwebby@gmail.com', 'coming-soon-page', '2025-12-03 19:26:00', 1, 'c9d6504c07604cd55298e982c428fe02', NULL),
  ('jswebby@yahoo.com', 'coming-soon-page', '2025-12-03 20:09:00', 1, '1ed1d3a8ad0a62cd4872a56aa320d345', NULL),
  ('a.vaca321@gmail.com', 'coming-soon-page', '2025-12-03 21:10:00', 1, 'eb0079ae3388d8eadb3367efb203d2b0', NULL),
  ('emgracemayer@gmail.com', 'coming-soon-page', '2025-12-04 12:38:00', 1, '44b147ffcf9ac14390edd6428b16eacc', NULL),
  ('devyndudek@yahoo.com', 'coming-soon-page', '2025-12-04 13:33:00', 1, '2672c1c732af92c77b24a2d22b4d3ab4', NULL),
  ('danaarabians@gmail.com', 'coming-soon-page', '2025-12-05 14:56:00', 1, '8879acf819786fbf93bacc1146638005', NULL),
  ('fsuviv@gmail.com', 'coming-soon-page', '2025-12-05 20:21:00', 1, 'e94ca566f1d3f99e158943e78275b16e', NULL),
  ('sameeryasar10@gmail.com', 'coming-soon-page', '2025-12-07 13:45:00', 1, '3c69170404918d388c9926b21042bc21', NULL),
  ('wendystevens2010@gmail.com', 'coming-soon-page', '2025-12-11 20:57:00', 1, 'd5a8db164da866262ce28f9f6a84213b', NULL),
  ('alywebby@gmail.com', 'coming-soon-page', '2025-12-12 17:24:00', 1, '1d87f3e6660a486c734bfb83cfad8a2e', NULL),
  ('carsonwebster@hotmail.com', 'coming-soon-page', '2025-12-31 13:01:48', 1, '81128252dc72e87aacf3b8d234c70dec', NULL),
  ('604cmaster@gmail.com', 'coming-soon-page', '2025-12-31 13:04:11', 0, 'eccad75fab62afd27165e00ed04fcf57', NULL),
  ('shellystew@hotmail.com', 'coming-soon-page', '2025-12-31 15:08:12', 1, '432939554e976e3f920c168aaed41ea4', NULL),
  ('dmcbride2@san.rr.com', 'coming-soon-page', '2026-01-09 11:10:37', 1, '69d099985145f5c825243437b31dae09', NULL),
  ('sherylmunning@gmail.com', 'coming-soon-page', '2026-01-09 11:23:21', 1, '28466c0ff3ec41b241c158c9a05e7858', NULL);
