(function () {
    'use strict';

    let groupedResult = null;
    let activeWorker = null;
    let currentPage = 1;
    const PAGE_SIZE = 12;

    const $ = id => document.getElementById(id);
    const guaranteeName = value => ({ 0: 'Sem garantia', 4: 'Quadra', 5: 'Quina', 6: 'Sena' })[value] || `${value} acertos`;
    const methodName = value => ({ minimum: 'Mínimo Matemático', balanced: 'Distribuição Equilibrada com filtros', total: 'Cercamento Total' })[value] || value;
    const formatNumber = value => Number(value).toLocaleString('pt-BR');

    function getSelectedNumbers() {
        return window.OBMMegaBridge ? window.OBMMegaBridge.getSelectedNumbers() : [];
    }

    function currentSpec() {
        return {
            numbers: getSelectedNumbers(),
            method: $('groupMethod').value,
            guarantee: Number($('groupGuarantee').value),
            scope: 'group',
            groupCount: Number($('groupCount').value),
            groupSize: Number($('groupSize').value),
            gamesPerGroup: Number($('groupGamesCount').value),
            seed: Date.now(),
            filterOptions: window.OBMMegaBridge?.getActiveFilters() || {},
            lastDraw: window.OBMMegaBridge?.getLastDraw() || []
        };
    }

    function setGroupedStatus(message, type = '') {
        const status = $('groupGenerationStatus');
        status.textContent = message;
        status.className = `status-box${type ? ` ${type}` : ''}`;
    }

    function toggleMode() {
        const mode = document.querySelector('input[name="generationMode"]:checked')?.value || 'traditional';
        const traditional = mode === 'traditional';
        $('traditionalModePanel').classList.toggle('hidden', !traditional);
        $('groupedModePanel').classList.toggle('hidden', traditional);
        document.querySelectorAll('.mode-card').forEach(card => {
            const checked = card.querySelector('input')?.checked;
            card.classList.toggle('selected', Boolean(checked));
        });
        if (!traditional) updatePreview();
    }

    function updateMethodFields() {
        const total = $('groupMethod').value === 'total';
        const balanced = $('groupMethod').value === 'balanced';
        if (total) $('groupGuarantee').value = '6';
        if (!balanced && $('groupGuarantee').value === '0') $('groupGuarantee').value = '4';
        Array.from($('groupGuarantee').options).find(option => option.value === '0').disabled = !balanced;
        $('groupCount').disabled = false;
        $('groupGamesCount').disabled = total;
        $('groupGuarantee').disabled = total;
        $('groupGuaranteeScope').disabled = total;
        $('groupCountHelp').textContent = total
            ? 'Cada grupo terá todas as combinações possíveis de suas dezenas-base.'
            : 'Cada grupo terá assinatura única dentro deste lote.';
        updatePreview();
    }

    function updatePreview() {
        if (!window.OBMGroupedCore) return;
        const spec = currentSpec();
        const n = spec.numbers.length;
        const universe = window.OBMGroupedCore.combinationCount(spec.groupSize, 6);
        const lower = spec.guarantee > 0 ? window.OBMGroupedCore.theoreticalLowerBound(spec.groupSize, spec.guarantee, true) : Math.ceil(spec.groupSize / 6);
        const totalMode = spec.method === 'total';
        const groups = spec.groupCount;
        const games = totalMode ? universe * spec.groupCount : spec.groupCount * spec.gamesPerGroup;
        $('groupSelectedCount').textContent = String(n);
        $('groupSelectedNumbers').textContent = spec.numbers.length ? spec.numbers.map(v => String(v).padStart(2, '0')).join(', ') : 'Nenhuma dezena selecionada.';
        $('groupUniverseMetric').textContent = formatNumber(universe);
        $('groupLowerBoundMetric').textContent = formatNumber(lower);
        $('groupCountMetric').textContent = formatNumber(groups);
        $('groupGamesMetric').textContent = formatNumber(games);

        const validation = window.OBMGroupedCore.validateSpec(spec);
        $('groupMathPreview').className = `status-box${validation.ok ? '' : ' error'}`;
        if (n < spec.groupSize) {
            $('groupMathPreview').textContent = `Selecione ao menos ${spec.groupSize} dezenas na aba Seleção para formar cada grupo.`;
        } else if (!validation.ok) {
            $('groupMathPreview').textContent = validation.errors[0];
        } else if (totalMode) {
            $('groupMathPreview').textContent = `Cercamento completo: cada grupo-base terá ${spec.groupSize} dezenas e seus ${formatNumber(universe)} jogos possíveis. Total previsto: ${formatNumber(games)} jogos em ${formatNumber(groups)} grupos.`;
        } else if (spec.guarantee === 0) {
            $('groupMathPreview').textContent = `Distribuição viável: ${formatNumber(groups)} grupos-base inéditos de ${spec.groupSize} dezenas, com ${spec.gamesPerGroup} jogos de 6 em cada grupo (${formatNumber(games)} jogos finais). Este modo não declara garantia de quadra, quina ou sena.`;
        } else {
            $('groupMathPreview').textContent = `Configuração viável para processamento. Limite inferior calculado: ${formatNumber(lower)} jogo(s) para ${guaranteeName(spec.guarantee).toLowerCase()}. A garantia final só será declarada após a verificação exaustiva.`;
        }
    }

    function runWorker(spec) {
        if (typeof Worker === 'undefined') {
            return Promise.resolve(window.OBMGroupedCore.generate(spec, renderProgress));
        }
        return new Promise((resolve, reject) => {
            try {
                activeWorker = new Worker(new URL('assets/workers/grouped-generator-worker.js', window.location.href));
            } catch (error) {
                activeWorker = null;
                try { resolve(window.OBMGroupedCore.generate(spec, renderProgress)); }
                catch (fallbackError) { reject(fallbackError); }
                return;
            }
            activeWorker.onmessage = event => {
                if (event.data.type === 'progress') renderProgress(event.data);
                if (event.data.type === 'done') { activeWorker.terminate(); activeWorker = null; resolve(event.data.result); }
                if (event.data.type === 'error') { activeWorker.terminate(); activeWorker = null; reject(new Error(event.data.message)); }
            };
            activeWorker.onerror = event => {
                if (typeof event.preventDefault === 'function') event.preventDefault();
                activeWorker?.terminate();
                activeWorker = null;
                try { resolve(window.OBMGroupedCore.generate(spec, renderProgress)); }
                catch (fallbackError) { reject(fallbackError); }
            };
            activeWorker.postMessage({ type: 'generate', spec });
        });
    }

    function renderProgress(progress) {
        const total = progress.totalGroups || 1;
        const generated = progress.generatedGroups || 0;
        setGroupedStatus(`Gerando e validando grupos: ${generated} de ${total}...`);
        $('groupProgressBar').style.width = `${Math.min(100, generated / total * 100)}%`;
    }

    async function generateGrouped() {
        const button = $('generateGroupsButton');
        const spec = currentSpec();
        const validation = window.OBMGroupedCore.validateSpec(spec);
        if (!validation.ok) {
            setGroupedStatus(validation.errors.join(' '), 'error');
            window.OBMMegaBridge?.showError(validation.errors.join(' '));
            return;
        }
        button.disabled = true;
        $('cancelGroupsButton').classList.remove('hidden');
        $('groupProgressBar').style.width = '0%';
        setGroupedStatus('Preparando o universo combinatório e verificando a cobertura...');
        try {
            groupedResult = await runWorker(spec);
            currentPage = 1;
            renderSummary();
            renderGroups();
            $('groupExportButton').disabled = false;
            $('groupAuditButton').disabled = false;
            $('groupProgressBar').style.width = '100%';
            const proof = groupedResult.spec.guarantee === 0
                ? ' A distribuição foi equilibrada sem promessa de premiação.'
                : groupedResult.exactMinimum
                ? ' O mínimo absoluto foi comprovado para esta configuração.'
                : ' A cobertura foi comprovada exaustivamente; a quantidade representa um fechamento otimizado, sem afirmação de mínimo absoluto.';
            setGroupedStatus(`${formatNumber(groupedResult.totalGames)} jogos em ${formatNumber(groupedResult.groups.length)} grupos inéditos.${proof}`, 'success');
        } catch (error) {
            if (error.message !== 'Geração cancelada pelo usuário.') {
                setGroupedStatus(error.message, 'error');
                window.OBMMegaBridge?.showError(error.message);
            }
        } finally {
            button.disabled = false;
            $('cancelGroupsButton').classList.add('hidden');
            activeWorker = null;
        }
    }

    function cancelGrouped() {
        if (activeWorker) activeWorker.terminate();
        activeWorker = null;
        $('generateGroupsButton').disabled = false;
        $('cancelGroupsButton').classList.add('hidden');
        setGroupedStatus('Geração cancelada pelo usuário.', 'error');
    }

    function renderSummary() {
        const result = groupedResult;
        if (!result) { $('groupGenerationSummary').innerHTML = ''; return; }
        const guarantee = result.batchGuarantee;
        const coverageLabel = guarantee.notEvaluated ? 'Não aplicável' : `${(guarantee.rate * 100).toFixed(2)}%`;
        $('groupGenerationSummary').innerHTML = `
            <div class="metric"><span>Método</span><strong>${methodName(result.method)}</strong></div>
            <div class="metric"><span>Grupos inéditos</span><strong>${formatNumber(result.groups.length)}</strong></div>
            <div class="metric"><span>Total de jogos</span><strong>${formatNumber(result.totalGames)}</strong></div>
            <div class="metric"><span>Cobertura verificada</span><strong>${coverageLabel}</strong></div>
        `;
    }

    function renderGroups() {
        const container = $('groupedResults');
        if (!groupedResult) { container.innerHTML = ''; $('groupPagination').innerHTML = ''; return; }
        const totalPages = Math.max(1, Math.ceil(groupedResult.groups.length / PAGE_SIZE));
        currentPage = Math.min(Math.max(currentPage, 1), totalPages);
        const start = (currentPage - 1) * PAGE_SIZE;
        const groups = groupedResult.groups.slice(start, start + PAGE_SIZE);
        container.innerHTML = groups.map(group => {
            const report = group.guarantee;
            const badge = report
                ? `<span class="guarantee-badge ${report.verified ? 'verified' : ''}">${report.verified ? 'Garantia comprovada' : 'Cobertura parcial'}: ${guaranteeName(report.target)}</span>`
                : groupedResult.spec.guarantee === 0
                    ? `<span class="guarantee-badge">Distribuição equilibrada — sem garantia</span>`
                    : `<span class="guarantee-badge">Garantia verificada no lote completo</span>`;
            return `<article class="group-card">
                <header><div><p class="kicker">${group.label}</p><h3>${group.games.length} jogo(s)</h3></div>${badge}</header>
                <div class="group-base"><strong>Base de ${group.baseNumbers.length} dezenas:</strong> ${group.baseNumbers.map(n => `<span class="number-ball">${String(n).padStart(2, '0')}</span>`).join('')}</div>
                <div class="group-games">${group.games.map(game => `<div class="group-game"><span class="game-index">Jogo ${String(game.id).padStart(2, '0')}</span><div>${game.numbers.map(n => `<span class="number-ball">${String(n).padStart(2, '0')}</span>`).join('')}</div></div>`).join('')}</div>
            </article>`;
        }).join('');
        $('groupPagination').innerHTML = `
            <button type="button" class="secondary" id="previousGroupPage" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
            <span>Página ${currentPage} de ${totalPages}</span>
            <button type="button" class="secondary" id="nextGroupPage" ${currentPage === totalPages ? 'disabled' : ''}>Próxima</button>`;
        $('previousGroupPage').onclick = () => { currentPage--; renderGroups(); $('groupedResults').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
        $('nextGroupPage').onclick = () => { currentPage++; renderGroups(); $('groupedResults').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    }

    function download(content, filename, type = 'text/plain;charset=utf-8') {
        const blob = new Blob([content], { type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }

    function exportGroupedTxt() {
        if (!groupedResult) return;
        const lines = [
            'Mega Sena Combinações',
            `Dezenas Selecionadas: ${groupedResult.spec.numbers.map(n => String(n).padStart(2, '0')).join(', ')}`,
            ''
        ];
        groupedResult.groups.forEach(group => group.games.forEach(game => {
            lines.push(game.numbers.map(n => String(n).padStart(2, '0')).join(' '));
        }));
        const now = new Date();
        const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}`;
        download(lines.join('\r\n'), `mega_sena_combinacoes_${timestamp}.txt`);
        window.OBMMegaBridge?.showSuccess('Combinações agrupadas exportadas para TXT!');
    }

    function exportGroupedAudit() {
        if (!groupedResult) return;
        download(JSON.stringify(groupedResult, null, 2), 'OBM-Mega-v2.1-auditoria-grupos.json', 'application/json;charset=utf-8');
    }

    function clearGrouped() {
        groupedResult = null;
        currentPage = 1;
        $('groupGenerationSummary').innerHTML = '';
        $('groupedResults').innerHTML = '';
        $('groupPagination').innerHTML = '';
        $('groupProgressBar').style.width = '0%';
        $('groupExportButton').disabled = true;
        $('groupAuditButton').disabled = true;
        setGroupedStatus('Aguardando a geração dos grupos.');
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('input[name="generationMode"]').forEach(input => input.addEventListener('change', toggleMode));
        ['groupMethod', 'groupGuarantee', 'groupSize', 'groupCount', 'groupGamesCount'].forEach(id => $(id).addEventListener('input', id === 'groupMethod' ? updateMethodFields : updatePreview));
        $('generateGroupsButton').addEventListener('click', generateGrouped);
        $('cancelGroupsButton').addEventListener('click', cancelGrouped);
        $('groupExportButton').addEventListener('click', exportGroupedTxt);
        $('groupAuditButton').addEventListener('click', exportGroupedAudit);
        $('clearGroupsButton').addEventListener('click', clearGrouped);
        window.addEventListener('obm-selection-changed', updatePreview);
        toggleMode();
        updateMethodFields();
    });
})();
