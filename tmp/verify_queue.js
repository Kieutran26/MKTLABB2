const wait = (ms) => new Promise(r => setTimeout(r, ms));

const GEMINI_MIN_INTER_REQUEST_GAP_MS = 6000;
let geminiLastRequestStartTime = 0;
let geminiRequestChain = Promise.resolve();

function enqueueGeminiRequest(task) {
    const next = geminiRequestChain.then(async () => {
        const now = Date.now();
        const elapsed = now - geminiLastRequestStartTime;
        if (elapsed < GEMINI_MIN_INTER_REQUEST_GAP_MS) {
            const w = GEMINI_MIN_INTER_REQUEST_GAP_MS - elapsed;
            console.log(`Waiting ${w}ms for RPM gap...`);
            await wait(w);
        }
        geminiLastRequestStartTime = Date.now();
        return task();
    });
    geminiRequestChain = next.then(
        () => undefined,
        () => undefined
    );
    return next;
}

async function test() {
    console.log('Starting test...');
    const start = Date.now();
    
    const task = (id) => async () => {
        console.log(`Task ${id} started at ${Date.now() - start}ms`);
        await wait(500); // simulate API call
        console.log(`Task ${id} finished at ${Date.now() - start}ms`);
    };

    console.log('Enqueuing Task 1');
    enqueueGeminiRequest(task(1));
    
    console.log('Enqueuing Task 2 (immediately)');
    enqueueGeminiRequest(task(2));
    
    await geminiRequestChain;
    console.log('Done.');
}

test();
