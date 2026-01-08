package com.pets.api.controller.v1;

import com.pets.api.domain.entity.User;
import com.pets.api.dto.request.LoginRequest;
import com.pets.api.dto.request.RegisterRequest;
import com.pets.api.dto.response.LoginResponse;
import com.pets.api.dto.response.LogoutResponse;
import com.pets.api.dto.response.UserResponse;
import com.pets.api.mapper.UserMapper;
import com.pets.api.security.JwtAuthenticationFilter;
import com.pets.api.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    
    private final AuthService authService;
    private final UserMapper userMapper;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    public AuthController(AuthService authService, UserMapper userMapper, JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.authService = authService;
        this.userMapper = userMapper;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }
    
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(userMapper.toResponse(user));
    }
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            jwtAuthenticationFilter.revokeToken(token);
        }
        
        LogoutResponse response = new LogoutResponse();
        return ResponseEntity.ok(response);
    }
}
