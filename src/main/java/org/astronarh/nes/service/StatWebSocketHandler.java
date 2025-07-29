package org.astronarh.nes.service;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class StatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AppStatService appStatService;

    public StatWebSocketHandler(AppStatService appStatService) {
        this.appStatService = appStatService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("WebSocket-соединение установлено: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("Получено текстовое сообщение через WebSocket: " + payload);

        try {
            JsonNode jsonNode = objectMapper.readTree(payload);

            String timestamp = jsonNode.has("timestamp") ? jsonNode.get("timestamp").asText() : "N/A";
            String userId = jsonNode.has("userId") ? jsonNode.get("userId").asText() : "N/A";
            String eventType = jsonNode.has("eventType") ? jsonNode.get("eventType").asText() : "N/A";
            JsonNode eventData = jsonNode.has("data") ? jsonNode.get("data") : objectMapper.createObjectNode();

            System.out.println("Получена статистика:");
            System.out.println("  Время: " + timestamp);
            System.out.println("  Пользователь: " + userId);
            System.out.println("  Тип события: " + eventType);
            System.out.println("  Данные: " + eventData.toString());

            appStatService.saveStat(timestamp, userId, eventType, eventData.toString());

        } catch (Exception e) {
            System.err.println("Ошибка обработки сообщения статистики: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
        System.out.println("WebSocket-соединение закрыто: " + session.getId() + " с кодом " + status.getCode() + ", причиной: " + status.getReason());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("Ошибка транспорта WebSocket в сессии " + session.getId() + ": " + exception.getMessage());
        exception.printStackTrace();
    }
}