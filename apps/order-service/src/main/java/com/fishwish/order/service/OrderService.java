package com.fishwish.order.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import com.fishwish.order.dto.ProductDTO;
import com.fishwish.order.model.Order;
import com.fishwish.order.model.OrderItem;
import com.fishwish.order.repository.OrderRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestTemplate restTemplate;

    @Value("${app.product-service.url:http://localhost:8081/api/products}")
    private String productServiceUrl;

    public OrderService(OrderRepository orderRepository, RestTemplate restTemplate) {
        this.orderRepository = orderRepository;
        this.restTemplate = restTemplate;
    }

    @Transactional
    public Order createOrder(Order order) {
        double total = 0.0;

        // FASE 1: Validación de existencia, stock y asignación de precio seguro del backend
        for (OrderItem item : order.getItems()) {
            try {
                // 1. Obtener datos reales del producto desde product-service
                ProductDTO product = restTemplate.getForObject(
                        productServiceUrl + "/" + item.getProductId(), 
                        ProductDTO.class
                );

                if (product == null) {
                    throw new IllegalArgumentException("El producto con ID " + item.getProductId() + " no existe.");
                }

                // 2. Validar stock
                if (product.getStock() < item.getQuantity()) {
                    throw new IllegalArgumentException("Stock insuficiente para: " + product.getName() + ". Solo quedan " + product.getStock() + " unidades.");
                }

                // 3. SOBRESCRIBIR los valores enviados desde el frontend por seguridad
                item.setPrice(product.getPrice());
                item.setProductName(product.getName());
                
                total += (product.getPrice() * item.getQuantity());

            } catch (HttpClientErrorException.NotFound e) {
                throw new IllegalArgumentException("El producto con ID " + item.getProductId() + " no existe.");
            }
        }

        // FASE 2: Todo validado, ahora descontamos el stock
        for (OrderItem item : order.getItems()) {
            restTemplate.put(
                productServiceUrl + "/" + item.getProductId() + "/reduce-stock?quantity=" + item.getQuantity(), 
                null
            );
        }
        
        order.setTotalAmount(total);
        order.setStatus("CONFIRMADO");

        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}