package repofy.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;

@Configuration
public class CryptoConfig {

    @Bean
    TextEncryptor tokenEncryptor(
            @Value("${app.token-encryptor-password:}") String password,
            @Value("${app.token-encryptor-salt:}") String salt) {
        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "Token encryption password is missing. Set TOKEN_ENCRYPTOR_PASSWORD in the environment or root .env file.");
        }
        if (salt == null || !salt.matches("[0-9a-fA-F]{16}")) {
            throw new IllegalStateException(
                    "Token encryption salt is invalid. Set TOKEN_ENCRYPTOR_SALT to exactly 16 hexadecimal characters (8 bytes).");
        }
        return Encryptors.text(password, salt);
    }
}
