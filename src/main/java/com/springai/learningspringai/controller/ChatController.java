package com.springai.learningspringai.controller;

import com.springai.learningspringai.dto.ChatRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/ai")
@Slf4j
public class ChatController {

    private final ChatClient chatClient;

    public ChatController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chat(@RequestBody ChatRequest request) {
        log.info("Received request: {}", request);

        return Flux.defer(() ->
                        chatClient
                                .prompt()
                                .user(request.message())
                                .stream()
                                .content()
                )
                .contextCapture(); // Captures thread locals into the reactive subscriber context
    }
}