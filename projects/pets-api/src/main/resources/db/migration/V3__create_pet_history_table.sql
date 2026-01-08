CREATE TABLE pet_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pet_history_pet_id ON pet_history(pet_id);
CREATE INDEX idx_pet_history_pet_date ON pet_history(pet_id, date DESC);

CREATE TRIGGER update_pet_history_updated_at BEFORE UPDATE ON pet_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
