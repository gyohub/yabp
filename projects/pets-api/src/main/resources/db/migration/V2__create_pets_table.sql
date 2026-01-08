CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    adoption_date DATE NOT NULL,
    birth_date DATE NOT NULL,
    race VARCHAR(50) NOT NULL,
    breed VARCHAR(100) NOT NULL,
    date_of_death DATE NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_birth_adoption CHECK (birth_date <= adoption_date),
    CONSTRAINT chk_death_birth CHECK (date_of_death IS NULL OR date_of_death >= birth_date),
    CONSTRAINT chk_deleted_consistency CHECK (deleted = FALSE OR deleted_at IS NOT NULL)
);

CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_deleted ON pets(deleted);
CREATE INDEX idx_pets_user_deleted ON pets(user_id, deleted);
CREATE INDEX idx_pets_name ON pets(name);

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
