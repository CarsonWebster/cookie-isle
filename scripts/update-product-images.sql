-- Update product records with R2 image URLs after migration
-- Run with: npx wrangler d1 execute cookie-isle-db --local --file=scripts/update-product-images.sql
-- Or for remote: npx wrangler d1 execute cookie-isle-db --file=scripts/update-product-images.sql

-- Chocolate Chip
UPDATE products 
SET 
	image_url = '/images/chocolate-chip-single.png',
	hero_image_url = '/images/chocolate-chip-multiple.png'
WHERE slug = 'chocolate-chip';

-- Brownie (use same image for both card and hero)
UPDATE products 
SET 
	image_url = '/images/brownie.jpg',
	hero_image_url = '/images/brownie.jpg'
WHERE slug = 'brownie';

-- Salted Caramel
UPDATE products 
SET 
	image_url = '/images/salted-caramel-single.png',
	hero_image_url = '/images/salted-caramel-multiple.png'
WHERE slug = 'salted-caramel';

-- Verify updates
SELECT 
	slug, 
	title, 
	image_url, 
	hero_image_url 
FROM products 
ORDER BY sort_order;
