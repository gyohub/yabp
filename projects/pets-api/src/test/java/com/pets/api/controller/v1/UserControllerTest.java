package com.pets.api.controller.v1;

import com.pets.api.domain.entity.User;
import com.pets.api.dto.request.UpdateUserRequest;
import com.pets.api.dto.response.PageResponse;
import com.pets.api.dto.response.UserResponse;
import com.pets.api.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserController Unit Tests")
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private UUID userId;
    private UpdateUserRequest updateRequest;
    private UserResponse userResponse;
    private PageResponse<UserResponse> pageResponse;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        updateRequest = new UpdateUserRequest();
        updateRequest.setUsername("newusername");
        updateRequest.setEmail("newemail@example.com");

        userResponse = new UserResponse();
        userResponse.setId(userId);
        userResponse.setUsername("newusername");
        userResponse.setEmail("newemail@example.com");
        userResponse.setRole(User.Role.USER);

        pageResponse = new PageResponse<>();
        pageResponse.setContent(List.of(userResponse));
        PageResponse.PageInfo pageInfo = new PageResponse.PageInfo();
        pageInfo.setNumber(0);
        pageInfo.setSize(20);
        pageInfo.setTotalElements(1L);
        pageInfo.setTotalPages(1);
        pageResponse.setPage(pageInfo);
    }

    @Test
    @DisplayName("Should find all users successfully")
    void shouldFindAllUsersSuccessfully() {
        when(userService.findAll(any())).thenReturn(pageResponse);

        ResponseEntity<PageResponse<UserResponse>> response = userController.findAll(0, 20, "createdAt,desc");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        verify(userService).findAll(any());
    }

    @Test
    @DisplayName("Should find user by id successfully")
    void shouldFindUserByIdSuccessfully() {
        when(userService.findById(userId)).thenReturn(userResponse);

        ResponseEntity<UserResponse> response = userController.findById(userId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo(userId);
        verify(userService).findById(userId);
    }

    @Test
    @DisplayName("Should update user successfully")
    void shouldUpdateUserSuccessfully() {
        when(userService.update(eq(userId), any(UpdateUserRequest.class))).thenReturn(userResponse);

        ResponseEntity<UserResponse> response = userController.update(userId, updateRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUsername()).isEqualTo("newusername");
        verify(userService).update(eq(userId), any(UpdateUserRequest.class));
    }

    @Test
    @DisplayName("Should delete user successfully")
    void shouldDeleteUserSuccessfully() {
        doNothing().when(userService).delete(userId);

        ResponseEntity<Void> response = userController.delete(userId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(userService).delete(userId);
    }
}
