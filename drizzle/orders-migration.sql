-- Orders data migration
-- Legacy orders from Google Sheets
-- Run with: npx wrangler d1 execute cookie-isle-db --local --file=drizzle/orders-migration.sql

-- Order 7RMAJJ - Pickup - Carson Webster
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_b17SyiCdEHqAgnrEbXL0p9ZhvhlqVMjfHkcTERMiCbiTfQCkzjy57RmAjJ',
  'paid',
  'Carson Webster',
  'carsonwebster@hotmail.com',
  '16193028234',
  'pickup',
  '2025-12-26',
  '12:00 PM',
  NULL,
  '[{"productId":1,"slug":"chocolate-chip","title":"Chocolate Chip","priceCents":350,"quantity":4},{"productId":3,"slug":"salted-caramel","title":"Salted Caramel Bliss","priceCents":400,"quantity":2},{"productId":4,"slug":"oatmeal-raisin","title":"Oatmeal Raisin","priceCents":325,"quantity":2}]',
  3450,
  0,
  0,
  NULL,
  267,
  3717,
  '2025-12-21 22:59:05'
);

-- Order 0AIW6E - Delivery - Carson Webster
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_b1dVZpWf6gMtXOTnSLlPSrTVV9IZyvI7TdgI2ayhk4EpBXOlAX8X0aiW6e',
  'paid',
  'Carson Webster',
  'carsonwebster@hotmail.com',
  '16193028234',
  'delivery',
  '2025-12-26',
  NULL,
  '{"street":"337 G Ave","apt":"","city":"Coronado","state":"CA","zip":"92118-1232"}',
  '[{"productId":1,"slug":"chocolate-chip","title":"Chocolate Chip","priceCents":350,"quantity":5},{"productId":3,"slug":"salted-caramel","title":"Salted Caramel Bliss","priceCents":400,"quantity":3},{"productId":4,"slug":"oatmeal-raisin","title":"Oatmeal Raisin","priceCents":325,"quantity":3}]',
  3725,
  0,
  0,
  NULL,
  289,
  4014,
  '2025-12-21 23:10:51'
);

-- Order CVPDJX - Delivery - Carson Webster
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_b1fq1UOQXHS0Pjo3WNMf9PU6ViPYrezwBWg3xs66PNlWfnHuQTQWCvPDjX',
  'paid',
  'Carson Webster',
  'carsonwebster@hotmail.com',
  '16193028234',
  'delivery',
  '2025-12-26',
  NULL,
  '{"street":"337 G Ave","apt":"","city":"Coronado","state":"CA","zip":"92118-1232"}',
  '[{"productId":1,"slug":"chocolate-chip","title":"Chocolate Chip","priceCents":350,"quantity":5},{"productId":3,"slug":"salted-caramel","title":"Salted Caramel Bliss","priceCents":400,"quantity":3},{"productId":4,"slug":"oatmeal-raisin","title":"Oatmeal Raisin","priceCents":325,"quantity":3}]',
  3725,
  0,
  0,
  NULL,
  289,
  4014,
  '2025-12-21 23:13:47'
);

-- Order BJKF4L - Pickup - Carson Webster
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_b1I001oPuixOiIQlRnQ643f3Puc0my3c2tXW7upQ7dwvO2QkXxjkbJkf4l',
  'paid',
  'Carson Webster',
  'carsonwebster@hotmail.com',
  '16193028234',
  'pickup',
  '2025-12-26',
  '12:00 PM',
  NULL,
  '[{"productId":3,"slug":"salted-caramel","title":"Salted Caramel Bliss","priceCents":400,"quantity":3},{"productId":1,"slug":"chocolate-chip","title":"Chocolate Chip","priceCents":350,"quantity":2},{"productId":4,"slug":"oatmeal-raisin","title":"Oatmeal Raisin","priceCents":325,"quantity":1}]',
  2225,
  0,
  0,
  NULL,
  172,
  2397,
  '2025-12-21 23:20:39'
);

-- Order ZQNHUB - Pickup - billy bob
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_a1zT8xZKgw7N8tdNINFoA87yP26JAKND0uWCy6PNnZA5eYi6oExtzqnhUB',
  'paid',
  'billy bob',
  'billybob@aol.com',
  '1234567890',
  'pickup',
  '2025-12-26',
  '12:00 PM',
  NULL,
  '[{"productId":3,"slug":"salted-caramel","title":"Salted Caramel Bliss","priceCents":400,"quantity":4}]',
  1600,
  0,
  0,
  NULL,
  124,
  1724,
  '2025-12-21 23:28:39'
);

-- Order JWTAFY - Pickup - Carson Webster
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_b1jKI4R5ufMlrUApD3q8BwD48dGeQeTctlWYPfMkIpobyv0HnZ5WJwtaFY',
  'paid',
  'Carson Webster',
  'carsonwebster@hotmail.com',
  '16193028234',
  'pickup',
  '2025-12-26',
  '12:00 PM',
  NULL,
  '[{"productId":3,"slug":"salted-caramel","title":"Salted Caramel Bliss","priceCents":400,"quantity":3},{"productId":1,"slug":"chocolate-chip","title":"Chocolate Chip","priceCents":350,"quantity":2},{"productId":4,"slug":"oatmeal-raisin","title":"Oatmeal Raisin","priceCents":325,"quantity":1}]',
  2225,
  0,
  0,
  NULL,
  172,
  2397,
  '2025-12-21 23:35:08'
);

-- Order S8B6W1 - Pickup - Carson Webster
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_b1L0rqEzhYVgqeaB1OFqOkuypZQD8rDH4Yib1G3VRmyTSOiweVsMS8b6W1',
  'paid',
  'Carson Webster',
  'carsonwebster@hotmail.com',
  '16193028234',
  'pickup',
  '2025-12-26',
  '12:00 PM',
  NULL,
  '[{"productId":1,"slug":"chocolate-chip","title":"Chocolate Chip","priceCents":350,"quantity":1},{"productId":3,"slug":"salted-caramel","title":"Salted Caramel Bliss","priceCents":400,"quantity":3},{"productId":4,"slug":"oatmeal-raisin","title":"Oatmeal Raisin","priceCents":325,"quantity":8}]',
  4350,
  0,
  0,
  NULL,
  337,
  4687,
  '2025-12-21 23:42:15'
);

-- Order MBINEF - Pickup - Carson Webster
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_b1tF30IfHJsSd7oJ7wW0ZlE7UKrPrzuS0ganZZ87eYfI0xJawH97MbiNef',
  'paid',
  'Carson Webster',
  'carsonwebster@hotmail.com',
  '16193028234',
  'pickup',
  '2025-12-26',
  '12:00 PM',
  NULL,
  '[{"productId":1,"slug":"chocolate-chip","title":"Chocolate Chip","priceCents":350,"quantity":6},{"productId":3,"slug":"salted-caramel","title":"Salted Caramel Bliss","priceCents":400,"quantity":4},{"productId":4,"slug":"oatmeal-raisin","title":"Oatmeal Raisin","priceCents":325,"quantity":3}]',
  4675,
  0,
  0,
  NULL,
  362,
  5037,
  '2025-12-21 23:43:49'
);

-- Order VD18US - Delivery - Alyssa Webster
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_a1eT2R4mdsH8cEuRspklBKoEFgB8v4CU1R2IQQZAOkXuHywUBbxSVd18US',
  'paid',
  'Alyssa Webster',
  'alywebby@gmail.com',
  '6198500661',
  'delivery',
  '2025-12-26',
  NULL,
  '{"street":"337 G Ave","apt":"","city":"Coronado","state":"CA","zip":"92118"}',
  '[{"productId":1,"slug":"chocolate-chip","title":"Chocolate Chip","priceCents":350,"quantity":3}]',
  1050,
  0,
  0,
  NULL,
  81,
  1131,
  '2025-12-22 09:57:05'
);

-- Order F7PAQH - Delivery - Chad Webster
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_a1zafTZZ5P0MMfAwF7pxqtP0WKOZ0EvlnTchCRTlh7ft3i9I7ryfF7Paqh',
  'paid',
  'Chad Webster',
  'chadwebby@gmail.com',
  '6199483949',
  'delivery',
  '2025-12-26',
  NULL,
  '{"street":"337 G Ave","apt":"","city":"Coronado","state":"CA","zip":"92118"}',
  '[{"productId":1,"slug":"chocolate-chip","title":"Chocolate Chip","priceCents":350,"quantity":6}]',
  2100,
  0,
  0,
  NULL,
  163,
  2263,
  '2025-12-22 10:34:29'
);

-- Order XSJCL6 - Pickup - Alyssa Webster
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'cs_test_b19ad6wysFrJjAUYZ4qT6ue2vqcv1vkWgZ2yEqCAmnZjX5odGQyDXsJcL6',
  'paid',
  'Alyssa Webster',
  'alywebby@gmail.com',
  '16198500661',
  'pickup',
  '2026-01-09',
  '3:00 PM',
  NULL,
  '[{"productId":2,"slug":"brownie","title":"Brownie","priceCents":500,"quantity":4}]',
  2000,
  0,
  0,
  NULL,
  155,
  2155,
  '2026-01-02 15:35:12'
);

-- Order TEST - Pickup - Test User (test order with gift message)
INSERT INTO orders (
  stripe_session_id, status, customer_name, customer_email, customer_phone,
  fulfillment_type, fulfillment_date, fulfillment_time, delivery_address,
  items, subtotal_cents, tip_cents, gift_box, gift_message, tax_cents, total_cents,
  created_at
) VALUES (
  'test_id',
  'paid',
  'Test User',
  'test@example.com',
  '555-0199',
  'pickup',
  '2026-01-08',
  '12:00 PM',
  NULL,
  '[{"productId":1,"slug":"chocolate-chip","title":"Chocolate Chip","priceCents":350,"quantity":1}]',
  350,
  0,
  1,
  'Happy Birthday!',
  27,
  377,
  '2026-01-07 23:56:58'
);
