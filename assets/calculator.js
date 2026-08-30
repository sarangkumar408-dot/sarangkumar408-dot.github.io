// Project cost calculator (client-side)
function calculateEstimate({pages, features, integrations, complexity}){
    const base = 3000; // base cost in INR
    const perPage = 1200; // per-page cost
    const integrationCost = 2000; // per integration
    const featurePrices = {
        contactForm: 800,
        blog: 1200,
        gallery: 900,
        ecommerce: 12000,
        custom: 4000
    };
    let featuresSum = 0;
    (features||[]).forEach(f => { if(featurePrices[f]) featuresSum += featurePrices[f]; });
    const integrationsSum = (parseInt(integrations)||0) * integrationCost;
    const complexityMultiplier = complexity === 'low' ? 1 : complexity === 'medium' ? 1.25 : 1.6;
    let total = Math.round((base + (pages||0)*perPage + featuresSum + integrationsSum) * complexityMultiplier);
    const low = Math.round(total * 0.9);
    const high = Math.round(total * 1.2);
    return {total, low, high};
}

function initProjectCalculator(containerSelector){
    const container = document.querySelector(containerSelector);
    if(!container) return;
    const form = container.querySelector('form');
    const resultEl = container.querySelector('.calc-result');
    function readForm(){
        const pages = parseInt(form.querySelector('#calc-pages').value) || 0;
        const integrations = parseInt(form.querySelector('#calc-integrations').value) || 0;
        const complexity = form.querySelector('select#calc-complexity').value;
        const features = Array.from(form.querySelectorAll('input[name="calc-feature"]:checked')).map(cb => cb.value);
        return {pages, integrations, complexity, features};
    }
    function render(){
        const vals = readForm();
        const est = calculateEstimate(vals);
        resultEl.innerHTML = `<p><strong>Estimated project cost:</strong> ₹${est.total.toLocaleString()}<br><small>Typical range: ₹${est.low.toLocaleString()} — ₹${est.high.toLocaleString()}</small></p>`;
    }
    form.addEventListener('input', render);
    render();
}

if(typeof window !== 'undefined'){
    window.calculateEstimate = calculateEstimate;
    window.initProjectCalculator = initProjectCalculator;
}
