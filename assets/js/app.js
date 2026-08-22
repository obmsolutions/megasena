// Constantes para os filtros
        const FIBONACCI_NUMBERS = [2, 3, 5, 8, 13, 21, 34, 55];
        const PRIME_NUMBERS = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
        const MOLDURA_NUMBERS = [1,2,3,4,5,6,7,8,9,10,11,21,31,41,51,52,53,54,55,56,57,58,59,60,20,30,40,50];
        const MIOLO_NUMBERS = [12,13,14,15,16,17,18,19,22,23,24,25,26,27,28,29,32,33,34,35,36,37,38,39,42,43,44,45,46,47,48,49];
        const QUADRANT_1 = [1,2,3,4,5,11,12,13,14,15,21,22,23,24,25];
        const QUADRANT_2 = [6,7,8,9,10,16,17,18,19,20,26,27,28,29,30];
        const QUADRANT_3 = [31,32,33,34,35,41,42,43,44,45,51,52,53,54,55];
        const QUADRANT_4 = [36,37,38,39,40,46,47,48,49,50,56,57,58,59,60];
        const HORIZONTAL_LINES = {
            1: Array.from({length: 10}, (_, i) => i + 1),
            2: Array.from({length: 10}, (_, i) => i + 11),
            3: Array.from({length: 10}, (_, i) => i + 21),
            4: Array.from({length: 10}, (_, i) => i + 31),
            5: Array.from({length: 10}, (_, i) => i + 41),
            6: Array.from({length: 10}, (_, i) => i + 51)
        };

        // Variáveis globais
        let selectedNumbers = [];
        let allCombinations = [];
        let filteredCombinations = [];
        let historicalData = [];
        let lastDrawNumbers = [];
        let currentResults = [];
        let numberFrequencies = Array(61).fill(0);
        let lastUsedDraw = null;
        let frequencyChart = null;
        let currentScannerResult = null;
        let lastParseReport = { valid: 0, invalid: 0, duplicateGames: 0, invalidLines: [] };

        // Inicialização
        document.addEventListener('DOMContentLoaded', () => {
            createNumberGrid();
            setupFilterOptions();
            initializeFilterStyles();
            loadLastDraws();
            
            // Event listeners para os novos controles
            document.getElementById('sorteiosAnalise').addEventListener('change', loadLastDraws);
            document.getElementById('topDezenas').addEventListener('change', function() {
                displayHotColdNumbers(parseInt(this.value));
            });
            
            // Configura os eventos para os filtros de análise
            document.querySelectorAll('#filtrosAnaliseOptions .filter-option').forEach(option => {
                option.addEventListener('click', function() {
                    this.classList.toggle('selected');
                });
            });
        });

        function atualizarAnalise() {
            loadLastDraws();
        }

        function openTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            document.querySelector(`.tab[onclick="openTab('${tabId}')"]`).classList.add('active');
        }

        function createNumberGrid() {
            const quadrants = {
                quadrant1Grid: QUADRANT_1,
                quadrant2Grid: QUADRANT_2,
                quadrant3Grid: QUADRANT_3,
                quadrant4Grid: QUADRANT_4
            };

            Object.keys(quadrants).forEach(gridId => {
                const grid = document.getElementById(gridId);
                grid.innerHTML = '';
                const numbers = quadrants[gridId].sort((a, b) => a - b);
                numbers.forEach((num, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'number-btn';
                    btn.textContent = num.toString().padStart(2, '0');
                    btn.dataset.number = num;
                    btn.style.gridColumn = (index % 5) + 1;
                    btn.style.gridRow = Math.floor(index / 5) + 1;
                    btn.addEventListener('click', () => toggleNumberSelection(num));
                    if (selectedNumbers.includes(num)) {
                        btn.classList.add('selected');
                    }
                    grid.appendChild(btn);
                });
            });

            updateSelectedNumbersDisplay();
        }

        function toggleNumberSelection(number) {
            const index = selectedNumbers.indexOf(number);
            if (index === -1) {
                if (selectedNumbers.length >= 60) {
                    showError('Máximo de 60 números permitidos!');
                    return;
                }
                selectedNumbers.push(number);
            } else {
                selectedNumbers.splice(index, 1);
            }
            updateSelectedNumbersDisplay();
            createNumberGrid();
        }

        function updateSelectedNumbersDisplay() {
            document.getElementById('selectedCount').textContent = selectedNumbers.length;
            const selectedNumbersStr = selectedNumbers.sort((a, b) => a - b).map(n => n.toString().padStart(2, '0')).join(', ');
            document.getElementById('selectedNumbers').textContent = selectedNumbersStr;
            document.getElementById('selectedNumbersCheck').textContent = selectedNumbersStr;
        }

        function selectAllNumbers() {
            selectedNumbers = Array.from({length: 60}, (_, i) => i + 1);
            updateSelectedNumbersDisplay();
            createNumberGrid();
            showSuccess('Todas as 60 dezenas selecionadas!');
        }

        function clearSelection() {
            selectedNumbers = [];
            createNumberGrid();
            updateSelectedNumbersDisplay();
            showSuccess('Seleção limpa!');
        }

        function clearCombinations() {
            allCombinations = [];
            filteredCombinations = [];
            document.getElementById('results').innerHTML = '';
            document.getElementById('filteredCount').textContent = '0';
            document.getElementById('generationStats').innerHTML = '';
            setGenerationStatus('Aguardando a geração das combinações.');
            showSuccess('Combinações limpas! Você pode gerar novas combinações.');
        }

        function setupFilterOptions() {
            document.querySelectorAll('.filter-options').forEach(container => {
                container.querySelectorAll('.filter-option').forEach(option => {
                    option.addEventListener('click', function() {
                        this.classList.toggle('selected');
                    });
                });
            });
        }

        function initializeFilterStyles() {
            // Pré-seleção controlada pelo HTML
        }

async function loadLastDraws() {
    const qtdSorteios = parseInt(document.getElementById('sorteiosAnalise').value);
    const topDezenas = parseInt(document.getElementById('topDezenas').value);
    
    try {
        historicalData = await OBMDataStore.recent(Math.min(qtdSorteios, 100));
        if (!historicalData.length) throw new Error('Base histórica local indisponível.');
        lastDrawNumbers = historicalData[0].listaDezenas.map(Number);
        
        updateNumberFrequencies();
        displayHotColdNumbers(topDezenas);
        displayFrequencyChart();
        displayPatternAnalysis();
    } catch (error) {
        console.error('Erro ao carregar sorteios:', error);
        historicalData = [];
        lastDrawNumbers = [];
        updateNumberFrequencies();
        if (frequencyChart) { frequencyChart.destroy(); frequencyChart = null; }
        document.getElementById('hotColdNumbers').innerHTML = '<p>Dados indisponíveis. Tente novamente ou carregue a planilha no módulo de Exclusão Ponderada.</p>';
        document.getElementById('patternAnalysis').innerHTML = '<p>Nenhuma análise foi calculada sem dados reais.</p>';
        showError('Não foi possível carregar a base histórica local ou sincronizada. Nenhum dado fictício foi utilizado.');
    }
}

        function updateNumberFrequencies() {
            numberFrequencies = Array(61).fill(0);
            historicalData.forEach(draw => {
                draw.listaDezenas.forEach(num => {
                    numberFrequencies[parseInt(num)]++;
                });
            });
        }

        function displayHotColdNumbers(topCount = 10) {
            const frequencies = numberFrequencies.slice(1).map((freq, idx) => ({ 
                num: idx + 1, 
                freq 
            }));
            
            frequencies.sort((a, b) => b.freq - a.freq);

            const hot = frequencies.slice(0, topCount).map(f => f.num);
            const cold = frequencies.slice(-topCount).reverse().map(f => f.num);

            const grid = document.getElementById('hotColdNumbers');
            grid.innerHTML = '';
            
            for (let i = 1; i <= 60; i++) {
                const btn = document.createElement('span');
                btn.className = `number-ball ${hot.includes(i) ? 'hot' : ''} ${cold.includes(i) ? 'cold' : ''}`;
                btn.textContent = i.toString().padStart(2, '0');
                grid.appendChild(btn);
            }
        }

        function displayFrequencyChart() {
            const ctx = document.getElementById('frequencyChart').getContext('2d');
            
            // Destrói o gráfico anterior se existir
            if (frequencyChart) {
                frequencyChart.destroy();
            }
            
            frequencyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Array.from({length: 60}, (_, i) => (i + 1).toString().padStart(2, '0')),
                    datasets: [{
                        label: 'Frequência',
                        data: numberFrequencies.slice(1),
                        backgroundColor: '#3b82f6',
                        borderColor: '#2563eb',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Frequência' } },
                        x: { 
                            title: { display: true, text: 'Número' },
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 20
                            }
                        }
                    }
                }
            });
        }

        function displayPatternAnalysis() {
            if (!historicalData.length) {
                document.getElementById('patternAnalysis').innerHTML = '<p>Nenhum dado real disponível para análise.</p>';
                return;
            }
            const stats = OBMStatistics.summary(historicalData);
            const analysis = [`Soma média das dezenas: ${stats.averageSum.toFixed(1)}`,`Percentual de jogos com números consecutivos: ${(stats.consecutiveRate * 100).toFixed(1)}%`];
            document.getElementById('patternAnalysis').innerHTML = analysis.map(line => `<p>${line}</p>`).join('');
        }

        function combinations(n, k) {
            if (k > n) return 0;
            let result = 1;
            for (let i = 0; i < k; i++) {
                result *= (n - i) / (i + 1);
            }
            return Math.round(result);
        }

        function generateCoverageCandidate(numbers, gameSize, actualFrequencies) {
            const remaining = [...numbers];
            const candidate = [];
            while (candidate.length < gameSize && remaining.length) {
                const weights = remaining.map(n => 1 / (1 + actualFrequencies[n]));
                const totalWeight = weights.reduce((a, b) => a + b, 0);
                let target = Math.random() * totalWeight;
                let selectedIndex = weights.length - 1;
                for (let i = 0; i < weights.length; i++) {
                    target -= weights[i];
                    if (target <= 0) { selectedIndex = i; break; }
                }
                candidate.push(remaining.splice(selectedIndex, 1)[0]);
            }
            return candidate.sort((a, b) => a - b);
        }

        function getActualFrequencies(combos, numbers) {
            const frequencies = Object.fromEntries(numbers.map(n => [n, 0]));
            combos.forEach(combo => combo.forEach(n => frequencies[n]++));
            return frequencies;
        }

        function getFilterConfig() {
            const ids = ['parImparOptions','somaOptions','repetidasOptions','fibonacciOptions','primosOptions','molduraOptions','mioloOptions','multiplos3Options','multiplos4Options','quadrantesOptions','linhasOptions','sequenciaisOptions','colunasVaziasOptions'];
            return Object.fromEntries(ids.map(id => [id, getSelectedOptions(id)]));
        }

        function runGeneratorWorker(numbers, gameSize, count, maxAttempts, onProgress) {
            const options = getFilterConfig();
            const fallback = () => runGeneratorInMainThread(numbers, gameSize, count, maxAttempts, options, lastDrawNumbers, onProgress);

            if (typeof Worker === 'undefined') return fallback();

            return new Promise((resolve, reject) => {
                let worker;
                let finished = false;

                const runFallback = () => {
                    if (finished) return;
                    finished = true;
                    if (worker) worker.terminate();
                    fallback().then(resolve, reject);
                };

                try {
                    const workerUrl = new URL('assets/workers/generator-worker.js', window.location.href);
                    worker = new Worker(workerUrl);
                } catch (error) {
                    runFallback();
                    return;
                }

                worker.onmessage = event => {
                    if (event.data.type === 'progress') onProgress?.(event.data);
                    if (event.data.type === 'done' && !finished) {
                        finished = true;
                        worker.terminate();
                        resolve(event.data);
                    }
                };
                worker.onerror = error => {
                    if (typeof error.preventDefault === 'function') error.preventDefault();
                    runFallback();
                };
                worker.postMessage({numbers, size:gameSize, count, maxAttempts, options, lastDraw:lastDrawNumbers});
            });
        }

        function runGeneratorInMainThread(numbers, gameSize, count, maxAttempts, options, lastDraw, onProgress) {
            return new Promise((resolve, reject) => {
                const frequencies = Object.fromEntries(numbers.map(n => [n, 0]));
                const seen = new Set();
                const generated = [];
                let attempts = 0;

                const processBatch = () => {
                    try {
                        const batchLimit = Math.min(maxAttempts, attempts + 2000);
                        while (generated.length < count && attempts < batchLimit) {
                            const combo = generateCoverageCandidate(numbers, gameSize, frequencies);
                            const key = combo.join(',');
                            if (!seen.has(key) && OBMCore.applyFilters(combo, options, lastDraw)) {
                                seen.add(key);
                                generated.push(combo);
                                combo.forEach(n => frequencies[n]++);
                            }
                            attempts++;
                        }

                        onProgress?.({ generated: generated.length, attempts });
                        if (generated.length >= count || attempts >= maxAttempts) {
                            resolve({ combinations: generated, attempts, frequencies, fallback: true });
                            return;
                        }
                        setTimeout(processBatch, 0);
                    } catch (error) {
                        reject(new Error(`Falha ao gerar as combinações: ${error.message}`));
                    }
                };

                processBatch();
            });
        }

        function setGenerationStatus(message, isError = false) {
            const status = document.getElementById('generationStatus');
            if (!status) return;
            status.textContent = message;
            status.className = `status-box${isError ? ' error' : ''}`;
        }

        async function generateCombinations() {
            const generateButton = document.getElementById('generateButton');
            const originalText = generateButton.innerHTML;
            generateButton.innerHTML = '<span class="loading"></span> Gerando...';
            generateButton.disabled = true;
            setGenerationStatus('Validando a seleção e os filtros...');

            try {
                if (selectedNumbers.length < 6) throw new Error('Selecione pelo menos 6 números!');
                const count = parseInt(document.getElementById('combinationsCount').value);
                const numbersPerGame = parseInt(document.getElementById('numbersPerGame').value);
                if (isNaN(count) || count < 1 || count > 1000) throw new Error('Informe um número válido de combinações (1-1000)!');
                if (isNaN(numbersPerGame) || numbersPerGame < 6 || numbersPerGame > 15) throw new Error('Informe uma quantidade válida de dezenas por jogo (6-15)!');
                if (selectedNumbers.length < numbersPerGame) throw new Error(`Selecione pelo menos ${numbersPerGame} números!`);

                const maxCombinations = combinations(selectedNumbers.length, numbersPerGame);
                if (count > maxCombinations) throw new Error(`O número solicitado (${count}) excede o máximo possível (${maxCombinations}).`);

                const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b);
                const maxAttempts = Math.max(15000, count * 800);
                setGenerationStatus(`Gerando 0 de ${count} combinações...`);
                const workerResult = await runGeneratorWorker(sortedNumbers, numbersPerGame, count, maxAttempts, progress => {
                    generateButton.innerHTML = `<span class="loading"></span> Gerando ${progress.generated}/${count}...`;
                    setGenerationStatus(`Gerando ${progress.generated} de ${count} combinações...`);
                });
                const selectedCombinations = workerResult.combinations;
                const attempts = workerResult.attempts;

                allCombinations = selectedCombinations;
                filteredCombinations = [...allCombinations];
                updateResultsDisplay();

                const actual = getActualFrequencies(allCombinations, sortedNumbers);
                const requestedSlots = count * numbersPerGame;
                const expectedAverage = requestedSlots / sortedNumbers.length;
                document.getElementById('generationStats').innerHTML = `
                    <p><strong>Solicitadas:</strong> ${count} | <strong>Geradas:</strong> ${allCombinations.length} | <strong>Tentativas:</strong> ${attempts}</p>
                    <p><strong>Frequência real das dezenas nos jogos aprovados</strong> (média-alvo: ${expectedAverage.toFixed(1)}):</p>
                    <div class="ranking-table-wrap"><table class="ranking-table"><thead><tr><th>Dezena</th><th>Frequência real</th><th>Diferença da média</th></tr></thead><tbody>
                    ${sortedNumbers.map(n => `<tr><td>${n.toString().padStart(2, '0')}</td><td>${actual[n]}</td><td>${(actual[n] - expectedAverage).toFixed(1)}</td></tr>`).join('')}
                    </tbody></table></div>`;

                if (allCombinations.length === 0) {
                    setGenerationStatus('Nenhuma combinação atende aos filtros selecionados. Desative ou flexibilize alguns filtros.', true);
                    showError('Nenhuma combinação atende aos filtros selecionados. Desative ou flexibilize alguns filtros.');
                } else if (allCombinations.length < count) {
                    setGenerationStatus(`Geração parcial: ${allCombinations.length} de ${count} combinações válidas encontradas.`);
                    showError(`Geração parcial: foram solicitados ${count} jogos, mas apenas ${allCombinations.length} combinações válidas foram encontradas. Flexibilize os filtros para completar a carteira.`);
                } else {
                    setGenerationStatus(`${allCombinations.length} combinações geradas e validadas com sucesso.`);
                    showSuccess(`${allCombinations.length} combinações geradas e validadas com sucesso.`);
                }
            } catch (error) {
                console.error('Erro ao gerar combinações:', error);
                setGenerationStatus(error.message, true);
                showError(error.message);
            } finally {
                generateButton.innerHTML = originalText;
                generateButton.disabled = false;
            }
        }

        async function applyFilters() {
            if (!allCombinations.length) {
                showError('Não existem combinações geradas. Configure os filtros e clique em "Gerar Combinações".');
                return;
            }
            filteredCombinations = allCombinations.filter(applyFiltersToCombination);
            updateResultsDisplay();
            if (filteredCombinations.length === 0) {
                showError('Nenhuma combinação existente atende à nova configuração de filtros.');
            } else {
                showSuccess(`${filteredCombinations.length} de ${allCombinations.length} combinações atendem aos filtros atuais.`);
            }
        }

        function getSelectedOptions(filterId) {
            return Array.from(document.querySelector(`#${filterId}`).querySelectorAll('.filter-option.selected')).map(opt => opt.dataset.value);
        }

        // A interface e o Worker usam o mesmo motor central para impedir divergência de filtros.
        function applyFiltersToCombination(combo) {
            return OBMCore.applyFilters(combo, getFilterConfig(), lastDrawNumbers);
        }

        function updateResultsDisplay() {
            const resultsDiv = document.getElementById('results');
            document.getElementById('filteredCount').textContent = filteredCombinations.length;
            resultsDiv.innerHTML = filteredCombinations.map(combo => `
                <div class="result-item">
                    ${combo.map(n => `<span class="number-ball">${n.toString().padStart(2, '0')}</span>`).join('')}
                </div>
            `).join('');
        }

        function resetFilters() {
            document.querySelectorAll('#tab3 .filter-option').forEach(opt => opt.classList.remove('selected'));
            showSuccess('Todos os filtros de geração foram desativados.');
        }

        function restoreRecommendedFilters() {
            const recommended = {
                parImparOptions: ['3-3','2-4','4-2'],
                somaOptions: ['120-240'],
                repetidasOptions: ['0','1'],
                fibonacciOptions: ['0','1','2'],
                primosOptions: ['1','2','3'],
                molduraOptions: ['2','3','4'],
                mioloOptions: ['2','3','4'],
                multiplos3Options: ['1','2','3'],
                multiplos4Options: ['0','1','2','3'],
                quadrantesOptions: ['3','4'],
                linhasOptions: ['1','2'],
                sequenciaisOptions: ['0','2'],
                colunasVaziasOptions: ['5']
            };
            document.querySelectorAll('#tab3 .filter-option').forEach(opt => opt.classList.remove('selected'));
            Object.entries(recommended).forEach(([id, values]) => {
                document.querySelectorAll(`#${id} .filter-option`).forEach(opt => {
                    if (values.includes(opt.dataset.value)) opt.classList.add('selected');
                });
            });
            showSuccess('Filtros recomendados restaurados com base no histórico.');
        }

        async function checkResults() {
            const fileInput = document.getElementById('fileInput');
            const drawNumberInput = document.getElementById('drawNumber');
            const checkButton = document.getElementById('checkButton');

            if (!fileInput.files[0]) {
                showError('Selecione um arquivo com seus jogos.');
                return;
            }

            const originalButtonText = checkButton.innerHTML;
            checkButton.innerHTML = '<span class="loading"></span> Conferindo...';
            checkButton.disabled = true;

            try {
                const fileContent = await readFileAsText(fileInput.files[0]);
                const combinations = parseCombinations(fileContent);
                if (combinations.length === 0) {
                    showError(`Nenhum jogo válido encontrado. Linhas inválidas: ${lastParseReport.invalid}; duplicadas: ${lastParseReport.duplicateGames}.`);
                    return;
                }

                let drawNumber = drawNumberInput.value ? parseInt(drawNumberInput.value) : null;
                let draw = drawNumber ? historicalData.find(d => d.numero === drawNumber) : historicalData[0];
                if (!draw && drawNumber) {
                    draw = await OBMDataStore.byNumber(drawNumber);
                    historicalData.push(draw);
                    historicalData.sort((a, b) => b.numero - a.numero);
                }
                if (!draw) throw new Error('Nenhum sorteio disponível.');

                lastUsedDraw = { ...draw, listaDezenas: draw.listaDezenas.map(n => n.padStart(2, '0')) };

                currentResults = processResults(combinations, draw);
                displayDrawInfo(draw);
                displayResults(currentResults, draw);
                document.getElementById('checkResults').classList.remove('hidden');
                document.getElementById('resultsSummary').classList.remove('hidden');
                showSuccess('Resultados conferidos com sucesso!');
            } catch (error) {
                console.error('Erro ao conferir resultados:', error);
                showError(`Erro: ${error.message}`);
            } finally {
                checkButton.innerHTML = originalButtonText;
                checkButton.disabled = false;
            }
        }

        async function checkManualResults() {
            const fileInput = document.getElementById('fileInput');
            const manualDrawNumber = document.getElementById('manualDrawNumber').value;
            const manualDrawDate = document.getElementById('manualDrawDate').value;
            const manualDrawNumbers = document.getElementById('manualDrawNumbers').value;
            const checkManualButton = document.getElementById('checkManualButton');

            if (!fileInput.files[0]) {
                showError('Selecione um arquivo com seus jogos.');
                return;
            }

            const originalButtonText = checkManualButton.innerHTML;
            checkManualButton.innerHTML = '<span class="loading"></span> Conferindo...';
            checkManualButton.disabled = true;

            try {
                const drawNumber = parseInt(manualDrawNumber);
                if (isNaN(drawNumber) || drawNumber <= 0) {
                    throw new Error('Informe um número de concurso válido.');
                }

                if (!manualDrawDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                    throw new Error('Informe a data no formato DD/MM/AAAA.');
                }
                const [day, month, year] = manualDrawDate.split('/').map(Number);
                const date = new Date(year, month - 1, day);
                if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() + 1 !== month || date.getFullYear() !== year) {
                    throw new Error('Data inválida.');
                }

                const numbers = manualDrawNumbers
                    .trim()
                    .split(/[\s,]+/)
                    .map(n => parseInt(n))
                    .filter(n => !isNaN(n) && n >= 1 && n <= 60);
                if (numbers.length !== 6 || new Set(numbers).size !== 6) {
                    throw new Error('Insira exatamente 6 dezenas únicas entre 1 e 60.');
                }

                const fileContent = await readFileAsText(fileInput.files[0]);
                const combinations = parseCombinations(fileContent);
                if (combinations.length === 0) {
                    throw new Error(`Nenhum jogo válido encontrado. Linhas inválidas: ${lastParseReport.invalid}; duplicadas: ${lastParseReport.duplicateGames}.`);
                }

                const draw = {
                    numero: drawNumber,
                    dataApuracao: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
                    listaDezenas: numbers.map(n => n.toString().padStart(2, '0'))
                };

                lastUsedDraw = { ...draw };

                currentResults = processResults(combinations, draw);
                displayDrawInfo(draw);
                displayResults(currentResults, draw);
                document.getElementById('checkResults').classList.remove('hidden');
                document.getElementById('resultsSummary').classList.remove('hidden');
                showSuccess('Resultados conferidos manualmente com sucesso!');
            } catch (error) {
                console.error('Erro ao conferir resultados manualmente:', error);
                showError(`Erro: ${error.message}`);
            } finally {
                checkManualButton.innerHTML = originalButtonText;
                checkManualButton.disabled = false;
            }
        }

        function readFileAsText(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = event => resolve(event.target.result);
                reader.onerror = error => reject(error);
                reader.readAsText(file);
            });
        }

        function parseCombinations(content) {
            const parsed = OBMCore.parseCombinations(content);
            lastParseReport = parsed.report;
            return parsed.combinations;
        }

        function processResults(combinations, draw) {
            return OBMChecker.process(combinations, draw);
        }

        function displayDrawInfo(draw) {
            const formattedDate = formatDateToDDMMYYYY(draw.dataApuracao);
            document.getElementById('drawResultDisplay').innerHTML = `
                <p><strong>Concurso:</strong> ${draw.numero}</p>
                <p><strong>Data:</strong> ${formattedDate}</p>
                <p><strong>Dezenas sorteadas:</strong> ${draw.listaDezenas.map(n => n.padStart(2, '0')).join(' ')}</p>
                <div>${draw.listaDezenas.map(n => `<span class="number-ball">${n}</span>`).join('')}</div>
            `;
        }

        function displayResults(results, draw) {
            const summary = { sena: 0, quina: 0, quadra: 0, terno: 0, duque: 0, as: 0, zero: 0 };
            const drawNumbers = draw.listaDezenas.map(Number);
            results.forEach(result => {
                const key = getResultKey(result.matches);
                summary[key]++;
            });

            const detailed = results.map((result, index) => `
                <div class="p-2 border-b">
                    Jogo ${index+1}:
                    ${result.numbers.map(n => {
                        const isMatch = drawNumbers.includes(n);
                        return `<span class="number-ball ${isMatch ? 'match' : ''}">${n.toString().padStart(2, '0')}</span>`;
                    }).join('')}
                    <span class="result-badge ${getResultClass(result.matches)}">${result.matches} acerto(s)</span>
                </div>
            `).join('');

            document.getElementById('detailedResults').innerHTML = detailed;
            document.getElementById('resultSummary').innerHTML = `
                <div class="stats-grid">
                    ${[6,5,4,3,2,1,0].map(matches => `
                        <div class="stat-item ${getResultClass(matches)}">
                            <span class="stat-count">${summary[getResultKey(matches)]}</span>
                            <span>${getResultLabel(matches)}</span>
                        </div>
                    `).join('')}
                </div>
                <p>Total de jogos conferidos: ${results.length}</p>
                <p>Importação: ${lastParseReport.valid} válidos, ${lastParseReport.invalid} linhas inválidas e ${lastParseReport.duplicateGames} jogos duplicados ignorados.${lastParseReport.invalidLines.length ? ` Linhas inválidas: ${lastParseReport.invalidLines.join(', ')}${lastParseReport.invalid > 10 ? '...' : ''}.` : ''}</p>
            `;
        }

        function exportToPDF() {
    if (!currentResults.length) {
        showError('Nenhum resultado para exportar.');
        return;
    }
    if (!lastUsedDraw || !lastUsedDraw.numero || !lastUsedDraw.dataApuracao || !lastUsedDraw.listaDezenas) {
        showError('Dados do sorteio inválidos. Realize a conferência novamente.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configurações iniciais
    doc.setProperties({
        title: `Conferência Mega Sena - Concurso ${lastUsedDraw.numero}`,
        subject: 'Resultados da conferência de jogos da Mega Sena',
        author: 'OBM Mega Analytics v2.0',
        keywords: 'mega sena, loteria, conferência, resultados',
        creator: 'OBM Mega Analytics v2.0'
    });

    const primaryColor = [0, 102, 204]; // Azul do site
    const formattedDate = formatDateToDDMMYYYY(lastUsedDraw.dataApuracao);

    // Cabeçalho
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Relatório de Conferência - Mega Sena', 105, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Concurso: ${lastUsedDraw.numero}`, 15, 40);
    doc.text(`Data: ${formattedDate}`, 15, 48);

    // Dezenas sorteadas com bolinhas verdes
    doc.text('Dezenas sorteadas:', 15, 60);
    const drawNumbers = lastUsedDraw.listaDezenas.map(n => n.toString().padStart(2, '0')).sort();
    let xPos = 60;
    drawNumbers.forEach(num => {
        doc.setFillColor(16, 185, 129); // verde
        doc.circle(xPos, 58, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(num, xPos, 59.5, { align: 'center' });
        xPos += 8;
        doc.setTextColor(0, 0, 0);
    });

    // Dezenas selecionadas adicionadas abaixo
    if (selectedNumbers.length > 0) {
        const selectedFormatted = selectedNumbers
            .map(n => n.toString().padStart(2, '0'))
            .sort()
            .join(', ');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Dezenas selecionadas:', 15, 70);
        doc.text(selectedFormatted, 15, 78);
    }

    // Detalhes dos jogos conferidos
    doc.text('Detalhes dos jogos conferidos:', 15, 90);
    let yPos = 100;
    currentResults.forEach((result, index) => {
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }
        const numbersText = result.numbers.map(n => n.toString().padStart(2, '0')).join(' ');
        doc.text(`Jogo ${index + 1}: ${numbersText} - Acertos: ${result.matches}`, 15, yPos);
        yPos += 10;
    });

    doc.save(`Conferencia_MegaSena_Concurso_${lastUsedDraw.numero}.pdf`);
    showSuccess('PDF exportado com sucesso!');
}

        function getResultLabelFromKey(key) {
            return {
                sena: 'Sena',
                quina: 'Quina',
                quadra: 'Quadra',
                terno: 'Terno',
                duque: 'Duque',
                as: 'Ás',
                zero: 'Zero'
            }[key] || '';
        }

        function exportToTxtCheck() {
            if (!currentResults.length) {
                showError('Nenhum resultado para exportar.');
                return;
            }
            if (!lastUsedDraw || !lastUsedDraw.numero || !lastUsedDraw.dataApuracao || !lastUsedDraw.listaDezenas) {
                showError('Dados do sorteio inválidos. Realize a conferência novamente.');
                return;
            }

            const formattedDate = formatDateToDDMMYYYY(lastUsedDraw.dataApuracao);

            let txtContent = `CONFERÊNCIA MEGA SENA\n`;
            txtContent += `Concurso: ${lastUsedDraw.numero}\n`;
            txtContent += `Data: ${formattedDate}\n`;
            txtContent += `Dezenas sorteadas: ${lastUsedDraw.listaDezenas.join(' ')}\n`;
            txtContent += `Dezenas Selecionadas: ${selectedNumbers.map(n => n.toString().padStart(2, '0')).join(', ')}\n\n`;
            txtContent += `ESTATÍSTICAS:\n`;
            const stats = currentResults.reduce((acc, result) => {
                acc[getResultKey(result.matches)]++;
                return acc;
            }, { sena: 0, quina: 0, quadra: 0, terno: 0, duque: 0, as: 0, zero: 0 });
            [6,5,4,3,2,1,0].forEach(matches => {
                txtContent += `${getResultLabel(matches)}: ${stats[getResultKey(matches)]}\n`;
            });
            txtContent += `\nDETALHES DOS JOGOS:\n`;
            currentResults.forEach((result, index) => {
                txtContent += `Jogo ${index+1}: ${result.numbers.map(n => n.toString().padStart(2, '0')).join(' ')} | ${result.matches} acertos\n`;
            });

            const blob = new Blob([txtContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conferencia_mega_sena_${lastUsedDraw.numero}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showSuccess('TXT exportado com sucesso!');
        }

        function exportToTxt() {
            if (filteredCombinations.length === 0) {
                showError('Nenhuma combinação para exportar!');
                return;
            }
            let txtContent = `Mega Sena Combinações\n`;
            txtContent += `Dezenas Selecionadas: ${selectedNumbers.map(n => n.toString().padStart(2, '0')).join(', ')}\n\n`;
            filteredCombinations.forEach(combo => {
                txtContent += `${combo.map(n => n.toString().padStart(2, '0')).join(' ')}\n`;
            });

            const blob = new Blob([txtContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const now = new Date();
            const timestamp = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}_${now.getMinutes().toString().padStart(2, '0')}`;
            a.download = `mega_sena_combinacoes_${timestamp}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showSuccess('Combinações exportadas para TXT!');
        }

        function exportGenerationAudit() {
            if (!allCombinations.length) return showError('Gere uma carteira antes de exportar a auditoria.');
            const universe=[...selectedNumbers].sort((a,b)=>a-b),frequencies=getActualFrequencies(allCombinations,universe),sizes=[...new Set(allCombinations.map(c=>c.length))];
            const duplicateCount=allCombinations.length-new Set(allCombinations.map(c=>[...c].sort((a,b)=>a-b).join(','))).size;
            const invalidCount=allCombinations.filter(c=>!OBMCore.applyFilters(c,getFilterConfig(),lastDrawNumbers)).length;
            const lines=['OBM MEGA ANALYTICS v2.0 - AUDITORIA DA CARTEIRA',`Gerado em: ${new Date().toLocaleString()}`,`Jogos: ${allCombinations.length}`,`Dezenas por jogo: ${sizes.join(', ')}`,`Universo: ${universe.map(n=>String(n).padStart(2,'0')).join(' ')}`,`Duplicidades: ${duplicateCount}`,`Jogos fora dos filtros atuais: ${invalidCount}`,'','FREQUÊNCIA REAL',...universe.map(n=>`${String(n).padStart(2,'0')}: ${frequencies[n]}`),'','FILTROS ATIVOS',...Object.entries(getFilterConfig()).map(([k,v])=>`${k}: ${v.length?v.join(', '):'desativado'}`)];
            const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`auditoria_obm_${Date.now()}.txt`;a.click();URL.revokeObjectURL(url);showSuccess('Auditoria exportada com sucesso.');
        }

        function updateFileInfo() {
            const fileInput = document.getElementById('fileInput');
            const fileInfo = document.getElementById('fileInfo');
            fileInfo.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'Nenhum arquivo selecionado';
        }

        function showError(message) {
            const errorContainer = document.getElementById('errorContainer');
            errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
            errorContainer.classList.remove('hidden');
            setTimeout(() => errorContainer.classList.add('hidden'), 5000);
        }

        function showSuccess(message) {
            const errorContainer = document.getElementById('errorContainer');
            errorContainer.innerHTML = `<div class="success-message">${message}</div>`;
            errorContainer.classList.remove('hidden');
            setTimeout(() => errorContainer.classList.add('hidden'), 3000);
        }

        function getResultKey(matches) {
            return { 6: 'sena', 5: 'quina', 4: 'quadra', 3: 'terno', 2: 'duque', 1: 'as', 0: 'zero' }[matches] || 'zero';
        }

        function getResultClass(matches) {
            return getResultKey(matches);
        }

        function getResultLabel(matches) {
            return { 6: 'Sena', 5: 'Quina', 4: 'Quadra', 3: 'Terno', 2: 'Duque', 1: 'Ás', 0: 'Zero' }[matches] || 'Zero';
        }

        function formatDateToDDMMYYYY(dateString) {
            if (!dateString) return 'Data não disponível';
            const parts = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/) || dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (parts) {
                const [, year, month, day] = parts[0].includes('-') ? parts : [null, parts[3], parts[2], parts[1]];
                return `${day}/${month}/${year}`;
            }
            return 'Data não disponível';
        }
        
        // Funções para a nova aba de Filtro Estatístico
        function gerarAnaliseFiltros() {
            const qtdJogos = parseInt(document.getElementById('qtdJogosAnalise').value);
            const filtrosSelecionados = Array.from(document.querySelectorAll('#filtrosAnaliseOptions .filter-option.selected'))
                .map(opt => opt.dataset.value);
            
            if (filtrosSelecionados.length === 0) {
                showError('Selecione pelo menos um filtro para análise.');
                return;
            }
            
            // Validação para aceitar no máximo 100 jogos
            if (qtdJogos < 10 || qtdJogos > 100) {
                showError('A quantidade de jogos deve ser entre 10 e 100.');
                return;
            }
            
            if (historicalData.length < qtdJogos) {
                showError(`Você solicitou análise de ${qtdJogos} jogos, mas só temos ${historicalData.length} disponíveis.`);
                return;
            }
            
            const jogosAnalisados = historicalData.slice(0, qtdJogos);
            let resultadosHTML = `<h3>Resultados da Análise (${qtdJogos} jogos)</h3>`;
            
            // Analisa cada filtro selecionado
            filtrosSelecionados.forEach(filtro => {
                resultadosHTML += `<div class="filter-section"><h4>${getNomeFiltro(filtro)}</h4>`;
                
                switch(filtro) {
                    case 'parImpar':
                        resultadosHTML += analisarParImpar(jogosAnalisados);
                        break;
                    case 'somaDezenas':
                        resultadosHTML += analisarSomaDezenas(jogosAnalisados);
                        break;
                    case 'dezenasRepetidas':
                        resultadosHTML += analisarDezenasRepetidas(jogosAnalisados);
                        break;
                    case 'fibonacci':
                        resultadosHTML += analisarFibonacci(jogosAnalisados);
                        break;
                    case 'primos':
                        resultadosHTML += analisarPrimos(jogosAnalisados);
                        break;
                    case 'moldura':
                        resultadosHTML += analisarMoldura(jogosAnalisados);
                        break;
                    case 'miolo':
                        resultadosHTML += analisarMiolo(jogosAnalisados);
                        break;
                    case 'multiplos3':
                        resultadosHTML += analisarMultiplos3(jogosAnalisados);
                        break;
                    case 'multiplos4':
                        resultadosHTML += analisarMultiplos4(jogosAnalisados);
                        break;
                    case 'quadrantes':
                        resultadosHTML += analisarQuadrantes(jogosAnalisados);
                        break;
                    case 'linhas':
                        resultadosHTML += analisarLinhas(jogosAnalisados);
                        break;
                    case 'sequenciais':
                        resultadosHTML += analisarSequenciais(jogosAnalisados);
                        break;
                    case 'colunasVazias':
                        resultadosHTML += analisarColunasVazias(jogosAnalisados);
                        break;
                    case 'dezenas1a30':
                        resultadosHTML += analisarDezenas1a30(jogosAnalisados);
                        break;
                    case 'dezenas31a60':
                        resultadosHTML += analisarDezenas31a60(jogosAnalisados);
                        break;
                }
                
                resultadosHTML += `</div>`;
            });
            
            document.getElementById('resultadoAnaliseFiltros').innerHTML = resultadosHTML;
        }

        function exportarAnaliseParaPDF() {
            const resultadosDiv = document.getElementById('resultadoAnaliseFiltros');
            if (!resultadosDiv || resultadosDiv.innerHTML.trim() === '') {
                showError('Nenhum resultado de análise para exportar. Gere a análise primeiro.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configurações iniciais
            doc.setProperties({
                title: 'Análise Estatística - Mega Sena',
                subject: 'Resultados da análise estatística dos filtros da Mega Sena',
                author: 'OBM Mega Analytics v2.0',
                keywords: 'mega sena, análise estatística, filtros, loteria',
                creator: 'OBM Mega Analytics v2.0'
            });

            // Cores do tema
            const primaryColor = [0, 102, 204]; // Azul do site

            // Cabeçalho
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 20, 'F');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('Análise Estatística dos Filtros - Mega Sena', 105, 15, { align: 'center' });

            // Informações básicas
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text('OBM Mega Analytics v2.0', 15, 30);
            doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 15, 37);
            
            // Configurações usadas
            const qtdJogos = document.getElementById('qtdJogosAnalise').value;
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Análise baseada nos últimos ${qtdJogos} jogos`, 15, 47);
            
            // Processa o conteúdo HTML para o PDF
            const elementos = resultadosDiv.querySelectorAll('.filter-section');
            let yPos = 60;
            
            elementos.forEach((elemento, index) => {
                if (yPos > 260 && index < elementos.length - 1) {
                    doc.addPage();
                    yPos = 20;
                }
                
                const titulo = elemento.querySelector('h4').textContent;
                const tabela = elemento.querySelector('table');
                
                // Adiciona o título
                doc.setFontSize(14);
                doc.setTextColor(...primaryColor);
                doc.text(titulo, 15, yPos);
                yPos += 10;
                
                // Adiciona a tabela
                if (tabela) {
                    const linhas = tabela.querySelectorAll('tr');
                    const dados = [];
                    
                    linhas.forEach(linha => {
                        const celulas = linha.querySelectorAll('th, td');
                        dados.push(Array.from(celulas).map(celula => celula.textContent));
                    });
                    
                    doc.autoTable({
                        startY: yPos,
                        head: [dados[0]],
                        body: dados.slice(1),
                        headStyles: {
                            fillColor: primaryColor,
                            textColor: 255,
                            fontStyle: 'bold'
                        },
                        styles: {
                            fontSize: 9,
                            cellPadding: 3
                        },
                        margin: { left: 15 }
                    });
                    
                    yPos = doc.autoTable.previous.finalY + 10;
                }
            });

            // Rodapé
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text(`Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
                doc.text('OBM Mega Analytics v2.0 - Relatório não oficial', 105, 293, { align: 'center' });
            }

            doc.save(`analise_filtros_mega_sena.pdf`);
            showSuccess('PDF exportado com sucesso!');
        }

        function getNomeFiltro(codigoFiltro) {
            const nomes = {
                'parImpar': 'Filtro 1: Par/Ímpar',
                'somaDezenas': 'Filtro 2: Soma das Dezenas',
                'dezenasRepetidas': 'Filtro 3: Dezenas Repetidas',
                'fibonacci': 'Filtro 4: Fibonacci',
                'primos': 'Filtro 5: Números Primos',
                'moldura': 'Filtro 6: Moldura',
                'miolo': 'Filtro 7: Miolo',
                'multiplos3': 'Filtro 8: Múltiplos de 3',
                'multiplos4': 'Filtro 9: Múltiplos de 4',
                'quadrantes': 'Filtro 10: Quadrantes',
                'linhas': 'Filtro 11: Linhas Vazias',
                'sequenciais': 'Filtro 12: Dezenas Sequenciais',
                'colunasVazias': 'Filtro 13: Colunas Vazias',
                'dezenas1a30': 'Filtro 14: Dezenas 1-30',
                'dezenas31a60': 'Filtro 15: Dezenas 31-60'
            };
            return nomes[codigoFiltro] || codigoFiltro;
        }

        function analisarParImpar(jogos) {
            const contagem = {
                '3P-3I': 0,
                '2P-4I': 0,
                '4P-2I': 0,
                '1P-5I': 0,
                '5P-1I': 0,
                '0P-6I': 0,
                '6P-0I': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const pares = numeros.filter(n => n % 2 === 0).length;
                const impares = 6 - pares;
                const chave = `${pares}P-${impares}I`;
                if (contagem[chave] !== undefined) {
                    contagem[chave]++;
                }
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarSomaDezenas(jogos) {
            const faixas = {
                '120-240': { min: 120, max: 240, count: 0 }
            };
            let foraDasFaixas = 0;
            
            jogos.forEach(jogo => {
                const soma = jogo.listaDezenas.reduce((total, num) => total + parseInt(num), 0);
                let classificado = false;
                for (const [faixa, dados] of Object.entries(faixas)) {
                    if (soma >= dados.min && soma <= dados.max) {
                        dados.count++;
                        classificado = true;
                        break;
                    }
                }
                if (!classificado) foraDasFaixas++;
            });
            
            const contagem = {};
            for (const [faixa, dados] of Object.entries(faixas)) {
                contagem[faixa] = dados.count;
            }
            contagem['Fora das faixas'] = foraDasFaixas;
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarDezenasRepetidas(jogos) {
            const contagem = {
                '0': 0,
                '1': 0,
                '2+': 0
            };
            
            for (let i = 1; i < jogos.length; i++) {
                const atual = new Set(jogos[i].listaDezenas);
                const anterior = new Set(jogos[i-1].listaDezenas);
                let repetidas = 0;
                
                atual.forEach(num => {
                    if (anterior.has(num)) repetidas++;
                });
                
                if (repetidas >= 2) {
                    contagem['2+']++;
                } else {
                    contagem[repetidas.toString()]++;
                }
            }
            
            return formatarResultados(contagem, jogos.length - 1);
        }

        function analisarFibonacci(jogos) {
            const contagem = {
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const fibCount = numeros.filter(n => FIBONACCI_NUMBERS.includes(n)).length;
                const chave = fibCount >= 3 ? '3' : fibCount.toString();
                contagem[chave]++;
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarPrimos(jogos) {
            const contagem = {
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0,
                '4+': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const primosCount = numeros.filter(n => PRIME_NUMBERS.includes(n)).length;
                const chave = primosCount >= 4 ? '4+' : primosCount.toString();
                contagem[chave]++;
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarMoldura(jogos) {
            const contagem = {
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0,
                '4+': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const molduraCount = numeros.filter(n => MOLDURA_NUMBERS.includes(n)).length;
                const chave = molduraCount >= 4 ? '4+' : molduraCount.toString();
                contagem[chave]++;
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarMiolo(jogos) {
            const contagem = {
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0,
                '4+': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const mioloCount = numeros.filter(n => MIOLO_NUMBERS.includes(n)).length;
                const chave = mioloCount >= 4 ? '4+' : mioloCount.toString();
                contagem[chave]++;
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarMultiplos3(jogos) {
            const contagem = {
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0,
                '4+': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const multiplosCount = numeros.filter(n => n % 3 === 0).length;
                const chave = multiplosCount >= 4 ? '4+' : multiplosCount.toString();
                contagem[chave]++;
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarMultiplos4(jogos) {
            const contagem = {
                '0': 0,
                '1': 0,
                '2': 0,
                '3+': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const multiplosCount = numeros.filter(n => n % 4 === 0).length;
                const chave = multiplosCount >= 3 ? '3+' : multiplosCount.toString();
                contagem[chave]++;
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarQuadrantes(jogos) {
            const contagem = {
                '1': 0,
                '2': 0,
                '3': 0,
                '4': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const quadrantes = new Set();
                
                numeros.forEach(num => {
                    if (QUADRANT_1.includes(num)) quadrantes.add(1);
                    else if (QUADRANT_2.includes(num)) quadrantes.add(2);
                    else if (QUADRANT_3.includes(num)) quadrantes.add(3);
                    else if (QUADRANT_4.includes(num)) quadrantes.add(4);
                });
                
                contagem[quadrantes.size.toString()]++;
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarColunasVazias(jogos) {
            const contagem = {
                '4': 0,
                '5': 0,
                '6': 0,
                '7': 0,
                '8': 0,
                '9': 0
            };

            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const colunasOcupadas = new Set(numeros.map(num => ((num - 1) % 10) + 1));
                const colunasVazias = 10 - colunasOcupadas.size;
                contagem[colunasVazias.toString()]++;
            });

            return formatarResultados(contagem, jogos.length);
        }

        function analisarLinhas(jogos) {
            const contagem = {
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0,
                '4': 0,
                '5': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const linhas = new Set();
                
                numeros.forEach(num => {
                    Object.keys(HORIZONTAL_LINES).forEach(linha => {
                        if (HORIZONTAL_LINES[linha].includes(num)) {
                            linhas.add(linha);
                        }
                    });
                });
                
                const linhasVazias = 6 - linhas.size;
                contagem[linhasVazias.toString()]++;
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function countConsecutiveAdjacencies(numbers) {
            return OBMCore.countConsecutiveAdjacencies(numbers);
        }

        function analisarSequenciais(jogos) {
            const contagem = {
                '0': 0,
                '2': 0,
                '3+': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number).sort((a, b) => a - b);
                const sequencias = countConsecutiveAdjacencies(numeros);
                
                if (sequencias >= 2) {
                    contagem['3+']++;
                } else if (sequencias === 1) {
                    contagem['2']++;
                } else {
                    contagem['0']++;
                }
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarDezenas1a30(jogos) {
            const contagem = {
                '0': 0,
                '1': 0,
                '2': 0,
                '3+': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const count = numeros.filter(n => n >= 1 && n <= 30).length;
                const chave = count >= 3 ? '3+' : count.toString();
                contagem[chave]++;
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function analisarDezenas31a60(jogos) {
            const contagem = {
                '0': 0,
                '1': 0,
                '2': 0,
                '3+': 0
            };
            
            jogos.forEach(jogo => {
                const numeros = jogo.listaDezenas.map(Number);
                const count = numeros.filter(n => n >= 31 && n <= 60).length;
                const chave = count >= 3 ? '3+' : count.toString();
                contagem[chave]++;
            });
            
            return formatarResultados(contagem, jogos.length);
        }

        function formatarResultados(contagem, totalJogos) {
            let html = '<table class="resultado-analise"><tr><th>Padrão</th><th>Quantidade</th><th>Percentual</th></tr>';
            
            for (const [padrao, quantidade] of Object.entries(contagem)) {
                const percentual = ((quantidade / totalJogos) * 100).toFixed(1);
                html += `<tr>
                    <td>${padrao}</td>
                    <td>${quantidade}</td>
                    <td>${percentual}%</td>
                </tr>`;
            }
            
            html += '</table>';
            return html;
        }
        
        // Funções para a nova aba Scanner
        async function executarScanner() {
            const concursoInput = document.getElementById('concursoScanner');
            const concurso = parseInt(concursoInput.value);
            
            if (isNaN(concurso) || concurso <= 0) {
                showError('Informe um número de concurso válido.');
                return;
            }
            
            try {
                // Tenta encontrar o concurso nos dados históricos já carregados
                let draw = historicalData.find(d => d.numero === concurso);
                
                // Se não encontrou, busca na API
                if (!draw) {
                    draw = await OBMDataStore.byNumber(concurso);
                    historicalData.push(draw);
                    historicalData.sort((a, b) => b.numero - a.numero);
                }
                
                // Analisa o jogo encontrado
                analisarJogo(draw);
                
                // Mostra o botão de exportar PDF
                document.getElementById('exportScannerButton').style.display = 'inline-block';
                
            } catch (error) {
                console.error('Erro ao executar scanner:', error);
                showError(`Erro: ${error.message}`);
            }
        }
        
        function analisarJogo(draw) {
            const numeros = draw.listaDezenas.map(Number).sort((a, b) => a - b);
            
            // Calcula os parâmetros para análise
            const soma = numeros.reduce((a, b) => a + b, 0);
            const pares = numeros.filter(n => n % 2 === 0).length;
            const impares = 6 - pares;
            
            // Fibonacci
            const fibonacci = numeros.filter(n => FIBONACCI_NUMBERS.includes(n)).length;
            
            // Números primos
            const primos = numeros.filter(n => PRIME_NUMBERS.includes(n)).length;
            
            // Moldura
            const moldura = numeros.filter(n => MOLDURA_NUMBERS.includes(n)).length;
            
            // Miolo
            const miolo = numeros.filter(n => MIOLO_NUMBERS.includes(n)).length;
            
            // Múltiplos de 3
            const multiplos3 = numeros.filter(n => n % 3 === 0).length;
            
            // Múltiplos de 4
            const multiplos4 = numeros.filter(n => n % 4 === 0).length;
            
            // Quadrantes
            const quadrantes = new Set();
            numeros.forEach(num => {
                if (QUADRANT_1.includes(num)) quadrantes.add(1);
                else if (QUADRANT_2.includes(num)) quadrantes.add(2);
                else if (QUADRANT_3.includes(num)) quadrantes.add(3);
                else if (QUADRANT_4.includes(num)) quadrantes.add(4);
            });
            
            // Linhas vazias
            const linhas = new Set();
            numeros.forEach(num => {
                Object.keys(HORIZONTAL_LINES).forEach(linha => {
                    if (HORIZONTAL_LINES[linha].includes(num)) {
                        linhas.add(parseInt(linha));
                    }
                });
            });

            // Colunas vazias (mesmo final no volante = mesma coluna)
            const colunasOcupadas = new Set(numeros.map(num => ((num - 1) % 10) + 1));
            const colunasVazias = 10 - colunasOcupadas.size;
            
            // Dezenas sequenciais
            let sequencias = 0;
            for (let i = 1; i < numeros.length; i++) {
                if (numeros[i] === numeros[i-1] + 1) {
                    sequencias++;
                }
            }
            
            // Dezenas 1-30 e 31-60
            const dezenas1a30 = numeros.filter(n => n >= 1 && n <= 30).length;
            const dezenas31a60 = numeros.filter(n => n >= 31 && n <= 60).length;
            
            // Formata a data
            const dataFormatada = formatDateToDDMMYYYY(draw.dataApuracao);
            
            // Monta o resultado
            let resultadoHTML = `
                <div class="scanner-result-item">
                    <h4>Informações Básicas</h4>
                    <p><strong>Concurso:</strong> ${draw.numero}</p>
                    <p><strong>Data:</strong> ${dataFormatada}</p>
                    <p><strong>Dezenas sorteadas:</strong> ${numeros.map(n => n.toString().padStart(2, '0')).join(' ')}</p>
                    <div style="margin: 10px 0;">
                        ${numeros.map(n => `<span class="number-ball">${n.toString().padStart(2, '0')}</span>`).join('')}
                    </div>
                </div>
                
                <div class="scanner-result-item">
                    <h4>Análise Detalhada</h4>
                    <p><strong>Soma das dezenas:</strong> ${soma}</p>
                    <p><strong>Distribuição Par/Ímpar:</strong> ${pares} pares e ${impares} ímpares</p>
                    <p><strong>Números Fibonacci:</strong> ${fibonacci} (${numeros.filter(n => FIBONACCI_NUMBERS.includes(n)).map(n => n.toString().padStart(2, '0')).join(', ') || 'Nenhum'})</p>
                    <p><strong>Números Primos:</strong> ${primos} (${numeros.filter(n => PRIME_NUMBERS.includes(n)).map(n => n.toString().padStart(2, '0')).join(', ') || 'Nenhum'})</p>
                    <p><strong>Dezenas na Moldura:</strong> ${moldura} (${numeros.filter(n => MOLDURA_NUMBERS.includes(n)).map(n => n.toString().padStart(2, '0')).join(', ') || 'Nenhuma'})</p>
                    <p><strong>Dezenas no Miolo:</strong> ${miolo} (${numeros.filter(n => MIOLO_NUMBERS.includes(n)).map(n => n.toString().padStart(2, '0')).join(', ') || 'Nenhuma'})</p>
                    <p><strong>Múltiplos de 3:</strong> ${multiplos3} (${numeros.filter(n => n % 3 === 0).map(n => n.toString().padStart(2, '0')).join(', ') || 'Nenhum'})</p>
                    <p><strong>Múltiplos de 4:</strong> ${multiplos4} (${numeros.filter(n => n % 4 === 0).map(n => n.toString().padStart(2, '0')).join(', ') || 'Nenhum'})</p>
                    <p><strong>Quadrantes:</strong> ${quadrantes.size} (${Array.from(quadrantes).join(', ')})</p>
                    <p><strong>Linhas Vazias:</strong> ${6 - linhas.size}</p>
                    <p><strong>Colunas Vazias:</strong> ${colunasVazias}</p>
                    <p><strong>Sequências de números consecutivos:</strong> ${sequencias}</p>
                    <p><strong>Dezenas entre 1-30:</strong> ${dezenas1a30}</p>
                    <p><strong>Dezenas entre 31-60:</strong> ${dezenas31a60}</p>
                </div>
            `;
            
            // Armazena o resultado para possível exportação
            currentScannerResult = {
                draw,
                analysis: {
                    soma,
                    pares,
                    impares,
                    fibonacci,
                    primos,
                    moldura,
                    miolo,
                    multiplos3,
                    multiplos4,
                    quadrantes: quadrantes.size,
                    linhas: 6 - linhas.size,
                    colunasVazias,
                    sequencias,
                    dezenas1a30,
                    dezenas31a60
                }
            };
            
            // Exibe o resultado
            document.getElementById('scannerResultContent').innerHTML = resultadoHTML;
            document.getElementById('scannerResult').classList.remove('hidden');
        }
        
        function exportarScannerParaPDF() {
            if (!currentScannerResult) {
                showError('Nenhum resultado de scanner para exportar. Execute o scanner primeiro.');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configurações iniciais
            doc.setProperties({
                title: `Scanner Mega Sena - Concurso ${currentScannerResult.draw.numero}`,
                subject: 'Resultado da análise detalhada do concurso da Mega Sena',
                author: 'OBM Mega Analytics v2.0',
                keywords: 'mega sena, scanner, análise, loteria',
                creator: 'OBM Mega Analytics v2.0'
            });

            // Cores do tema
            const primaryColor = [0, 102, 204]; // Azul do site
            
            // Formata a data
            const dataFormatada = formatDateToDDMMYYYY(currentScannerResult.draw.dataApuracao);
            
            // Cabeçalho
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 20, 'F');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('Scanner de Concurso - Mega Sena', 105, 15, { align: 'center' });

            // Informações básicas
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text('OBM Mega Analytics v2.0', 15, 30);
            doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 15, 37);
            
            // Informações do sorteio
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('Informações do Sorteio', 15, 50);
            doc.setDrawColor(...primaryColor);
            doc.line(15, 52, 60, 52);
            
            doc.setFontSize(12);
            doc.text(`Concurso: ${currentScannerResult.draw.numero}`, 15, 60);
            doc.text(`Data: ${dataFormatada}`, 15, 67);
            
            // Dezenas sorteadas com bolinhas
            doc.text('Dezenas sorteadas:', 15, 74);
            const numeros = currentScannerResult.draw.listaDezenas.map(Number).sort((a, b) => a - b);
            let xPos = 55;
            numeros.forEach(num => {
                doc.setFillColor(16, 185, 129); // Verde para números sorteados
                doc.circle(xPos, 72, 3, 'F');
                doc.setTextColor(255, 255, 255);
                doc.text(num.toString().padStart(2, '0'), xPos, 73.5, { align: 'center' });
                xPos += 7;
                doc.setTextColor(0, 0, 0);
            });
            
            // Análise detalhada
            doc.setFontSize(14);
            doc.text('Análise Detalhada', 15, 90);
            doc.setDrawColor(...primaryColor);
            doc.line(15, 92, 60, 92);
            
            const analysis = currentScannerResult.analysis;
            const analysisData = [
                ['Parâmetro', 'Valor'],
                ['Soma das dezenas', analysis.soma],
                ['Pares/Ímpares', `${analysis.pares} / ${analysis.impares}`],
                ['Números Fibonacci', analysis.fibonacci],
                ['Números Primos', analysis.primos],
                ['Dezenas na Moldura', analysis.moldura],
                ['Dezenas no Miolo', analysis.miolo],
                ['Múltiplos de 3', analysis.multiplos3],
                ['Múltiplos de 4', analysis.multiplos4],
                ['Quadrantes', analysis.quadrantes],
                ['Linhas Vazias', analysis.linhas],
                ['Colunas Vazias', analysis.colunasVazias],
                ['Sequências', analysis.sequencias],
                ['Dezenas 1-30', analysis.dezenas1a30],
                ['Dezenas 31-60', analysis.dezenas31a60]
            ];
            
            doc.autoTable({
                startY: 100,
                head: [analysisData[0]],
                body: analysisData.slice(1),
                headStyles: {
                    fillColor: primaryColor,
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 60, fontStyle: 'bold' },
                    1: { cellWidth: 40 }
                },
                styles: { fontSize: 10 },
                margin: { left: 15 }
            });
            
            // Rodapé
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('OBM Mega Analytics v2.0 - Relatório não oficial', 105, 290, { align: 'center' });
            
            doc.save(`scanner_mega_sena_${currentScannerResult.draw.numero}.pdf`);
            showSuccess('PDF exportado com sucesso!');
        }

        // ===== Módulo de Exclusão Ponderada OBM Mega Analytics =====
        let weightedDraws = [];
        let weightedRankingResult = [];
        let weightedLastResult = null;

        function weightedStatus(message, isError = false) {
            const el = document.getElementById('weightedStatus');
            el.textContent = message;
            el.className = `status-box${isError ? ' error' : ''}`;
        }

        function normalizeDrawRecord(record) {
            const normalized = {};
            Object.keys(record).forEach(key => {
                normalized[String(key).trim().toLowerCase().replace(/\s+/g, '')] = record[key];
            });
            const contest = Number(normalized.concurso || normalized.numero || normalized.numeroconcurso);
            const numbers = [];
            for (let i = 1; i <= 6; i++) {
                const value = normalized[`bola${i}`] ?? normalized[`dezena${i}`] ?? normalized[`numero${i}`];
                numbers.push(Number(value));
            }
            if (!Number.isInteger(contest) || numbers.some(n => !Number.isInteger(n) || n < 1 || n > 60) || new Set(numbers).size !== 6) return null;
            return { numero: contest, listaDezenas: numbers.sort((a, b) => a - b) };
        }

        function updateFilterGuidance(draws) {
            if (!Array.isArray(draws) || draws.length < 100) return;
            const pct = (value, total = draws.length) => `${(100 * value / total).toFixed(1).replace('.', ',')}%`;
            const pct2 = (value, total = draws.length) => `${(100 * value / total).toFixed(2).replace('.', ',')}%`;
            const countBy = fn => {
                const result = {};
                draws.forEach(draw => { const key = fn(draw.listaDezenas); result[key] = (result[key] || 0) + 1; });
                return result;
            };
            const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
            const last = draws[draws.length - 1].numero;
            const parity = countBy(nums => nums.filter(n => n % 2 === 0).length);
            const sums = countBy(nums => { const s=nums.reduce((a,b)=>a+b,0); return s>=120&&s<=240?'120-240':'fora'; });
            const fib = countBy(nums => Math.min(3, nums.filter(n => FIBONACCI_NUMBERS.includes(n)).length));
            const primes = countBy(nums => Math.min(4, nums.filter(n => PRIME_NUMBERS.includes(n)).length));
            const frame = countBy(nums => nums.filter(n => MOLDURA_NUMBERS.includes(n)).length);
            const core = countBy(nums => nums.filter(n => MIOLO_NUMBERS.includes(n)).length);
            const m3 = countBy(nums => Math.min(4, nums.filter(n => n%3===0).length));
            const m4 = countBy(nums => Math.min(3, nums.filter(n => n%4===0).length));
            const quadrants = countBy(nums => new Set(nums.map(n => QUADRANT_1.includes(n)?1:QUADRANT_2.includes(n)?2:QUADRANT_3.includes(n)?3:4)).size);
            const lines = countBy(nums => 6-new Set(nums.map(n => Math.ceil(n/10))).size);
            const emptyColumns = countBy(nums => 10-new Set(nums.map(n => ((n-1)%10)+1)).size);
            const seq = countBy(nums => Math.min(2, countConsecutiveAdjacencies(nums)));
            const repeated = {0:0,1:0,2:0};
            for (let i=1;i<draws.length;i++) {
                const prior = new Set(draws[i-1].listaDezenas);
                const value = Math.min(2, draws[i].listaDezenas.filter(n => prior.has(n)).length);
                repeated[value]++;
            }
            setText('statsParImpar', `Base até ${last}: 3P-3I ${pct(parity[3]||0)} | 4P-2I ${pct(parity[4]||0)} | 2P-4I ${pct(parity[2]||0)}`);
            setText('statsSoma', `Base até ${last}: faixa 120-240 em ${pct2(sums['120-240']||0)} dos concursos`);
            setText('statsRepetidas', `Base até ${last}: 0 ${pct(repeated[0],draws.length-1)} | 1 ${pct(repeated[1],draws.length-1)} | 2+ ${pct(repeated[2],draws.length-1)}`);
            setText('statsFibonacci', `Base até ${last}: 0 ${pct(fib[0]||0)} | 1 ${pct(fib[1]||0)} | 2 ${pct(fib[2]||0)} | 3+ ${pct(fib[3]||0)}`);
            setText('statsPrimos', `Base até ${last}: 0 ${pct(primes[0]||0)} | 1 ${pct(primes[1]||0)} | 2 ${pct(primes[2]||0)} | 3 ${pct(primes[3]||0)} | 4+ ${pct(primes[4]||0)}`);
            setText('statsMoldura', `Base até ${last}: 1 ${pct(frame[1]||0)} | 2 ${pct(frame[2]||0)} | 3 ${pct(frame[3]||0)} | 4 ${pct(frame[4]||0)}`);
            setText('statsMiolo', `Base até ${last}: 1 ${pct(core[1]||0)} | 2 ${pct(core[2]||0)} | 3 ${pct(core[3]||0)} | 4 ${pct(core[4]||0)}`);
            setText('statsMultiplos3', `Base até ${last}: 0 ${pct(m3[0]||0)} | 1 ${pct(m3[1]||0)} | 2 ${pct(m3[2]||0)} | 3 ${pct(m3[3]||0)} | 4+ ${pct(m3[4]||0)}`);
            setText('statsMultiplos4', `Base até ${last}: 0 ${pct(m4[0]||0)} | 1 ${pct(m4[1]||0)} | 2 ${pct(m4[2]||0)} | 3+ ${pct(m4[3]||0)}`);
            setText('statsQuadrantes', `Base até ${last}: 2 ${pct(quadrants[2]||0)} | 3 ${pct(quadrants[3]||0)} | 4 ${pct(quadrants[4]||0)}`);
            setText('statsLinhas', `Base até ${last}: 1 linha vazia ${pct2(lines[1]||0)} | 2 linhas vazias ${pct2(lines[2]||0)}`);
            setText('statsColunasVazias', `Base até ${last}: 4 colunas vazias ${pct2(emptyColumns[4]||0)} | 5 colunas vazias ${pct2(emptyColumns[5]||0)} | 6 colunas vazias ${pct2(emptyColumns[6]||0)}`);
            setText('statsSequenciais', `Base até ${last}: sem consecutivas ${pct(seq[0]||0)} | um par ${pct(seq[1]||0)} | dois pares/trinca ${pct(seq[2]||0)} (rejeitados pelo filtro)`);
        }

        async function loadWeightedHistoryFile() {
            const input = document.getElementById('weightedHistoryFile');
            const file = input.files && input.files[0];
            if (!file) return weightedStatus('Selecione o arquivo Mega-Sena.xlsx.', true);
            if (typeof XLSX === 'undefined') return weightedStatus('Leitor de planilhas indisponível. Verifique a conexão com a internet e recarregue a página.', true);
            try {
                weightedStatus('Lendo e validando a planilha...');
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
                const parsed = rows.map(normalizeDrawRecord).filter(Boolean).sort((a, b) => a.numero - b.numero);
                const unique = new Map(parsed.map(draw => [draw.numero, draw]));
                weightedDraws = Array.from(unique.values()).sort((a, b) => a.numero - b.numero);
                if (weightedDraws.length < 100) throw new Error('A planilha precisa conter pelo menos 100 concursos válidos.');
                updateFilterGuidance(weightedDraws);
                document.getElementById('weightedBaseDraw').value = weightedDraws[weightedDraws.length - 1].numero;
                weightedStatus(`Base carregada: ${weightedDraws.length} concursos válidos, do ${weightedDraws[0].numero} ao ${weightedDraws[weightedDraws.length - 1].numero}.`);
                runWeightedRanking();
            } catch (error) {
                console.error(error);
                weightedStatus(`Não foi possível ler a base: ${error.message}`, true);
            }
        }

        function useCurrentApiHistory() {
            const parsed = historicalData.map(draw => ({
                numero: Number(draw.numero),
                listaDezenas: draw.listaDezenas.map(Number).sort((a, b) => a - b)
            })).filter(draw => Number.isInteger(draw.numero) && draw.listaDezenas.length === 6).sort((a, b) => a.numero - b.numero);
            weightedDraws = Array.from(new Map(parsed.map(d => [d.numero, d])).values()).sort((a, b) => a.numero - b.numero);
            if (weightedDraws.length < 30) return weightedStatus('Há poucos concursos carregados pela API. Use a planilha completa para maior confiabilidade.', true);
            document.getElementById('weightedBaseDraw').value = weightedDraws[weightedDraws.length - 1].numero;
            weightedStatus(`Modo rápido: ${weightedDraws.length} concursos da API. Para o retroteste completo, carregue a planilha.`);
            runWeightedRanking();
        }

        function getWeightedWeights() {
            const ids = ['wFreq30','wFreq100','wFreq300','wDelay','wLast1','wLast2','wGlobal','wPairs','wStability'];
            const values = ids.map(id => Math.max(0, Number(document.getElementById(id).value) || 0));
            const total = values.reduce((a, b) => a + b, 0) || 1;
            return Object.fromEntries(ids.map((id, i) => [id, values[i] / total]));
        }

        function windowFrequency(draws, size) {
            const freq = Array(61).fill(0);
            draws.slice(-Math.min(size, draws.length)).forEach(draw => draw.listaDezenas.forEach(n => freq[n]++));
            return freq;
        }

        function scaleArray(values) {
            const slice = values.slice(1);
            const min = Math.min(...slice), max = Math.max(...slice);
            const range = max - min || 1;
            return values.map((v, i) => i === 0 ? 0 : (v - min) / range);
        }

        function calculateWeightedScores(draws, weights = getWeightedWeights()) {
            if (!draws.length) return [];
            const f30 = windowFrequency(draws, 30), f100 = windowFrequency(draws, 100), f300 = windowFrequency(draws, 300), fg = windowFrequency(draws, draws.length);
            const n30 = scaleArray(f30), n100 = scaleArray(f100), n300 = scaleArray(f300), ng = scaleArray(fg);
            const last1 = new Set(draws[draws.length - 1]?.listaDezenas || []);
            const last2 = new Set(draws[draws.length - 2]?.listaDezenas || []);
            const delays = Array(61).fill(draws.length);
            for (let n = 1; n <= 60; n++) {
                for (let i = draws.length - 1; i >= 0; i--) if (draws[i].listaDezenas.includes(n)) { delays[n] = draws.length - 1 - i; break; }
            }
            const pairMatrix = Array.from({length:61}, () => Array(61).fill(0));
            draws.slice(-Math.min(300, draws.length)).forEach(draw => {
                for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
                    const a = draw.listaDezenas[i], b = draw.listaDezenas[j];
                    pairMatrix[a][b]++; pairMatrix[b][a]++;
                }
            });
            const pairStrength = Array(61).fill(0);
            for (let n = 1; n <= 60; n++) pairStrength[n] = pairMatrix[n].slice(1).sort((a,b)=>b-a).slice(0,5).reduce((a,b)=>a+b,0);
            const npairs = scaleArray(pairStrength);
            return Array.from({length: 60}, (_, idx) => {
                const n = idx + 1;
                const delayScore = Math.exp(-Math.abs(delays[n] - 7) / 14);
                const stability = 1 - Math.min(1, Math.abs(n30[n] - n100[n]));
                let score = 100 * (
                    weights.wFreq30 * n30[n] + weights.wFreq100 * n100[n] + weights.wFreq300 * n300[n] +
                    weights.wDelay * delayScore + weights.wGlobal * ng[n] + weights.wPairs * npairs[n] +
                    weights.wStability * stability - weights.wLast1 * (last1.has(n) ? 1 : 0) -
                    weights.wLast2 * (last2.has(n) ? 1 : 0)
                );
                return { number: n, score, f30: f30[n], f100: f100[n], f300: f300[n], global: fg[n], delay: delays[n], last1: last1.has(n), last2: last2.has(n) };
            }).sort((a, b) => b.score - a.score || a.number - b.number);
        }

        function runWeightedRanking() {
            if (weightedDraws.length < 30) return weightedStatus('Carregue a planilha histórica antes de calcular o ranking.', true);
            const requestedBase = Number(document.getElementById('weightedBaseDraw').value) || weightedDraws[weightedDraws.length - 1].numero;
            const baseDraws = weightedDraws.filter(draw => draw.numero <= requestedBase);
            if (baseDraws.length < 30) return weightedStatus('O concurso-base selecionado possui histórico insuficiente.', true);
            const excludeCount = Number(document.getElementById('weightedProfile').value);
            weightedRankingResult = calculateWeightedScores(baseDraws);
            const excluded = weightedRankingResult.slice(-excludeCount).map(x => x.number).sort((a,b) => a-b);
            const kept = weightedRankingResult.slice(0, 60 - excludeCount).map(x => x.number).sort((a,b) => a-b);
            const core = weightedRankingResult.slice(0, 15).map(x => x.number).sort((a,b) => a-b);
            const riskStart = Math.max(15, 60 - excludeCount - 10);
            const risk = weightedRankingResult.slice(riskStart, 60 - excludeCount).map(x => x.number).sort((a,b) => a-b);
            weightedLastResult = { base: baseDraws[baseDraws.length - 1].numero, excludeCount, excluded, kept, core, risk };
            renderWeightedResult();
            weightedStatus(`Ranking calculado com dados disponíveis até o concurso ${weightedLastResult.base}.`);
        }

        function chips(numbers, cls) {
            return numbers.map(n => `<span class="number-chip ${cls}">${String(n).padStart(2,'0')}</span>`).join('');
        }

        function renderWeightedResult() {
            const r = weightedLastResult;
            document.getElementById('weightedSummary').innerHTML = `
                <div class="metric"><strong>${r.base}</strong>Concurso-base</div>
                <div class="metric"><strong>${r.kept.length}</strong>Mantidas</div>
                <div class="metric"><strong>${r.excluded.length}</strong>Excluídas</div>
                <div class="metric"><strong>${r.core.length}</strong>Núcleo</div>`;
            document.getElementById('weightedLists').innerHTML = `
                <p><strong>Núcleo estatístico:</strong><br>${chips(r.core, 'keep')}</p>
                <p><strong>Faixa de risco mantida:</strong><br>${chips(r.risk, 'risk')}</p>
                <p><strong>Exclusão recomendada:</strong><br>${chips(r.excluded, 'exclude')}</p>`;
            const excludedSet = new Set(r.excluded);
            document.getElementById('weightedRanking').innerHTML = `<table class="ranking-table"><thead><tr><th>Pos.</th><th>Dezena</th><th>Pontuação</th><th>30</th><th>100</th><th>300</th><th>Histórico</th><th>Atraso</th><th>Último</th><th>Penúltimo</th><th>Status</th></tr></thead><tbody>${weightedRankingResult.map((x,i) => `<tr><td>${i+1}</td><td><strong>${String(x.number).padStart(2,'0')}</strong></td><td>${x.score.toFixed(2)}</td><td>${x.f30}</td><td>${x.f100}</td><td>${x.f300}</td><td>${x.global}</td><td>${x.delay}</td><td>${x.last1?'Sim':'Não'}</td><td>${x.last2?'Sim':'Não'}</td><td>${excludedSet.has(x.number)?'Excluir':i<15?'Núcleo':'Manter'}</td></tr>`).join('')}</tbody></table>`;
        }

        function applyWeightedKeptNumbers() {
            if (!weightedLastResult) return weightedStatus('Calcule o ranking antes de aplicar a seleção.', true);
            selectedNumbers = [...weightedLastResult.kept];
            createNumberGrid();
            updateSelectedNumbersDisplay();
            openTab('tab1');
            showSuccess(`${selectedNumbers.length} dezenas mantidas foram aplicadas à Seleção.`);
        }

        function resetWeightedWeights() {
            const defaults = {wFreq30:10,wFreq100:20,wFreq300:10,wDelay:10,wLast1:10,wLast2:5,wGlobal:15,wPairs:10,wStability:10};
            Object.entries(defaults).forEach(([id,value]) => document.getElementById(id).value = value);
            if (weightedDraws.length) runWeightedRanking();
        }

        function countRetained(winning, excludedSet) {
            return winning.reduce((total, n) => total + (excludedSet.has(n) ? 0 : 1), 0);
        }

        function combinationProbabilityRetained(excluded, minimum) {
            const choose = (n,k) => { if (k < 0 || k > n) return 0; let v=1; for(let i=1;i<=k;i++) v=v*(n-k+i)/i; return v; };
            let favorable = 0;
            for (let retained = minimum; retained <= 6; retained++) favorable += choose(60-excluded, retained) * choose(excluded, 6-retained);
            return favorable / choose(60,6);
        }

        // Versão v2: retroteste executado fora da interface principal.
        function runWeightedBacktest() {
            if (weightedDraws.length < 150) return weightedStatus('Carregue a planilha completa para executar o retroteste.', true);
            const status = document.getElementById('weightedBacktestStatus');
            const excludeCount = Number(document.getElementById('weightedBacktestExclude').value);
            const requested = Math.min(Number(document.getElementById('weightedBacktestCount').value) || 500, weightedDraws.length - 100);
            status.textContent = 'Executando retroteste em segundo plano...';
            status.className = 'status-box';
            const worker = new Worker('assets/workers/backtest-worker.js');
            worker.onmessage = event => {
                const data = event.data;
                if (data.type === 'progress') {
                    status.textContent = `Retroteste em segundo plano: ${data.done}/${data.total} concursos...`;
                    return;
                }
                if (data.type !== 'done') return;
                worker.terminate();
                const {model,lastTwo,modelTotal,lastTwoTotal,total,start} = data;
                const pctAtLeast = (arr,min) => 100 * arr.slice(min).reduce((a,b)=>a+b,0) / total;
                const random4=100*combinationProbabilityRetained(excludeCount,4),random5=100*combinationProbabilityRetained(excludeCount,5),random6=100*combinationProbabilityRetained(excludeCount,6);
                document.getElementById('weightedBacktestResult').innerHTML = `
                    <div class="metric-grid"><div class="metric"><strong>${(modelTotal/total).toFixed(2)}</strong>Média preservada</div><div class="metric"><strong>${pctAtLeast(model,4).toFixed(1)}%</strong>4 ou mais</div><div class="metric"><strong>${pctAtLeast(model,5).toFixed(1)}%</strong>5 ou mais</div><div class="metric"><strong>${pctAtLeast(model,6).toFixed(1)}%</strong>As 6</div></div>
                    <table class="ranking-table" style="margin-top:14px"><thead><tr><th>Estratégia</th><th>Média preservada</th><th>4+</th><th>5+</th><th>6</th></tr></thead><tbody>
                    <tr><td>Modelo ponderado (${excludeCount})</td><td>${(modelTotal/total).toFixed(2)}</td><td>${pctAtLeast(model,4).toFixed(1)}%</td><td>${pctAtLeast(model,5).toFixed(1)}%</td><td>${pctAtLeast(model,6).toFixed(1)}%</td></tr>
                    <tr><td>Referência aleatória (${excludeCount})</td><td>${(6*(60-excludeCount)/60).toFixed(2)}</td><td>${random4.toFixed(1)}%</td><td>${random5.toFixed(1)}%</td><td>${random6.toFixed(1)}%</td></tr>
                    <tr><td>União dos 2 anteriores</td><td>${(lastTwoTotal/total).toFixed(2)}</td><td>${pctAtLeast(lastTwo,4).toFixed(1)}%</td><td>${pctAtLeast(lastTwo,5).toFixed(1)}%</td><td>${pctAtLeast(lastTwo,6).toFixed(1)}%</td></tr></tbody></table>`;
                status.textContent = `Retroteste concluído em ${total} concursos, do ${weightedDraws[start].numero} ao ${weightedDraws.at(-1).numero}.`;
            };
            worker.onerror = error => { worker.terminate(); status.textContent = `Falha no retroteste: ${error.message}`; status.className='status-box error'; };
            worker.postMessage({draws:weightedDraws,excludeCount,requested,weights:getWeightedWeights()});
        }

        function exportWeightedTxt() {
            if (!weightedLastResult) return weightedStatus('Calcule o ranking antes de exportar.', true);
            const lines = [
                'OBM MEGA ANALYTICS - EXCLUSÃO PONDERADA',
                `Concurso-base: ${weightedLastResult.base}`,
                `Perfil: ${weightedLastResult.excludeCount} exclusões`,
                `Núcleo: ${weightedLastResult.core.map(n=>String(n).padStart(2,'0')).join(' ')}`,
                `Excluídas: ${weightedLastResult.excluded.map(n=>String(n).padStart(2,'0')).join(' ')}`,
                `Mantidas: ${weightedLastResult.kept.map(n=>String(n).padStart(2,'0')).join(' ')}`,
                '', 'Ranking:',
                ...weightedRankingResult.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${String(x.number).padStart(2,'0')} | ${x.score.toFixed(2)} pontos | atraso ${x.delay}`),
                '', 'Aviso: análise estatística não garante premiação.'
            ];
            const blob = new Blob([lines.join('\n')], {type:'text/plain;charset=utf-8'});
            const url = URL.createObjectURL(blob), a = document.createElement('a');
            a.href = url; a.download = `OBM_Exclusao_Ponderada_${weightedLastResult.base}.txt`; a.click(); URL.revokeObjectURL(url);
        }
