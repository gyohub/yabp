package com.pets.api.e2e;

import com.pets.api.dto.request.CreatePetRequest;
import com.pets.api.dto.request.RegisterRequest;
import com.pets.api.dto.response.LoginResponse;
import com.pets.api.dto.response.PetResponse;
import com.pets.api.integration.BaseIntegrationTest;
import com.pets.api.integration.util.AuthHelper;
import com.pets.api.integration.util.TestDataFactory;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;

import static org.hamcrest.Matchers.*;

@DisplayName("End-to-End: Security and Authorization Workflow")
class SecurityWorkflowTest extends BaseIntegrationTest {

    @LocalServerPort
    private int port;

    private AuthHelper authHelper;
    private String user1Token;
    private String user2Token;
    private PetResponse user1Pet;

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
        authHelper = new AuthHelper("http://localhost", port);

        RegisterRequest user1Request = TestDataFactory.createRegisterRequest();
        LoginResponse user1Login = authHelper.registerAndLogin(user1Request);
        user1Token = user1Login.getToken();

        RegisterRequest user2Request = TestDataFactory.createRegisterRequest();
        LoginResponse user2Login = authHelper.registerAndLogin(user2Request);
        user2Token = user2Login.getToken();

        CreatePetRequest petRequest = TestDataFactory.createPetRequest();
        user1Pet = RestAssured.given()
                .header("Authorization", "Bearer " + user1Token)
                .contentType(ContentType.JSON)
                .body(petRequest)
                .when()
                .post("/api/v1/pets")
                .then()
                .extract()
                .as(PetResponse.class);
    }

    @Test
    @DisplayName("User should not access another user's pet")
    void userShouldNotAccessAnotherUserPet() {
        RestAssured.given()
                .header("Authorization", "Bearer " + user2Token)
                .when()
                .get("/api/v1/pets/" + user1Pet.getId())
                .then()
                .statusCode(403);

        RestAssured.given()
                .header("Authorization", "Bearer " + user2Token)
                .contentType(ContentType.JSON)
                .body("{\"name\": \"Hacked\"}")
                .when()
                .put("/api/v1/pets/" + user1Pet.getId())
                .then()
                .statusCode(403);

        RestAssured.given()
                .header("Authorization", "Bearer " + user2Token)
                .when()
                .delete("/api/v1/pets/" + user1Pet.getId())
                .then()
                .statusCode(403);
    }

    @Test
    @DisplayName("User should only see their own pets in list")
    void userShouldOnlySeeOwnPets() {
        CreatePetRequest petRequest2 = TestDataFactory.createPetRequest();
        RestAssured.given()
                .header("Authorization", "Bearer " + user2Token)
                .contentType(ContentType.JSON)
                .body(petRequest2)
                .when()
                .post("/api/v1/pets");

        RestAssured.given()
                .header("Authorization", "Bearer " + user1Token)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200)
                .body("content", hasSize(1))
                .body("content[0].id", equalTo(user1Pet.getId().toString()));

        RestAssured.given()
                .header("Authorization", "Bearer " + user2Token)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200)
                .body("content", hasSize(1))
                .body("content[0].id", not(equalTo(user1Pet.getId().toString())));
    }

    @Test
    @DisplayName("Invalid token should be rejected")
    void invalidTokenShouldBeRejected() {
        RestAssured.given()
                .header("Authorization", "Bearer invalid-token")
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(401);

        RestAssured.given()
                .header("Authorization", "Bearer expired.token.here")
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(401);
    }

    @Test
    @DisplayName("Missing token should be rejected")
    void missingTokenShouldBeRejected() {
        RestAssured.given()
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(401);

        RestAssured.given()
                .when()
                .post("/api/v1/pets")
                .then()
                .statusCode(401);
    }

    @Test
    @DisplayName("Revoked token should be rejected after logout")
    void revokedTokenShouldBeRejected() {
        RestAssured.given()
                .header("Authorization", "Bearer " + user1Token)
                .when()
                .post("/api/v1/auth/logout")
                .then()
                .statusCode(200);

        RestAssured.given()
                .header("Authorization", "Bearer " + user1Token)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(401);
    }
}
