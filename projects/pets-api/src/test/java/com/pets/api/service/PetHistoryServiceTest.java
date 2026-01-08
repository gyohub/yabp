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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PetHistoryService Unit Tests")
class PetHistoryServiceTest {

    @Mock
    private PetHistoryRepository petHistoryRepository;

    @Mock
    private PetRepository petRepository;

    @Mock
    private PetHistoryMapper petHistoryMapper;

    @InjectMocks
    private PetHistoryService petHistoryService;

    private User user;
    private Pet pet;
    private PetHistory petHistory;
    private UUID userId;
    private UUID petId;
    private UUID historyId;
    private CreateHistoryRequest createRequest;
    private UpdateHistoryRequest updateRequest;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        petId = UUID.randomUUID();
        historyId = UUID.randomUUID();

        user = new User();
        user.setId(userId);
        user.setUsername("testuser");
        user.setRole(User.Role.USER);

        pet = new Pet();
        pet.setId(petId);
        pet.setName("Buddy");
        pet.setUser(user);
        pet.setDeleted(false);

        petHistory = new PetHistory();
        petHistory.setId(historyId);
        petHistory.setDate(LocalDate.of(2024, 1, 15));
        petHistory.setDescription("Regular checkup");
        petHistory.setPet(pet);

        createRequest = new CreateHistoryRequest();
        createRequest.setDate(LocalDate.of(2024, 1, 15));
        createRequest.setDescription("Regular checkup");

        updateRequest = new UpdateHistoryRequest();
        updateRequest.setDescription("Updated description");
    }

    @Test
    @DisplayName("Should create history successfully")
    void shouldCreateHistorySuccessfully() {
        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.of(pet));
        when(petHistoryMapper.toEntity(createRequest)).thenReturn(petHistory);
        when(petHistoryRepository.save(any(PetHistory.class))).thenReturn(petHistory);

        PetHistoryResponse response = new PetHistoryResponse();
        response.setId(historyId);
        response.setDescription("Regular checkup");
        when(petHistoryMapper.toResponse(petHistory)).thenReturn(response);

        PetHistoryResponse result = petHistoryService.create(petId, userId, User.Role.USER, createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getDescription()).isEqualTo("Regular checkup");
        verify(petRepository).findByUserIdAndId(userId, petId, false);
        verify(petHistoryMapper).toEntity(createRequest);
        verify(petHistoryRepository).save(any(PetHistory.class));
    }

    @Test
    @DisplayName("Should throw exception when pet not found for creation")
    void shouldThrowExceptionWhenPetNotFoundForCreation() {
        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> petHistoryService.create(petId, userId, User.Role.USER, createRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Pet not found");

        verify(petRepository).findByUserIdAndId(userId, petId, false);
        verify(petHistoryRepository, never()).save(any(PetHistory.class));
    }

    @Test
    @DisplayName("Should find all history records successfully")
    void shouldFindAllHistoryRecordsSuccessfully() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<PetHistory> historyPage = new PageImpl<>(List.of(petHistory), pageable, 1);

        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.of(pet));
        when(petHistoryRepository.findByPetIdOrderByDateDesc(petId, pageable)).thenReturn(historyPage);

        PetHistoryResponse response = new PetHistoryResponse();
        response.setId(historyId);
        response.setDescription("Regular checkup");
        when(petHistoryMapper.toResponse(petHistory)).thenReturn(response);

        PageResponse<PetHistoryResponse> result = petHistoryService.findAll(petId, userId, User.Role.USER, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getPage().getTotalElements()).isEqualTo(1);
        verify(petRepository).findByUserIdAndId(userId, petId, false);
        verify(petHistoryRepository).findByPetIdOrderByDateDesc(petId, pageable);
    }

    @Test
    @DisplayName("Should update history successfully")
    void shouldUpdateHistorySuccessfully() {
        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.of(pet));
        when(petHistoryRepository.findByPetIdAndId(petId, historyId)).thenReturn(Optional.of(petHistory));
        when(petHistoryRepository.save(any(PetHistory.class))).thenReturn(petHistory);

        PetHistoryResponse response = new PetHistoryResponse();
        response.setId(historyId);
        response.setDescription("Updated description");
        when(petHistoryMapper.toResponse(petHistory)).thenReturn(response);

        PetHistoryResponse result = petHistoryService.update(petId, historyId, userId, User.Role.USER, updateRequest);

        assertThat(result).isNotNull();
        verify(petHistoryMapper).updateEntity(petHistory, updateRequest);
        verify(petHistoryRepository).save(petHistory);
    }

    @Test
    @DisplayName("Should throw exception when history not found for update")
    void shouldThrowExceptionWhenHistoryNotFoundForUpdate() {
        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.of(pet));
        when(petHistoryRepository.findByPetIdAndId(petId, historyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> petHistoryService.update(petId, historyId, userId, User.Role.USER, updateRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("History record not found");

        verify(petHistoryRepository).findByPetIdAndId(petId, historyId);
        verify(petHistoryRepository, never()).save(any(PetHistory.class));
    }

    @Test
    @DisplayName("Should delete history successfully")
    void shouldDeleteHistorySuccessfully() {
        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.of(pet));
        when(petHistoryRepository.findByPetIdAndId(petId, historyId)).thenReturn(Optional.of(petHistory));

        petHistoryService.delete(petId, historyId, userId, User.Role.USER);

        verify(petHistoryRepository).delete(petHistory);
    }

    @Test
    @DisplayName("Should throw exception when history not found for deletion")
    void shouldThrowExceptionWhenHistoryNotFoundForDeletion() {
        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.of(pet));
        when(petHistoryRepository.findByPetIdAndId(petId, historyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> petHistoryService.delete(petId, historyId, userId, User.Role.USER))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("History record not found");

        verify(petHistoryRepository).findByPetIdAndId(petId, historyId);
        verify(petHistoryRepository, never()).delete(any(PetHistory.class));
    }

    @Test
    @DisplayName("Should allow admin to access any pet history")
    void shouldAllowAdminToAccessAnyPetHistory() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<PetHistory> historyPage = new PageImpl<>(List.of(petHistory), pageable, 1);

        when(petRepository.findById(petId, false)).thenReturn(Optional.of(pet));
        when(petHistoryRepository.findByPetIdOrderByDateDesc(petId, pageable)).thenReturn(historyPage);

        PetHistoryResponse response = new PetHistoryResponse();
        response.setId(historyId);
        when(petHistoryMapper.toResponse(petHistory)).thenReturn(response);

        PageResponse<PetHistoryResponse> result = petHistoryService.findAll(petId, userId, User.Role.ADMIN, pageable);

        assertThat(result).isNotNull();
        verify(petRepository).findById(petId, false);
        verify(petRepository, never()).findByUserIdAndId(any(), any(), anyBoolean());
    }
}
