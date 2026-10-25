package com.springai.learningspringai.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PrReviewViewController {

    @GetMapping("/pr-review")
    public String prReviewPage() {
        return "pr-review";
    }
}