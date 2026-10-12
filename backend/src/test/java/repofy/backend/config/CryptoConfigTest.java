package repofy.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class CryptoConfigTest {

    private final CryptoConfig cryptoConfig = new CryptoConfig();

    @Test
    void encryptorPreservesTextEncryptorCompatibilityForValidSettings() {
        var encryptor = cryptoConfig.tokenEncryptor("test-password", "0123456789abcdef");
        String encrypted = encryptor.encrypt("github-access-token");

        assertEquals("github-access-token", encryptor.decrypt(encrypted));
    }

    @Test
    void missingPasswordFailsWithActionableMessage() {
        var error = assertThrows(
                IllegalStateException.class,
                () -> cryptoConfig.tokenEncryptor(" ", "0123456789abcdef"));

        assertTrue(error.getMessage().contains("TOKEN_ENCRYPTOR_PASSWORD"));
        assertFalse(error.getMessage().contains("0123456789abcdef"));
    }

    @Test
    void invalidSaltFailsWithoutExposingItsValue() {
        String invalidSalt = "not-a-valid-salt";

        var error = assertThrows(
                IllegalStateException.class,
                () -> cryptoConfig.tokenEncryptor("test-password", invalidSalt));

        assertTrue(error.getMessage().contains("TOKEN_ENCRYPTOR_SALT"));
        assertFalse(error.getMessage().contains(invalidSalt));
    }
}
