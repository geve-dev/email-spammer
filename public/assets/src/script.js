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

    inputs.forEach(input => {
        if (!input.checkValidity()) {
            isValid = false;
            input.reportValidity(); // Shows the browser's native validation bubble
        }
    });

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
            showStatus('success', 'Mensagem enviada', '✅ Recebi sua mensagem! Em breve retorno o contato.', 'fa-solid fa-check');
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
