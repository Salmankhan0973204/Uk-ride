-- Fleet classes like ukride.uk (step 3.8): example models, hand luggage and an
-- optional picture for each class.

-- AlterTable
ALTER TABLE "vehicle_types"
  ADD COLUMN "example_models" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "hand_luggage" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "image_url" TEXT;

-- The placeholder classes from 3.1 become the six ukride.uk classes. Run once,
-- here, because the seed never overwrites a row that already exists. A
-- database without these rows is untouched; the seed then creates them.
-- "Minibus" (8 seats, 8 cases) is ukride.uk's "8 Seater", so it is renamed,
-- slug included: no booking points at a slug yet.
UPDATE "vehicle_types" SET
  "slug" = '8-seater', "name" = '8 Seater', "sort_order" = 10,
  "description" = 'Eight seats and a case each, for groups and families travelling together.',
  "example_models" = 'VW Transporter, Mercedes Vito',
  "passengers" = 8, "suitcases" = 8, "hand_luggage" = 8
WHERE "slug" = 'minibus';

UPDATE "vehicle_types" SET
  "sort_order" = 20,
  "description" = 'A premium saloon for business travel, with more room in the back.',
  "example_models" = 'BMW 5 Series, Mercedes E Class, Tesla Model S',
  "passengers" = 3, "suitcases" = 4, "hand_luggage" = 3
WHERE "slug" = 'executive';

UPDATE "vehicle_types" SET
  "name" = 'MPV', "sort_order" = 30,
  "description" = 'A spacious people carrier for small groups with plenty of luggage.',
  "example_models" = 'Mercedes V Class, Tesla Model X, Mercedes Viano',
  "passengers" = 5, "suitcases" = 6, "hand_luggage" = 5
WHERE "slug" = 'mpv';

UPDATE "vehicle_types" SET
  "sort_order" = 40,
  "description" = 'A comfortable car with a larger boot for extra luggage.',
  "example_models" = 'MG5 EV, Toyota Auris, Tesla Model S',
  "passengers" = 3, "suitcases" = 4, "hand_luggage" = 3
WHERE "slug" = 'estate';

UPDATE "vehicle_types" SET
  "sort_order" = 60,
  "description" = 'A standard four-door car for everyday journeys and airport runs.',
  "example_models" = 'Toyota Prius, Tesla Model 3, Mitsubishi Outlander',
  "passengers" = 4, "suitcases" = 3, "hand_luggage" = 4
WHERE "slug" = 'saloon';
