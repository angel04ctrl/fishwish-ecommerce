package com.fishwish.order.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Se aplica a todos los endpoints
                .allowedOrigins(
                    "http://localhost:3000", 
                    "https://fishwish-ecommerce-web-five.vercel.app"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*") // Permite todos los headers para evitar problemas con Stripe
                .exposedHeaders("Authorization")
                .allowCredentials(true)
                .maxAge(3600);
    }
}