package com.springai.learningspringai.config;

import io.micrometer.context.ContextRegistry;
import io.micrometer.context.ContextSnapshot;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.server.WebFilter;

@Configuration
public class ReactiveTracingConfig {

    @Bean
    public WebFilter traceContextFilter() {
        return (exchange, chain) -> chain.filter(exchange)
                .contextWrite(context -> ContextSnapshot.captureAll(ContextRegistry.getInstance())
                        .updateContext(context));
    }
}