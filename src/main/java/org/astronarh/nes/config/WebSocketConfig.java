package org.astronarh.nes.config;

import org.astronarh.nes.service.StatWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final StatWebSocketHandler statWebSocketHandler;

    public WebSocketConfig(StatWebSocketHandler statWebSocketHandler) {
        this.statWebSocketHandler = statWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(statWebSocketHandler, "/ws/stats").setAllowedOrigins("https://web.telegram.org", "https://*.telegram.org");
        registry.addHandler(statWebSocketHandler, "/ws/stats").setAllowedOrigins("*");
    }
}