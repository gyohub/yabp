package com.pets.api.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class UpdateHistoryRequest {
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
    
    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
}
