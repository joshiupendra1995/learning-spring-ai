package com.springai.learningspringai.controller;

import com.springai.learningspringai.dto.PrReviewRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/ai")
@Slf4j
public class PrReviewController {

    private final ChatClient chatClient;
    private final RestClient restClient;

    public PrReviewController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
        this.restClient = RestClient.create();
    }

    @PostMapping(value = "/pr-review", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> reviewPr(@RequestBody PrReviewRequest request) {
        log.info("Received PR review request for URL: {}", request.prUrl());

        // Ensure the URL targets the raw diff format
        String diffUrl = request.prUrl().trim();
        if (!diffUrl.endsWith(".diff")) {
            diffUrl = diffUrl + ".diff";
        }

        String diffContent;
        try {
            diffContent = restClient.get()
                    .uri(diffUrl)
                    .accept(MediaType.TEXT_PLAIN)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("Failed to fetch PR diff from URL: {}", diffUrl, e);
            return Flux.just("### Error\nFailed to fetch the PR diff. Ensure the URL is valid and the repository is public.\n\n*Details: " + e.getMessage() + "*");
        }

        if (diffContent == null || diffContent.isBlank()) {
            return Flux.just("### Warning\nThe fetched PR diff is empty.");
        }

        // Truncate overly massive diffs if needed to fit model context windows
        if (diffContent.length() > 50000) {
            diffContent = diffContent.substring(0, 50000) + "\n\n[Diff truncated due to size limits...]";
        }

        String systemPrompt = """
                You are an expert Senior Staff Software Engineer and Principal Code Reviewer.
                Analyze the following Git diff carefully and provide a rigorous, professional code review.
                Structure your review clearly using Markdown:
                1. **Executive Summary**: Brief overview of what changes are introduced.
                2. **Bugs & Logical Flaws**: Any potential errors, null-pointer risks, edge cases, or concurrency issues.
                3. **Performance & Architecture**: Scalability, resource usage, or design patterns impact.
                4. **Security & Best Practices**: Vulnerabilities, clean coding guidelines, error handling.
                5. **Actionable Recommendations**: Specific code improvements or refactoring suggestions.
                """;

        String finalDiffContent = diffContent;
        return Flux.defer(() ->
                chatClient
                        .prompt()
                        .system(systemPrompt)
                        .user(finalDiffContent)
                        .stream()
                        .content()
        ).contextCapture();
    }
}