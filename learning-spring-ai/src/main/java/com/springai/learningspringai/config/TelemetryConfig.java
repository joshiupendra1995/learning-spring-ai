package com.springai.learningspringai.config;

import io.opentelemetry.exporter.otlp.http.trace.OtlpHttpSpanExporter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TelemetryConfig {

    @Bean
    public OtlpHttpSpanExporter otlpHttpSpanExporter() {
        return OtlpHttpSpanExporter.builder()
                .setEndpoint("http://localhost:3000/api/public/otel/v1/traces")
                .addHeader("Authorization", "Basic cGstbGYtYTE2N2FlNDQtMmE1MC00YzRiLTgzQtZDg4MjE3YjE4NDhhOnNrLWxmLTQ0YjkzODA0LWMzMzUtNGVjMi05ZjA1LWZmODIyYzdiNjJlOQ==")
                .build();
    }
}