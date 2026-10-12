package repofy.backend.services.ai;

import java.util.List;

import repofy.backend.dto.CitationDto;

public record RetrievedContext(
        List<CitationDto> citations,
        String contextText) {
}
