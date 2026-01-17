-- Update seed data with placeholder image URLs
-- These will be replaced with actual R2 URLs after migration
-- For now, we'll use relative paths that match the R2 serving endpoint pattern

-- Update Chocolate Chip with images
UPDATE products 
SET 
	image_url = '/images/cholocatechipsingle.png',
	hero_image_url = '/images/cholocatechipmultiple.png'
WHERE slug = 'chocolate-chip';

-- Update Brownie with image
UPDATE products 
SET 
	image_url = '/images/brownie.jpg',
	hero_image_url = '/images/brownie.jpg'
WHERE slug = 'brownie';

-- Update Salted Caramel with images
UPDATE products 
SET 
	image_url = '/images/saltedcaramelsingle.png',
	hero_image_url = '/images/saltedcaramelmultiple.png'
WHERE slug = 'salted-caramel';

-- Oatmeal Raisin has no images yet
-- Leave as NULL

-- Verify updates
SELECT slug, title, image_url, hero_image_url FROM products;
