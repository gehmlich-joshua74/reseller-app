CREATE TABLE IF NOT EXISTS "users" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"          VARCHAR(255),
  "email"         VARCHAR(255) UNIQUE,
  "password_hash" VARCHAR(255),
  "created_at"    TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "items" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "added_by"     UUID NOT NULL REFERENCES "users"("id"),
  "name"         VARCHAR(255),
  "description"  TEXT,
  "category"     VARCHAR(255),
  "status"       VARCHAR(255) DEFAULT 'at_home',
  "cost"         DECIMAL,
  "location"     VARCHAR(255),
  "photos_ready" BOOLEAN DEFAULT false,
  "created_at"   TIMESTAMP DEFAULT now(),
  "updated_at"   TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "listings" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "item_id"        UUID NOT NULL REFERENCES "items"("id"),
  "platform"       VARCHAR(255),
  "asking_price"   DECIMAL,
  "listed_at"      TIMESTAMP DEFAULT now(),
  "sold_at"        TIMESTAMP,
  "sale_price"     DECIMAL,
  "platform_fees"  DECIMAL,
  "shipping_costs" DECIMAL
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();