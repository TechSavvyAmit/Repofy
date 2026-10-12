package repofy.backend.services.indexing;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
class PgVectorStoreWriteIntegrationTest {
    private static final int EMBEDDING_DIMENSIONS = 1536;

    @Autowired
    private VectorStore vectorStore;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private UUID testDocumentId;

    @Test
    void addInsertsAndUpdatesDocumentInPostgresVectorStore() {
        assertThat(jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')",
                Boolean.class)).isTrue();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT to_regclass('public.vector_store')",
                String.class)).isEqualTo("vector_store");

        testDocumentId = UUID.randomUUID();
        String testRunId = UUID.randomUUID().toString();

        vectorStore.add(List.of(document("first value", testRunId)));

        assertStoredDocument("first value", testRunId);

        vectorStore.add(List.of(document("updated value", testRunId)));

        assertStoredDocument("updated value", testRunId);

        var filter = new FilterExpressionBuilder().eq("testRunId", testRunId).build();
        List<Document> retrieved = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query("integration test query")
                        .topK(1)
                        .filterExpression(filter)
                        .build());

        assertThat(retrieved)
                .extracting(Document::getId, Document::getText)
                .containsExactly(org.assertj.core.groups.Tuple.tuple(
                        testDocumentId.toString(), "updated value"));
    }

    @AfterEach
    void removeTestDocument() {
        if (testDocumentId != null) {
            jdbcTemplate.update("DELETE FROM public.vector_store WHERE id = ?", testDocumentId);
        }
    }

    private Document document(String content, String testRunId) {
        return new Document(testDocumentId.toString(), content, Map.of("testRunId", testRunId));
    }

    private void assertStoredDocument(String expectedContent, String expectedTestRunId) {
        Map<String, Object> row = jdbcTemplate.queryForMap(
                "SELECT content, metadata->>'testRunId' AS test_run_id "
                        + "FROM public.vector_store WHERE id = ?",
                testDocumentId);

        assertThat(row.get("content")).isEqualTo(expectedContent);
        assertThat(row.get("test_run_id")).isEqualTo(expectedTestRunId);
    }

    private static float[] testEmbedding() {
        float[] embedding = new float[EMBEDDING_DIMENSIONS];
        embedding[0] = 1.0f;
        return embedding;
    }

    @TestConfiguration
    static class EmbeddingConfiguration {
        @Bean
        @Primary
        EmbeddingModel testEmbeddingModel() {
            return new EmbeddingModel() {
                @Override
                public EmbeddingResponse call(EmbeddingRequest request) {
                    List<Embedding> embeddings = IntStream.range(0, request.getInstructions().size())
                            .mapToObj(index -> new Embedding(testEmbedding(), index))
                            .toList();
                    return new EmbeddingResponse(embeddings);
                }

                @Override
                public float[] embed(Document document) {
                    return testEmbedding();
                }

                @Override
                public int dimensions() {
                    return EMBEDDING_DIMENSIONS;
                }
            };
        }
    }
}
