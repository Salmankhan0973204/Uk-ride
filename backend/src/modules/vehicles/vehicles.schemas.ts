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

export const VEHICLE_STATUSES = ['ACTIVE', 'MAINTENANCE', 'RETIRED'] as const;
export const MAX_PAGE_SIZE = 100;

/** An empty value (`?search=`) counts as not sent. */
const blankToUndefined = (value: unknown) => (value === '' ? undefined : value);

/**
 * GET /admin/vehicles?page=2&pageSize=20&status=ACTIVE&type=executive&search=ab12
 *
 * Every part is optional. Unknown names are refused, so a typo such as
 * `?statu=ACTIVE` is reported instead of silently showing every vehicle.
 */
export const listVehiclesQuery = z.strictObject(
  {
    page: z.coerce
      .number('Page must be a number')
      .int('Page must be a whole number')
      .min(1, 'Page must be 1 or more')
      .default(1),
    pageSize: z.coerce
      .number('Page size must be a number')
      .int('Page size must be a whole number')
      .min(1, 'Page size must be 1 or more')
      .max(MAX_PAGE_SIZE, `Page size must be at most ${MAX_PAGE_SIZE}`)
      .default(20),
    status: z.preprocess(
      blankToUndefined,
      z.enum(VEHICLE_STATUSES, 'Status must be ACTIVE, MAINTENANCE or RETIRED').optional(),
    ),
    // A vehicle type's slug, as in the public catalogue.
    type: z.preprocess(blankToUndefined, z.string().trim().toLowerCase().max(40).optional()),
    search: z.preprocess(
      blankToUndefined,
      z.string().trim().max(40, 'Search must be at most 40 characters').optional(),
    ),
  },
  'Use only page, pageSize, status, type and search',
);

export type ListVehiclesQuery = z.infer<typeof listVehiclesQuery>;

/** Body of PATCH /admin/vehicles/:id/status. */
export const changeStatusSchema = z.strictObject(
  { status: z.enum(VEHICLE_STATUSES, 'Status must be ACTIVE, MAINTENANCE or RETIRED') },
  'Send status only',
);

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
