const SUPABASE_URL = 'https://pwfbgcbchhtumvwjrlep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3ZmJnY2JjaGh0dW12d2pybGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4ODYzMjgsImV4cCI6MjA4MjQ2MjMyOH0.Eu2qwiU9dIXpjIZzyNiBDhLeEePCXPvobk2ce9BIr1s';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let authMode = 'login';
let categories = [];
let pricingConfig = [];
let selectedCategoryId = null;
let stops = [];
let currentEstimate = 0;
let currentDistance = 0;
let pendingSubmissionData = null;

// Map Variables
let map = null;
let markers = [];
let routeLine = null;

// Obter transportador_id da URL (Ex: ?u=USER_ID)
const urlParams = new URLSearchParams(window.location.search);
const transportUserId = urlParams.get('u') || '15ccd519-4351-4925-b1b3-8f85e9f04057';

// DOM Elements
const authView = document.getElementById('authView');
const dashboardView = document.getElementById('dashboardView');
const successMessage = document.getElementById('successMessage');
const authForm = document.getElementById('authForm');
const freightForm = document.getElementById('freightForm');
const stopsContainer = document.getElementById('stopsContainer');
const categoryGrid = document.getElementById('categoryGrid');
const userInfo = document.getElementById('userInfo');
const userEmailSpan = document.getElementById('userEmail');
const estimateResult = document.getElementById('estimateResult');
const estimatedValueDisplay = document.getElementById('estimatedValueDisplay');
const submitBtn = document.getElementById('submitBtn');
const formCard = document.getElementById('formCard');
const summaryCard = document.getElementById('summaryCard');
const summaryContent = document.getElementById('summaryContent');

// --- Initialization ---

async function init() {
    checkSession();
    await fetchPricing();
    fetchCategories();
    initMap();
}

function initMap() {
    // Initial center (São Paulo)
    map = L.map('map').setView([-23.5505, -46.6333], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

async function checkSession() {
    const { data: { session } } = await client.auth.getSession();
    if (session) {
        showDashboard(session.user);
    } else {
        showAuth();
    }
}

async function fetchCategories() {
    const { data, error } = await client.from('categorias_veiculos').select('*').order('created_at', { ascending: true });
    if (data) {
        categories = data;
        renderCategories();
    }
}

async function fetchPricing() {
    const { data, error } = await client.from('config_precos_frete').select('*').eq('ativo', true);
    if (data) {
        pricingConfig = data;
    }
}

// --- Navigation ---

// --- Navigation ---

function switchAuthTab(mode) {
    authMode = mode;
    document.getElementById('loginTab').classList.toggle('active', mode === 'login');
    document.getElementById('signupTab').classList.toggle('active', mode === 'signup');
    document.getElementById('signupFields').classList.toggle('hidden', mode === 'login');
    document.getElementById('authBtn').innerText = mode === 'login' ? 'Entrar no Portal' : 'Criar Conta';
}

function switchTab(tabId) {
    // Nav Items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(`switchTab('${tabId}')`)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Views
    const dashboardView = document.getElementById('dashboardView');
    const historyView = document.getElementById('historyView');
    const pageTitle = document.getElementById('pageTitle');

    // Default: Reset views
    const freightFormCard = document.querySelector('.workspace-grid');

    if (tabId === 'new') {
        freightFormCard.classList.remove('hidden');
        historyView.classList.add('hidden');
        pageTitle.innerText = 'Nova Solicitação';

        // Ensure form is visible (in case we were in summary)
        document.querySelector('.main-column').classList.remove('hidden');
        if (summaryCard) summaryCard.classList.add('hidden');
    } else if (tabId === 'history') {
        freightFormCard.classList.add('hidden');
        historyView.classList.remove('hidden');
        pageTitle.innerText = 'Meu Histórico';
        fetchMyRequests();
    }
}

async function showDashboard(user) {
    // Check if company profile exists
    const { data: profile } = await client.from('empresas_ofreteja').select('*').eq('id', user.id).single();

    if (!profile) {
        await client.from('empresas_ofreteja').insert([{ id: user.id, name: 'Empresa ' + user.email.split('@')[0], email: user.email }]);
    }

    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    userEmailSpan.innerText = user.email;

    fetchMyRequests();
}

async function fetchMyRequests() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) return;

    const { data, error } = await client.from('fretes_ofreteja')
        .select(`
            *,
            categorias_veiculos(name)
        `)
        .eq('empresa_id', session.user.id)
        .order('created_at', { ascending: false });

    if (data) {
        renderMyRequests(data);
    }
}

function renderMyRequests(requests) {
    const container = document.getElementById('myRequestsContainer');
    if (!container) return;

    if (requests.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-20 opacity-30"><p>Nenhuma solicitação encontrada.</p></div>';
        return;
    }

    container.innerHTML = requests.map(req => {
        const date = new Date(req.date).toLocaleDateString('pt-BR');
        const statusClass = req.status.toLowerCase().replace('_', '');
        const statusLabel = req.status.replace('_', ' ');
        const value = req.estimated_value ? req.estimated_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sob Consulta';

        return `
            <div class="request-item card" style="padding: 24px; border-radius: 16px; margin-bottom: 0;">
                <div class="request-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <span class="request-date" style="font-size: 11px; font-weight: 700; color: var(--text-muted); opacity: 0.6;">${date}</span>
                    <span class="status-badge ${statusClass}" style="font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">${statusLabel}</span>
                </div>
                <div class="request-body" style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="font-size: 13px;">
                        <span style="color: var(--text-muted); font-size: 10px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 2px;">Trajeto</span>
                        <p style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${req.origin_address} → ${req.delivery_address}</p>
                    </div>
                    <div style="font-size: 13px;">
                        <span style="color: var(--text-muted); font-size: 10px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 2px;">Veículo</span>
                        <p style="font-weight: 600;">${req.categorias_veiculos?.name || 'Não inf.'}</p>
                    </div>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 18px; font-weight: 900; color: var(--primary);">${value}</span>
                        <button class="btn-text-only" style="font-size: 11px;">Ver Detalhes</button>
                    </div>
                    ${req.rejection_reason ? `<div style="margin-top: 8px; padding: 8px; background: #FEF2F2; border-radius: 8px; color: #991B1B; font-size: 11px;"><strong>Motivo:</strong> ${req.rejection_reason}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function showAuth() {
    authView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    userInfo.classList.add('hidden');
}

// --- Auth Logic ---

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const companyName = document.getElementById('company_name').value;
    const companyPhone = document.getElementById('company_phone').value;

    try {
        if (authMode === 'signup') {
            const { data, error } = await client.auth.signUp({ email, password });
            if (error) throw error;

            if (data.user) {
                const { error: profileError } = await client.from('empresas_ofreteja').insert([{
                    id: data.user.id,
                    name: companyName || 'Empresa Nova',
                    email: email,
                    phone: companyPhone
                }]);
                if (profileError) console.error('Erro ao criar perfil:', profileError);
            }
            alert('Conta criada com sucesso! Por favor, faça login.');
            switchAuthTab('login');
        } else {
            const { data, error } = await client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            showDashboard(data.user);
        }
    } catch (err) {
        alert('Erro: ' + err.message);
    }
});

async function handleLogout() {
    await client.auth.signOut();
    location.reload();
}

// --- Freight Form Logic ---

function renderCategories() {
    categoryGrid.innerHTML = categories.map(cat => {
        const config = pricingConfig.find(p => p.categoria === cat.name);
        const weightLimit = config ? `${config.peso_maximo}kg` : '';

        // Vehicle Category Icons (Lalamove Style)
        const icon = cat.name.toLowerCase().includes('moto') ? '🛵' :
            cat.name.toLowerCase().includes('furg') ? '🚐' :
                cat.name.toLowerCase().includes('vuc') ? '🚛' :
                    cat.name.toLowerCase().includes('caminh') ? '🚚' : '📦';

        return `
            <div class="vehicle-option ${selectedCategoryId === cat.id ? 'selected' : ''}" onclick="selectCategory('${cat.id}')">
                <span class="vehicle-icon">${icon}</span>
                <span class="vehicle-name">${cat.name}</span>
                <span class="vehicle-capacity">${weightLimit}</span>
            </div>
        `;
    }).join('');
}

function selectCategory(id) {
    selectedCategoryId = id;
    renderCategories();
}

// --- Address Autocomplete ---

function setupAutocomplete(input) {
    let timeout = null;
    let resultsDiv = null;

    input.addEventListener('input', () => {
        clearTimeout(timeout);
        const query = input.value;
        if (query.length < 4) {
            if (resultsDiv) resultsDiv.remove();
            return;
        }

        timeout = setTimeout(async () => {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br`);
            const data = await response.json();

            if (resultsDiv) resultsDiv.remove();
            resultsDiv = document.createElement('div');
            resultsDiv.className = 'autocomplete-results';

            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                div.innerText = item.display_name;
                div.onclick = () => {
                    input.value = item.display_name;
                    resultsDiv.remove();
                    updateMapRoute();
                };
                resultsDiv.appendChild(div);
            });

            input.parentElement.appendChild(resultsDiv);
        }, 500);
    });

    // Close on blur (delayed to allow click)
    input.addEventListener('blur', () => {
        setTimeout(() => { if (resultsDiv) resultsDiv.remove(); }, 200);
    });
}

function addStop() {
    const stopId = Date.now();
    const stopHtml = `
        <div class="stop-item" id="stop-${stopId}" style="background: white; padding: 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid var(--border); position: relative; animation: slideUp 0.3s ease-out;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <label style="margin-bottom: 0;">Parada Intermediária</label>
                <button type="button" onclick="removeStop(${stopId})" style="background: none; border: none; color: var(--accent-rose); font-size: 10px; font-weight: 800; cursor: pointer;">REMOVER</button>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 12px; position: relative;">
                <input type="text" data-stop-field="cep" placeholder="CEP" required>
                <input type="text" data-stop-field="address" placeholder="Endereço da parada..." required class="stop-address-input">
            </div>
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 12px;">
                <input type="text" data-stop-field="number" placeholder="Nº" required>
                <input type="text" data-stop-field="complement" placeholder="Apto, Sala, Referência...">
            </div>
        </div>
    `;
    stopsContainer.insertAdjacentHTML('beforeend', stopHtml);
    const stopEl = document.getElementById(`stop-${stopId}`);
    setupAutocomplete(stopEl.querySelector('.stop-address-input'));
}

// Initialize autocomplete for main address fields
document.addEventListener('DOMContentLoaded', () => {
    const originInput = document.querySelector('[name="origin_address"]');
    const deliveryInput = document.querySelector('[name="delivery_address"]');
    if (originInput) setupAutocomplete(originInput);
    if (deliveryInput) setupAutocomplete(deliveryInput);
});

function removeStop(id) {
    document.getElementById(`stop-${id}`).remove();
}

// --- Map & Routing Logic ---

async function geocode(address) {
    if (!address || address.length < 5) return null;
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (e) {
        console.error('Geocoding error:', e);
    }
    return null;
}

async function updateMapRoute() {
    const origin = document.querySelector('[name="origin_address"]').value;
    const dest = document.querySelector('[name="delivery_address"]').value;
    const stopsElements = stopsContainer.querySelectorAll('.stop-item');

    if (!origin || !dest) return;

    const waypoints = [];

    const originCoord = await geocode(origin);
    if (originCoord) waypoints.push(originCoord);

    for (let el of stopsElements) {
        const addr = el.querySelector('[data-stop-field="address"]').value;
        const coord = await geocode(addr);
        if (coord) waypoints.push(coord);
    }

    const destCoord = await geocode(dest);
    if (destCoord) waypoints.push(destCoord);

    if (waypoints.length < 2) return;

    // Clear old stuff
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (routeLine) map.removeLayer(routeLine);

    // Add Markers
    waypoints.forEach((wp, idx) => {
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background: ${idx === 0 ? 'var(--secondary)' : idx === waypoints.length - 1 ? 'var(--primary)' : '#94A3B8'}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [12, 12]
        });
        const m = L.marker([wp.lat, wp.lng], { icon }).addTo(map);
        markers.push(m);
    });

    // Get Route from OSRM
    const coordsStr = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
    try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            currentDistance = route.distance / 1000; // in km

            routeLine = L.geoJSON(route.geometry, {
                style: { color: 'var(--primary)', weight: 4, opacity: 0.8 }
            }).addTo(map);

            map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
        }
    } catch (e) {
        console.error('Routing error:', e);
    }
}

// --- Calculation Logic ---

async function calculateEstimate() {
    const weightInput = document.getElementById('load_weight');
    const weight = parseFloat(weightInput.value);

    if (!selectedCategoryId) {
        alert('Selecione uma categoria de veículo primeiro.');
        return;
    }

    if (isNaN(weight) || weight <= 0) {
        alert('Informe o peso da carga corretamente.');
        return;
    }

    const category = categories.find(c => c.id === selectedCategoryId);
    const config = pricingConfig.find(p => p.categoria === category.name);

    if (!config) {
        alert('Configuração de preço não encontrada para esta categoria.');
        return;
    }

    if (weight > config.peso_maximo) {
        alert(`O peso informado (${weight}kg) excede o limite da categoria ${category.name} (${config.peso_maximo}kg). Escolha uma categoria superior.`);
        return;
    }

    const calcBtn = document.getElementById('calcBtn');
    const originalText = calcBtn.innerText;
    calcBtn.disabled = true;
    calcBtn.innerText = 'Calculando Rota...';

    // Trigger map update before calculation
    await updateMapRoute();

    const numStops = stopsContainer.querySelectorAll('.stop-item').length;
    const distance = currentDistance > 0 ? currentDistance : 10;

    const total = parseFloat(config.tarifa_base) + (distance * parseFloat(config.valor_km)) + (numStops * parseFloat(config.valor_parada));

    currentEstimate = total;

    estimatedValueDisplay.innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    estimateResult.classList.remove('hidden');
    submitBtn.classList.remove('hidden');
    calcBtn.classList.add('hidden');
    calcBtn.disabled = false;
    calcBtn.innerText = originalText;

    estimateResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

freightForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(freightForm);
    const collectionDate = new Date(formData.get('date'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (collectionDate < today) {
        alert('A data de coleta não pode ser retroativa.');
        return;
    }

    const { data: { session } } = await client.auth.getSession();

    const stopsElements = stopsContainer.querySelectorAll('.stop-item');
    const stopsData = Array.from(stopsElements).map(el => ({
        cep: el.querySelector('[data-stop-field="cep"]').value,
        address: el.querySelector('[data-stop-field="address"]').value,
        number: el.querySelector('[data-stop-field="number"]').value,
        complement: el.querySelector('[data-stop-field="complement"]').value
    }));

    const submissionData = {
        empresa_id: session.user.id,
        user_id: transportUserId,
        origin_cep: formData.get('origin_cep'),
        origin_address: formData.get('origin_address'),
        origin_number: formData.get('origin_number'),
        origin_complement: formData.get('origin_complement'),
        delivery_cep: formData.get('delivery_cep'),
        delivery_address: formData.get('delivery_address'),
        delivery_number: formData.get('delivery_number'),
        delivery_complement: formData.get('delivery_complement'),
        stops: stopsData,
        vehicle_category_id: selectedCategoryId,
        weight: parseFloat(formData.get('weight')),
        contact_phone: formData.get('contact_phone'),
        date: formData.get('date'),
        status: 'AGUARDANDO_APROVACAO',
        distance_km: currentDistance,
        estimated_value: currentEstimate
    };

    pendingSubmissionData = submissionData;
    showSummary();
});

function showSummary() {
    if (!pendingSubmissionData) return;

    const cat = categories.find(c => c.id === pendingSubmissionData.vehicle_category_id);
    const stopsHtml = pendingSubmissionData.stops.map((s, idx) => `
        <div class="summary-address-item" style="display: flex; gap: 12px; margin-bottom: 8px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #94A3B8; margin-top: 6px;"></div>
            <div style="font-size: 13px;">
                <strong>Parada ${idx + 1}:</strong> ${s.address}, ${s.number}${s.complement ? ` - ${s.complement}` : ''}
            </div>
        </div>
    `).join('');

    summaryContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 24px;">
            <div>
                <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;">Rota e Trajeto</h4>
                <div style="background: var(--bg-main); padding: 20px; border-radius: 16px;">
                    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--secondary); margin-top: 6px;"></div>
                        <div style="font-size: 13px;">
                            <strong>Coleta:</strong> ${pendingSubmissionData.origin_address}, ${pendingSubmissionData.origin_number}
                        </div>
                    </div>
                    ${stopsHtml}
                    <div style="display: flex; gap: 12px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary); margin-top: 6px;"></div>
                        <div style="font-size: 13px;">
                            <strong>Entrega Final:</strong> ${pendingSubmissionData.delivery_address}, ${pendingSubmissionData.delivery_number}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;">Detalhes Carga</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div style="background: var(--bg-main); padding: 12px; border-radius: 12px; font-size: 12px;">
                        <span style="display: block; opacity: 0.6; font-size: 10px;">VEÍCULO</span>
                        <strong>${cat?.name}</strong>
                    </div>
                    <div style="background: var(--bg-main); padding: 12px; border-radius: 12px; font-size: 12px;">
                        <span style="display: block; opacity: 0.6; font-size: 10px;">PESO</span>
                        <strong>${pendingSubmissionData.weight}kg</strong>
                    </div>
                </div>
                <div style="margin-top: 16px; background: var(--bg-main); padding: 12px; border-radius: 12px; font-size: 12px;">
                    <span style="display: block; opacity: 0.6; font-size: 10px;">DISTÂNCIA TOTAL</span>
                    <strong>${currentDistance.toFixed(2)} km</strong>
                </div>
            </div>
        </div>
    `;

    document.querySelector('.main-column').classList.add('hidden');
    document.getElementById('confirmBtn').classList.remove('hidden');
}

async function confirmSubmission() {
    if (!pendingSubmissionData) return;

    try {
        const { error } = await client.from('fretes_ofreteja').insert([pendingSubmissionData]);
        if (error) throw error;
        fetchMyRequests();
        dashboardView.classList.add('hidden');
        successMessage.classList.remove('hidden');
    } catch (err) {
        alert('Erro ao enviar: ' + err.message);
    }
}

init();
