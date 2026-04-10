package com.fishwish.product.controller;

import com.fishwish.product.model.Product;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    // Productos reales de FishWish (según tu PDF)
    private final List<Product> products = List.of(
        new Product(1L, "Snack FishWish 100g", "100g", 80.0, 50, "Snacks naturales de pescado deshidratado - Ideal para probar"),
        new Product(2L, "Snack FishWish 250g", "250g", 110.0, 30, "Presentación estándar - Omega 3 y proteínas"),
        new Product(3L, "Snack FishWish 500g", "500g", 150.0, 20, "Presentación familiar - Mejor precio por volumen")
    );

    @GetMapping
    public List<Product> getAllProducts() {
        return products;
    }

    @GetMapping("/{id}")
    public Product getProductById(Long id) {
        return products.stream()
                .filter(p -> p.getId().equals(id))
                .findFirst()
                .orElse(null);
    }
}