# Histórico de versões

## 2.1.0 — Desdobramento por Grupos

- Mantido integralmente o modo tradicional da v2.0.
- Incluído seletor entre geração tradicional e geração por grupos.
- Adicionados os métodos Mínimo Matemático, Distribuição Equilibrada e Cercamento Total.
- Incluída garantia pretendida (quadra, quina ou sena), verificada separadamente em cada grupo-base.
- Validação prévia dos limites combinatórios e dos limites seguros de processamento.
- Grupos com assinatura canônica, impedindo duplicidade por simples reordenação dos jogos.
- Cobertura verificada exaustivamente antes de declarar a garantia.
- Processamento dedicado em Web Worker, com fallback local, progresso e cancelamento.
- Resultados agrupados, paginação, exportação TXT e auditoria JSON.
- A geração equilibrada com até 60 dezenas valida cada jogo nos 13 filtros ativos.
- O TXT mantém o formato tradicional: cabeçalho, dezenas selecionadas e uma combinação por linha, sem identificação de grupo ou jogo.
- Jogos repetidos são bloqueados em todo o lote antes da montagem dos grupos internos.
- Separado o universo geral da aba Seleção do universo interno de cada grupo.
- Incluída a escolha de 7 a 15 dezenas por grupo.
- Cada grupo-base é inédito, todos os seus jogos usam somente suas dezenas e a união dos jogos utiliza toda a base.

## 2.0.1 — modernização preservando a versão estável

- Interface alinhada ao padrão visual do OBM Lotofácil Analytics v1.0.
- Novo cabeçalho institucional, navegação, cartões, formulários e resultados.
- Melhor responsividade para computador, tablet e celular.
- Contador visível de filtros ativos e opções selecionadas.
- Controles de filtros e dezenas com melhorias de teclado e acessibilidade.
- A ação que seleciona as 60 dezenas passou a ter nome explícito, evitando confusão com uma aposta aleatória.
- Corrigida a duplicidade de evento nos filtros da análise estatística.
- Telas de login e gerenciamento de usuários modernizadas.
- Motores de filtros, geração, conferência, scanner e exclusão preservados.

## Ajuste controlado da versão 2.0

- Corrigido o botão Gerar Combinações para exibir erros na própria tela de Desdobramento.
- Incluído gerador alternativo automático quando o navegador bloqueia ou não carrega o Web Worker.
- Filtro 2 consolidado em uma única faixa de soma: 120 a 240.
- Filtro 11 convertido para uma ou duas linhas vazias.
- Incluído Filtro 13 para quatro, cinco ou seis colunas vazias, com cinco pré-selecionada.
- Estatísticas e relatórios ajustados para as novas regras.
- Demais funcionalidades da versão 2.0 preservadas.

## 2.0.0

- Modularização de HTML, CSS e JavaScript.
- Base histórica local e cache incremental.
- Dependências locais para uso offline.
- Web Workers para geração e retroteste.
- Motor central de filtros.
- Testes automatizados.
- Preservação das funcionalidades da Fase 1.
