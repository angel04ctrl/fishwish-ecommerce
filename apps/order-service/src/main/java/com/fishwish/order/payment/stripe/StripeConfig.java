package com.fishwish.order.payment.stripe;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.stripe.Stripe;

import jakarta.annotation.PostConstruct;

/**
 * 🔐 Configuración de Stripe API
 * Inicializa la clave secreta de Stripe desde variables de entorno
 */
@Configuration
public class StripeConfig {

    // Lee la clave secreta de application.yml (que lee de ${STRIPE_SECRET_KEY})
    @Value("${payment.stripe.secret-key}")
    private String secretKey;

    // Lee la clave pública para información (opcional)
    @Value("${payment.stripe.public-key:}")
    private String publicKey;

    @PostConstruct
    public void init() {
        // ✅ Validar que la clave secreta está configurada
        if (secretKey == null || secretKey.trim().isEmpty()) {
            throw new IllegalStateException(
                "❌ ERROR CRÍTICO: STRIPE_SECRET_KEY no está configurada.\n" +
                "   En Railway: Agrega esta variable de entorno\n" +
                "   En local: Configura en application.yml"
            );
        }

        // ✅ Validar formato de clave secreta (debe empezar con sk_)
        if (!secretKey.startsWith("sk_")) {
            throw new IllegalStateException(
                "❌ ERROR: STRIPE_SECRET_KEY no tiene el formato correcto.\n" +
                "   Debe empezar con 'sk_' (clave secreta)\n" +
                "   Clave detectada: " + secretKey.substring(0, Math.min(10, secretKey.length())) + "..."
            );
        }

        // ✅ Configurar Stripe con la clave secreta
        Stripe.apiKey = secretKey;

        System.out.println("✅ Stripe configurado correctamente");
        System.out.println("   Clave secreta: " + secretKey.substring(0, 10) + "...");
        if (publicKey != null && !publicKey.isEmpty()) {
            System.out.println("   Clave pública: " + publicKey.substring(0, 10) + "...");
        }
    }
}