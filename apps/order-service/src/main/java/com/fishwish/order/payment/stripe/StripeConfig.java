package com.fishwish.order.payment.stripe;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.stripe.Stripe;

import jakarta.annotation.PostConstruct;

@Configuration // Le dice a Java que este es un archivo de configuración
public class StripeConfig {

    // Lee la clave secreta que pusimos en el archivo application.yml
    @Value("${payment.stripe.secret-key}")
    private String secretKey;

    @PostConstruct // Este método se ejecuta automáticamente al iniciar la app
    public void init() {
        // Le entrega la llave a la librería oficial de Stripe
        Stripe.apiKey = secretKey;
    }
}