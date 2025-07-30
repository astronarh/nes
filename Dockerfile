FROM eclipse-temurin:17-jdk-jammy AS build

WORKDIR /app
COPY . .

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar  # Для Maven

EXPOSE ${PORT}
ENTRYPOINT ["java", "-jar", "app.jar"]