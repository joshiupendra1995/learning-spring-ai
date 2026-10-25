package com.springai.learningspringai.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PrFixServiceTests {

    @Test
    void stripsOptionalMarkdownCodeFenceFromGeneratedFile() {
        assertEquals(
                "class Example {}\n",
                PrFixService.stripFileCodeFence("```java\nclass Example {}\n```")
        );
    }

    @Test
    void leavesUnfencedGeneratedFileUnchanged() {
        String source = "class Example {}\n";

        assertEquals(source, PrFixService.stripFileCodeFence(source));
    }
}
