# Используем OpenJDK 17
FROM eclipse-temurin:17-jdk-jammy

# Рабочая директория
WORKDIR /app

# Копируем JAR-файл (предварительно собранный или собираем на месте)
COPY target/*.jar app.jar

# Указываем порт (Render сам назначает PORT)
EXPOSE ${PORT}

# Команда запуска
ENTRYPOINT ["java", "-jar", "app.jar"]