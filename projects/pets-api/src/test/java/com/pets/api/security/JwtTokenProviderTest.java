package com.pets.api.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtTokenProvider Unit Tests")
class JwtTokenProviderTest {

    @InjectMocks
    private JwtTokenProvider jwtTokenProvider;

    private static final String SECRET_KEY = "testSecretKeyForJwtTokenProviderTestingPurposesOnly123456";
    private static final Long EXPIRATION = 86400000L;

    private UUID userId;
    private String username;
    private String role;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtTokenProvider, "secret", SECRET_KEY);
        ReflectionTestUtils.setField(jwtTokenProvider, "expiration", EXPIRATION);

        userId = UUID.randomUUID();
        username = "testuser";
        role = "USER";
    }

    @Test
    @DisplayName("Should generate token successfully")
    void shouldGenerateTokenSuccessfully() {
        String token = jwtTokenProvider.generateToken(userId, username, role);

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
    }

    @Test
    @DisplayName("Should extract user id from token")
    void shouldExtractUserIdFromToken() {
        String token = jwtTokenProvider.generateToken(userId, username, role);

        UUID extractedUserId = jwtTokenProvider.getUserIdFromToken(token);

        assertThat(extractedUserId).isEqualTo(userId);
    }

    @Test
    @DisplayName("Should extract username from token")
    void shouldExtractUsernameFromToken() {
        String token = jwtTokenProvider.generateToken(userId, username, role);

        String extractedUsername = jwtTokenProvider.getUsernameFromToken(token);

        assertThat(extractedUsername).isEqualTo(username);
    }

    @Test
    @DisplayName("Should extract role from token")
    void shouldExtractRoleFromToken() {
        String token = jwtTokenProvider.generateToken(userId, username, role);

        String extractedRole = jwtTokenProvider.getRoleFromToken(token);

        assertThat(extractedRole).isEqualTo(role);
    }

    @Test
    @DisplayName("Should extract expiration date from token")
    void shouldExtractExpirationDateFromToken() {
        String token = jwtTokenProvider.generateToken(userId, username, role);

        Date expirationDate = jwtTokenProvider.getExpirationDateFromToken(token);

        assertThat(expirationDate).isNotNull();
        assertThat(expirationDate.getTime()).isGreaterThan(System.currentTimeMillis());
    }

    @Test
    @DisplayName("Should validate valid token")
    void shouldValidateValidToken() {
        String token = jwtTokenProvider.generateToken(userId, username, role);

        Boolean isValid = jwtTokenProvider.validateToken(token);

        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should invalidate invalid token")
    void shouldInvalidateInvalidToken() {
        String invalidToken = "invalid.token.here";

        Boolean isValid = jwtTokenProvider.validateToken(invalidToken);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should return expiration in seconds")
    void shouldReturnExpirationInSeconds() {
        Long expirationInSeconds = jwtTokenProvider.getExpirationInSeconds();

        assertThat(expirationInSeconds).isEqualTo(EXPIRATION / 1000);
    }

    @Test
    @DisplayName("Should generate different tokens for different users")
    void shouldGenerateDifferentTokensForDifferentUsers() {
        UUID userId2 = UUID.randomUUID();
        String token1 = jwtTokenProvider.generateToken(userId, username, role);
        String token2 = jwtTokenProvider.generateToken(userId2, username, role);

        assertThat(token1).isNotEqualTo(token2);
    }

    @Test
    @DisplayName("Should include all claims in token")
    void shouldIncludeAllClaimsInToken() {
        String token = jwtTokenProvider.generateToken(userId, username, role);

        UUID extractedUserId = jwtTokenProvider.getUserIdFromToken(token);
        String extractedUsername = jwtTokenProvider.getUsernameFromToken(token);
        String extractedRole = jwtTokenProvider.getRoleFromToken(token);
        Date expirationDate = jwtTokenProvider.getExpirationDateFromToken(token);

        assertThat(extractedUserId).isEqualTo(userId);
        assertThat(extractedUsername).isEqualTo(username);
        assertThat(extractedRole).isEqualTo(role);
        assertThat(expirationDate).isNotNull();
    }
}
