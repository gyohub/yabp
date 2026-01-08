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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PetService Unit Tests")
class PetServiceTest {

    @Mock
    private PetRepository petRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PetMapper petMapper;

    @InjectMocks
    private PetService petService;

    private User user;
    private Pet pet;
    private UUID userId;
    private UUID petId;
    private CreatePetRequest createRequest;
    private UpdatePetRequest updateRequest;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        petId = UUID.randomUUID();

        user = new User();
        user.setId(userId);
        user.setUsername("testuser");
        user.setRole(User.Role.USER);

        pet = new Pet();
        pet.setId(petId);
        pet.setName("Buddy");
        pet.setBirthDate(LocalDate.of(2020, 1, 1));
        pet.setAdoptionDate(LocalDate.of(2020, 2, 1));
        pet.setRace("Dog");
        pet.setBreed("Golden Retriever");
        pet.setUser(user);
        pet.setDeleted(false);

        createRequest = new CreatePetRequest();
        createRequest.setName("Buddy");
        createRequest.setBirthDate(LocalDate.of(2020, 1, 1));
        createRequest.setAdoptionDate(LocalDate.of(2020, 2, 1));
        createRequest.setRace("Dog");
        createRequest.setBreed("Golden Retriever");

        updateRequest = new UpdatePetRequest();
        updateRequest.setName("Max");
    }

    @Test
    @DisplayName("Should create pet successfully")
    void shouldCreatePetSuccessfully() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(petMapper.toEntity(createRequest)).thenReturn(pet);
        when(petRepository.save(any(Pet.class))).thenReturn(pet);

        PetResponse response = new PetResponse();
        response.setId(petId);
        response.setName("Buddy");
        when(petMapper.toResponse(pet)).thenReturn(response);

        PetResponse result = petService.create(userId, createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Buddy");
        verify(userRepository).findById(userId);
        verify(petMapper).toEntity(createRequest);
        verify(petRepository).save(any(Pet.class));
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void shouldThrowExceptionWhenUserNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> petService.create(userId, createRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");

        verify(userRepository).findById(userId);
        verify(petRepository, never()).save(any(Pet.class));
    }

    @Test
    @DisplayName("Should throw exception when birth date is after adoption date")
    void shouldThrowExceptionWhenBirthDateAfterAdoptionDate() {
        createRequest.setBirthDate(LocalDate.of(2020, 2, 2));
        createRequest.setAdoptionDate(LocalDate.of(2020, 2, 1));

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> petService.create(userId, createRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Birth date must be before or equal to adoption date");

        verify(userRepository).findById(userId);
        verify(petRepository, never()).save(any(Pet.class));
    }

    @Test
    @DisplayName("Should find all pets for user")
    void shouldFindAllPetsForUser() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Pet> petPage = new PageImpl<>(List.of(pet), pageable, 1);

        when(petRepository.findByUserId(userId, false, pageable)).thenReturn(petPage);

        PetResponse response = new PetResponse();
        response.setId(petId);
        response.setName("Buddy");
        when(petMapper.toResponse(pet)).thenReturn(response);

        PageResponse<PetResponse> result = petService.findAll(userId, User.Role.USER, false, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getPage().getTotalElements()).isEqualTo(1);
        verify(petRepository).findByUserId(userId, false, pageable);
    }

    @Test
    @DisplayName("Should find all pets for admin")
    void shouldFindAllPetsForAdmin() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Pet> petPage = new PageImpl<>(List.of(pet), pageable, 1);

        when(petRepository.findAllActive(false, pageable)).thenReturn(petPage);

        PetResponse response = new PetResponse();
        response.setId(petId);
        response.setName("Buddy");
        when(petMapper.toResponse(pet)).thenReturn(response);

        PageResponse<PetResponse> result = petService.findAll(userId, User.Role.ADMIN, false, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(petRepository).findAllActive(false, pageable);
    }

    @Test
    @DisplayName("Should find pet by id for user")
    void shouldFindPetByIdForUser() {
        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.of(pet));

        PetResponse response = new PetResponse();
        response.setId(petId);
        response.setName("Buddy");
        when(petMapper.toResponse(pet)).thenReturn(response);

        PetResponse result = petService.findById(petId, userId, User.Role.USER, false);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(petId);
        verify(petRepository).findByUserIdAndId(userId, petId, false);
    }

    @Test
    @DisplayName("Should throw exception when pet not found")
    void shouldThrowExceptionWhenPetNotFound() {
        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> petService.findById(petId, userId, User.Role.USER, false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Pet not found");

        verify(petRepository).findByUserIdAndId(userId, petId, false);
    }

    @Test
    @DisplayName("Should update pet successfully")
    void shouldUpdatePetSuccessfully() {
        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.of(pet));
        when(petRepository.save(any(Pet.class))).thenReturn(pet);

        PetResponse response = new PetResponse();
        response.setId(petId);
        response.setName("Max");
        when(petMapper.toResponse(pet)).thenReturn(response);

        PetResponse result = petService.update(petId, userId, User.Role.USER, updateRequest);

        assertThat(result).isNotNull();
        verify(petMapper).updateEntity(pet, updateRequest);
        verify(petRepository).save(pet);
    }

    @Test
    @DisplayName("Should delete pet successfully")
    void shouldDeletePetSuccessfully() {
        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.of(pet));
        when(petRepository.save(any(Pet.class))).thenReturn(pet);

        petService.delete(petId, userId, User.Role.USER);

        assertThat(pet.getDeleted()).isTrue();
        assertThat(pet.getDeletedAt()).isNotNull();
        verify(petRepository).save(pet);
    }

    @Test
    @DisplayName("Should throw exception when deleting already deleted pet")
    void shouldThrowExceptionWhenDeletingAlreadyDeletedPet() {
        pet.setDeleted(true);
        pet.setDeletedAt(java.time.LocalDateTime.now());

        when(petRepository.findByUserIdAndId(userId, petId, false)).thenReturn(Optional.of(pet));

        assertThatThrownBy(() -> petService.delete(petId, userId, User.Role.USER))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Pet already deleted");

        verify(petRepository, never()).save(any(Pet.class));
    }
}
