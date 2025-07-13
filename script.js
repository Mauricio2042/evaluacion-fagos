document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES Y CONSTANTES ---
    // URL del Web App de Google Apps Script (¡IMPORTANTE! El docente debe pegar la URL aquí)
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyegtiRMB05k9IXcF_Qyy6IuFl4JZc7TW4JfaZsJsEhS4jsjsIZHpYy23Zzqwa4AahSGg/exec';

    const studentData = {
        timestamp: '',
        fullName: '',
        email: '',
        scoreRemember: 0,
        answerComprehend: '',
        scoreApply: 0,
        answerAnalyze: '',
        answerEvaluate: '',
        answerCreate: '',
        finalGrade: 0,
        qualitativeGrade: ''
    };

    // --- ELEMENTOS DEL DOM ---
    const registrationModal = document.getElementById('registration-modal');
    const registrationForm = document.getElementById('registration-form');
    const appContainer = document.getElementById('app-container');
    const resultsScreen = document.getElementById('results-screen');
    const loadingOverlay = document.getElementById('loading-overlay');
    const submitButton = document.getElementById('submit-evaluation');

    // --- LÓGICA DE REGISTRO ---
    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');

        if (fullNameInput.value.trim() && emailInput.value.trim()) {
            studentData.fullName = fullNameInput.value.trim();
            studentData.email = emailInput.value.trim();
            registrationModal.style.display = 'none';
            appContainer.style.display = 'block';
        } else {
            alert('Por favor, completa todos los campos.');
        }
    });

    // --- LÓGICA NIVEL 1: RECORDAR (DRAG & DROP) ---
    const draggables = document.querySelectorAll('.event');
    const dropZones = document.querySelectorAll('.drop-zone');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
        });
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('hovered');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('hovered');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('hovered');
            const draggingElement = document.querySelector('.dragging');
            
            // Solo permite soltar si la zona está vacía
            if (zone.children.length === 0 && draggingElement) {
                zone.appendChild(draggingElement);
                // Desactiva el drag para el elemento ya soltado
                draggingElement.setAttribute('draggable', 'false');
            }
        });
    });

    // --- LÓGICA DE FINALIZACIÓN Y EVALUACIÓN ---
    submitButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas finalizar y enviar tu evaluación? No podrás cambiar tus respuestas.')) {
            loadingOverlay.style.display = 'flex';
            calculateScores();
            collectTextAnswers();
            sendDataToSheet();
        }
    });

    function calculateScores() {
        // Nivel 1: Recordar (3 puntos)
        let scoreRemember = 0;
        dropZones.forEach(zone => {
            const droppedEvent = zone.querySelector('.event');
            if (droppedEvent && droppedEvent.dataset.year === zone.dataset.year) {
                scoreRemember++;
                zone.classList.add('correct');
            }
        });
        studentData.scoreRemember = scoreRemember;

        // Nivel 3: Aplicar (5 puntos)
        const selectedOption = document.querySelector('input[name="aplicar-question"]:checked');
        if (selectedOption && selectedOption.value === 'c') {
            studentData.scoreApply = 5;
        } else {
            studentData.scoreApply = 0;
        }

        // Cálculo de nota final (escala 1.0 a 5.0)
        const totalPoints = studentData.scoreRemember + studentData.scoreApply;
        const maxPoints = 3 + 5; // Puntos de Recordar + Aplicar
        // Fórmula de transformación lineal
        const finalGrade = 1.0 + (totalPoints / maxPoints) * 4.0;
        studentData.finalGrade = parseFloat(finalGrade.toFixed(1));

        // Asignación de nota cualitativa
        if (studentData.finalGrade >= 4.8) studentData.qualitativeGrade = "Excelente, dominio completo";
        else if (studentData.finalGrade >= 4.0) studentData.qualitativeGrade = "Muy Bueno";
        else if (studentData.finalGrade >= 3.0) studentData.qualitativeGrade = "Suficiente";
        else studentData.qualitativeGrade = "Requiere revisión";
    }

    function collectTextAnswers() {
        studentData.answerComprehend = document.getElementById('comprender-answer').value.trim();
        studentData.answerAnalyze = document.getElementById('analizar-answer').value.trim();
        studentData.answerEvaluate = document.getElementById('evaluar-answer').value.trim();
        studentData.answerCreate = document.getElementById('crear-answer').value.trim();
        studentData.timestamp = new Date().toLocaleString('es-CO');
    }

    function sendDataToSheet() {
        // Verifica si la URL del script fue reemplazada
        if (SCRIPT_URL === 'URL_DEL_SCRIPT_PEGAR_AQUI') {
            alert('Error de configuración: La URL del script no ha sido establecida por el docente.');
            loadingOverlay.style.display = 'none';
            // Aún así, muestra los resultados al estudiante
            displayResults();
            return;
        }

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors', // El script de Google debe estar preparado para CORS
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            displayResults();
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Hubo un error al enviar tus respuestas. Por favor, contacta a tu docente. Aún puedes ver tu calificación.');
            displayResults(); // Muestra los resultados aunque falle el envío
        })
        .finally(() => {
            loadingOverlay.style.display = 'none';
        });
    }

    function displayResults() {
        document.getElementById('quantitative-score').textContent = studentData.finalGrade.toFixed(1);
        document.getElementById('qualitative-score').textContent = studentData.qualitativeGrade;
        
        let feedback = '';
        switch(studentData.qualitativeGrade) {
            case "Excelente, dominio completo":
                feedback = "¡Felicitaciones! Demuestras una comprensión profunda y una excelente capacidad de aplicación de los conceptos.";
                break;
            case "Muy Bueno":
                feedback = "¡Gran trabajo! Tienes un sólido entendimiento del material. Sigue así.";
                break;
            case "Suficiente":
                feedback = "Has aprobado la evaluación, pero hay áreas que puedes reforzar. Revisa el material y las actividades complementarias.";
                break;
            default:
                feedback = "Es importante que revises nuevamente el artículo y los conceptos clave. Utiliza las actividades complementarias para fortalecer tu comprensión.";
        }
        document.getElementById('feedback-message').textContent = feedback;

        appContainer.style.display = 'none';
        resultsScreen.style.display = 'block';
    }
});