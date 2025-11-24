# Etapa 1: Build
FROM maven:3.9.4-eclipse-temurin-21 AS build
WORKDIR /app

# Copia o arquivo pom.xml e baixa as dependências
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia o código e compila
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: Execução
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Copia o jar gerado do estágio anterior
COPY --from=build /app/target/*.jar app.jar

# Porta padrão
EXPOSE 8090

# Comando de execução
ENTRYPOINT ["java", "-jar", "app.jar"]