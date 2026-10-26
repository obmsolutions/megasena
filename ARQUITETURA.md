# Arquitetura — OBM Mega Analytics v2.1

## Componentes

- `sistema.html`: estrutura visual do painel.
- `assets/css/app.css`: estilos da aplicação.
- `assets/js/app.js`: controlador da interface e recursos legados preservados.
- `assets/js/core.js`: regras compartilhadas de filtros e importação.
- `assets/js/data-store.js`: base local, cache e sincronização incremental.
- `assets/workers/generator-worker.js`: geração fora da interface principal.
- `assets/workers/backtest-worker.js`: retroteste fora da interface principal.
- `assets/js/grouped-core.js`: domínio combinatório, validação, assinaturas e prova de cobertura do modo por grupos.
- `assets/js/grouped-ui.js`: controlador exclusivo da interface, paginação e exportação dos grupos.
- `assets/workers/grouped-generator-worker.js`: fechamento e verificação exaustiva fora da interface principal.
- `data/mega-sena.json`: base histórica auditável.
- `data/mega-sena-data.js`: mesma base para execução direta/offline.
- `tests/`: regressões automatizadas.

## Princípios

1. Um único motor de filtros é utilizado pela interface e pelo Worker.
2. Dados fictícios nunca substituem resultados reais.
3. A base local funciona sem internet; a API apenas complementa concursos novos.
4. Tarefas pesadas não devem bloquear a interface.
5. Alterações no motor devem ser acompanhadas de testes.
6. O modo por grupos lê a seleção por um contrato imutável e não escreve no estado do gerador tradicional.
7. Cada grupo possui `baseNumbers` própria, entre 7 e 15 dezenas, e assinatura canônica independente da ordem.
8. Filtros estatísticos não são removidos de um fechamento já construído, pois isso invalidaria a garantia.
9. No modo equilibrado, o motor central valida cada jogo antes da inclusão; os grupos são montados somente após a obtenção dos jogos válidos e inéditos.
10. A exportação TXT é deliberadamente plana para permanecer compatível com a importação e a conferência existentes.

## Modelo de dados do desdobramento

- `Desdobramento`: universo geral selecionado, tamanho da base, método, garantia, grupos, total de jogos e prova global.
- `Grupo`: identificador, `baseNumbers`, assinatura canônica, jogos e prova de cobertura da própria base.
- `Jogo`: identificador interno, seis dezenas ordenadas e assinatura canônica.
