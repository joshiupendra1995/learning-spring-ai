package com.springai.learningspringai.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PrReviewViewController {

    @GetMapping(value = "/pr-review", produces = MediaType.TEXT_HTML_VALUE)
    public Resource prReviewPage() {
        return new ClassPathResource("static/index.html");
    }
}