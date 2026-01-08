package com.pets.api.integration.util;

import com.pets.api.dto.request.LoginRequest;
import com.pets.api.dto.request.RegisterRequest;
import com.pets.api.dto.response.LoginResponse;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.springframework.boot.test.web.server.LocalServerPort;

public class AuthHelper {

    private final String baseUrl;
    private final int port;

    public AuthHelper(String baseUrl, int port) {
        this.baseUrl = baseUrl;
        this.port = port;
    }

    public LoginResponse registerAndLogin(RegisterRequest registerRequest) {
        registerUser(registerRequest);
        return login(registerRequest.getUsername(), registerRequest.getPassword());
    }

    public Response registerUser(RegisterRequest request) {
        return RestAssured.given()
                .baseUri(baseUrl)
                .port(port)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/auth/register");
    }

    public LoginResponse login(String username, String password) {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(username);
        loginRequest.setPassword(password);

        Response response = RestAssured.given()
                .baseUri(baseUrl)
                .port(port)
                .contentType(ContentType.JSON)
                .body(loginRequest)
                .when()
                .post("/api/v1/auth/login");

        return response.as(LoginResponse.class);
    }

    public Response logout(String token) {
        return RestAssured.given()
                .baseUri(baseUrl)
                .port(port)
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/api/v1/auth/logout");
    }

    public String getAuthToken(String username, String password) {
        LoginResponse loginResponse = login(username, password);
        return loginResponse.getToken();
    }
}
