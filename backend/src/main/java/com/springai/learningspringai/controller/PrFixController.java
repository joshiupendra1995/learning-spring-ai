package com.springai.learningspringai.controller;

import com.springai.learningspringai.dto.PrFixCommitRequest;
import com.springai.learningspringai.dto.PrFixCommitResponse;
import com.springai.learningspringai.dto.PrFixPreviewResponse;
import com.springai.learningspringai.dto.PrFixRequest;
import com.springai.learningspringai.dto.PrFixStatusResponse;
import com.springai.learningspringai.service.PrFixService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai/pr-review")
public class PrFixController {

    private final PrFixService prFixService;


    @GetMapping("/fixes/status")
    public PrFixStatusResponse fixesStatus() {
        return new PrFixStatusResponse(
                prFixService.isWriteEnabled(),
                prFixService.isWriteFlagEnabled(),
                prFixService.isTokenConfigured()
        );
    }

    @PostMapping("/fixes/prepare")
    public Mono<PrFixPreviewResponse> prepareFixes(@RequestBody PrFixRequest request) {
        return prFixService.prepareFixes(request);
    }

    @PostMapping("/fixes/commit")
    public Mono<PrFixCommitResponse> commitFixes(@RequestBody PrFixCommitRequest request) {
        return prFixService.commitFixes(request);
    }
}
