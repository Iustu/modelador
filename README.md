# Modelador de Trilhas - Backend e Frontend (learning-curve-paths-back)

Este repositório contém o código-fonte para o backend e frontend da aplicação Modelador de Trilhas, parte do projeto Learning Curve. A aplicação permite aos usuários criar, visualizar, salvar e carregar diagramas de trilhas de aprendizado.

## Backend (Java / Spring Boot)

O backend é construído usando Java 21 e Spring Boot 3. Ele fornece uma API REST para gerenciar as trilhas de aprendizado e serve a aplicação frontend estática.

### Estrutura Principal

* **`com.learningcurve`**: Pacote raiz da aplicação.
    * **`config`**: Configurações da aplicação.
        * `SegurancaConfig.java`: Configura o Spring Security, permitindo acesso a todos os endpoints e definindo políticas de segurança de cabeçalho.
    * **`controller`**: Controladores REST que expõem os endpoints da API.
        * `TrilhaController.java`: Endpoints para CRUD (Criar, Ler, Atualizar, Deletar) de Trilhas (`/api/trilhas`).
        * `WebController.java`: Mapeia rotas do frontend (como `/` e `/editor/{id}`) para servir o `index.html`, permitindo o roteamento no lado do cliente.
    * **`domain`**: Lógica de negócio e modelo de domínio.
        * **`layout`**: Representa a parte visual/layout do diagrama.
            * `DiagramaLayout.java`: Agrupa as informações de layout dos nós.
            * `NoLayout.java`: Armazena propriedades visuais de um nó (posição, cor, texto base).
        * **`model`**: Representa a estrutura lógica da trilha.
            * `NoModel.java`: Representa um nó lógico (com ID, pai, filhos, ID de conteúdo/trilha externa).
            * `SetaModel.java`: Representa uma conexão lógica entre dois nós (origem, destino, tipo, hierarquia).
            * `TrilhaModel.java`: Agrupa o título, a lista de nós (`NoModel`) e a lista de setas (`SetaModel`) lógicas de uma trilha.
        * `TrilhaCompleta.java`: Encapsula tanto o `TrilhaModel` (lógica) quanto o `DiagramaLayout` (visual).
    * **`DTO`**: Data Transfer Objects - objetos simples para transferir dados entre camadas (principalmente API <-> Service/Mapper).
        * `DiagramaObjetoDTO.java`: Recebe dados misturados (modelo e layout) de um objeto do diagrama vindo do frontend.
        * `SetaDTO.java`: Recebe dados de uma seta vinda do frontend.
        * `TrilhaInputDTO.java`: DTO para receber a estrutura completa de uma trilha do frontend (usado para criar/atualizar).
        * `TrilhaOutputDTO.java`: DTO para enviar uma trilha completa (com ID) para o frontend (usado para buscar/retornar após salvar).
    * **`entity`**: Entidades JPA que mapeiam as tabelas do banco de dados.
        * `TrilhaModelEntity.java`: Entidade principal que armazena os dados da trilha, incluindo os modelos e layouts serializados como JSON, e gerencia relacionamentos.
        * `TrilhaItemEntity.java`: Tabela de relacionamento para rastrear itens (Conteúdo, Trilha, Assunto) referenciados dentro de uma trilha (usada para verificar dependências ao deletar).
        * `TrilhaSetaEntity.java`: Tabela para armazenar informações detalhadas sobre cada seta (relacionada a `TrilhaModelEntity`).
    * **`mapper`**: Classes responsáveis por converter entre DTOs e objetos de domínio/entidades.
        * `TrilhaMapper.java`: Converte `TrilhaInputDTO` (vindo da API) para o objeto de domínio `TrilhaCompleta`.
    * **`repository`**: Interfaces Spring Data JPA para interação com o banco de dados.
        * `TrilhaModelRepository.java`: Repositório para a entidade `TrilhaModelEntity`.
        * `TrilhaItemRepository.java`: Repositório para a entidade `TrilhaItemEntity`.
        * `TrilhaSetaRepository.java`: Repositório para a entidade `TrilhaSetaEntity`.
    * **`service`**: Camada de serviço contendo a lógica de negócio principal.
        * `TrilhaService.java`: Orquestra as operações de salvar, buscar, atualizar e deletar trilhas, utilizando o Mapper e os Repositórios. Lida com a serialização/desserialização dos dados JSON armazenados na entidade.
    * `ModeladorTrilhaBackApplication.java`: Classe principal que inicializa a aplicação Spring Boot.

* **`src/main/resources`**:
    * `application.properties`: Configurações principais da aplicação (porta, nome, perfil ativo).
    * `application-prod.properties`: Configurações específicas para o ambiente de produção (banco de dados PostgreSQL externo).
    * `static`: Contém os arquivos estáticos do frontend (HTML, CSS, JS).

## Frontend (HTML / CSS / JavaScript / Fabric.js)

O frontend é uma Single Page Application (SPA) que utiliza a biblioteca Fabric.js para renderizar e manipular o diagrama em um elemento `<canvas>`.

### Estrutura Principal (`src/main/resources/static`)

* **`index.html`**: A página principal da aplicação. Define a estrutura HTML, incluindo a área do canvas, a barra lateral de ferramentas e os modais.
* **`style.css`**: Folha de estilos CSS responsável pela aparência visual da aplicação.
* **`jsCanva/`**: Diretório contendo os arquivos JavaScript que controlam a lógica do frontend.
    * **`canvas_principal.js`**: Script principal. Inicializa o canvas do Fabric.js, lida com eventos de mouse/teclado no canvas (arrastar, soltar, selecionar, deletar), gerencia estilos de seleção e coordena a criação de objetos a partir da barra lateral ou drop. **(Contém a lógica modificada para arrastar grupos)**.
    * **`caminho.js`**: Lógica específica para desenho e atualização de setas. Contém as funções `createStandardArrow` e `updateArrowsForObject` (que calcula a posição das setas quando nós são movidos) e `getEdgePoint` (para calcular o ponto de conexão na borda do nó). **(Contém a lógica modificada para arrastar grupos)**.
    * **`servico_api.js`**: Centraliza as chamadas `fetch` para as APIs (tanto a API interna `/api/trilhas` quanto a API externa `http://api.learningcurv.es`) para buscar documentações, documentos e salvar/carregar/deletar trilhas.
    * **`passo.js`**: Gerencia a criação dos nós do tipo "Trilha", "Assunto" e "Conteúdo". Controla o modal de dois níveis para seleção de documentações e documentos da API externa.
    * **`fluxo.js`**: Responsável pela criação dos nós de fluxo (Início, Fim, Gateways).
    * **`persistencia.js`**: Lida com a interação com a API interna para salvar (`saveDiagram`), carregar (`getDiagramById`) e deletar (`deleteDiagramById`) trilhas no banco de dados. Também gerencia a atualização da URL do navegador (`/editor/{id}`).
    * **`importar_exportar.js`**: Implementa as funcionalidades de importar e exportar diagramas como arquivos JSON locais.
    * **`hierarquia.js`**: Contém a lógica para calcular e exibir a numeração hierárquica nos nós do tipo "Assunto" e seus filhos.
    * **`validador.js`**: Implementa regras de validação para verificar a consistência lógica do diagrama (ex: início/fim conectados, assuntos com conteúdo, etc.).
    * **`utilitarios.js`**: Funções utilitárias (ex: `generateId`).

## Como Executar

1.  **Backend:**
    * Certifique-se de ter o Java 21 e o Maven instalados.
    * Navegue até o diretório raiz do projeto (`learning-curve-paths-back`).
    * Execute `./mvnw spring-boot:run` (ou `mvnw.cmd spring-boot:run` no Windows).
    * O backend estará disponível em `http://localhost:8090`.
2.  **Frontend:**
    * O frontend é servido automaticamente pelo backend. Acesse `http://localhost:8090` no seu navegador.

## Acesso ao Banco de Dados (PostgreSQL - Supabase)
Para acesso direto ao banco de dados utilizado pela aplicação (hospedado no Supabase via Pooler), utilize as seguintes credenciais:

* **URL JDBC:** `jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres`
* **Usuário:** `postgres.fpwjzjrclhnezlvhtidm`
* **Senha:** `learningcurve2025`
* **Driver:** `org.postgresql.Driver`

*(Estas credenciais são lidas a partir dos arquivos `application-prod.properties` e `application-dev.properties`)*.
