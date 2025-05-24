
// Configuração do Mailchimp
const MAILCHIMP_CONFIG = {
    // Substitua pela sua URL do Mailchimp
    url: 'https://YOUR_DOMAIN.us1.list-manage.com/subscribe/post-json',
    user_id: 'YOUR_USER_ID',
    list_id: 'YOUR_LIST_ID'
};

// Elementos do DOM
const form = document.getElementById('captureForm');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// Função para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Função para formatar telefone
function formatPhone(phone) {
    return phone.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

// Aplicar máscara no telefone
document.getElementById('phone').addEventListener('input', function (e) {
    e.target.value = formatPhone(e.target.value);
});

// Função para enviar dados para o Mailchimp
async function sendToMailchimp(formData) {
    const data = {
        u: MAILCHIMP_CONFIG.user_id,
        id: MAILCHIMP_CONFIG.list_id,
        EMAIL: formData.email,
        FNAME: formData.name.split(' ')[0],
        LNAME: formData.name.split(' ').slice(1).join(' '),
        PHONE: formData.phone || ''
    };

    try {
        // Para Mailchimp, você precisa usar JSONP devido ao CORS
        const script = document.createElement('script');
        const callbackName = 'mailchimpCallback' + Date.now();

        window[callbackName] = function (response) {
            document.head.removeChild(script);
            delete window[callbackName];

            if (response.result === 'success') {
                showSuccess();
                // Opcional: redirecionar para página de obrigado
                // setTimeout(() => window.location.href = '/obrigado.html', 2000);
            } else {
                throw new Error(response.msg || 'Erro no cadastro');
            }
        };

        const params = new URLSearchParams(data).toString();
        script.src = `${MAILCHIMP_CONFIG.url}?${params}&c=${callbackName}`;
        document.head.appendChild(script);

    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// Função alternativa para outros provedores de email
async function sendToEmailProvider(formData) {
    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Erro na requisição');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// Função para mostrar loading
function showLoading() {
    submitBtn.style.display = 'none';
    loading.style.display = 'block';
    hideMessages();
}

// Função para esconder loading
function hideLoading() {
    submitBtn.style.display = 'block';
    loading.style.display = 'none';
}

// Função para mostrar sucesso
function showSuccess() {
    hideLoading();
    successMessage.style.display = 'block';
    form.reset();

    // Analytics/Tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
            'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL'
        });
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead');
    }
}

// Função para mostrar erro
function showError(message = 'Erro ao processar. Tente novamente.') {
    hideLoading();
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Função para esconder mensagens
function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Event listener do formulário
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Validações
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!name || name.length < 2) {
        showError('Por favor, digite um nome válido.');
        return;
    }

    if (!isValidEmail(email)) {
        showError('Por favor, digite um e-mail válido.');
        return;
    }

    // Preparar dados
    const formData = { name, email, phone };

    try {
        showLoading();

        // Escolha o método de envio baseado na sua configuração
        // Para Mailchimp:
        await sendToMailchimp(formData);

        // Para outros provedores:
        // await sendToEmailProvider(formData);

    } catch (error) {
        console.error('Erro no envio:', error);
        showError(error.message || 'Erro ao processar. Tente novamente.');
    }
});

// Animações e interações adicionais
document.addEventListener('DOMContentLoaded', function () {
    // Smooth scroll para dispositivos móveis
    if (window.innerWidth <= 768) {
        const formSection = document.querySelector('.form-section');
        setTimeout(() => {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 1000);
    }

    // Contador de urgência (opcional)
    let timeLeft = 24 * 60 * 60; // 24 horas em segundos

    function updateTimer() {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;

        // Você pode adicionar um elemento de timer na página
        // document.getElementById('timer').textContent = 
        //     `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft > 0) {
            timeLeft--;
            setTimeout(updateTimer, 1000);
        }
    }

    // updateTimer(); // Descomente para ativar o timer
});

// Tracking de eventos (opcional)
function trackEvent(eventName, properties = {}) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', eventName, properties);
    }

    console.log('Event tracked:', eventName, properties);
}

// Rastrear interações
document.getElementById('name').addEventListener('focus', () => {
    trackEvent('form_start', { field: 'name' });
});

document.getElementById('email').addEventListener('focus', () => {
    trackEvent('form_progress', { field: 'email' });
});
