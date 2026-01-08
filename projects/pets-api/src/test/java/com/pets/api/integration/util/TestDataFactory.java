package com.pets.api.integration.util;

import com.pets.api.domain.entity.User;
import com.pets.api.dto.request.CreateHistoryRequest;
import com.pets.api.dto.request.CreatePetRequest;
import com.pets.api.dto.request.RegisterRequest;

import java.time.LocalDate;
import java.util.UUID;

public class TestDataFactory {

    public static RegisterRequest createRegisterRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser_" + UUID.randomUUID().toString().substring(0, 8));
        request.setEmail("test_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com");
        request.setPassword("ValidPass123!");
        return request;
    }

    public static RegisterRequest createRegisterRequest(String username, String email, String password) {
        RegisterRequest request = new RegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    public static RegisterRequest createAdminRegisterRequest() {
        RegisterRequest request = createRegisterRequest();
        return request;
    }

    public static CreatePetRequest createPetRequest() {
        CreatePetRequest request = new CreatePetRequest();
        request.setName("Buddy");
        request.setBirthDate(LocalDate.of(2020, 1, 1));
        request.setAdoptionDate(LocalDate.of(2020, 2, 1));
        request.setRace("Dog");
        request.setBreed("Golden Retriever");
        return request;
    }

    public static CreatePetRequest createPetRequest(String name, LocalDate birthDate, LocalDate adoptionDate) {
        CreatePetRequest request = new CreatePetRequest();
        request.setName(name);
        request.setBirthDate(birthDate);
        request.setAdoptionDate(adoptionDate);
        request.setRace("Dog");
        request.setBreed("Golden Retriever");
        return request;
    }

    public static CreateHistoryRequest createHistoryRequest() {
        CreateHistoryRequest request = new CreateHistoryRequest();
        request.setDate(LocalDate.now());
        request.setDescription("Annual checkup completed. All vaccinations up to date.");
        return request;
    }

    public static CreateHistoryRequest createHistoryRequest(LocalDate date, String description) {
        CreateHistoryRequest request = new CreateHistoryRequest();
        request.setDate(date);
        request.setDescription(description);
        return request;
    }
}
