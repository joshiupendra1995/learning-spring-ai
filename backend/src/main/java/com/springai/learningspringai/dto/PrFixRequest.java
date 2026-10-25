package com.springai.learningspringai.dto;

import java.util.List;

public record PrFixRequest(String prUrl, List<String> findings) {
}
