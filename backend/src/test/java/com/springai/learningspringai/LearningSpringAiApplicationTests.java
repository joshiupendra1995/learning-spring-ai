package com.springai.learningspringai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"app.github.write.enabled=false", "app.github.token="}
)
class LearningSpringAiApplicationTests {

    private WebTestClient webTestClient;

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUpWebTestClient() {
        webTestClient = WebTestClient.bindToServer()
                .baseUrl("http://127.0.0.1:" + port)
                .build();
    }

    @Test
    void contextLoads() {
    }

    @Test
    void chatAndReviewRoutesServeTheReactApplication() {
        webTestClient.get()
                .uri("/")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .value(body -> org.junit.jupiter.api.Assertions.assertTrue(body.contains("<div id=\"root\"></div>")));

        webTestClient.get()
                .uri("/pr-review")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .value(body -> org.junit.jupiter.api.Assertions.assertTrue(body.contains("<div id=\"root\"></div>")));
    }

    @Test
    void fixPushesAreDisabledByDefault() {
        webTestClient.get()
                .uri("/api/ai/pr-review/fixes/status")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.enabled").isEqualTo(false)
                .jsonPath("$.writeEnabled").isEqualTo(false)
                .jsonPath("$.tokenConfigured").isEqualTo(false);
    }
}
