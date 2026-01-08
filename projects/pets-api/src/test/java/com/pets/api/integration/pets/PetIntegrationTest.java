package com.pets.api.integration.pets;

import com.pets.api.domain.entity.Pet;
import com.pets.api.domain.entity.User;
import com.pets.api.domain.repository.PetRepository;
import com.pets.api.domain.repository.UserRepository;
import com.pets.api.dto.request.CreatePetRequest;
import com.pets.api.dto.request.UpdatePetRequest;
import com.pets.api.dto.response.PetResponse;
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

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;

@DisplayName("Pet Management Integration Tests")
class PetIntegrationTest extends BaseIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private UserRepository userRepository;

    private AuthHelper authHelper;
    private String userToken;
    private String adminToken;
    private User testUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
        authHelper = new AuthHelper("http://localhost", port);

        petRepository.deleteAll();
        userRepository.deleteAll();

        var userRegisterRequest = TestDataFactory.createRegisterRequest();
        var userLoginResponse = authHelper.registerAndLogin(userRegisterRequest);
        userToken = userLoginResponse.getToken();
        testUser = userRepository.findByUsername(userRegisterRequest.getUsername()).orElseThrow();

        var adminRegisterRequest = TestDataFactory.createRegisterRequest("admin", "admin@example.com", "AdminPass123!");
        authHelper.registerUser(adminRegisterRequest);
        adminUser = userRepository.findByUsername(adminRegisterRequest.getUsername()).orElseThrow();
        adminUser.setRole(User.Role.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminToken = authHelper.getAuthToken(adminRegisterRequest.getUsername(), adminRegisterRequest.getPassword());
    }

    @Test
    @DisplayName("Should create pet successfully and associate with user")
    void shouldCreatePetSuccessfully() {
        CreatePetRequest request = TestDataFactory.createPetRequest();

        PetResponse response = RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/pets")
                .then()
                .statusCode(201)
                .extract()
                .as(PetResponse.class);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getName()).isEqualTo(request.getName());
        assertThat(response.getUserId()).isEqualTo(testUser.getId());

        Pet savedPet = petRepository.findById(response.getId()).orElse(null);
        assertThat(savedPet).isNotNull();
        assertThat(savedPet.getUser().getId()).isEqualTo(testUser.getId());
    }

    @Test
    @DisplayName("Should fail creating pet with invalid date range")
    void shouldFailCreatingPetWithInvalidDateRange() {
        CreatePetRequest request = TestDataFactory.createPetRequest();
        request.setBirthDate(LocalDate.of(2020, 2, 1));
        request.setAdoptionDate(LocalDate.of(2020, 1, 1));

        RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/pets")
                .then()
                .statusCode(400);
    }

    @Test
    @DisplayName("Should list user's pets only")
    void shouldListUserPetsOnly() {
        CreatePetRequest request1 = TestDataFactory.createPetRequest("Pet1", LocalDate.of(2020, 1, 1), LocalDate.of(2020, 2, 1));
        CreatePetRequest request2 = TestDataFactory.createPetRequest("Pet2", LocalDate.of(2020, 1, 1), LocalDate.of(2020, 2, 1));

        RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(request1)
                .when()
                .post("/api/v1/pets");

        RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(request2)
                .when()
                .post("/api/v1/pets");

        RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200)
                .body("content", hasSize(2))
                .body("content.name", hasItems("Pet1", "Pet2"));
    }

    @Test
    @DisplayName("Should get pet by ID")
    void shouldGetPetById() {
        CreatePetRequest request = TestDataFactory.createPetRequest();
        PetResponse createdPet = RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/pets")
                .then()
                .extract()
                .as(PetResponse.class);

        RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .when()
                .get("/api/v1/pets/" + createdPet.getId())
                .then()
                .statusCode(200)
                .body("id", equalTo(createdPet.getId().toString()))
                .body("name", equalTo(request.getName()));
    }

    @Test
    @DisplayName("Should fail accessing another user's pet")
    void shouldFailAccessingAnotherUserPet() {
        var otherUserRequest = TestDataFactory.createRegisterRequest();
        var otherUserLogin = authHelper.registerAndLogin(otherUserRequest);
        String otherUserToken = otherUserLogin.getToken();

        CreatePetRequest request = TestDataFactory.createPetRequest();
        PetResponse createdPet = RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/pets")
                .then()
                .extract()
                .as(PetResponse.class);

        RestAssured.given()
                .header("Authorization", "Bearer " + otherUserToken)
                .when()
                .get("/api/v1/pets/" + createdPet.getId())
                .then()
                .statusCode(403);
    }

    @Test
    @DisplayName("Should update pet successfully")
    void shouldUpdatePetSuccessfully() {
        CreatePetRequest createRequest = TestDataFactory.createPetRequest();
        PetResponse createdPet = RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(createRequest)
                .when()
                .post("/api/v1/pets")
                .then()
                .extract()
                .as(PetResponse.class);

        UpdatePetRequest updateRequest = new UpdatePetRequest();
        updateRequest.setName("Updated Name");

        RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(updateRequest)
                .when()
                .put("/api/v1/pets/" + createdPet.getId())
                .then()
                .statusCode(200)
                .body("name", equalTo("Updated Name"));

        Pet updatedPet = petRepository.findById(createdPet.getId()).orElseThrow();
        assertThat(updatedPet.getName()).isEqualTo("Updated Name");
    }

    @Test
    @DisplayName("Should soft delete pet")
    void shouldSoftDeletePet() {
        CreatePetRequest request = TestDataFactory.createPetRequest();
        PetResponse createdPet = RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/pets")
                .then()
                .extract()
                .as(PetResponse.class);

        RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .when()
                .delete("/api/v1/pets/" + createdPet.getId())
                .then()
                .statusCode(204);

        RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200)
                .body("content", hasSize(0));

        RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .queryParam("includeDeleted", true)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200)
                .body("content", hasSize(1));
    }

    @Test
    @DisplayName("Should admin access all pets")
    void shouldAdminAccessAllPets() {
        CreatePetRequest request = TestDataFactory.createPetRequest();
        RestAssured.given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/pets");

        RestAssured.given()
                .header("Authorization", "Bearer " + adminToken)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200)
                .body("content", hasSize(greaterThanOrEqualTo(1)));
    }
}
