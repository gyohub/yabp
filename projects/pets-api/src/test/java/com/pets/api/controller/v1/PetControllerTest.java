package com.pets.api.controller.v1;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pets.api.domain.entity.User;
import com.pets.api.dto.request.CreatePetRequest;
import com.pets.api.dto.request.UpdatePetRequest;
import com.pets.api.dto.response.PageResponse;
import com.pets.api.dto.response.PetResponse;
import com.pets.api.security.UserPrincipal;
import com.pets.api.service.PetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PetController Unit Tests")
class PetControllerTest {

    @Mock
    private PetService petService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private PetController petController;

    private UserPrincipal userPrincipal;
    private UUID userId;
    private UUID petId;
    private CreatePetRequest createRequest;
    private UpdatePetRequest updateRequest;
    private PetResponse petResponse;
    private PageResponse<PetResponse> pageResponse;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        petId = UUID.randomUUID();

        userPrincipal = new UserPrincipal(userId, "testuser", "password", User.Role.USER);
        when(authentication.getPrincipal()).thenReturn(userPrincipal);

        createRequest = new CreatePetRequest();
        createRequest.setName("Buddy");
        createRequest.setBirthDate(LocalDate.of(2020, 1, 1));
        createRequest.setAdoptionDate(LocalDate.of(2020, 2, 1));
        createRequest.setRace("Dog");
        createRequest.setBreed("Golden Retriever");

        updateRequest = new UpdatePetRequest();
        updateRequest.setName("Max");

        petResponse = new PetResponse();
        petResponse.setId(petId);
        petResponse.setName("Buddy");

        pageResponse = new PageResponse<>();
        pageResponse.setContent(List.of(petResponse));
        PageResponse.PageInfo pageInfo = new PageResponse.PageInfo();
        pageInfo.setNumber(0);
        pageInfo.setSize(20);
        pageInfo.setTotalElements(1L);
        pageInfo.setTotalPages(1);
        pageResponse.setPage(pageInfo);
    }

    @Test
    @DisplayName("Should create pet successfully")
    void shouldCreatePetSuccessfully() {
        when(petService.create(eq(userId), any(CreatePetRequest.class))).thenReturn(petResponse);

        ResponseEntity<PetResponse> response = petController.create(createRequest, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getName()).isEqualTo("Buddy");
        verify(petService).create(eq(userId), any(CreatePetRequest.class));
    }

    @Test
    @DisplayName("Should find all pets successfully")
    void shouldFindAllPetsSuccessfully() {
        when(petService.findAll(any(UUID.class), any(User.Role.class), anyBoolean(), any(), any()))
                .thenReturn(pageResponse);

        ResponseEntity<PageResponse<PetResponse>> response = petController.findAll(
                0, 20, "createdAt,desc", false, null, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        verify(petService).findAll(eq(userId), eq(User.Role.USER), eq(false), isNull(), any());
    }

    @Test
    @DisplayName("Should find pet by id successfully")
    void shouldFindPetByIdSuccessfully() {
        when(petService.findById(any(UUID.class), any(UUID.class), any(User.Role.class), anyBoolean()))
                .thenReturn(petResponse);

        ResponseEntity<PetResponse> response = petController.findById(petId, false, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo(petId);
        verify(petService).findById(eq(petId), eq(userId), eq(User.Role.USER), eq(false));
    }

    @Test
    @DisplayName("Should update pet successfully")
    void shouldUpdatePetSuccessfully() {
        petResponse.setName("Max");
        when(petService.update(any(UUID.class), any(UUID.class), any(User.Role.class), any(UpdatePetRequest.class)))
                .thenReturn(petResponse);

        ResponseEntity<PetResponse> response = petController.update(petId, updateRequest, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getName()).isEqualTo("Max");
        verify(petService).update(eq(petId), eq(userId), eq(User.Role.USER), any(UpdatePetRequest.class));
    }

    @Test
    @DisplayName("Should delete pet successfully")
    void shouldDeletePetSuccessfully() {
        doNothing().when(petService).delete(any(UUID.class), any(UUID.class), any(User.Role.class));

        ResponseEntity<Void> response = petController.delete(petId, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(petService).delete(eq(petId), eq(userId), eq(User.Role.USER));
    }

    @Test
    @DisplayName("Should limit page size to 100")
    void shouldLimitPageSizeTo100() {
        when(petService.findAll(any(UUID.class), any(User.Role.class), anyBoolean(), any(), any()))
                .thenReturn(pageResponse);

        ResponseEntity<PageResponse<PetResponse>> response = petController.findAll(
                0, 200, "createdAt,desc", false, null, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(petService).findAll(eq(userId), eq(User.Role.USER), eq(false), isNull(), any());
    }
}
