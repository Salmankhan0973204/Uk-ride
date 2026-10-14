import { z } from 'zod';

/** The oldest car the fleet accepts, and the newest: next year's models go on sale early. */
export const MIN_YEAR = 1990;
export const maxYear = () => new Date().getFullYear() + 1;

/**
 * A UK number plate, in one stored form: capitals, no spaces. "ab12 cde" and
 * "AB12CDE" are the same plate, so they must be stored the same way, or the
 * unique index could not see that they clash.
 *
 * Only the shape is checked (2 to 8 letters and digits), not the DVLA
 * formats: private and older plates come in many shapes.
 */
export const registration = z
  .string('Registration is required')
  .transform((value) => value.replace(/\s+/g, '').toUpperCase())
  .pipe(
    z
      .string()
      .min(1, 'Registration is required')
      .regex(/^[A-Z0-9]{2,8}$/, 'Use 2 to 8 letters and numbers, like AB12 CDE'),
  );

const text = (label: string, max: number) =>
  z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const year = z
  .number('Year must be a number')
  .int('Year must be a whole number')
  .min(MIN_YEAR, `Year must be ${MIN_YEAR} or later`)
  .refine((value) => value <= maxYear(), { message: 'Year cannot be in the future' });

const vehicleTypeId = z.uuid('Choose a vehicle type');

const fields = {
  registration,
  make: text('Make', 40),
  model: text('Model', 40),
  colour: text('Colour', 30),
  year,
  vehicleTypeId,
};

/** A new vehicle. It always starts ACTIVE; status has its own endpoint. */
export const createVehicleSchema = z.strictObject(
  fields,
  'Send registration, make, model, colour, year and vehicleTypeId',
);

/** A partial update. Status is not here: changing it is an action of its own. */
export const updateVehicleSchema = z
  .strictObject(
    {
      registration: fields.registration.optional(),
      make: fields.make.optional(),
      model: fields.model.optional(),
      colour: fields.colour.optional(),
      year: fields.year.optional(),
      vehicleTypeId: fields.vehicleTypeId.optional(),
    },
    'Only registration, make, model, colour, year and vehicleTypeId can be changed here',
  )
  .refine((changes) => Object.keys(changes).length > 0, 'Nothing to update');

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
