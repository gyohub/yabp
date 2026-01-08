package com.pets.api.controller.v1;

import com.pets.api.dto.request.CreateHistoryRequest;
import com.pets.api.dto.request.UpdateHistoryRequest;
import com.pets.api.dto.response.PageResponse;
import com.pets.api.dto.response.PetHistoryResponse;
import com.pets.api.service.PetHistoryService;
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
@RequestMapping("/api/v1/pets/{petId}/history")
public class PetHistoryController {
    
    private final PetHistoryService petHistoryService;
    
    public PetHistoryController(PetHistoryService petHistoryService) {
        this.petHistoryService = petHistoryService;
    }
    
    @PostMapping
    public ResponseEntity<PetHistoryResponse> create(@PathVariable UUID petId,
                                                     @Valid @RequestBody CreateHistoryRequest request,
                                                     Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        PetHistoryResponse response = petHistoryService.create(petId, principal.getUserId(), principal.getRole(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping
    public ResponseEntity<PageResponse<PetHistoryResponse>> findAll(
            @PathVariable UUID petId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "date,desc") String sort,
            Authentication authentication) {
        
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && "asc".equalsIgnoreCase(sortParams[1])
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, sortParams[0]));
        
        PageResponse<PetHistoryResponse> response = petHistoryService.findAll(
                petId,
                principal.getUserId(),
                principal.getRole(),
                pageable
        );
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PetHistoryResponse> update(@PathVariable UUID petId,
                                                      @PathVariable UUID id,
                                                      @Valid @RequestBody UpdateHistoryRequest request,
                                                      Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        PetHistoryResponse response = petHistoryService.update(
                petId,
                id,
                principal.getUserId(),
                principal.getRole(),
                request
        );
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID petId,
                                       @PathVariable UUID id,
                                       Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        petHistoryService.delete(petId, id, principal.getUserId(), principal.getRole());
        return ResponseEntity.noContent().build();
    }
}
