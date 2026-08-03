# Arquitetura — OBM Mega Analytics v2.0

## Componentes

- `sistema.html`: estrutura visual do painel.
- `assets/css/app.css`: estilos da aplicação.
- `assets/js/app.js`: controlador da interface e recursos legados preservados.
- `assets/js/core.js`: regras compartilhadas de filtros e importação.
- `assets/js/data-store.js`: base local, cache e sincronização incremental.
- `assets/workers/generator-worker.js`: geração fora da interface principal.
- `assets/workers/backtest-worker.js`: retroteste fora da interface principal.
- `data/mega-sena.json`: base histórica auditável.
- `data/mega-sena-data.js`: mesma base para execução direta/offline.
- `tests/`: regressões automatizadas.

## Princípios

1. Um único motor de filtros é utilizado pela interface e pelo Worker.
2. Dados fictícios nunca substituem resultados reais.
3. A base local funciona sem internet; a API apenas complementa concursos novos.
4. Tarefas pesadas não devem bloquear a interface.
5. Alterações no motor devem ser acompanhadas de testes.
