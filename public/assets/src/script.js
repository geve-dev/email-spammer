// 1. Obter o formulário pelo ID
const form = document.getElementById('contact-form');
const statusDiv = document.getElementById('form-status');
const statusTitle = statusDiv?.querySelector('.status-title');
const statusMessage = statusDiv?.querySelector('.status-message');
const statusIcon = statusDiv?.querySelector('.status-icon i');
const statusProgress = statusDiv?.querySelector('.status-progress');

function showStatus(type, title, message, iconClass) {
    if (!statusDiv) return;
    statusDiv.hidden = false;
    statusDiv.style.display = 'block';
    statusDiv.classList.remove('success', 'error', 'loading');
    statusDiv.classList.add(type);
    if (statusTitle) statusTitle.textContent = title;
    if (statusMessage) statusMessage.textContent = message;
    if (statusIcon) {
        statusIcon.className = iconClass;
    }
    if (type === 'loading') {
        if (statusProgress) statusProgress.style.display = 'block';
    } else {
        if (statusProgress) statusProgress.style.display = 'none';
    }
}

function hideStatus(delay = 6000) {
    if (!statusDiv) return;
    setTimeout(() => {
        statusDiv.style.display = 'none';
        statusDiv.hidden = true;
    }, delay);
}

// Wizard State
let currentStep = 1;
const totalSteps = 3;

// Wizard Elements
const steps = document.querySelectorAll('.form-step');
const progressBar = document.getElementById('progress-bar');
const stepDots = document.querySelectorAll('.step-dot');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');

// Email List Management
let emailList = [];
const emailInput = document.getElementById('emailInput');
const addEmailBtn = document.getElementById('addEmailBtn');
const emailListContainer = document.getElementById('emailListContainer');
const recipientsInput = document.getElementById('recipients');
let editIndex = null; // Track which email is being edited

// Email domain suggestions UI
let suggestionBox;
const COMMON_DOMAINS = [
    'gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com',
    'icloud.com', 'proton.me', 'protonmail.com', 'aol.com', 'uol.com.br',
    'bol.com.br', 'terra.com.br', 'globo.com', 'me.com'
];

function ensureSuggestionBox() {
    if (!emailInput) return;
    if (!suggestionBox) {
        suggestionBox = document.createElement('ul');
        suggestionBox.id = 'email-suggestions';
        suggestionBox.style.position = 'absolute';
        suggestionBox.style.left = '0';
        suggestionBox.style.right = '0';
        suggestionBox.style.zIndex = '1000';
        suggestionBox.style.marginTop = '2px';
        suggestionBox.style.listStyle = 'none';
        suggestionBox.style.padding = '2px 0';
        suggestionBox.style.background = 'rgba(255,255,255,0.2)';
        suggestionBox.style.border = '1px solid rgba(255,255,255,0.18)';
        suggestionBox.style.borderRadius = '10px';
        suggestionBox.style.display = 'none';
        suggestionBox.style.maxHeight = '90px';
        suggestionBox.style.overflowY = 'auto';
        suggestionBox.style.backdropFilter = 'blur(10px)';
        suggestionBox.style.webkitBackdropFilter = 'blur(10px)';
        suggestionBox.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
        suggestionBox.style.outline = '1px solid rgba(255,255,255,0.06)';
        // container is the parent div that already is position: relative in HTML
        emailInput.parentElement.appendChild(suggestionBox);
    }
}

function hideSuggestions() {
    if (suggestionBox) suggestionBox.style.display = 'none';
}

function showSuggestions(items) {
    ensureSuggestionBox();
    if (!suggestionBox) return;
    suggestionBox.innerHTML = '';
    if (!items.length) {
        hideSuggestions();
        return;
    }
    items.forEach((s, idx) => {
        const li = document.createElement('li');
        li.textContent = s;
        li.style.padding = '6px 10px';
        li.style.cursor = 'pointer';
        li.style.color = 'var(--text-color-primary, #fff)';
        li.style.fontSize = '0.85rem';
        li.dataset.index = String(idx);
        li.addEventListener('mouseenter', () => highlightSuggestion(idx));
        li.addEventListener('mouseleave', () => clearHighlight(idx));
        li.addEventListener('mousedown', (e) => { // use mousedown to select before input blur
            e.preventDefault();
            applySuggestion(s);
        });
        suggestionBox.appendChild(li);
    });
    activeIndex = 0;
    updateActiveItem();
    suggestionBox.style.display = 'block';
}

function buildSuggestions(value) {
    const [local, domainPart] = value.split('@');
    if (!local || value.endsWith('@')) {
        // Show full list when user just typed local or ends with @
        return COMMON_DOMAINS.map(d => `${local || ''}@${d}`);
    }
    if (!domainPart) return [];
    const filtered = COMMON_DOMAINS
        .filter(d => d.startsWith(domainPart.toLowerCase()))
        .map(d => `${local}@${d}`);
    return filtered;
}

function applySuggestion(fullEmail) {
    emailInput.value = fullEmail;
    hideSuggestions();
}

let activeIndex = -1;
function updateActiveItem() {
    if (!suggestionBox) return;
    const items = suggestionBox.querySelectorAll('li');
    items.forEach((li, i) => {
        if (i === activeIndex) {
            li.style.background = 'rgba(255,255,255,0.12)';
        } else {
            li.style.background = 'rgba(0,0,0,0)';
        }
    });
}

function highlightSuggestion(index) { activeIndex = index; updateActiveItem(); }
function clearHighlight(index) { if (activeIndex === index) { activeIndex = -1; updateActiveItem(); } }


function renderEmailList() {
    if (!emailListContainer) return;
    emailListContainer.innerHTML = '';
    emailList.forEach((email, index) => {
        const item = document.createElement('div');
        item.className = 'email-item';

        if (editIndex === index) {
            // Edit Mode
            const input = document.createElement('input');
            input.type = 'email';
            input.value = email;
            input.className = 'email-edit-input';

            // Add keydown listener for Enter within edit input
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation(); // Stop propagation to prevent form wizard nav
                    saveEmail(index, input.value);
                }
            });

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'email-actions';

            const saveBtn = document.createElement('button');
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            saveBtn.className = 'icon-btn save';
            saveBtn.onclick = () => saveEmail(index, input.value);

            const cancelBtn = document.createElement('button');
            cancelBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            cancelBtn.className = 'icon-btn cancel';
            cancelBtn.onclick = () => cancelEdit();

            actionsDiv.appendChild(saveBtn);
            actionsDiv.appendChild(cancelBtn);

            item.appendChild(input);
            item.appendChild(actionsDiv);

            // Auto focus the input
            setTimeout(() => input.focus(), 50);

        } else {
            // View Mode
            const contentDiv = document.createElement('div');
            contentDiv.className = 'email-content';

            contentDiv.innerHTML = `<span class="email-number">#${index + 1}</span><span class="email-text" title="${email}">${email}</span>`;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'email-actions';

            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editBtn.className = 'icon-btn edit';
            editBtn.onclick = () => editEmail(index);

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            removeBtn.className = 'icon-btn delete';
            removeBtn.onclick = () => removeEmail(index);

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(removeBtn);

            item.appendChild(contentDiv);
            item.appendChild(actionsDiv);
        }

        emailListContainer.appendChild(item);
    });
    updateRecipientsInput();
}

function updateRecipientsInput() {
    if (recipientsInput) {
        recipientsInput.value = emailList.join(',');
    }
}

function addEmail() {
    const email = emailInput.value.trim();
    if (email && validateEmail(email)) {
        if (!emailList.includes(email)) {
            emailList.push(email);
            renderEmailList();
            emailInput.value = '';
            emailInput.focus();
        } else {
            alert('Este email já foi adicionado!');
        }
    } else {
        emailInput.reportValidity();
    }
}

function removeEmail(index) {
    if (editIndex === index) editIndex = null; // Reset edit if removing currently edited item
    emailList.splice(index, 1);
    renderEmailList();
}

function editEmail(index) {
    editIndex = index;
    renderEmailList();
}

function cancelEdit() {
    editIndex = null;
    renderEmailList();
}

function saveEmail(index, newEmail) {
    newEmail = newEmail.trim();
    if (newEmail && validateEmail(newEmail)) {
        // Check for duplicates (excluding current index)
        const isDuplicate = emailList.some((email, i) => i !== index && email === newEmail);

        if (!isDuplicate) {
            emailList[index] = newEmail;
            editIndex = null;
            renderEmailList();
        } else {
            alert('Este email já existe na lista!');
        }
    } else {
        alert('Email inválido!');
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (addEmailBtn) {
    addEmailBtn.addEventListener('click', addEmail);
}

if (emailInput) {
    ensureSuggestionBox();

    emailInput.addEventListener('input', () => {
        const v = emailInput.value.trim();
        if (!v.includes('@')) { hideSuggestions(); return; }
        const suggestions = buildSuggestions(v).slice(0, 8);
        if (suggestions.length) showSuggestions(suggestions); else hideSuggestions();
    });

    emailInput.addEventListener('blur', () => {
        // Delay to allow click selection
        setTimeout(() => hideSuggestions(), 150);
    });

    emailInput.addEventListener('focus', () => {
        const v = emailInput.value.trim();
        if (v.includes('@')) {
            const suggestions = buildSuggestions(v).slice(0, 8);
            if (suggestions.length) showSuggestions(suggestions);
        }
    });

    emailInput.addEventListener('keydown', (e) => {
        const isOpen = suggestionBox && suggestionBox.style.display !== 'none';
        if (e.key === 'ArrowDown' && isOpen) {
            e.preventDefault();
            activeIndex = Math.min(activeIndex + 1, suggestionBox.children.length - 1);
            updateActiveItem();
        } else if (e.key === 'ArrowUp' && isOpen) {
            e.preventDefault();
            activeIndex = Math.max(activeIndex - 1, 0);
            updateActiveItem();
        } else if ((e.key === 'Tab' || e.key === 'Enter') && isOpen) {
            // Accept suggestion
            const items = suggestionBox.querySelectorAll('li');
            if (items.length && activeIndex >= 0) {
                e.preventDefault();
                applySuggestion(items[activeIndex].textContent);
                if (e.key === 'Enter') { e.stopPropagation(); addEmail(); }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                addEmail();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            addEmail();
        } else if (e.key === 'Escape' && isOpen) {
            hideSuggestions();
        }
    });
}


// Initialize Wizard
updateWizardUI();

// Navigation Event Listeners
if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateWizardUI();
            }
        }
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizardUI();
        }
    });
}

// Enter key navigation
const formInputs = document.querySelectorAll('input, textarea');
formInputs.forEach(input => {
    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            // If it's the last step, submit; otherwise next
            if (currentStep === totalSteps) {
                form.requestSubmit();
            } else {
                nextBtn.click();
            }
        }
    });
});

function updateWizardUI() {
    // 1. Show/Hide Steps
    steps.forEach(step => {
        if (parseInt(step.dataset.step) === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // 2. Update Progress Bar
    // Start at 0% (Step 1) and end at 100% (Step 3)
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100 + '%';
    if (progressBar) progressBar.style.width = progress;

    // 3. Update Dots
    stepDots.forEach(dot => {
        const dotStep = parseInt(dot.dataset.step);
        if (dotStep <= currentStep) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    // 4. Update Buttons
    if (currentStep === 1) {
        if (prevBtn) prevBtn.hidden = true;
        if (nextBtn) nextBtn.hidden = false;
        if (submitBtn) submitBtn.hidden = true;
    } else if (currentStep === totalSteps) {
        if (prevBtn) prevBtn.hidden = false;
        if (nextBtn) nextBtn.hidden = true;
        if (submitBtn) submitBtn.hidden = false;
    } else {
        if (prevBtn) prevBtn.hidden = false;
        if (nextBtn) nextBtn.hidden = false;
        if (submitBtn) submitBtn.hidden = true;
    }
}

function validateStep(stepIndex) {
    const currentStepEl = document.querySelector(`.form-step[data-step="${stepIndex}"]`);
    const inputs = currentStepEl.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    // Special check for Step 2 (Recipients)
    if (stepIndex === 2) {
        if (emailList.length === 0) {
            isValid = false;
            // Focus on email input to prompt user
            if (emailInput) emailInput.focus();
            // Optional: simple alert or custom UI feedback
            // alert('Adicione pelo menos um destinatário.');
            // Or better, show standard validation failure on the hidden input if possible, 
            // but since it's hidden, we might need a visual cue.
            // Let's use the reportValidity on the visible input but with a custom message if empty
            if (emailInput) {
                emailInput.setCustomValidity("Adicione pelo menos um email à lista.");
                emailInput.reportValidity();
                // Reset it immediately so they can type
                setTimeout(() => emailInput.setCustomValidity(""), 2000);
            }
        }
    } else {
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                isValid = false;
                input.reportValidity(); // Shows the browser's native validation bubble
            }
        });
    }

    return isValid;
}

// 2. Adicionar o Listener para o evento de submit
form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Impede o envio padrão (que te levaria para a tela do Formspree)

    showStatus('loading', 'Enviando', 'Enviando sua mensagem... Aguarde.', 'fa-solid fa-circle-notch fa-spin');

    const data = new FormData(form); // Cria um objeto com os dados do formulário
    const body = {};

    // Converter FormData para JSON Object
    data.forEach((value, key) => {
        // Tratar checkbox
        if (key === 'showSenderEmail') {
            body[key] = true;
        } else {
            body[key] = value;
        }
    });

    // Se o checkbox não estiver marcado, ele não vem no FormData, então garantimos que seja false se não existir
    if (!body.hasOwnProperty('showSenderEmail')) {
        body['showSenderEmail'] = false;
    }

    try {
        // 3. Enviar os dados para o backend usando Fetch API
        const response = await fetch(event.target.action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Alterado para JSON
                'Accept': 'application/json'
            },
            body: JSON.stringify(body) // Enviar como JSON
        });

        if (response.ok) {
            // 4. Se o envio for bem-sucedido
            showStatus('success', 'Mensagem enviada', '✅ Sua mensagem foi enviada com sucesso! Volte sempre.', 'fa-solid fa-check');
            form.reset(); // Limpa os campos do formulário
            hideStatus(5000);
        } else {
            // 5. Se houver um erro no envio (ex: campos inválidos, limite de envio)
            let responseData = {};
            try { responseData = await response.json(); } catch { }
            const errorMsg = responseData.error || 'Ocorreu um erro no envio. Tente novamente mais tarde.';
            showStatus('error', 'Falha no envio', `❌ ${errorMsg}`, 'fa-solid fa-triangle-exclamation');
        }
    } catch (error) {
        // 6. Se houver um erro de rede (conexão)
        showStatus('error', 'Erro de conexão', '❌ Verifique sua conexão com a internet e tente novamente.', 'fa-solid fa-wifi');
        console.error('Erro de rede:', error);
    }
});
