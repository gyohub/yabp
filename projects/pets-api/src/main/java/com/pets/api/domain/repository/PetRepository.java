package com.pets.api.domain.repository;

import com.pets.api.domain.entity.Pet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PetRepository extends JpaRepository<Pet, UUID> {
    
    @Query("SELECT p FROM Pet p WHERE p.user.id = :userId AND (:includeDeleted = true OR p.deleted = false)")
    Page<Pet> findByUserId(@Param("userId") UUID userId, @Param("includeDeleted") boolean includeDeleted, Pageable pageable);
    
    @Query("SELECT p FROM Pet p WHERE (:includeDeleted = true OR p.deleted = false)")
    Page<Pet> findAllActive(@Param("includeDeleted") boolean includeDeleted, Pageable pageable);
    
    @Query("SELECT p FROM Pet p WHERE p.user.id = :userId AND p.id = :petId AND (:includeDeleted = true OR p.deleted = false)")
    Optional<Pet> findByUserIdAndId(@Param("userId") UUID userId, @Param("petId") UUID petId, @Param("includeDeleted") boolean includeDeleted);
    
    @Query("SELECT p FROM Pet p WHERE p.id = :petId AND (:includeDeleted = true OR p.deleted = false)")
    Optional<Pet> findByIdActive(@Param("petId") UUID petId, @Param("includeDeleted") boolean includeDeleted);
    
    @Query("SELECT p FROM Pet p WHERE p.user.id = :userId AND (:includeDeleted = true OR p.deleted = false) AND LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Pet> findByUserIdAndNameContaining(@Param("userId") UUID userId, @Param("name") String name, @Param("includeDeleted") boolean includeDeleted, Pageable pageable);
    
    @Query("SELECT p FROM Pet p WHERE (:includeDeleted = true OR p.deleted = false) AND LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Pet> findByNameContaining(@Param("name") String name, @Param("includeDeleted") boolean includeDeleted, Pageable pageable);
}
