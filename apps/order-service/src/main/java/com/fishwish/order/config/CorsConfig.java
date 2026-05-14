package com.fishwish.order.config;

import java.util.Arrays;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 🛡️ CORS Configuration - Robusta y garantizada
 * 
 * Usa AMBOS métodos para máxima compatibilidad:
 * 1. FilterRegistrationBean - Se ejecuta FIRST (Ordered.HIGHEST_PRECEDENCE)
 * 2. WebMvcConfigurer - Fallback para endpoints que no van a través del filtro
 * 
 * Válido para: http://localhost:3000, https://fishwish-ecommerce-web-five.vercel.app
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private static final String LOCAL_ORIGIN = "http://localhost:3000";
    private static final String VERCEL_ORIGIN = "https://fishwish-ecommerce-web-five.vercel.app";
    private static final String[] ALLOWED_ORIGINS = {LOCAL_ORIGIN, VERCEL_ORIGIN};
    private static final String[] ALLOWED_METHODS = {"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"};
    private static final long MAX_AGE = 3600;

    /**
     * ✅ MÉTODO 1: FilterRegistrationBean
     * Se ejecuta ANTES que cualquier otra cosa (HIGHEST_PRECEDENCE)
     * Garantiza que CORS se procesa primero, incluso si hay otros filtros
     */
    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // ✅ Configurar orígenes permitidos
        config.setAllowedOrigins(Arrays.asList(ALLOWED_ORIGINS));
        
        // ✅ Permitir todos los métodos HTTP
        config.setAllowedMethods(Arrays.asList(ALLOWED_METHODS));
        
        // ✅ Permitir todos los headers (incluyendo Authorization, Content-Type, etc.)
        config.setAllowedHeaders(Arrays.asList("*"));
        
        // ✅ Headers expuestos al cliente
        config.setExposedHeaders(Arrays.asList("Authorization", "X-Total-Count", "X-Page-Count"));
        
        // ✅ Permitir envío de credenciales (cookies, etc.)
        config.setAllowCredentials(true);
        
        // ✅ Cache de preflight requests (en segundos)
        config.setMaxAge(MAX_AGE);

        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        
        // 🔴 CRÍTICO: Orden HIGHEST_PRECEDENCE = ejecutar ANTES que todo
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        
        System.out.println("✅ CORS Filter registrado con orden HIGHEST_PRECEDENCE");
        System.out.println("   Orígenes permitidos: " + Arrays.asList(ALLOWED_ORIGINS));
        System.out.println("   Métodos permitidos: " + Arrays.asList(ALLOWED_METHODS));

        return bean;
    }

    /**
     * ✅ MÉTODO 2: WebMvcConfigurer (Fallback)
     * Para endpoints que no pasen a través del filtro
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(ALLOWED_ORIGINS)
                .allowedMethods(ALLOWED_METHODS)
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "X-Total-Count", "X-Page-Count")
                .allowCredentials(true)
                .maxAge(MAX_AGE);
        
        System.out.println("✅ WebMvc CORS mappings configurado para todos los endpoints");
    }
}