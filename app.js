// ===== بيانات اللعبة (محدثة بالكميات الجديدة) =====
let gameData = {
    playedIds: new Set(),
    prizes: {
        prize10: 100,      // 10 شيكل * 10 مرات = 100
        prize15: 150,      // 15 شيكل * 10 مرات = 150
        prize20: 200,      // 20 شيكل * 10 مرات = 200
        prize25: 150,      // 25 شيكل * 6 مرات = 150
        prize30: 150,      // 30 شيكل * 5 مرات = 150
        prize35: 70,       // 35 شيكل * 2 مرات = 70
        prize40: 80,       // 40 شيكل * 2 مرات = 80
        prize45: 45,       // 45 شيكل * 1 مرة = 45
        prize50: 50,       // 50 شيكل * 1 مرة = 50
    },
    prizeMap: {
        prize10: '10 شيكل', prize15: '15 شيكل', prize20: '20 شيكل', prize25: '25 شيكل',
        prize30: '30 شيكل', prize35: '35 شيكل', prize40: '40 شيكل', prize45: '45 شيكل',
        prize50: '50 شيكل'
    }
};

// ===== رابط Google Apps Script URL (لم يتغير) =====
const googleAppsScriptURL = 'https://script.google.com/macros/s/AKfycbxZ7NtD5UqDnwiQzbqUNP4zpbWzA6NIGyBgzGiDGX_UK2xlZoHWNyKSaR6j_XFl0g/exec';

// ===== تعريف القطاعات (9 قطاعات متساوية - 40 درجة لكل قطاع) =====
const segments = [
    { name: '50 شيكل', key: 'prize50', icon: '💵', class: 'win-50', startAngle: 0, endAngle: 40, stopAngle: 20 },
    { name: '45 شيكل', key: 'prize45', icon: '💵', class: 'win-45', startAngle: 40, endAngle: 80, stopAngle: 60 },
    { name: '40 شيكل', key: 'prize40', icon: '💵', class: 'win-40', startAngle: 80, endAngle: 120, stopAngle: 100 },
    { name: '35 شيكل', key: 'prize35', icon: '💵', class: 'win-35', startAngle: 120, endAngle: 160, stopAngle: 140 },
    { name: '30 شيكل', key: 'prize30', icon: '💵', class: 'win-30', startAngle: 160, endAngle: 200, stopAngle: 180 },
    { name: '25 شيكل', key: 'prize25', icon: '💵', class: 'win-25', startAngle: 200, endAngle: 240, stopAngle: 220 },
    { name: '20 شيكل', key: 'prize20', icon: '💵', class: 'win-20', startAngle: 240, endAngle: 280, stopAngle: 260 },
    { name: '15 شيكل', key: 'prize15', icon: '💵', class: 'win-15', startAngle: 280, endAngle: 320, stopAngle: 300 },
    { name: '10 شيكل', key: 'prize10', icon: '💵', class: 'win-10', startAngle: 320, endAngle: 360, stopAngle: 340 }
];

// ===== عناصر DOM =====
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');
const resultDiv = document.getElementById('result');

// تهيئة الأحداث
document.addEventListener('DOMContentLoaded', function() {
    spinBtn.addEventListener('click', startSpin);
    updateStats();
});

// ===== دوال التحقق والرسائل (تم التعديل لإضافة اسم الموظف) =====
function validateInput() {
    const id = document.getElementById('playerId').value.trim();
    const phone = document.getElementById('playerPhone').value.trim();
    const employeeName = document.getElementById('employeeName').value.trim(); // === حقل جديد ===

    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('successMsg').style.display = 'none';

    if (!/^\d{9}$/.test(id)) { showError('يجب أن يكون رقم الهوية 9 أرقام فقط'); return false; }
    if (!/^05\d{8}$/.test(phone)) { showError('يجب أن يكون رقم الهاتف 10 أرقام ويبدأ بـ 05'); return false; }
    if (employeeName.length < 2) { showError('الرجاء إدخال اسم الموظف بشكل صحيح'); return false; } // === تحقق جديد ===
    if (gameData.playedIds.has(id)) { showError('هذا الرقم قد لعب مسبقاً'); return false; }

    return true;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMsg');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMsg');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

// ... (دالة createConfetti لا تحتاج لتعديل) ...
function createConfetti() {
    const colors = ['#27ae60','#3498db','#f1c40f','#e74c3c'];
    for (let i=0; i<80; i++){
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 1.5 + 's';
        document.body.appendChild(confetti);
        setTimeout(() => document.body.removeChild(confetti), 2200);
    }
}


// ===== وظيفة بدء الدوران (تم التعديل لإضافة اسم الموظف) =====
function startSpin() {
    if (!validateInput()) return;

    spinBtn.disabled = true;
    resultDiv.style.display = 'none';

    // 1. تحديد الجائزة الفائزة من الجوائز المتبقية (الاحتمالية)
    let availablePrizes = [];
    for (const prizeKey in gameData.prizes) {
        for (let i = 0; i < gameData.prizes[prizeKey]; i++) {
            availablePrizes.push(prizeKey);
        }
    }

    if (availablePrizes.length === 0) {
        showError('عذراً، لقد نفدت جميع الجوائز!');
        spinBtn.disabled = false;
        return;
    }

    const selectedPrizeKey = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
    const selectedPrizeName = gameData.prizeMap[selectedPrizeKey];

    // 2. توجيه العجلة لتقف عند القطاع الصحيح المرئي
    const visualSegment = segments.find(s => s.key === selectedPrizeKey);
    if (!visualSegment) { showError('خطأ داخلي: لم يتم العثور على قطاع مرئي للجائزة.'); spinBtn.disabled = false; return; }
    
    const baseRotations = 5 * 360;
    const stopAngle = 360 - visualSegment.stopAngle; 
    const totalRotation = baseRotations + stopAngle;
    const randomOffset = Math.floor(Math.random() * 30) - 15;
    const finalRotation = totalRotation + randomOffset;

    wheel.style.transition = 'none';
    wheel.style.transform = `rotate(5deg)`;

    setTimeout(() => {
        wheel.style.transition = 'transform 4s cubic-bezier(0.17,0.89,0.32,0.98)';
        wheel.style.transform = `rotate(${finalRotation}deg)`;
    }, 50);

    setTimeout(() => {
        // عرض النتيجة
        showActualResult(selectedPrizeName, visualSegment.class, visualSegment.icon);

        const id = document.getElementById('playerId').value.trim();
        const phone = document.getElementById('playerPhone').value.trim();
        const employeeName = document.getElementById('employeeName').value.trim(); // === جلب القيمة الجديدة ===
        const timestamp = getGregorianNow();

        gameData.playedIds.add(id);
        // === إرسال القيمة الجديدة ===
        sendToGoogleSheets(id, phone, selectedPrizeName, timestamp, employeeName);
        
        // خصم الجائزة
        gameData.prizes[selectedPrizeKey]--;
        createConfetti(); 

        updateStats();

        document.getElementById('playerId').value = '';
        document.getElementById('playerPhone').value = '';
        document.getElementById('employeeName').value = ''; // === تفريغ حقل اسم الموظف ===
        spinBtn.disabled = false;

    }, 4200);
}

// عرض النتيجة
function showActualResult(prizeName, segmentClass, icon) {
    resultDiv.innerHTML = `${icon} ${prizeName} ${icon}`;
    resultDiv.className = `result ${segmentClass}`;
    resultDiv.style.display = 'flex';
}

// ===== تحديث الإحصائيات (لم يتغير) =====
function updateStats() {
    document.getElementById('totalPlayers').textContent = gameData.playedIds.size;
    
    const totalPlayersElement = document.getElementById('totalPlayers');
    if (totalPlayersElement && totalPlayersElement.parentElement) {
        totalPlayersElement.parentElement.classList.add('highlight');
        setTimeout(() => totalPlayersElement.parentElement.classList.remove('highlight'), 1400);
    }
}

// ===== دالة الإرسال (تم التعديل لتضمين اسم الموظف) =====
function sendToGoogleSheets(id, phone, prize, timestamp, employeeName) {
    // === إضافة employeeName إلى كائن البيانات المرسل ===
    const data = { id, phone, prize, timestamp, employeeName }; 
    // ===============================================
    
    fetch(googleAppsScriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(() => {
        console.log('Data sent to Google Sheets successfully.');
        showSuccess('تم تسجيل فوزك بنجاح!');
    })
    .catch(error => {
        console.error('Error sending data to Google Sheets:', error);
        showError('حدث خطأ أثناء تسجيل البيانات، يرجى المحاولة مرة أخرى.');
    });
}

function getGregorianNow() {
    const d = new Date();
    const YYYY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}
