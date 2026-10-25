package com.springai.learningspringai.dto;

import java.util.List;

public record PrFixPreviewResponse(
        String previewId,
        String headSha,
        List<FileChangePreview> files
) {
    public record FileChangePreview(String path, String originalContent, String updatedContent) {
    }
}
