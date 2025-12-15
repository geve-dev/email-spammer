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

function renderEmailList() {
    if (!emailListContainer) return;
    emailListContainer.innerHTML = '';
    emailList.forEach((email, index) => {
        const item = document.createElement('div');
        item.className = 'email-item';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.padding = '0.5rem';
        item.style.marginBottom = '0.5rem';
        item.style.background = 'rgba(255, 255, 255, 0.05)';
        item.style.border = '1px solid var(--shadow-glow)';
        item.style.borderRadius = '4px';

        const textSpan = document.createElement('span');
        textSpan.innerHTML = `<strong style="color: var(--brand-glow); margin-right: 10px;">#${index + 1}</strong> ${email}`;

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        removeBtn.type = 'button';
        removeBtn.style.background = 'transparent';
        removeBtn.style.border = 'none';
        removeBtn.style.color = '#ff4444';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.fontSize = '1rem';
        removeBtn.onclick = () => removeEmail(index);

        item.appendChild(textSpan);
        item.appendChild(removeBtn);
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
        // Optional: Show invalid email feedback
        emailInput.reportValidity();
    }
}

function removeEmail(index) {
    emailList.splice(index, 1);
    renderEmailList();
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (addEmailBtn) {
    addEmailBtn.addEventListener('click', addEmail);
}

if (emailInput) {
    emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEmail();
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
