package com.pets.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);
    
    private final RedisTemplate<String, String> redisTemplate;
    
    private static final int AUTH_RATE_LIMIT = 5;
    private static final int GENERAL_RATE_LIMIT = 100;
    private static final int ADMIN_RATE_LIMIT = 200;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 1;
    
    public RateLimitingFilter(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            String path = request.getRequestURI();
            
            if (path.startsWith("/api/v1/auth/")) {
                String clientIp = getClientIp(request);
                if (!checkRateLimit("auth:" + clientIp, AUTH_RATE_LIMIT, response)) {
                    return;
                }
            } else if (path.startsWith("/api/v1/")) {
                String identifier = getRateLimitIdentifier(request);
                int limit = getRateLimitForPath(path);
                if (!checkRateLimit("api:" + identifier, limit, response)) {
                    return;
                }
            }
        } catch (Exception e) {
            logger.warn("Rate limiting check failed, allowing request: {}", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
    
    private boolean checkRateLimit(String key, int limit, HttpServletResponse response) throws IOException {
        try {
            String countStr = redisTemplate.opsForValue().get(key);
            int count = countStr == null ? 0 : Integer.parseInt(countStr);
            
            if (count >= limit) {
                response.setStatus(HttpServletResponse.SC_TOO_MANY_REQUESTS);
                response.setHeader("Retry-After", String.valueOf(RATE_LIMIT_WINDOW_MINUTES * 60));
                response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
                response.setHeader("X-RateLimit-Remaining", "0");
                
                Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
                if (ttl != null && ttl > 0) {
                    response.setHeader("X-RateLimit-Reset", String.valueOf(System.currentTimeMillis() / 1000 + ttl));
                }
                
                response.getWriter().write("{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again later.\"}");
                response.setContentType("application/json");
                return false;
            }
            
            if (count == 0) {
                redisTemplate.opsForValue().set(key, "1", RATE_LIMIT_WINDOW_MINUTES, TimeUnit.MINUTES);
            } else {
                redisTemplate.opsForValue().increment(key);
            }
            
            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(limit - count - 1));
            
            Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            if (ttl != null && ttl > 0) {
                response.setHeader("X-RateLimit-Reset", String.valueOf(System.currentTimeMillis() / 1000 + ttl));
            }
            
            return true;
        } catch (Exception e) {
            logger.warn("Rate limit check failed for key {}: {}", key, e.getMessage());
            return true;
        }
    }
    
    private String getRateLimitIdentifier(HttpServletRequest request) {
        try {
            Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            
            if (principal instanceof UserPrincipal) {
                UserPrincipal userPrincipal = (UserPrincipal) principal;
                return userPrincipal.getUserId().toString();
            }
        } catch (Exception e) {
            logger.debug("Could not get user principal for rate limiting: {}", e.getMessage());
        }
        
        return getClientIp(request);
    }
    
    private int getRateLimitForPath(String path) {
        try {
            if (path.startsWith("/api/v1/users")) {
                Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication().getPrincipal();
                if (principal instanceof UserPrincipal) {
                    UserPrincipal userPrincipal = (UserPrincipal) principal;
                    if (userPrincipal.getRole() == com.pets.api.domain.entity.User.Role.ADMIN) {
                        return ADMIN_RATE_LIMIT;
                    }
                }
            }
        } catch (Exception e) {
            logger.debug("Could not determine rate limit for path: {}", e.getMessage());
        }
        return GENERAL_RATE_LIMIT;
    }
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
