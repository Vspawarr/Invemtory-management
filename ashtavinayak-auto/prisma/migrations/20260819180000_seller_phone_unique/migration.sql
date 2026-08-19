-- Enforce that a seller's mobile number uniquely identifies their VehicleSeller record.
DROP INDEX IF EXISTS "VehicleSeller_phone_idx";
CREATE UNIQUE INDEX "VehicleSeller_phone_key" ON "VehicleSeller"("phone");
