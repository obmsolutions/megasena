importScripts('../js/core.js', '../js/grouped-core.js');

self.onmessage = event => {
    if (!event.data || event.data.type !== 'generate') return;
    try {
        const result = self.OBMGroupedCore.generate(event.data.spec, progress => {
            self.postMessage({ type: 'progress', ...progress });
        });
        self.postMessage({ type: 'done', result });
    } catch (error) {
        self.postMessage({ type: 'error', message: error && error.message ? error.message : String(error) });
    }
};
