(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.OBMGroupedCore = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
    'use strict';

    const GAME_SIZE = 6;
    const GUARANTEE_LIMIT = 6000;
    const TOTAL_LIMIT = 50000;

    function combinationCount(n, k) {
        if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || n < k) return 0;
        k = Math.min(k, n - k);
        let result = 1;
        for (let i = 1; i <= k; i++) result = result * (n - k + i) / i;
        return Math.round(result);
    }

    function combinations(values, size, limit = Infinity) {
        const result = [];
        const current = [];
        function visit(start) {
            if (result.length > limit) throw new Error(`O universo ultrapassa o limite seguro de ${limit.toLocaleString('pt-BR')} combinações.`);
            if (current.length === size) {
                result.push(current.map(index => values[index]));
                return;
            }
            const needed = size - current.length;
            for (let i = start; i <= values.length - needed; i++) {
                current.push(i);
                visit(i + 1);
                current.pop();
            }
        }
        visit(0);
        return result;
    }

    function intersectionSize(a, b) {
        let i = 0;
        let j = 0;
        let hits = 0;
        while (i < a.length && j < b.length) {
            if (a[i] === b[j]) { hits++; i++; j++; }
            else if (a[i] < b[j]) i++;
            else j++;
        }
        return hits;
    }

    function coveragePerGame(v, target) {
        let total = 0;
        for (let hits = target; hits <= GAME_SIZE; hits++) {
            total += combinationCount(GAME_SIZE, hits) * combinationCount(v - GAME_SIZE, GAME_SIZE - hits);
        }
        return total;
    }

    function theoreticalLowerBound(v, target, requireEveryNumber = true) {
        const outcomes = combinationCount(v, GAME_SIZE);
        const coverage = coveragePerGame(v, target);
        const coverageBound = Math.ceil(outcomes / Math.max(coverage, 1));
        const numberBound = requireEveryNumber ? Math.ceil(v / GAME_SIZE) : 1;
        return Math.max(coverageBound, numberBound);
    }

    function normalizeSpec(raw) {
        const numbers = [...new Set((raw.numbers || []).map(Number))].sort((a, b) => a - b);
        return {
            numbers,
            method: raw.method || 'minimum',
            guarantee: Number(raw.guarantee ?? 4),
            scope: 'group',
            groupCount: Number(raw.groupCount || 1),
            groupSize: Number(raw.groupSize || 8),
            gamesPerGroup: Number(raw.gamesPerGroup || 1),
            seed: Number(raw.seed || Date.now()) >>> 0,
            filterOptions: raw.filterOptions && typeof raw.filterOptions === 'object' ? raw.filterOptions : {},
            lastDraw: Array.isArray(raw.lastDraw) ? raw.lastDraw.map(Number) : []
        };
    }

    function validateSpec(raw) {
        const spec = normalizeSpec(raw);
        const errors = [];
        if (spec.numbers.length < 7) errors.push('Selecione pelo menos 7 dezenas para formar os grupos.');
        if (spec.numbers.some(n => !Number.isInteger(n) || n < 1 || n > 60)) errors.push('As dezenas devem estar entre 1 e 60.');
        if (!Number.isInteger(spec.groupSize) || spec.groupSize < 7 || spec.groupSize > 15) errors.push('A quantidade de dezenas por grupo deve estar entre 7 e 15.');
        if (spec.groupSize > spec.numbers.length) errors.push(`Selecione pelo menos ${spec.groupSize} dezenas na aba Seleção para formar cada grupo.`);
        if (!['minimum', 'balanced', 'total'].includes(spec.method)) errors.push('Método de desdobramento inválido.');
        if (![0, 4, 5, 6].includes(spec.guarantee)) errors.push('Escolha uma garantia válida.');
        if (spec.guarantee === 0 && spec.method !== 'balanced') errors.push('A opção sem garantia está disponível somente na Distribuição Equilibrada.');
        if (!Number.isInteger(spec.groupCount) || spec.groupCount < 1 || spec.groupCount > 200) errors.push('A quantidade de grupos deve estar entre 1 e 200.');
        if (!Number.isInteger(spec.gamesPerGroup) || spec.gamesPerGroup < 1 || spec.gamesPerGroup > 2000) errors.push('A quantidade de jogos por grupo deve estar entre 1 e 2.000.');

        const universeSize = combinationCount(spec.groupSize, GAME_SIZE);
        const masterGameUniverse = combinationCount(spec.numbers.length, GAME_SIZE);
        const groupUniverse = combinationCount(spec.numbers.length, spec.groupSize);
        const lowerBound = spec.guarantee === 0 ? Math.ceil(spec.groupSize / GAME_SIZE) : theoreticalLowerBound(spec.groupSize, spec.guarantee, true);
        const requestedTotal = spec.method === 'total'
            ? spec.groupCount * universeSize
            : spec.groupCount * spec.gamesPerGroup;

        if (spec.method === 'total') {
            if (requestedTotal > TOTAL_LIMIT) errors.push(`O cercamento total produziria ${requestedTotal.toLocaleString('pt-BR')} jogos e ultrapassa o limite seguro de ${TOTAL_LIMIT.toLocaleString('pt-BR')}.`);
        } else {
            if (spec.gamesPerGroup * GAME_SIZE < spec.groupSize) errors.push(`${spec.gamesPerGroup} jogo(s) oferecem apenas ${spec.gamesPerGroup * GAME_SIZE} posições e não conseguem utilizar todas as ${spec.groupSize} dezenas do grupo. Use pelo menos ${Math.ceil(spec.groupSize / GAME_SIZE)} jogos por grupo.`);
            if (spec.guarantee > 0 && spec.gamesPerGroup < lowerBound) errors.push(`Cada grupo precisa de pelo menos ${lowerBound} jogo(s) pelo limite combinatório calculado para a garantia escolhida.`);
            if (spec.gamesPerGroup > universeSize) errors.push(`Cada grupo pede ${spec.gamesPerGroup.toLocaleString('pt-BR')} jogos, mas ${spec.groupSize} dezenas produzem somente ${universeSize.toLocaleString('pt-BR')} combinações simples.`);
        }
        if (requestedTotal > TOTAL_LIMIT) errors.push(`O lote solicitado possui ${requestedTotal.toLocaleString('pt-BR')} jogos e excede o limite seguro de ${TOTAL_LIMIT.toLocaleString('pt-BR')}.`);
        if (requestedTotal > masterGameUniverse) errors.push(`O lote solicita ${requestedTotal.toLocaleString('pt-BR')} jogos inéditos, mas as dezenas selecionadas produzem somente ${masterGameUniverse.toLocaleString('pt-BR')} jogos de 6 diferentes.`);
        if (spec.groupCount > groupUniverse) errors.push(`Só existem ${groupUniverse.toLocaleString('pt-BR')} grupos-base diferentes com essa seleção.`);

        return { ok: errors.length === 0, errors, spec, universeSize, masterGameUniverse, groupUniverse, lowerBound, requestedTotal };
    }

    function mulberry32(seed) {
        return function () {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function gameKey(game) {
        return [...game].sort((a, b) => a - b).map(n => String(n).padStart(2, '0')).join('-');
    }

    function groupKey(games) {
        return games.map(gameKey).sort().join('|');
    }

    function coverageReport(games, outcomes, target) {
        let covered = 0;
        let minimumHits = GAME_SIZE;
        for (const outcome of outcomes) {
            let best = 0;
            for (const game of games) {
                best = Math.max(best, intersectionSize(outcome, game));
                if (best === GAME_SIZE) break;
            }
            minimumHits = Math.min(minimumHits, best);
            if (best >= target) covered++;
        }
        return {
            target,
            covered,
            total: outcomes.length,
            rate: outcomes.length ? covered / outcomes.length : 0,
            minimumHits: games.length ? minimumHits : 0,
            verified: covered === outcomes.length
        };
    }

    function buildCoverageLists(candidates, outcomes, target) {
        return candidates.map(game => {
            const indexes = [];
            for (let i = 0; i < outcomes.length; i++) {
                if (intersectionSize(game, outcomes[i]) >= target) indexes.push(i);
            }
            return indexes;
        });
    }

    function buildClosure(numbers, target, maxGames, seed, balanceWeight, isAllowed, excludedGameKeys) {
        const outcomes = combinations(numbers, GAME_SIZE, GUARANTEE_LIMIT);
        const candidates = outcomes.filter(game => isAllowed(game) && !excludedGameKeys.has(gameKey(game)));
        if (target === GAME_SIZE) {
            if (candidates.length !== outcomes.length || candidates.length > maxGames) return { games: [], complete: false, required: outcomes.length };
            return { games: candidates.slice(0, maxGames), complete: true, required: outcomes.length };
        }
        const covers = buildCoverageLists(candidates, outcomes, target);
        const uncovered = new Uint8Array(outcomes.length);
        uncovered.fill(1);
        let uncoveredCount = outcomes.length;
        const selectedIndexes = [];
        const selectedSet = new Set();
        const frequencies = Object.fromEntries(numbers.map(n => [n, 0]));
        const random = mulberry32(seed);

        while (uncoveredCount && selectedIndexes.length < maxGames) {
            let bestIndex = -1;
            let bestScore = -Infinity;
            for (let index = 0; index < candidates.length; index++) {
                if (selectedSet.has(index)) continue;
                let newlyCovered = 0;
                for (const outcomeIndex of covers[index]) newlyCovered += uncovered[outcomeIndex];
                if (!newlyCovered) continue;
                const balance = candidates[index].reduce((sum, n) => sum + frequencies[n], 0);
                const score = newlyCovered * 100000 - balance * balanceWeight + random();
                if (score > bestScore) { bestScore = score; bestIndex = index; }
            }
            if (bestIndex < 0) break;
            selectedIndexes.push(bestIndex);
            selectedSet.add(bestIndex);
            candidates[bestIndex].forEach(n => frequencies[n]++);
            for (const outcomeIndex of covers[bestIndex]) {
                if (uncovered[outcomeIndex]) { uncovered[outcomeIndex] = 0; uncoveredCount--; }
            }
        }

        if (uncoveredCount) return { games: selectedIndexes.map(i => candidates[i]), complete: false, required: selectedIndexes.length + 1 };

        // Um desdobramento deve utilizar todas as dezenas escolhidas, mesmo quando
        // uma cobertura de interseção seria matematicamente possível sem isso.
        const used = new Set(selectedIndexes.flatMap(i => candidates[i]));
        while (used.size < numbers.length && selectedIndexes.length < maxGames) {
            let bestIndex = -1;
            let bestScore = -Infinity;
            for (let index = 0; index < candidates.length; index++) {
                if (selectedSet.has(index)) continue;
                const unusedGain = candidates[index].filter(n => !used.has(n)).length;
                const balance = candidates[index].reduce((sum, n) => sum + frequencies[n], 0);
                const score = unusedGain * 10000 - balance * balanceWeight + random();
                if (score > bestScore) { bestScore = score; bestIndex = index; }
            }
            if (bestIndex < 0) break;
            selectedIndexes.push(bestIndex);
            selectedSet.add(bestIndex);
            candidates[bestIndex].forEach(n => { used.add(n); frequencies[n]++; });
        }

        while (selectedIndexes.length < maxGames && selectedIndexes.length < candidates.length) {
            let bestIndex = -1;
            let bestScore = Infinity;
            for (let index = 0; index < candidates.length; index++) {
                if (selectedSet.has(index)) continue;
                const balance = candidates[index].reduce((sum, n) => sum + frequencies[n], 0);
                const overlap = selectedIndexes.reduce((sum, selected) => sum + Math.max(0, intersectionSize(candidates[index], candidates[selected]) - 2), 0);
                const score = balance * Math.max(balanceWeight, 1) + overlap * 2 + random();
                if (score < bestScore) { bestScore = score; bestIndex = index; }
            }
            if (bestIndex < 0) break;
            selectedIndexes.push(bestIndex);
            selectedSet.add(bestIndex);
            candidates[bestIndex].forEach(n => frequencies[n]++);
        }

        const games = selectedIndexes.map(i => candidates[i]);
        return { games, complete: used.size === numbers.length, required: games.length };
    }

    function exactMinimumProven(v, target, gameCount) {
        if (v === GAME_SIZE && gameCount === 1) return true;
        if (target === 6 && gameCount === combinationCount(v, GAME_SIZE)) return true;
        return target === 4 && v === 7 && gameCount === 2 || target === 4 && v === 8 && gameCount === 2;
    }

    function deriveCandidatePool(numbers, filterOptions, lastDrawNumbers) {
        const onlyZero = id => Array.isArray(filterOptions[id]) && filterOptions[id].length === 1 && filterOptions[id][0] === '0';
        const fibonacci = new Set([2, 3, 5, 8, 13, 21, 34, 55]);
        const primes = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59]);
        const lastDraw = new Set(lastDrawNumbers || []);
        return numbers.filter(number => {
            if (onlyZero('fibonacciOptions') && fibonacci.has(number)) return false;
            if (onlyZero('primosOptions') && primes.has(number)) return false;
            if (onlyZero('repetidasOptions') && lastDraw.has(number)) return false;
            if (onlyZero('multiplos3Options') && number % 3 === 0) return false;
            if (onlyZero('multiplos4Options') && number % 4 === 0) return false;
            return true;
        });
    }

    function selectGamesCoveringBase(base, count, isAllowed, excludedSignatures, frequency, random) {
        const candidates = combinations(base, GAME_SIZE).filter(game => !excludedSignatures.has(gameKey(game)) && isAllowed(game));
        if (candidates.length < count) return null;
        for (let retry = 0; retry < 100; retry++) {
            const selected = [];
            const selectedKeys = new Set();
            const used = new Set();
            for (let slot = 0; slot < count; slot++) {
                const slotsAfter = count - slot - 1;
                const ranked = [];
                for (const game of candidates) {
                    const signature = gameKey(game);
                    if (selectedKeys.has(signature)) continue;
                    const union = new Set([...used, ...game]);
                    if (union.size + slotsAfter * GAME_SIZE < base.length) continue;
                    const gain = union.size - used.size;
                    const targetGain = Math.ceil((base.length - used.size) / (slotsAfter + 1));
                    const balance = game.reduce((sum, number) => sum + frequency[number], 0);
                    ranked.push({ game, signature, score: Math.abs(gain - targetGain) * 100 + balance * 2 + random() });
                }
                if (!ranked.length) break;
                ranked.sort((a, b) => a.score - b.score);
                const chosen = ranked[Math.floor(random() * Math.min(5, ranked.length))];
                selected.push(chosen.game);
                selectedKeys.add(chosen.signature);
                chosen.game.forEach(number => used.add(number));
            }
            if (selected.length === count && used.size === base.length) return selected;
        }
        return null;
    }

    function buildBalancedOnly(spec, isAllowed, onProgress) {
        const { numbers, groupCount, groupSize, gamesPerGroup, seed, filterOptions, lastDraw } = spec;
        const random = mulberry32(seed);
        const candidatePool = deriveCandidatePool(numbers, filterOptions, lastDraw);
        if (candidatePool.length < groupSize) throw new Error(`Os filtros com contagem zero deixam somente ${candidatePool.length} dezenas utilizáveis, menos que as ${groupSize} necessárias em cada grupo.`);

        const totalGames = groupCount * gamesPerGroup;
        const reservoirTarget = Math.min(3000, Math.max(240, totalGames * 8));
        const reservoir = [];
        const reservoirSignatures = new Set();
        const maxAttempts = Math.min(10000000, Math.max(500000, reservoirTarget * 15000));
        let attempts = 0;

        function randomGame() {
            const pool = [...candidatePool];
            for (let index = 0; index < GAME_SIZE; index++) {
                const picked = index + Math.floor(random() * (pool.length - index));
                [pool[index], pool[picked]] = [pool[picked], pool[index]];
            }
            return pool.slice(0, GAME_SIZE).sort((a, b) => a - b);
        }

        while (reservoir.length < reservoirTarget && attempts < maxAttempts) {
            const game = randomGame();
            const signature = gameKey(game);
            attempts++;
            if (!reservoirSignatures.has(signature) && isAllowed(game)) {
                reservoirSignatures.add(signature);
                reservoir.push(game);
            }
        }
        if (reservoir.length < totalGames) {
            throw new Error(`Foram encontrados somente ${reservoir.length} jogos inéditos que atendem simultaneamente aos filtros. São necessários ${totalGames}. Flexibilize os filtros ou reduza a quantidade solicitada.`);
        }

        const available = new Set(reservoir.map((_, index) => index));
        const reservoirIndex = new Map(reservoir.map((game, index) => [gameKey(game), index]));
        const usedGameSignatures = new Set();
        const groupSignatures = new Set();
        const numberFrequency = Object.fromEntries(numbers.map(number => [number, 0]));
        const groups = [];

        for (let id = 1; id <= groupCount; id++) {
            let accepted = null;
            for (let directTry = 0; directTry < 160 && !accepted; directTry++) {
                const base = sampleBase(candidatePool, groupSize, numberFrequency, random, groupSignatures, [], false);
                if (!base) break;
                const games = selectGamesCoveringBase(base, gamesPerGroup, isAllowed, usedGameSignatures, numberFrequency, random);
                if (games) accepted = { games, baseNumbers: base, baseSignature: gameKey(base), selectedIndexes: [] };
            }
            for (let retry = 0; retry < 800 && !accepted; retry++) {
                const selectedIndexes = [];
                const used = new Set();
                for (let slot = 0; slot < gamesPerGroup; slot++) {
                    const slotsAfter = gamesPerGroup - slot - 1;
                    const candidates = [];
                    for (const index of available) {
                        if (selectedIndexes.includes(index)) continue;
                        const game = reservoir[index];
                        const union = new Set([...used, ...game]);
                        if (union.size > groupSize) continue;
                        if (union.size + slotsAfter * GAME_SIZE < groupSize) continue;
                        const gain = union.size - used.size;
                        const frequencyScore = game.reduce((sum, number) => sum + numberFrequency[number], 0);
                        const targetGain = Math.ceil((groupSize - used.size) / (slotsAfter + 1));
                        const score = Math.abs(gain - targetGain) * 100 + frequencyScore * 3 + random();
                        candidates.push({ index, game, union, score });
                    }
                    if (!candidates.length) break;
                    candidates.sort((a, b) => a.score - b.score);
                    const chosen = candidates[Math.floor(random() * Math.min(8, candidates.length))];
                    selectedIndexes.push(chosen.index);
                    chosen.game.forEach(number => used.add(number));
                }
                if (selectedIndexes.length !== gamesPerGroup || used.size !== groupSize) continue;
                const baseNumbers = [...used].sort((a, b) => a - b);
                const baseSignature = gameKey(baseNumbers);
                if (groupSignatures.has(baseSignature)) continue;
                accepted = { selectedIndexes, baseNumbers, baseSignature };
            }
            if (!accepted) {
                throw new Error(`Foi possível montar ${groups.length} de ${groupCount} grupos com ${groupSize} dezenas e ${gamesPerGroup} jogos filtrados. Flexibilize os filtros, aumente os jogos por grupo ou reduza os grupos.`);
            }
            const games = accepted.games || accepted.selectedIndexes.map(index => reservoir[index]);
            accepted.selectedIndexes.forEach(index => available.delete(index));
            games.forEach(game => {
                const signature = gameKey(game);
                usedGameSignatures.add(signature);
                const index = reservoirIndex.get(signature);
                if (index !== undefined) available.delete(index);
            });
            accepted.baseNumbers.forEach(number => numberFrequency[number]++);
            groupSignatures.add(accepted.baseSignature);
            groups.push({
                id,
                label: `Grupo ${String(id).padStart(2, '0')}`,
                baseNumbers: accepted.baseNumbers,
                baseSignature: accepted.baseSignature,
                games: games.map((numbersInGame, gameIndex) => ({ id: gameIndex + 1, numbers: numbersInGame, signature: gameKey(numbersInGame) })),
                signature: groupKey(games),
                guarantee: null
            });
            onProgress?.({ generatedGroups: id, totalGroups: groupCount, attempts });
        }
        return groups;
    }

    function makeGroup(id, baseNumbers, games, outcomes, target) {
        const report = coverageReport(games, outcomes, target);
        return {
            id,
            label: `Grupo ${String(id).padStart(2, '0')}`,
            baseNumbers: [...baseNumbers],
            baseSignature: gameKey(baseNumbers),
            games: games.map((numbers, index) => ({ id: index + 1, numbers, signature: gameKey(numbers) })),
            signature: groupKey(games),
            guarantee: report
        };
    }

    function sampleBase(pool, size, frequency, random, signatures, previousBases, avoidGameOverlap) {
        for (let attempt = 0; attempt < 3000; attempt++) {
            const ranked = pool
                .map(number => ({ number, score: frequency[number] * 12 + random() * 10 }))
                .sort((a, b) => a.score - b.score);
            const working = ranked.slice(0, Math.min(ranked.length, Math.max(size + 8, size * 2)));
            const base = [];
            while (base.length < size && working.length) {
                const index = Math.floor(random() * Math.min(6, working.length));
                base.push(working.splice(index, 1)[0].number);
            }
            base.sort((a, b) => a - b);
            const signature = gameKey(base);
            if (signatures.has(signature)) continue;
            if (avoidGameOverlap && previousBases.some(previous => intersectionSize(previous, base) >= GAME_SIZE)) continue;
            return base;
        }
        return null;
    }

    function generate(raw, onProgress) {
        const validation = validateSpec(raw);
        if (!validation.ok) throw new Error(validation.errors.join(' '));
        const { spec, universeSize, lowerBound } = validation;
        const groups = [];
        const baseSignatures = new Set();
        const globalGameSignatures = new Set();
        const previousBases = [];
        const baseFrequency = Object.fromEntries(spec.numbers.map(number => [number, 0]));
        const random = mulberry32(spec.seed);
        const isAllowed = game => {
            const engine = typeof globalThis !== 'undefined' ? globalThis.OBMCore : null;
            return !engine || typeof engine.applyFilters !== 'function'
                ? true
                : engine.applyFilters(game, spec.filterOptions, spec.lastDraw);
        };

        if (spec.method === 'balanced' && spec.guarantee === 0) {
            const balancedGroups = buildBalancedOnly(spec, isAllowed, onProgress);
            return {
                version: 1,
                method: spec.method,
                spec,
                groups: balancedGroups,
                totalGames: spec.groupCount * spec.gamesPerGroup,
                universeSize,
                lowerBound: 0,
                batchGuarantee: { target: 0, covered: null, total: universeSize * spec.groupCount, rate: null, minimumHits: null, verified: false, notEvaluated: true },
                exactMinimum: false,
                generatedAt: new Date().toISOString()
            };
        }

        if (spec.method === 'total') {
            for (let id = 1; id <= spec.groupCount; id++) {
                const base = sampleBase(spec.numbers, spec.groupSize, baseFrequency, random, baseSignatures, previousBases, true);
                if (!base) throw new Error(`Foi possível criar ${groups.length} grupos-base inéditos sem repetir jogos. Reduza a quantidade de grupos.`);
                const games = combinations(base, GAME_SIZE, TOTAL_LIMIT);
                const outcomes = games;
                const group = makeGroup(id, base, games, outcomes, 6);
                baseSignatures.add(group.baseSignature);
                previousBases.push(base);
                base.forEach(number => baseFrequency[number]++);
                games.forEach(game => globalGameSignatures.add(gameKey(game)));
                groups.push(group);
                onProgress?.({ generatedGroups: id, totalGroups: spec.groupCount });
            }
            const totalGames = groups.reduce((sum, group) => sum + group.games.length, 0);
            return {
                version: 1,
                method: spec.method,
                spec,
                groups,
                totalGames,
                universeSize,
                lowerBound,
                batchGuarantee: { target: 6, covered: universeSize * spec.groupCount, total: universeSize * spec.groupCount, rate: 1, minimumHits: 6, verified: true },
                exactMinimum: true,
                generatedAt: new Date().toISOString()
            };
        }

        const eligiblePool = deriveCandidatePool(spec.numbers, spec.filterOptions, spec.lastDraw);
        if (eligiblePool.length < spec.groupSize) throw new Error(`Os filtros deixam apenas ${eligiblePool.length} dezenas utilizáveis, menos que as ${spec.groupSize} necessárias por grupo.`);
        for (let id = 1; id <= spec.groupCount; id++) {
            let accepted = null;
            for (let retry = 0; retry < 300 && !accepted; retry++) {
                const base = sampleBase(eligiblePool, spec.groupSize, baseFrequency, random, baseSignatures, previousBases, false);
                if (!base) break;
                const outcomes = combinations(base, GAME_SIZE, GUARANTEE_LIMIT);
                const closure = buildClosure(base, spec.guarantee, spec.gamesPerGroup, spec.seed + id * 7919 + retry * 104729, spec.method === 'balanced' ? 25 : 3, isAllowed, globalGameSignatures);
                if (!closure.complete) continue;
                const group = makeGroup(id, base, closure.games, outcomes, spec.guarantee);
                if (group.guarantee.verified && !baseSignatures.has(group.baseSignature)) accepted = group;
            }
            if (!accepted) throw new Error(`Foi possível criar ${groups.length} de ${spec.groupCount} grupos com a garantia solicitada. Aumente os jogos por grupo ou flexibilize os filtros.`);
            baseSignatures.add(accepted.baseSignature);
            previousBases.push(accepted.baseNumbers);
            accepted.baseNumbers.forEach(number => baseFrequency[number]++);
            accepted.games.forEach(game => globalGameSignatures.add(game.signature));
            groups.push(accepted);
            onProgress?.({ generatedGroups: id, totalGroups: spec.groupCount });
        }

        const allGames = groups.flatMap(group => group.games.map(game => game.numbers));
        const covered = groups.reduce((sum, group) => sum + group.guarantee.covered, 0);
        const totalOutcomes = groups.reduce((sum, group) => sum + group.guarantee.total, 0);
        const batchGuarantee = { target: spec.guarantee, covered, total: totalOutcomes, rate: totalOutcomes ? covered / totalOutcomes : 0, minimumHits: Math.min(...groups.map(group => group.guarantee.minimumHits)), verified: groups.every(group => group.guarantee.verified) };
        return {
            version: 1,
            method: spec.method,
            spec,
            groups,
            totalGames: allGames.length,
            universeSize,
            lowerBound,
            batchGuarantee,
            exactMinimum: spec.method === 'minimum' && groups.every(group => exactMinimumProven(spec.groupSize, spec.guarantee, group.games.length)),
            generatedAt: new Date().toISOString()
        };
    }

    return {
        GAME_SIZE,
        GUARANTEE_LIMIT,
        TOTAL_LIMIT,
        combinationCount,
        combinations,
        coveragePerGame,
        theoreticalLowerBound,
        validateSpec,
        gameKey,
        groupKey,
        coverageReport,
        generate
    };
});
