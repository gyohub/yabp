package com.pets.api.integration.auth;

import com.pets.api.domain.entity.User;
import com.pets.api.domain.repository.UserRepository;
import com.pets.api.dto.request.LoginRequest;
import com.pets.api.dto.request.RegisterRequest;
import com.pets.api.dto.response.LoginResponse;
import com.pets.api.integration.BaseIntegrationTest;
import com.pets.api.integration.util.AuthHelper;
import com.pets.api.integration.util.TestDataFactory;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;

@DisplayName("Authentication Integration Tests")
class AuthIntegrationTest extends BaseIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private AuthHelper authHelper;

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
        authHelper = new AuthHelper("http://localhost", port);
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should register user successfully and persist to database")
    void shouldRegisterUserSuccessfully() {
        RegisterRequest request = TestDataFactory.createRegisterRequest();

        RestAssured.given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/auth/register")
                .then()
                .statusCode(201)
                .body("username", equalTo(request.getUsername()))
                .body("email", equalTo(request.getEmail()))
                .body("role", equalTo("USER"))
                .body("id", notNullValue())
                .body("createdAt", notNullValue());

        User savedUser = userRepository.findByUsername(request.getUsername()).orElse(null);
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getEmail()).isEqualTo(request.getEmail());
        assertThat(passwordEncoder.matches(request.getPassword(), savedUser.getPassword())).isTrue();
    }

    @Test
    @DisplayName("Should fail registration with duplicate username")
    void shouldFailRegistrationWithDuplicateUsername() {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        authHelper.registerUser(request);

        RestAssured.given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/auth/register")
                .then()
                .statusCode(400)
                .body("message", containsString("already exists"));
    }

    @Test
    @DisplayName("Should fail registration with invalid email format")
    void shouldFailRegistrationWithInvalidEmail() {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        request.setEmail("invalid-email");

        RestAssured.given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/auth/register")
                .then()
                .statusCode(400);
    }

    @Test
    @DisplayName("Should fail registration with weak password")
    void shouldFailRegistrationWithWeakPassword() {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        request.setPassword("weak");

        RestAssured.given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/auth/register")
                .then()
                .statusCode(400);
    }

    @Test
    @DisplayName("Should login successfully and return JWT token")
    void shouldLoginSuccessfully() {
        RegisterRequest registerRequest = TestDataFactory.createRegisterRequest();
        authHelper.registerUser(registerRequest);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(registerRequest.getUsername());
        loginRequest.setPassword(registerRequest.getPassword());

        LoginResponse response = RestAssured.given()
                .contentType(ContentType.JSON)
                .body(loginRequest)
                .when()
                .post("/api/v1/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .as(LoginResponse.class);

        assertThat(response.getToken()).isNotNull();
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getExpiresIn()).isPositive();
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getUsername()).isEqualTo(registerRequest.getUsername());
    }

    @Test
    @DisplayName("Should fail login with invalid credentials")
    void shouldFailLoginWithInvalidCredentials() {
        RegisterRequest registerRequest = TestDataFactory.createRegisterRequest();
        authHelper.registerUser(registerRequest);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(registerRequest.getUsername());
        loginRequest.setPassword("wrongpassword");

        RestAssured.given()
                .contentType(ContentType.JSON)
                .body(loginRequest)
                .when()
                .post("/api/v1/auth/login")
                .then()
                .statusCode(401);
    }

    @Test
    @DisplayName("Should logout successfully and revoke token")
    void shouldLogoutSuccessfully() {
        RegisterRequest registerRequest = TestDataFactory.createRegisterRequest();
        LoginResponse loginResponse = authHelper.registerAndLogin(registerRequest);
        String token = loginResponse.getToken();

        RestAssured.given()
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/api/v1/auth/logout")
                .then()
                .statusCode(200);

        RestAssured.given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(401);
    }

    @Test
    @DisplayName("Should access protected endpoint with valid token")
    void shouldAccessProtectedEndpointWithValidToken() {
        RegisterRequest registerRequest = TestDataFactory.createRegisterRequest();
        LoginResponse loginResponse = authHelper.registerAndLogin(registerRequest);
        String token = loginResponse.getToken();

        RestAssured.given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200);
    }

    @Test
    @DisplayName("Should reject request without authentication token")
    void shouldRejectRequestWithoutToken() {
        RestAssured.given()
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(401);
    }
}
