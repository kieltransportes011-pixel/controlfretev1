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
let currentDistance = 10; // Mock 10km for Phase 3
let pendingSubmissionData = null;

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
    await fetchPricing(); // Load pricing first to show limits
    fetchCategories();
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

function switchTab(mode) {
    authMode = mode;
    document.getElementById('loginTab').classList.toggle('active', mode === 'login');
    document.getElementById('signupTab').classList.toggle('active', mode === 'signup');
    document.getElementById('signupFields').classList.toggle('hidden', mode === 'login');
    document.getElementById('authBtn').innerText = mode === 'login' ? 'Entrar' : 'Criar Conta';
}

async function showDashboard(user) {
    // Check if company profile exists
    const { data: profile } = await client.from('empresas_ofreteja').select('*').eq('id', user.id).single();

    if (!profile) {
        // Fallback: create a profile for existing users if it doesn't exist
        await client.from('empresas_ofreteja').insert([{ id: user.id, name: 'Empresa ' + user.email.split('@')[0], email: user.email }]);
    }

    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    userEmailSpan.innerText = user.email;
    document.getElementById('headerSubtitle').innerText = 'Dashboard da Empresa';
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
        container.innerHTML = '<p class="text-muted">Nenhuma solicitação encontrada.</p>';
        return;
    }

    container.innerHTML = requests.map(req => {
        const date = new Date(req.date).toLocaleDateString('pt-BR');
        const statusClass = req.status.toLowerCase().replace('_', '');
        const statusLabel = req.status.replace('_', ' ');
        const value = req.estimated_value ? req.estimated_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sob Consulta';

        return `
            <div class="request-item">
                <div class="request-header">
                    <span class="request-date">${date}</span>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </div>
                <div class="request-body">
                    <p><strong>De:</strong> ${req.origin_address}</p>
                    <p><strong>Para:</strong> ${req.delivery_address}</p>
                    <p><strong>Veículo:</strong> ${req.categorias_veiculos?.name || 'Não inf.'}</p>
                    <p class="request-price">${value}</p>
                    ${req.rejection_reason ? `<p class="rejection-box"><strong>Motivo:</strong> ${req.rejection_reason}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function showAuth() {
    authView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    userInfo.classList.add('hidden');
    document.getElementById('headerSubtitle').innerText = 'O seu frete, na hora certa.';
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

            // Create company profile
            if (data.user) {
                const { error: profileError } = await client.from('empresas_ofreteja').insert([{
                    id: data.user.id,
                    name: companyName || 'Empresa Nova',
                    email: email,
                    phone: companyPhone
                }]);
                if (profileError) {
                    console.error('Erro ao criar perfil:', profileError);
                    alert('Usuário criado, mas erro ao salvar dados da empresa. Tente fazer login.');
                }
            }
            alert('Conta criada com sucesso! Por favor, faça login.');
            switchTab('login');
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
        const weightLimit = config ? `<span class="weight-limit">Até ${config.peso_maximo}kg</span>` : '';

        return `
            <div class="category-card ${selectedCategoryId === cat.id ? 'selected' : ''}" onclick="selectCategory('${cat.id}')">
                <h4>${cat.name}</h4>
                <p>${cat.capacity}</p>
                ${weightLimit}
            </div>
        `;
    }).join('');
}

function selectCategory(id) {
    selectedCategoryId = id;
    renderCategories();
}

function addStop() {
    const stopId = Date.now();
    const stopHtml = `
        <div class="stop-item" id="stop-${stopId}">
            <div class="flex-between" style="margin-bottom: 8px;">
                <p class="text-muted" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">Parada Intermediária</p>
                <button type="button" class="btn-remove" onclick="removeStop(${stopId})">Remover</button>
            </div>
            <div class="grid grid-3-cols mb-1">
                <div class="form-group">
                    <label>CEP</label>
                    <input type="text" data-stop-field="cep" placeholder="00000-000">
                </div>
                <div class="form-group">
                    <label>Nº</label>
                    <input type="text" data-stop-field="number">
                </div>
                <div class="form-group">
                    <label>Complemento</label>
                    <input type="text" data-stop-field="complement">
                </div>
            </div>
            <div class="form-group">
                <label>Endereço</label>
                <input type="text" data-stop-field="address" placeholder="Rua, Av...">
            </div>
        </div>
    `;
    stopsContainer.insertAdjacentHTML('beforeend', stopHtml);
}

function removeStop(id) {
    document.getElementById(`stop-${id}`).remove();
}

// --- Calculation Logic ---

function calculateEstimate() {
    const weight = parseFloat(document.getElementById('load_weight').value);

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

    // Weight validation
    if (weight > config.peso_maximo) {
        alert(`O peso informado (${weight}kg) excede o limite da categoria ${category.name} (${config.peso_maximo}kg). Escolha uma categoria superior.`);
        return;
    }

    // Calculation formula
    const numStops = stopsContainer.querySelectorAll('.stop-item').length;
    const distanceFixed = 10; // Phase 3 Mock

    const total = parseFloat(config.tarifa_base) + (distanceFixed * parseFloat(config.valor_km)) + (numStops * parseFloat(config.valor_parada));

    currentEstimate = total;
    currentDistance = distanceFixed;

    estimatedValueDisplay.innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    estimateResult.classList.remove('hidden');
    submitBtn.classList.remove('hidden');

    // Smooth scroll to result
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

    // Parse stops
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
        <div class="summary-address-item">
            <div class="address-dot stop"></div>
            <div class="address-text">
                <strong>Parada ${idx + 1}:</strong> ${s.address}, ${s.number}${s.complement ? ` - ${s.complement}` : ''}
            </div>
        </div>
    `).join('');

    summaryContent.innerHTML = `
        <div class="summary-content">
            <div class="summary-section">
                <h4>Trajeto</h4>
                <div class="summary-address-box">
                    <div class="summary-address-item">
                        <div class="address-dot origin"></div>
                        <div class="address-text">
                            <strong>Origem:</strong> ${pendingSubmissionData.origin_address}, ${pendingSubmissionData.origin_number}${pendingSubmissionData.origin_complement ? ` - ${pendingSubmissionData.origin_complement}` : ''}
                        </div>
                    </div>
                    ${stopsHtml}
                    <div class="summary-address-item">
                        <div class="address-dot dest"></div>
                        <div class="address-text">
                            <strong>Entrega Final:</strong> ${pendingSubmissionData.delivery_address}, ${pendingSubmissionData.delivery_number}${pendingSubmissionData.delivery_complement ? ` - ${pendingSubmissionData.delivery_complement}` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <div class="summary-section">
                <h4>Veículo e Carga</h4>
                <div class="summary-row">
                    <span class="label">Categoria:</span>
                    <span class="value">${cat?.name || 'Não informada'}</span>
                </div>
                <div class="summary-row">
                    <span class="label">Peso informado:</span>
                    <span class="value">${pendingSubmissionData.weight} kg</span>
                </div>
                <div class="summary-row">
                    <span class="label">Data de Coleta:</span>
                    <span class="value">${new Date(pendingSubmissionData.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="summary-row">
                    <span class="label">Contato:</span>
                    <span class="value">${pendingSubmissionData.contact_phone}</span>
                </div>
            </div>

            <div class="summary-section bg-primary-soft">
                <h4>Resumo Financeiro</h4>
                <div class="summary-row">
                    <span class="label">Distância (Est.):</span>
                    <span class="value">${pendingSubmissionData.distance_km} km</span>
                </div>
                <div class="summary-row" style="font-size: 1.2rem; color: var(--primary); margin-top: 0.5rem;">
                    <span class="label" style="color: var(--primary);">Valor Estimado:</span>
                    <span class="value">${pendingSubmissionData.estimated_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <p class="disclaimer" style="margin-top: 10px; font-size: 0.75rem;">
                    O valor final está sujeito a aprovação manual.
                </p>
            </div>
        </div>
    `;

    formCard.classList.add('hidden');
    summaryCard.classList.remove('hidden');
    summaryCard.scrollIntoView({ behavior: 'smooth' });
}

function editForm() {
    summaryCard.classList.add('hidden');
    formCard.classList.remove('hidden');
    formCard.scrollIntoView({ behavior: 'smooth' });
}

async function confirmSubmission() {
    if (!pendingSubmissionData) return;

    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerText = 'Enviando...';

    try {
        const { error } = await client.from('fretes_ofreteja').insert([pendingSubmissionData]);
        if (error) throw error;

        // Refresh local list before showing success
        fetchMyRequests();

        dashboardView.classList.add('hidden');
        successMessage.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        alert('Erro ao enviar: ' + err.message);
        confirmBtn.disabled = false;
        confirmBtn.innerText = 'Confirmar Solicitação';
    }
}

init();
