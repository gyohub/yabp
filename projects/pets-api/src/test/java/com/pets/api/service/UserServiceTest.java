package com.pets.api.service;

import com.pets.api.domain.entity.User;
import com.pets.api.domain.repository.UserRepository;
import com.pets.api.dto.request.UpdateUserRequest;
import com.pets.api.dto.response.PageResponse;
import com.pets.api.dto.response.UserResponse;
import com.pets.api.mapper.UserMapper;
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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    private User user;
    private UUID userId;
    private UpdateUserRequest updateRequest;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        user = new User();
        user.setId(userId);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setRole(User.Role.USER);

        updateRequest = new UpdateUserRequest();
        updateRequest.setUsername("newusername");
        updateRequest.setEmail("newemail@example.com");
    }

    @Test
    @DisplayName("Should find all users successfully")
    void shouldFindAllUsersSuccessfully() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> userPage = new PageImpl<>(List.of(user), pageable, 1);

        when(userRepository.findAll(pageable)).thenReturn(userPage);

        UserResponse response = new UserResponse();
        response.setId(userId);
        response.setUsername("testuser");
        when(userMapper.toResponse(user)).thenReturn(response);

        PageResponse<UserResponse> result = userService.findAll(pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getPage().getTotalElements()).isEqualTo(1);
        verify(userRepository).findAll(pageable);
    }

    @Test
    @DisplayName("Should find user by id successfully")
    void shouldFindUserByIdSuccessfully() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UserResponse response = new UserResponse();
        response.setId(userId);
        response.setUsername("testuser");
        when(userMapper.toResponse(user)).thenReturn(response);

        UserResponse result = userService.findById(userId);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(userId);
        verify(userRepository).findById(userId);
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void shouldThrowExceptionWhenUserNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(userId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");

        verify(userRepository).findById(userId);
    }

    @Test
    @DisplayName("Should update user successfully")
    void shouldUpdateUserSuccessfully() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername(updateRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(updateRequest.getEmail())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = new UserResponse();
        response.setId(userId);
        response.setUsername("newusername");
        when(userMapper.toResponse(user)).thenReturn(response);

        UserResponse result = userService.update(userId, updateRequest);

        assertThat(result).isNotNull();
        verify(userMapper).updateEntity(user, updateRequest);
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Should throw exception when username already exists")
    void shouldThrowExceptionWhenUsernameExists() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername(updateRequest.getUsername())).thenReturn(true);

        assertThatThrownBy(() -> userService.update(userId, updateRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Username already exists");

        verify(userRepository).existsByUsername(updateRequest.getUsername());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when email already exists")
    void shouldThrowExceptionWhenEmailExists() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername(updateRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(updateRequest.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> userService.update(userId, updateRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email already exists");

        verify(userRepository).existsByEmail(updateRequest.getEmail());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should allow update when username and email are unchanged")
    void shouldAllowUpdateWhenUsernameAndEmailUnchanged() {
        updateRequest.setUsername(user.getUsername());
        updateRequest.setEmail(user.getEmail());

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = new UserResponse();
        response.setId(userId);
        when(userMapper.toResponse(user)).thenReturn(response);

        UserResponse result = userService.update(userId, updateRequest);

        assertThat(result).isNotNull();
        verify(userRepository, never()).existsByUsername(anyString());
        verify(userRepository, never()).existsByEmail(anyString());
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Should delete user successfully")
    void shouldDeleteUserSuccessfully() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.count()).thenReturn(2L);

        userService.delete(userId);

        verify(userRepository).delete(user);
    }

    @Test
    @DisplayName("Should throw exception when user not found for deletion")
    void shouldThrowExceptionWhenUserNotFoundForDeletion() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.delete(userId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");

        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when deleting the only admin")
    void shouldThrowExceptionWhenDeletingOnlyAdmin() {
        user.setRole(User.Role.ADMIN);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.count()).thenReturn(1L);

        assertThatThrownBy(() -> userService.delete(userId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cannot delete the only admin user");

        verify(userRepository, never()).delete(any(User.class));
    }
}
