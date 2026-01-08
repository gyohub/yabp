package com.pets.api.controller.v1;

import com.pets.api.domain.entity.User;
import com.pets.api.dto.request.CreateHistoryRequest;
import com.pets.api.dto.request.UpdateHistoryRequest;
import com.pets.api.dto.response.PageResponse;
import com.pets.api.dto.response.PetHistoryResponse;
import com.pets.api.security.UserPrincipal;
import com.pets.api.service.PetHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PetHistoryController Unit Tests")
class PetHistoryControllerTest {

    @Mock
    private PetHistoryService petHistoryService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private PetHistoryController petHistoryController;

    private UserPrincipal userPrincipal;
    private UUID userId;
    private UUID petId;
    private UUID historyId;
    private CreateHistoryRequest createRequest;
    private UpdateHistoryRequest updateRequest;
    private PetHistoryResponse historyResponse;
    private PageResponse<PetHistoryResponse> pageResponse;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        petId = UUID.randomUUID();
        historyId = UUID.randomUUID();

        userPrincipal = new UserPrincipal(userId, "testuser", "password", User.Role.USER);
        when(authentication.getPrincipal()).thenReturn(userPrincipal);

        createRequest = new CreateHistoryRequest();
        createRequest.setDate(LocalDate.of(2024, 1, 15));
        createRequest.setDescription("Regular checkup");

        updateRequest = new UpdateHistoryRequest();
        updateRequest.setDescription("Updated description");

        historyResponse = new PetHistoryResponse();
        historyResponse.setId(historyId);
        historyResponse.setPetId(petId);
        historyResponse.setDate(LocalDate.of(2024, 1, 15));
        historyResponse.setDescription("Regular checkup");

        pageResponse = new PageResponse<>();
        pageResponse.setContent(List.of(historyResponse));
        PageResponse.PageInfo pageInfo = new PageResponse.PageInfo();
        pageInfo.setNumber(0);
        pageInfo.setSize(20);
        pageInfo.setTotalElements(1L);
        pageInfo.setTotalPages(1);
        pageResponse.setPage(pageInfo);
    }

    @Test
    @DisplayName("Should create history successfully")
    void shouldCreateHistorySuccessfully() {
        when(petHistoryService.create(eq(petId), eq(userId), any(User.Role.class), any(CreateHistoryRequest.class)))
                .thenReturn(historyResponse);

        ResponseEntity<PetHistoryResponse> response = petHistoryController.create(petId, createRequest, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getDescription()).isEqualTo("Regular checkup");
        verify(petHistoryService).create(eq(petId), eq(userId), eq(User.Role.USER), any(CreateHistoryRequest.class));
    }

    @Test
    @DisplayName("Should find all history records successfully")
    void shouldFindAllHistoryRecordsSuccessfully() {
        when(petHistoryService.findAll(eq(petId), eq(userId), any(User.Role.class), any()))
                .thenReturn(pageResponse);

        ResponseEntity<PageResponse<PetHistoryResponse>> response = petHistoryController.findAll(
                petId, 0, 20, "date,desc", authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        verify(petHistoryService).findAll(eq(petId), eq(userId), eq(User.Role.USER), any());
    }

    @Test
    @DisplayName("Should update history successfully")
    void shouldUpdateHistorySuccessfully() {
        historyResponse.setDescription("Updated description");
        when(petHistoryService.update(eq(petId), eq(historyId), eq(userId), any(User.Role.class), any(UpdateHistoryRequest.class)))
                .thenReturn(historyResponse);

        ResponseEntity<PetHistoryResponse> response = petHistoryController.update(
                petId, historyId, updateRequest, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getDescription()).isEqualTo("Updated description");
        verify(petHistoryService).update(eq(petId), eq(historyId), eq(userId), eq(User.Role.USER), any(UpdateHistoryRequest.class));
    }

    @Test
    @DisplayName("Should delete history successfully")
    void shouldDeleteHistorySuccessfully() {
        doNothing().when(petHistoryService).delete(eq(petId), eq(historyId), eq(userId), any(User.Role.class));

        ResponseEntity<Void> response = petHistoryController.delete(petId, historyId, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(petHistoryService).delete(eq(petId), eq(historyId), eq(userId), eq(User.Role.USER));
    }

    @Test
    @DisplayName("Should limit page size to 100")
    void shouldLimitPageSizeTo100() {
        when(petHistoryService.findAll(eq(petId), eq(userId), any(User.Role.class), any()))
                .thenReturn(pageResponse);

        ResponseEntity<PageResponse<PetHistoryResponse>> response = petHistoryController.findAll(
                petId, 0, 200, "date,desc", authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(petHistoryService).findAll(eq(petId), eq(userId), eq(User.Role.USER), any());
    }
}
