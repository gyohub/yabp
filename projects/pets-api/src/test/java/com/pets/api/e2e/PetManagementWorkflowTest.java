package com.pets.api.e2e;

import com.pets.api.dto.request.CreateHistoryRequest;
import com.pets.api.dto.request.CreatePetRequest;
import com.pets.api.dto.request.RegisterRequest;
import com.pets.api.dto.response.LoginResponse;
import com.pets.api.dto.response.PetHistoryResponse;
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

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;

@DisplayName("End-to-End: Pet Management Workflow")
class PetManagementWorkflowTest extends BaseIntegrationTest {

    @LocalServerPort
    private int port;

    private AuthHelper authHelper;
    private String authToken;
    private RegisterRequest userRequest;

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
        authHelper = new AuthHelper("http://localhost", port);

        userRequest = TestDataFactory.createRegisterRequest();
        LoginResponse loginResponse = authHelper.registerAndLogin(userRequest);
        authToken = loginResponse.getToken();
    }

    @Test
    @DisplayName("Complete pet management workflow: register, create pets, add history, view, update, delete")
    void completePetManagementWorkflow() {
        CreatePetRequest petRequest1 = TestDataFactory.createPetRequest("Max", 
                LocalDate.of(2018, 5, 15), 
                LocalDate.of(2019, 1, 10));
        
        CreatePetRequest petRequest2 = TestDataFactory.createPetRequest("Bella", 
                LocalDate.of(2019, 3, 20), 
                LocalDate.of(2020, 6, 1));

        PetResponse pet1 = RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(petRequest1)
                .when()
                .post("/api/v1/pets")
                .then()
                .statusCode(201)
                .extract()
                .as(PetResponse.class);

        PetResponse pet2 = RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(petRequest2)
                .when()
                .post("/api/v1/pets")
                .then()
                .statusCode(201)
                .extract()
                .as(PetResponse.class);

        assertThat(pet1.getId()).isNotNull();
        assertThat(pet2.getId()).isNotNull();

        RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200)
                .body("content", hasSize(2))
                .body("content.name", hasItems("Max", "Bella"));

        CreateHistoryRequest historyRequest1 = TestDataFactory.createHistoryRequest(
                LocalDate.of(2023, 1, 15), 
                "Annual checkup - all good");

        CreateHistoryRequest historyRequest2 = TestDataFactory.createHistoryRequest(
                LocalDate.of(2023, 6, 20), 
                "Vaccination updated");

        PetHistoryResponse history1 = RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(historyRequest1)
                .when()
                .post("/api/v1/pets/" + pet1.getId() + "/history")
                .then()
                .statusCode(201)
                .extract()
                .as(PetHistoryResponse.class);

        PetHistoryResponse history2 = RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(historyRequest2)
                .when()
                .post("/api/v1/pets/" + pet1.getId() + "/history")
                .then()
                .statusCode(201)
                .extract()
                .as(PetHistoryResponse.class);

        RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .get("/api/v1/pets/" + pet1.getId() + "/history")
                .then()
                .statusCode(200)
                .body("content", hasSize(2));

        RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body("{\"name\": \"Max Updated\"}")
                .when()
                .put("/api/v1/pets/" + pet1.getId())
                .then()
                .statusCode(200)
                .body("name", equalTo("Max Updated"));

        RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .delete("/api/v1/pets/" + pet1.getId())
                .then()
                .statusCode(204);

        RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200)
                .body("content", hasSize(1))
                .body("content[0].name", equalTo("Bella"));
    }

    @Test
    @DisplayName("User registration, login, pet creation, and logout workflow")
    void authenticationAndPetCreationWorkflow() {
        RegisterRequest newUserRequest = TestDataFactory.createRegisterRequest();
        
        RestAssured.given()
                .contentType(ContentType.JSON)
                .body(newUserRequest)
                .when()
                .post("/api/v1/auth/register")
                .then()
                .statusCode(201);

        LoginResponse loginResponse = authHelper.login(newUserRequest.getUsername(), newUserRequest.getPassword());
        String token = loginResponse.getToken();
        assertThat(token).isNotNull();

        CreatePetRequest petRequest = TestDataFactory.createPetRequest();
        PetResponse pet = RestAssured.given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(petRequest)
                .when()
                .post("/api/v1/pets")
                .then()
                .statusCode(201)
                .extract()
                .as(PetResponse.class);

        assertThat(pet.getId()).isNotNull();

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
    @DisplayName("Pagination and filtering workflow")
    void paginationAndFilteringWorkflow() {
        for (int i = 1; i <= 5; i++) {
            CreatePetRequest request = TestDataFactory.createPetRequest(
                    "Pet" + i,
                    LocalDate.of(2020, 1, 1),
                    LocalDate.of(2020, 2, 1));
            
            RestAssured.given()
                    .header("Authorization", "Bearer " + authToken)
                    .contentType(ContentType.JSON)
                    .body(request)
                    .when()
                    .post("/api/v1/pets");
        }

        RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .queryParam("page", 0)
                .queryParam("size", 2)
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200)
                .body("content", hasSize(2))
                .body("page.number", equalTo(0))
                .body("page.size", equalTo(2))
                .body("page.totalElements", equalTo(5));

        RestAssured.given()
                .header("Authorization", "Bearer " + authToken)
                .queryParam("name", "Pet1")
                .when()
                .get("/api/v1/pets")
                .then()
                .statusCode(200)
                .body("content", hasSize(1))
                .body("content[0].name", equalTo("Pet1"));
    }
}
