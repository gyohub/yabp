package com.pets.api.service;

import com.pets.api.domain.entity.Pet;
import com.pets.api.domain.entity.PetHistory;
import com.pets.api.domain.entity.User;
import com.pets.api.domain.repository.PetHistoryRepository;
import com.pets.api.domain.repository.PetRepository;
import com.pets.api.dto.request.CreateHistoryRequest;
import com.pets.api.dto.request.UpdateHistoryRequest;
import com.pets.api.dto.response.PageResponse;
import com.pets.api.dto.response.PetHistoryResponse;
import com.pets.api.mapper.PetHistoryMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PetHistoryService {
    
    private final PetHistoryRepository petHistoryRepository;
    private final PetRepository petRepository;
    private final PetHistoryMapper petHistoryMapper;
    
    public PetHistoryService(PetHistoryRepository petHistoryRepository, PetRepository petRepository,
                            PetHistoryMapper petHistoryMapper) {
        this.petHistoryRepository = petHistoryRepository;
        this.petRepository = petRepository;
        this.petHistoryMapper = petHistoryMapper;
    }
    
    @Transactional
    public PetHistoryResponse create(UUID petId, UUID userId, User.Role role, CreateHistoryRequest request) {
        Pet pet;
        
        if (role == User.Role.ADMIN) {
            pet = petRepository.findById(petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        } else {
            pet = petRepository.findByUserIdAndId(userId, petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        }
        
        PetHistory history = petHistoryMapper.toEntity(request);
        history.setPet(pet);
        
        PetHistory saved = petHistoryRepository.save(history);
        return petHistoryMapper.toResponse(saved);
    }
    
    public PageResponse<PetHistoryResponse> findAll(UUID petId, UUID userId, User.Role role, Pageable pageable) {
        Pet pet;
        
        if (role == User.Role.ADMIN) {
            pet = petRepository.findById(petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        } else {
            pet = petRepository.findByUserIdAndId(userId, petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        }
        
        Page<PetHistory> page = petHistoryRepository.findByPetIdOrderByDateDesc(petId, pageable);
        
        List<PetHistoryResponse> content = page.getContent().stream()
                .map(petHistoryMapper::toResponse)
                .collect(Collectors.toList());
        
        PageResponse<PetHistoryResponse> response = new PageResponse<>();
        response.setContent(content);
        
        PageResponse.PageInfo pageInfo = new PageResponse.PageInfo();
        pageInfo.setNumber(page.getNumber());
        pageInfo.setSize(page.getSize());
        pageInfo.setTotalElements(page.getTotalElements());
        pageInfo.setTotalPages(page.getTotalPages());
        response.setPage(pageInfo);
        
        return response;
    }
    
    @Transactional
    public PetHistoryResponse update(UUID petId, UUID historyId, UUID userId, User.Role role, UpdateHistoryRequest request) {
        Pet pet;
        
        if (role == User.Role.ADMIN) {
            pet = petRepository.findById(petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        } else {
            pet = petRepository.findByUserIdAndId(userId, petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        }
        
        PetHistory history = petHistoryRepository.findByPetIdAndId(petId, historyId)
                .orElseThrow(() -> new IllegalArgumentException("History record not found"));
        
        petHistoryMapper.updateEntity(history, request);
        PetHistory saved = petHistoryRepository.save(history);
        return petHistoryMapper.toResponse(saved);
    }
    
    @Transactional
    public void delete(UUID petId, UUID historyId, UUID userId, User.Role role) {
        Pet pet;
        
        if (role == User.Role.ADMIN) {
            pet = petRepository.findById(petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        } else {
            pet = petRepository.findByUserIdAndId(userId, petId, false)
                    .orElseThrow(() -> new IllegalArgumentException("Pet not found"));
        }
        
        PetHistory history = petHistoryRepository.findByPetIdAndId(petId, historyId)
                .orElseThrow(() -> new IllegalArgumentException("History record not found"));
        
        petHistoryRepository.delete(history);
    }
}
