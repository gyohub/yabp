package com.pets.api.controller.v1;

import com.pets.api.domain.entity.User;
import com.pets.api.dto.request.CreatePetRequest;
import com.pets.api.dto.request.UpdatePetRequest;
import com.pets.api.dto.response.PageResponse;
import com.pets.api.dto.response.PetResponse;
import com.pets.api.service.PetService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pets")
public class PetController {
    
    private final PetService petService;
    
    public PetController(PetService petService) {
        this.petService = petService;
    }
    
    @PostMapping
    public ResponseEntity<PetResponse> create(@Valid @RequestBody CreatePetRequest request,
                                             Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        PetResponse response = petService.create(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping
    public ResponseEntity<PageResponse<PetResponse>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @RequestParam(required = false) String name,
            Authentication authentication) {
        
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && "asc".equalsIgnoreCase(sortParams[1])
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, sortParams[0]));
        
        PageResponse<PetResponse> response = petService.findAll(
                principal.getUserId(),
                principal.getRole(),
                includeDeleted,
                name,
                pageable
        );
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PetResponse> findById(@PathVariable UUID id,
                                                @RequestParam(defaultValue = "false") boolean includeDeleted,
                                                Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        PetResponse response = petService.findById(id, principal.getUserId(), principal.getRole(), includeDeleted);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PetResponse> update(@PathVariable UUID id,
                                              @Valid @RequestBody UpdatePetRequest request,
                                              Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        PetResponse response = petService.update(id, principal.getUserId(), principal.getRole(), request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        petService.delete(id, principal.getUserId(), principal.getRole());
        return ResponseEntity.noContent().build();
    }
}
