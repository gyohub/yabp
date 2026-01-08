package com.pets.api.dto.response;

import com.pets.api.domain.entity.User;

import java.util.UUID;

public class LoginResponse {
    private String token;
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserInfo user;
    
    public static class UserInfo {
        private UUID id;
        private String username;
        private String email;
        private User.Role role;
        
        public UUID getId() {
            return id;
        }
        
        public void setId(UUID id) {
            this.id = id;
        }
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getEmail() {
            return email;
        }
        
        public void setEmail(String email) {
            this.email = email;
        }
        
        public User.Role getRole() {
            return role;
        }
        
        public void setRole(User.Role role) {
            this.role = role;
        }
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getTokenType() {
        return tokenType;
    }
    
    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }
    
    public Long getExpiresIn() {
        return expiresIn;
    }
    
    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }
    
    public UserInfo getUser() {
        return user;
    }
    
    public void setUser(UserInfo user) {
        this.user = user;
    }
}
