package com.pets.api.domain.repository;

import com.pets.api.domain.entity.PetHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PetHistoryRepository extends JpaRepository<PetHistory, UUID> {
    
    @Query("SELECT h FROM PetHistory h WHERE h.pet.id = :petId ORDER BY h.date DESC")
    Page<PetHistory> findByPetIdOrderByDateDesc(@Param("petId") UUID petId, Pageable pageable);
    
    @Query("SELECT h FROM PetHistory h WHERE h.pet.id = :petId AND h.id = :historyId")
    Optional<PetHistory> findByPetIdAndId(@Param("petId") UUID petId, @Param("historyId") UUID historyId);
    
    boolean existsByPetId(UUID petId);
}
