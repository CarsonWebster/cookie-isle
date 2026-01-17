-- Seed data for Cookie Isle local development
-- Run with: npx wrangler d1 execute cookie-isle-db --local --file=drizzle/seed.sql

-- Clear existing data (for re-seeding)
DELETE FROM products;
DELETE FROM fulfillment_slots;
DELETE FROM daily_capacity;

-- Reset auto-increment counters
DELETE FROM sqlite_sequence WHERE name IN ('products', 'fulfillment_slots');

-- =============================================================================
-- PRODUCTS (from legacy Hugo content)
-- =============================================================================

INSERT INTO products (slug, title, price_cents, stripe_price_id, description, ingredients, image_url, hero_image_url, tags, featured, active, sort_order)
VALUES
  (
    'chocolate-chip',
    'Chocolate Chip',
    350,
    'price_1Sh28WD2fyOJEz3a1Rox6bU4',
    'Our classic chocolate chip cookie loaded with premium semi-sweet chocolate chips.',
    'Butter, flour, brown sugar, eggs, vanilla, semi-sweet chocolate chips, sea salt',
    NULL,
    NULL,
    '["classic", "chocolate", "bestseller"]',
    1,
    1,
    1
  ),
  (
    'brownie',
    'Brownie',
    500,
    'price_1SgwUFD2fyOJEz3agsYsC7eP',
    'Made with two types of chocolate, they are ultra rich with fudgy goodness in every bite!',
    'Butter, flour, brown sugar, eggs, vanilla, semi-sweet chocolate chips, sea salt',
    NULL,
    NULL,
    '["chocolate", "rich", "fudgy"]',
    1,
    1,
    2
  ),
  (
    'salted-caramel',
    'Salted Caramel Bliss',
    400,
    'price_1Sh2ArD2fyOJEz3aDG0rENt3',
    'Buttery caramel swirled throughout with a perfect touch of sea salt.',
    'Butter, flour, brown sugar, caramel chips, sea salt, vanilla, eggs',
    NULL,
    NULL,
    '["signature", "salted", "caramel"]',
    1,
    1,
    3
  ),
  (
    'oatmeal-raisin',
    'Oatmeal Raisin',
    325,
    'price_1Sh29aD2fyOJEz3aK6T1HIse',
    'A wholesome classic with hearty oats and plump raisins.',
    'Butter, flour, rolled oats, brown sugar, raisins, cinnamon, eggs, vanilla',
    NULL,
    NULL,
    '["classic", "oatmeal", "wholesome"]',
    0,
    1,
    4
  );

-- =============================================================================
-- FULFILLMENT SLOTS (sample slots for testing checkout)
-- Using dates relative to "now" - these will need updating for long-term use
-- =============================================================================

-- Tomorrow pickup slot (10am-12pm)
INSERT INTO fulfillment_slots (date, start_time, end_time, slot_type, max_cookies, active)
VALUES (date('now', '+1 day'), '10:00', '12:00', 'pickup', 200, 1);

-- Tomorrow pickup slot (2pm-4pm)
INSERT INTO fulfillment_slots (date, start_time, end_time, slot_type, max_cookies, active)
VALUES (date('now', '+1 day'), '14:00', '16:00', 'pickup', 200, 1);

-- Day after tomorrow delivery slot (11am-1pm)
INSERT INTO fulfillment_slots (date, start_time, end_time, slot_type, max_cookies, active)
VALUES (date('now', '+2 days'), '11:00', '13:00', 'delivery', 150, 1);

-- 3 days from now - both pickup and delivery (10am-2pm)
INSERT INTO fulfillment_slots (date, start_time, end_time, slot_type, max_cookies, active)
VALUES (date('now', '+3 days'), '10:00', '14:00', 'both', 200, 1);

-- =============================================================================
-- Verification queries (uncomment to test)
-- =============================================================================
-- SELECT id, slug, title, price_cents, featured, sort_order FROM products;
-- SELECT id, date, start_time, end_time, slot_type FROM fulfillment_slots;
