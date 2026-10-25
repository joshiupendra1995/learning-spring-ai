package com.springai.learningspringai.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/utility")
public class TestSummaryController {

    private final ChatClient chatClient;

    public TestSummaryController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @PostMapping("/summarize")
    public Mono<String> summarizeText(@RequestBody String text) {
        if (text == null || text.isBlank()) {
            return Mono.just("Error: Input text cannot be empty.");
        }

        // Using blocking .call() inside a reactive endpoint blocks the event loop thread.
        //Await the completion of the chat client call in a separate thread, to prevent blocking the event loop.
        return Mono.create(sink -> {
            chatClient prompt()
                    .user("Provide a concise 2-sentence summary of the following text: " + text)
                    .call()
                    .content()
                .subscribe(
                    summary -> sink.success(summary),
                    error -> sink.error(error)
                );
        });
    }
}