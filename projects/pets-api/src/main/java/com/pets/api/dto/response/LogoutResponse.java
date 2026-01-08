package com.pets.api.dto.response;

public class LogoutResponse {
    private String message = "Logged out successfully";
    private boolean tokenRevoked = true;
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public boolean isTokenRevoked() {
        return tokenRevoked;
    }
    
    public void setTokenRevoked(boolean tokenRevoked) {
        this.tokenRevoked = tokenRevoked;
    }
}
