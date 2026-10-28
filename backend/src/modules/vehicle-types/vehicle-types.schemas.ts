import { z } from 'zod';

/** The most a private-hire vehicle may carry in the UK is eight passengers. */
export const MAX_PASSENGERS = 8;
export const MAX_SUITCASES = 20;

const name = z
  .string('Name is required')
  .trim()
  .min(1, 'Name is required')
  .max(40, 'Name must be at most 40 characters');

// Lower-case words joined by hyphens: "executive", "people-carrier".
const slug = z
  .string('Slug must be text')
  .trim()
  .toLowerCase()
  .min(2, 'Slug must be at least 2 characters')
  .max(40, 'Slug must be at most 40 characters')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug can only contain letters, numbers and hyphens');

const description = z
  .string('Description is required')
  .trim()
  .min(1, 'Description is required')
  .max(200, 'Description must be at most 200 characters');

// "BMW 5 Series, Mercedes E Class": shown as "Cars like ... or similar".
const exampleModels = z
  .string('Example models must be text')
  .trim()
  .max(120, 'Example models must be at most 120 characters');

/**
 * The address of a picture hosted elsewhere, or null for none. Only http and
 * https: a "javascript:" address in an image tag must never get this far.
 */
const imageUrl = z
  .url({ protocol: /^https?$/, error: 'Image address must start with http:// or https://' })
  .max(500, 'Image address must be at most 500 characters')
  .nullable();

/** A whole number in a range. "4" as text is refused: JSON has real numbers. */
const count = (label: string, min: number, max: number) =>
  z
    .number(`${label} must be a number`)
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

const passengers = count('Passengers', 1, MAX_PASSENGERS);
const suitcases = count('Suitcases', 0, MAX_SUITCASES);
const handLuggage = count('Hand luggage', 0, MAX_SUITCASES);
const sortOrder = count('Sort order', 0, 9999);

/**
 * A new vehicle type. The slug may be left out: it is then made from the name
 * ("People carrier" becomes "people-carrier").
 */
export const createVehicleTypeSchema = z.strictObject(
  {
    name,
    slug: slug.optional(),
    description,
    exampleModels: exampleModels.optional(),
    passengers,
    suitcases,
    handLuggage: handLuggage.optional(),
    imageUrl: imageUrl.optional(),
    sortOrder: sortOrder.optional(),
  },
  'Send name, description, passengers, suitcases, and optionally slug, exampleModels, handLuggage, imageUrl and sortOrder',
);

/**
 * A partial update. The slug is not on the list: it is the address of the
 * type, and links and later bookings rely on it staying the same.
 * `isActive` is here so a type that was switched off can be switched on again.
 */
export const updateVehicleTypeSchema = z
  .strictObject(
    {
      name: name.optional(),
      description: description.optional(),
      exampleModels: exampleModels.optional(),
      passengers: passengers.optional(),
      suitcases: suitcases.optional(),
      handLuggage: handLuggage.optional(),
      // null takes the picture away.
      imageUrl: imageUrl.optional(),
      sortOrder: sortOrder.optional(),
      isActive: z.boolean('isActive must be true or false').optional(),
    },
    'Only name, description, exampleModels, passengers, suitcases, handLuggage, imageUrl, sortOrder and isActive can be changed',
  )
  .refine((changes) => Object.keys(changes).length > 0, 'Nothing to update');

export type CreateVehicleTypeInput = z.infer<typeof createVehicleTypeSchema>;
export type UpdateVehicleTypeInput = z.infer<typeof updateVehicleTypeSchema>;
