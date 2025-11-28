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
    // قائمة لربط اسم الجائزة في الكود باسمها الظاهر
    prizeMap: {
        prize10: '10 شيكل',
        prize15: '15 شيكل',
        prize20: '20 شيكل',
        prize25: '25 شيكل',
        prize30: '30 شيكل',
        prize35: '35 شيكل',
        prize40: '40 شيكل',
        prize45: '45 شيكل',
        prize50: '50 شيكل'
    }
};

// ===== رابط Google Apps Script URL (لم يتغير) =====
const googleAppsScriptURL = 'https://script.google.com/macros/s/AKfycbxZ7NtD5UqDnwiQzbqUNP4zpbWzA6NIGyBgzGiDGX_UK2xlZoHWNyKSaR6j_XFl0g/exec';

// ===== تعريف القطاعات (العرض المرئي) =====
// الكلاسات والألوان تعكس مجموعة من الجوائز لتبسيط العرض.
const segments = [
    { name: '💰 الكبرى', icon: '💰', class: 'win-50', startAngle: 0, endAngle: 72, stopAngle: 36, winnable: true },      
    { name: '💵 المميزة', icon: '💵', class: 'win-40', startAngle: 72, endAngle: 144, stopAngle: 108, winnable: true },   
    { name: '💸 الجيدة', icon: '💸', class: 'win-30', startAngle: 144, endAngle: 216, stopAngle: 180, winnable: true },    
    { name: '🎁 المتوسطة', icon: '🎁', class: 'win-20', startAngle: 216, endAngle: 288, stopAngle: 252, winnable: true },   
    { name: '🪙 الصغيرة', icon: '🪙', class: 'win-10', startAngle: 288, endAngle: 360, stopAngle: 324, winnable: true } 
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

// ===== دوال التحقق والرسائل =====
function validateInput() {
    const id = document.getElementById('playerId').value.trim();
    const phone = document.getElementById('playerPhone').value.trim();

    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('successMsg').style.display = 'none';

    if (!/^\d{9}$/.test(id)) { showError('يجب أن يكون رقم الهوية 9 أرقام فقط'); return false; }
    if (!/^05\d{8}$/.test(phone)) { showError('يجب أن يكون رقم الهاتف 10 أرقام ويبدأ بـ 05'); return false; }
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

// ===== مؤثر confetti =====
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

// ===== وظيفة بدء الدوران (المنطق المعدل) =====
function startSpin() {
    if (!validateInput()) return;

    spinBtn.disabled = true;
    resultDiv.style.display = 'none';

    // 1. تحديد الجائزة الفائزة من الجوائز المتبقية
    let availablePrizes = [];
    for (const prizeKey in gameData.prizes) {
        // نكرر المفتاح بعدد الجوائز المتبقية
        for (let i = 0; i < gameData.prizes[prizeKey]; i++) {
            availablePrizes.push(prizeKey);
        }
    }

    if (availablePrizes.length === 0) {
        showError('عذراً، لقد نفدت جميع الجوائز!');
        spinBtn.disabled = false;
        return;
    }

    // يتم اختيار الجائزة بناءً على عددها المتبقي (احتمالية أعلى للجوائز ذات الكمية الأكبر)
    const selectedPrizeKey = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
    const selectedPrizeName = gameData.prizeMap[selectedPrizeKey];

    // 2. توجيه العجلة لتقف عند قطاع يمثل هذه الجائزة (لغرض العرض المرئي)
    let visualSegment;
    // منطق توجيه تقريبي:
    if (['prize45', 'prize50'].includes(selectedPrizeKey)) {
        visualSegment = segments[0]; // الكبرى (50, 45)
    } else if (['prize35', 'prize40'].includes(selectedPrizeKey)) {
        visualSegment = segments[1]; // المميزة (40, 35)
    } else if (['prize25', 'prize30'].includes(selectedPrizeKey)) {
        visualSegment = segments[2]; // الجيدة (30, 25)
    } else if (['prize20'].includes(selectedPrizeKey)) {
        visualSegment = segments[3]; // المتوسطة (20)
    } else if (['prize10', 'prize15'].includes(selectedPrizeKey)) {
        visualSegment = segments[4]; // الصغيرة (15, 10)
    } else {
        // اختيار عشوائي إذا لم يتم التحديد
        visualSegment = segments[Math.floor(Math.random() * segments.length)];
    }
    
    // حساب زاوية الدوران لتقف عند القطاع المختار
    const baseRotations = 5 * 360;
    const stopAngle = 360 - visualSegment.stopAngle;
    const totalRotation = baseRotations + stopAngle;

    // إضافة تغيير طفيف عشوائي (+/- 10 درجات) لجعل الوقوف يبدو واقعياً داخل القطاع
    const randomOffset = Math.floor(Math.random() * 20) - 10;
    const finalRotation = totalRotation + randomOffset;

    wheel.style.transition = 'none';
    wheel.style.transform = `rotate(5deg)`;

    setTimeout(() => {
        wheel.style.transition = 'transform 4s cubic-bezier(0.17,0.89,0.32,0.98)';
        wheel.style.transform = `rotate(${finalRotation}deg)`;
    }, 50);

    setTimeout(() => {
        // عرض النتيجة الفعلية (اسم الجائزة من prizeMap)
        showActualResult(selectedPrizeName, visualSegment.class, visualSegment.icon);

        const id = document.getElementById('playerId').value.trim();
        const phone = document.getElementById('playerPhone').value.trim();
        const timestamp = getGregorianNow();

        gameData.playedIds.add(id);
        sendToGoogleSheets(id, phone, selectedPrizeName, timestamp);
        
        // خصم الجائزة
        gameData.prizes[selectedPrizeKey]--;
        createConfetti(); // تفعيل المؤثر لكل فوز

        updateStats();

        document.getElementById('playerId').value = '';
        document.getElementById('playerPhone').value = '';
        spinBtn.disabled = false;

    }, 4200);
}

// عرض النتيجة المعدلة لتعرض الجائزة الفعلية وليس اسم القطاع
function showActualResult(prizeName, segmentClass, icon) {
    // يمكننا استخدام أيقونة القطاع المرئي ولكن عرض اسم الجائزة الفعلي
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

// ===== دالة الإرسال (بدون تغيير) =====
function sendToGoogleSheets(id, phone, prize, timestamp) {
    const data = { id, phone, prize, timestamp };
    
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
