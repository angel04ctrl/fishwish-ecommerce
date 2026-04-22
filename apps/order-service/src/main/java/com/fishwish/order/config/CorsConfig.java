package com.fishwish.order.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        // Permitimos que el frontend de Vercel y el localhost 
        // hagan peticiones a todos los endpoints (/**) de este microservicio
        registry.addMapping("/**")
                .allowedOrigins(
                    "http://localhost:3000", 
                    "https://fishwish-ecommerce-web-five.vercel.app"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}