/**
 * Generates a unique bullet ID in the format ubid_xxxxxxxx
 * This matches the format used in the database's default value
 */
export const generateBulletId = (): string => {
  const uuid = crypto.randomUUID();
  return `ubid_${uuid.substring(0, 8)}`;
};