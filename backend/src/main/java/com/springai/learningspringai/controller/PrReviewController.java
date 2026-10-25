package com.springai.learningspringai.controller;

import com.springai.learningspringai.dto.PrReviewRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/ai")
@Slf4j
public class PrReviewController {

    private final ChatClient chatClient;
    private final WebClient webClient;

    // Pattern to match: https://github.com/{owner}/{repo}/pull/{pull_number}
    private static final Pattern GITHUB_PR_PATTERN = Pattern.compile("github\\.com/([^/]+)/([^/]+)/pull/(\\d+)");

    public PrReviewController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
        this.webClient = WebClient.builder()
                .defaultHeader("User-Agent", "Spring-AI-PR-Reviewer-Bot")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .build();
    }

    @PostMapping(value = "/pr-review", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> reviewPr(@RequestBody PrReviewRequest request) {
        String inputUrl = request.prUrl().trim();
        log.info("Received PR review request for URL: {}", inputUrl);

        Matcher matcher = GITHUB_PR_PATTERN.matcher(inputUrl);
        if (!matcher.find()) {
            return Flux.just("### Error\nInvalid GitHub PR URL format. Please provide a URL like: `https://github.com/owner/repo/pull/123`");
        }

        String owner = matcher.group(1);
        String repo = matcher.group(2);
        String pullNumber = matcher.group(3);

        // Construct official GitHub REST API URL for diffs
        String apiUrl = String.format("https://api.github.com/repos/%s/%s/pulls/%s", owner, repo, pullNumber);

        String systemPrompt = """
                You are an expert Senior Staff Software Engineer and Principal Code Reviewer.
                Analyze the following Git diff carefully and provide a rigorous, professional code review.
                Structure your review clearly using Markdown:
                1. Dont give me summary of the changes just what fix needs to be made.
                2. **Bugs & Logical Flaws**: Any potential errors, null-pointer risks, edge cases, or concurrency issues.
                3. **Performance & Architecture**: Scalability, resource usage, or design patterns impact.
                4. **Security & Best Practices**: Vulnerabilities, clean coding guidelines, error handling.
                5. **Actionable Recommendations**: Specific code improvements or refactoring suggestions.
                """;

        return webClient.get()
                .uri(apiUrl)
                .accept(MediaType.valueOf("application/vnd.github.v3.diff")) // Requests raw diff format from GitHub API
                .retrieve()
                .bodyToMono(String.class)
                .defaultIfEmpty("")
                .flatMapMany(diffContent -> {
                    log.info("Successfully fetched API diff length: {} characters", diffContent.length());

                    if (diffContent.isBlank()) {
                        return Flux.just("### Warning\nThe fetched PR diff is empty. Make sure there are code changes included in this pull request.");
                    }

                    // Truncate if too large for context window
                    if (diffContent.length() > 50000) {
                        diffContent = diffContent.substring(0, 50000) + "\n\n[Diff truncated due to size limits...]";
                    }

                    String contentToReview = diffContent;
                    return Flux.defer(() ->
                            chatClient.prompt()
                                    .system(systemPrompt)
                                    .user(contentToReview)
                                    .stream()
                                    .content()
                    );
                })
                .onErrorResume(e -> {
                    log.error("Failed to fetch PR diff from GitHub API for URL: {}", inputUrl, e);
                    return Flux.just("### Error\nFailed to fetch the PR diff via GitHub API. Ensure the repository is public and the PR number exists.\n\n*Details: " + e.getMessage() + "*");
                })
                .contextCapture();
    }
}