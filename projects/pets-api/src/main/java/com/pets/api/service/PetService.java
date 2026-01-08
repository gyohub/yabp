package com.pets.api.service;

import com.pets.api.domain.entity.Pet;
import com.pets.api.domain.entity.User;
import com.pets.api.domain.repository.PetRepository;
import com.pets.api.domain.repository.UserRepository;
import com.pets.api.dto.request.CreatePetRequest;
import com.pets.api.dto.request.UpdatePetRequest;
import com.pets.api.dto.response.PageResponse;
import com.pets.api.dto.response.PetResponse;
import com.pets.api.mapper.PetMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PetService {
    
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final PetMapper petMapper;
    
    public PetService(PetRepository petRepository, UserRepository userRepository, PetMapper petMapper) {
        this.petRepository = petRepository;
        this.userRepository = userRepository;
        this.petMapper = petMapper;
    }
    
    @Transactional
    public PetResponse create(UUID userId, CreatePetRequest request) {
        validatePetDates(request.getBirthDate(), request.getAdoptionDate(), request.getDateOfDeath());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Pet pet = petMapper.toEntity(request);
        pet.setUser(user);
        
        Pet saved = petRepository.save(pet);
        return petMapper.toResponse(saved);
    }
    
    public PageResponse<PetResponse> findAll(UUID userId, User.Role role, boolean includeDeleted, String name, Pageable pageable) {
        Page<Pet> page;
        
        if (role == User.Role.ADMIN) {
            if (name != null && !name.isEmpty()) {
                page = petRepository.findByNameContaining(name, includeDeleted, pageable);
            } else {
                page = petRepository.findAllActive(includeDeleted, pageable);
            }
        } else {
            if (name != null && !name.isEmpty()) {
                page = petRepository.findByUserIdAndNameContaining(userId, name, includeDeleted, pageable);
            } else {
                page = petRepository.findByUserId(userId, includeDeleted, pageable);
            }
        }
        
        List<PetResponse> content = page.getContent().stream()
                .map(petMapper::toResponse)
                .collect(Collectors.toList());
        
        PageResponse<PetResponse> response = new PageResponse<>();
        response.setContent(content);
        
        PageResponse.PageInfo pageInfo = new PageResponse.PageInfo();
        pageInfo.setNumber(page.getNumber());
        pageInfo.setSize(page.getSize());
        pageInfo.setTotalElements(page.getTotalElements());
        pageInfo.setTotalPages(page.getTotalPages());
        response.setPage(pageInfo);
        
        return response;
    }
    
    public PetResponse findById(UUID petId, UUID userId, User.Role role, boolean includeDeleted) {
        Pet pet;
        
        if (role == User.Role.ADMIN) {
            pet = petRepository.findByIdActive(petId, includeDeleted)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        } else {
            pet = petRepository.findByUserIdAndId(userId, petId, includeDeleted)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        }
        
        return petMapper.toResponse(pet);
    }
    
    @Transactional
    public PetResponse update(UUID petId, UUID userId, User.Role role, UpdatePetRequest request) {
        Pet pet;
        
        if (role == User.Role.ADMIN) {
            pet = petRepository.findByIdActive(petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        } else {
            pet = petRepository.findByUserIdAndId(userId, petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        }
        
        LocalDate birthDate = request.getBirthDate() != null ? request.getBirthDate() : pet.getBirthDate();
        LocalDate adoptionDate = request.getAdoptionDate() != null ? request.getAdoptionDate() : pet.getAdoptionDate();
        LocalDate dateOfDeath = request.getDateOfDeath() != null ? request.getDateOfDeath() : pet.getDateOfDeath();
        
        validatePetDates(birthDate, adoptionDate, dateOfDeath);
        
        petMapper.updateEntity(pet, request);
        Pet saved = petRepository.save(pet);
        return petMapper.toResponse(saved);
    }
    
    @Transactional
    public void delete(UUID petId, UUID userId, User.Role role) {
        Pet pet;
        
        if (role == User.Role.ADMIN) {
            pet = petRepository.findByIdActive(petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        } else {
            pet = petRepository.findByUserIdAndId(userId, petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        }
        
        if (pet.getDeleted()) {
            throw new IllegalArgumentException("Pet already deleted");
        }
        
        pet.setDeleted(true);
        pet.setDeletedAt(java.time.LocalDateTime.now());
        petRepository.save(pet);
    }
    
    private void validatePetDates(LocalDate birthDate, LocalDate adoptionDate, LocalDate dateOfDeath) {
        if (birthDate != null && adoptionDate != null && birthDate.isAfter(adoptionDate)) {
            throw new IllegalArgumentException("Birth date must be before or equal to adoption date");
        }
        
        if (dateOfDeath != null && birthDate != null && dateOfDeath.isBefore(birthDate)) {
            throw new IllegalArgumentException("Date of death must be after or equal to birth date");
        }
    }
}
