// Конфігурація та дефолтні налаштування
const DEFAULT_RANGES = [
    { label: 'Високий рівень', minPercent: 80, color: 'bg-emerald-500', textClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50' },
    { label: 'Достатній / Середній', minPercent: 40, color: 'bg-amber-500', textClass: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50' },
    { label: 'Початковий рівень', minPercent: 0, color: 'bg-rose-500', textClass: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50' }
];

let customRanges = JSON.parse(localStorage.getItem('calc_custom_ranges')) || DEFAULT_RANGES;

// Елементи DOM
const scoreInput = document.getElementById('scoreInput');
const maxScoreInput = document.getElementById('maxScoreInput');
const targetScaleSelect = document.getElementById('targetScale');
const customScaleContainer = document.getElementById('customScaleContainer');
const customScaleInput = document.getElementById('customScaleInput');
const roundingModeSelect = document.getElementById('roundingMode');

const resultValue = document.getElementById('resultValue');
const resultScaleMax = document.getElementById('resultScaleMax');
const levelBadge = document.getElementById('levelBadge');
const progressBar = document.getElementById('progressBar');
const percentageText = document.getElementById('percentageText');

const copyBtn = document.getElementById('copyBtn');
const copyText = document.getElementById('copyText');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Елементи модального вікна
const customRangesBtn = document.getElementById('customRangesBtn');
const customRangesModal = document.getElementById('customRangesModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const saveRangesBtn = document.getElementById('saveRangesBtn');
const resetRangesBtn = document.getElementById('resetRangesBtn');
const rangesList = document.getElementById('rangesList');

// Ініціалізація теми
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
});

// Слухачі подій для розрахунку
[scoreInput, maxScoreInput, customScaleInput].forEach(el => el.addEventListener('input', calculateScore));
[targetScaleSelect, roundingModeSelect].forEach(el => el.addEventListener('change', () => {
    toggleCustomScale();
    calculateScore();
}));

function toggleCustomScale() {
    if (targetScaleSelect.value === 'custom') {
        customScaleContainer.classList.remove('hidden');
    } else {
        customScaleContainer.classList.add('hidden');
    }
}

function setPreset(score, max) {
    scoreInput.value = score;
    maxScoreInput.value = max;
    calculateScore();
}

function calculateScore() {
    const score = parseFloat(scoreInput.value);
    const maxScore = parseFloat(maxScoreInput.value);

    if (isNaN(score) || isNaN(maxScore) || maxScore <= 0 || score < 0) {
        resetOutput();
        return;
    }

    // Розрахунок відсотка (0-100%)
    const percentage = Math.min(Math.max((score / maxScore) * 100, 0), 100);

    // Отримання цільового максимуму
    let targetMax = parseFloat(targetScaleSelect.value);
    if (targetScaleSelect.value === 'custom') {
        targetMax = parseFloat(customScaleInput.value) || 1;
    }

    // Переведення
    let rawResult = (percentage / 100) * targetMax;

    // Округлення
    const rounding = roundingModeSelect.value;
    let formattedResult = rawResult;
    if (rounding !== 'none') {
        const decimals = parseInt(rounding);
        formattedResult = rawResult.toFixed(decimals);
    } else {
        formattedResult = Math.round(rawResult * 1000) / 1000; // точне до 3 знаків
    }

    // Оновлення інтерфейсу
    resultValue.textContent = formattedResult;
    resultScaleMax.textContent = `/ ${targetMax}`;
    percentageText.textContent = `${Math.round(percentage)}%`;
    progressBar.style.width = `${percentage}%`;

    // Визначення рівня
    updateLevelBadge(percentage);
}

function resetOutput() {
    resultValue.textContent = '0';
    resultScaleMax.textContent = `/ ${targetScaleSelect.value === 'custom' ? (customScaleInput.value || '1') : targetScaleSelect.value}`;
    percentageText.textContent = '0%';
    progressBar.style.width = '0%';
    levelBadge.textContent = 'Введіть бали';
    levelBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
}

function updateLevelBadge(percent) {
    const sortedRanges = [...customRanges].sort((a, b) => b.minPercent - a.minPercent);
    const matched = sortedRanges.find(r => percent >= r.minPercent) || sortedRanges[sortedRanges.length - 1];

    levelBadge.textContent = matched.label;
    levelBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all ${matched.textClass}`;
    progressBar.className = `h-full rounded-full transition-all duration-300 ${matched.color}`;
}

// Модальне вікно рівнів
customRangesBtn.addEventListener('click', () => {
    renderRangesInputs();
    customRangesModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', () => customRangesModal.classList.add('hidden'));

function renderRangesInputs() {
    rangesList.innerHTML = '';
    customRanges.forEach((range, idx) => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2';
        div.innerHTML = `
            <input type="text" value="${range.label}" data-idx="${idx}" class="range-label flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium outline-none">
            <div class="flex items-center gap-1">
                <span class="text-xs text-slate-400">від</span>
                <input type="number" min="0" max="100" value="${range.minPercent}" data-idx="${idx}" class="range-min w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold outline-none text-center">
                <span class="text-xs text-slate-400">%</span>
            </div>
        `;
        rangesList.appendChild(div);
    });
}

saveRangesBtn.addEventListener('click', () => {
    const labels = document.querySelectorAll('.range-label');
    const mins = document.querySelectorAll('.range-min');

    labels.forEach((el, idx) => {
        customRanges[idx].label = el.value || customRanges[idx].label;
        customRanges[idx].minPercent = parseFloat(mins[idx].value) || 0;
    });

    localStorage.setItem('calc_custom_ranges', JSON.stringify(customRanges));
    customRangesModal.classList.add('hidden');
    calculateScore();
});

resetRangesBtn.addEventListener('click', () => {
    customRanges = [...DEFAULT_RANGES];
    localStorage.removeItem('calc_custom_ranges');
    renderRangesInputs();
    calculateScore();
});

// Копіювання результату
copyBtn.addEventListener('click', () => {
    const val = resultValue.textContent;
    const max = resultScaleMax.textContent.replace('/ ', '');
    const textToCopy = `${val}/${max} (${percentageText.textContent})`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.classList.add('copy-success');
        copyText.textContent = 'Скопійовано!';
        setTimeout(() => {
            copyBtn.classList.remove('copy-success');
            copyText.textContent = 'Копіювати';
        }, 2000);
    });
});

// Первинний ініт
calculateScore();
