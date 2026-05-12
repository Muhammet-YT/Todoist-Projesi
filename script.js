/* ==========================================
   1. VERİ & STATE YÖNETİMİ (LOCALSTORAGE)
   ========================================== */
let state = {
    tasks: [],
    habits: [],
    categories: [
        { id: 'cat1', name: 'Okul', color: '#FF9F43', emoji: '🎓' },
        { id: 'cat2', name: 'İş', color: '#8E44AD', emoji: '💼' },
        { id: 'cat3', name: 'Kişisel', color: '#4F8CFF', emoji: '👤' },
        { id: 'cat4', name: 'Sağlık', color: '#2ECC71', emoji: '❤️' }
    ],
    stats: { completedTasks: 0, pomodoroSessions: 0 },
    theme: 'dark'
};

function getTodayStr() { 
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadData() {
    const saved = localStorage.getItem('proxima_app_data');
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch(e) { console.error("Veri yükleme hatası", e); }
    } else {
        // İlk açılışta kişiselleştirilmiş demo verileri yükle
        state.tasks = [
            { id: Date.now()+1, title: 'İstemci Taraflı Programlama Proje Teslimi', desc: 'JavaScript final projesi GitHub\'a yüklenecek.', category: 'Okul', priority: 'high', date: getTodayStr(), time: '23:59', recurrence: 'none', reminder: false, reminded: false, completed: false, completedDate: null },
            { id: Date.now()+2, title: 'Belediye Yazılım Stajı Başvurusu (20 Günlük)', desc: 'Gerekli evraklar toplanıp yazılım departmanına iletilecek.', category: 'İş', priority: 'high', date: getTodayStr(), time: '14:00', recurrence: 'none', reminder: false, reminded: false, completed: false, completedDate: null },
            { id: Date.now()+3, title: 'C# Eczane Otomasyonu CSV Entegrasyonu', desc: 'Windows Forms uygulamasında stok mantığı kodlanacak.', category: 'Kişisel', priority: 'med', date: getTodayStr(), time: '19:00', recurrence: 'none', reminder: false, reminded: false, completed: false, completedDate: null },
            { id: Date.now()+4, title: 'YouTube Shorts Karakter Üretimi', desc: 'Pixar tarzı konuşan sebzeler (domates, mısır) için prompt yazılacak.', category: 'Kişisel', priority: 'low', date: getTodayStr(), time: '', recurrence: 'none', reminder: false, reminded: false, completed: false, completedDate: null }
        ];
        state.habits = [
            { id: Date.now()+10, name: 'C# / JS Kodlama Pratiği', emoji: '💻', streak: 12, maxStreak: 12, totalDays: 15, lastDone: '', history: [] },
            { id: Date.now()+11, name: 'Suno & Kling AI ile Üretim', emoji: '🎵', streak: 5, maxStreak: 8, totalDays: 20, lastDone: '', history: [] }
        ];
        saveData();
    }
    applyTheme();
    updateCategoryDropdowns();
    checkRecurringTasks(); 
}

function saveData() {
    localStorage.setItem('proxima_app_data', JSON.stringify(state));
    updateDashboardStats();
}

function getCategoryDetails(name) {
    return state.categories.find(c => c.name === name) || { color: '#6b7280', emoji: '📌' };
}


/* ==========================================
   2. YEDEKLEME (EXPORT / IMPORT)
   ========================================== */
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "Proxima_Backup_" + getTodayStr() + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast("Yedekleme dosyası indirildi!");
    closeModal('settingsModal');
}

function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (!file) return alert("Lütfen bir JSON yedek dosyası seçin.");

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if (importedState && importedState.tasks && importedState.categories) {
                state = importedState;
                saveData();
                showToast("Veriler başarıyla yüklendi. Sayfa yenileniyor...");
                setTimeout(() => location.reload(), 1500);
            } else { alert("Geçersiz yedek dosyası formatı!"); }
        } catch (error) { alert("Dosya okuma hatası. Lütfen doğru bir JSON dosyası seçin."); }
    };
    reader.readAsText(file);
}


/* ==========================================
   3. ARAYÜZ (UI) & BAŞLATMA
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderTasks();
    renderHabits();
    renderCalendar();
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dash-date').innerText = new Date().toLocaleDateString('tr-TR', options);

    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
    setInterval(checkReminders, 10000);
});

function testNotification() {
    showToast("🔔 Ses ve Bildirim Testi Başarılı!", "info");
    try { new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg').play().catch(()=>{}); } catch(e) {}
    if (Notification.permission === "granted") {
        new Notification("Test Başarılı", { body: "Proxima bildirimleri aktif." });
    } else { Notification.requestPermission(); }
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if(item.querySelector('.fa-tags') || item.querySelector('.fa-gear')) return; 
        
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        
        item.classList.add('active');
        const target = item.getAttribute('data-target');
        document.getElementById(target).classList.add('active');
        
        if(window.innerWidth <= 768) toggleMobileMenu();
        if(target === 'calendar') renderCalendar();
    });
});

function toggleTheme() { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); saveData(); }
function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const icon = state.theme === 'dark' ? 'fa-sun' : 'fa-moon';
    const themeBtn = document.querySelector('.theme-toggle i');
    if(themeBtn) themeBtn.className = `fa-solid ${icon}`;
}

function toggleMobileMenu() { document.getElementById('sidebar').classList.toggle('open'); }

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check" style="color:var(--success); font-size:20px;"></i>' : '<i class="fa-solid fa-bell" style="color:var(--primary); font-size:20px;"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('hiding'); }, 3700);
    setTimeout(() => { toast.remove(); }, 4000);
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { 
    document.getElementById(id).classList.remove('active'); 
    if(id === 'taskModal') document.getElementById('taskForm').reset();
    if(id === 'habitModal') document.getElementById('habitForm').reset();
    if(id === 'categoryModal') document.getElementById('categoryForm').reset();
}


/* ==========================================
   4. KATEGORİ SİSTEMİ
   ========================================== */
function updateCategoryDropdowns() {
    const taskCatSelect = document.getElementById('taskCategory');
    const filterCatSelect = document.getElementById('filterCategory');
    if(taskCatSelect) taskCatSelect.innerHTML = '';
    if(filterCatSelect) filterCatSelect.innerHTML = '<option value="all">Tüm Kategoriler</option>';
    
    state.categories.forEach(cat => {
        const optionHTML = `<option value="${cat.name}">${cat.emoji} ${cat.name}</option>`;
        if(taskCatSelect) taskCatSelect.innerHTML += optionHTML;
        if(filterCatSelect) filterCatSelect.innerHTML += optionHTML;
    });
    renderCategoryList();
}

function handleCategorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('catName').value.trim();
    const emoji = document.getElementById('catEmoji').value;
    const color = document.getElementById('catColor').value;

    const existingIndex = state.categories.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    if(existingIndex > -1) {
        state.categories[existingIndex].emoji = emoji; state.categories[existingIndex].color = color;
        showToast('Kategori güncellendi.');
    } else {
        state.categories.push({ id: 'cat_'+Date.now(), name, color, emoji });
        showToast('Yeni kategori eklendi.');
    }
    saveData(); updateCategoryDropdowns(); renderTasks(); renderCalendar();
    document.getElementById('categoryForm').reset();
}

function deleteCategory(name) {
    if(state.categories.length <= 1) return showToast('En az 1 kategori bırakmalısın!', 'error');
    if(confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) {
        state.categories = state.categories.filter(c => c.name !== name);
        state.tasks.forEach(t => { if(t.category === name) t.category = state.categories[0].name; });
        saveData(); updateCategoryDropdowns(); renderTasks(); renderCalendar();
    }
}

function renderCategoryList() {
    const container = document.getElementById('categoryListContainer');
    if(!container) return;
    container.innerHTML = state.categories.map(cat => `
        <div class="tag" style="background:${cat.color}20; color:${cat.color}; border:1px solid ${cat.color}50; padding:8px 12px; font-size:14px; border-radius: 8px;">
            ${cat.emoji} ${cat.name} <i class="fa-solid fa-xmark" style="margin-left:12px; cursor:pointer; color: var(--text-muted);" onclick="deleteCategory('${cat.name}')"></i>
        </div>
    `).join('');
}


/* ==========================================
   5. GÖREVLER, SÜRÜKLE-BIRAK & HATIRLATICI
   ========================================== */
let draggedTaskId = null;

function checkReminders() {
    const now = new Date();
    const todayStr = getTodayStr(); 
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMin}`;

    let dataUpdated = false;

    state.tasks.forEach(task => {
        if (!task.completed && task.reminder && !task.reminded && task.reminderDate && task.reminderTime) {
            if (task.reminderDate < todayStr || (task.reminderDate === todayStr && task.reminderTime <= currentTime)) {
                showToast(`🔔 HATIRLATMA: ${task.title}`, 'info');
                try { new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg').play().catch(()=>{}); } catch(e) {}
                if (Notification.permission === "granted") {
                    new Notification("Proxima Hatırlatıcı", { body: `Vakit Geldi: ${task.title}` });
                }
                task.reminded = true;
                dataUpdated = true;
            }
        }
    });
    if (dataUpdated) { saveData(); renderTasks(); }
}

function toggleReminderInputs() {
    const isChecked = document.getElementById('taskReminder').checked;
    const div = document.getElementById('reminderInputsDiv');
    if (isChecked) {
        div.style.display = 'flex';
        document.getElementById('reminderDate').value = document.getElementById('taskDate').value || getTodayStr();
    } else {
        div.style.display = 'none';
        document.getElementById('reminderDate').value = '';
        document.getElementById('reminderTime').value = '';
    }
}

function checkRecurringTasks() {
    const today = getTodayStr();
    let isAdded = false;

    state.tasks.forEach(task => {
        if(task.recurrence !== 'none' && task.completed && task.date < today) {
            let newDate = new Date(task.date);
            if(task.recurrence === 'daily') newDate.setDate(newDate.getDate() + 1);
            if(task.recurrence === 'weekly') newDate.setDate(newDate.getDate() + 7);
            
            const newDateStr = newDate.toLocaleDateString('en-CA');
            const exists = state.tasks.find(t => t.title === task.title && t.date === newDateStr);
            if(!exists) {
                state.tasks.push({ 
                    ...task, id: Date.now() + Math.floor(Math.random()*1000), 
                    date: newDateStr, completed: false, completedDate: null, reminded: false, 
                    reminderDate: task.reminder ? newDateStr : ''
                });
                isAdded = true;
            }
        }
    });
    if(isAdded) saveData();
}

function openTaskModal(taskId = null) {
    const titleEl = document.getElementById('taskModalTitle');
    const form = document.getElementById('taskForm');
    form.reset();
    
    if(taskId) {
        titleEl.innerText = "Görevi Düzenle";
        const task = state.tasks.find(t => t.id === taskId);
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDesc').value = task.desc || '';
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskTime').value = task.time || '';
        document.getElementById('taskRecurrence').value = task.recurrence || 'none';
        document.getElementById('taskReminder').checked = task.reminder || false;
        document.getElementById('reminderDate').value = task.reminderDate || '';
        document.getElementById('reminderTime').value = task.reminderTime || '';
        toggleReminderInputs();
    } else {
        titleEl.innerText = "Yeni Görev";
        document.getElementById('taskId').value = '';
        document.getElementById('taskDate').value = getTodayStr();
        document.getElementById('taskReminder').checked = false;
        toggleReminderInputs();
    }
    openModal('taskModal');
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('taskId').value;
    const hasReminder = document.getElementById('taskReminder').checked;
    const rDate = document.getElementById('reminderDate').value;
    const rTime = document.getElementById('reminderTime').value;

    if(hasReminder && (!rDate || !rTime)) return alert("Özel hatırlatıcı kurabilmek için hem TARİH hem SAAT belirtmelisiniz.");

    const taskData = {
        title: document.getElementById('taskTitle').value,
        desc: document.getElementById('taskDesc').value,
        category: document.getElementById('taskCategory').value,
        priority: document.getElementById('taskPriority').value,
        date: document.getElementById('taskDate').value,
        time: document.getElementById('taskTime').value,
        recurrence: document.getElementById('taskRecurrence').value,
        reminder: hasReminder, reminderDate: hasReminder ? rDate : '', reminderTime: hasReminder ? rTime : '', reminded: false
    };

    if(id) {
        const idx = state.tasks.findIndex(t => t.id == id);
        state.tasks[idx] = { ...state.tasks[idx], ...taskData };
        showToast('Görev güncellendi.');
    } else {
        state.tasks.push({ ...taskData, id: Date.now(), completed: false, completedDate: null });
        showToast('Yeni görev eklendi.');
    }

    saveData(); renderTasks(); renderCalendar(); closeModal('taskModal');
    if(window.pipWindow) renderMiniTasks();
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if(task) {
        task.completed = !task.completed;
        if(task.completed) {
            state.stats.completedTasks++;
            task.completedDate = getTodayStr();
        } else {
            if(state.stats.completedTasks > 0) state.stats.completedTasks--;
            task.completedDate = null;
        }
        saveData(); renderTasks(); checkRecurringTasks(); renderCalendar();
        if(window.pipWindow) renderMiniTasks();
    }
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveData(); renderTasks(); renderCalendar(); showToast('Görev silindi.');
    if(window.pipWindow) renderMiniTasks();
}

function filterTasks() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const catFilter = document.getElementById('filterCategory')?.value || 'all';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';

    const filtered = state.tasks.filter(t => {
        const matchQ = t.title.toLowerCase().includes(query) || (t.desc && t.desc.toLowerCase().includes(query));
        const matchC = catFilter === 'all' || t.category === catFilter;
        const matchS = statusFilter === 'all' || (statusFilter === 'completed' && t.completed) || (statusFilter === 'pending' && !t.completed);
        return matchQ && matchC && matchS;
    }).sort((a,b) => new Date(a.date) - new Date(b.date));

    renderTaskListItems(filtered);
}

function renderTasks() { filterTasks(); }

function renderTaskListItems(filteredArray) {
    const mainList = document.getElementById('main-task-list');
    const dashList = document.getElementById('dash-task-list');
    const today = getTodayStr();
    
    if(mainList) mainList.innerHTML = '';
    if(dashList) dashList.innerHTML = '';

    filteredArray.forEach(task => {
        const cat = getCategoryDetails(task.category);
        const prioLabel = task.priority === 'high' ? 'Yüksek' : task.priority === 'med' ? 'Orta' : 'Düşük';
        const isReminderActive = task.reminder && !task.reminded && !task.completed;
        
        const html = `
            <div class="task-item glass ${task.completed ? 'completed' : ''}" draggable="true" ondragstart="drag(event, ${task.id})" ondragend="dragEnd(event)">
                <div class="task-checkbox" onclick="toggleTask(${task.id})"></div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.desc ? `<div class="task-desc">${task.desc}</div>` : ''}
                    <div class="task-meta">
                        <span class="tag" style="background:${cat.color}20; color:${cat.color}">${cat.emoji} ${task.category}</span>
                        <span class="tag priority-${task.priority}">${prioLabel}</span>
                        <span class="tag time-tag"><i class="fa-regular fa-calendar"></i> Bitiş: ${task.date} ${task.time ? '| ' + task.time : ''}</span>
                        ${isReminderActive ? `<span class="tag reminder-tag" title="Hatırlatıcı: ${task.reminderTime}"><i class="fa-solid fa-bell"></i> ${task.reminderTime}</span>` : ''}
                        ${task.recurrence !== 'none' ? `<span class="tag recurring-tag"><i class="fa-solid fa-rotate"></i></span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-icon" onclick="openTaskModal(${task.id})" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon" onclick="deleteTask(${task.id})" title="Sil"><i class="fa-solid fa-trash" style="color:var(--danger)"></i></button>
                </div>
            </div>
        `;
        
        if(mainList) mainList.innerHTML += html;
        if(dashList && (task.date === today || (!task.completed && task.date < today))) dashList.innerHTML += html;
    });

    if(mainList && mainList.innerHTML === '') mainList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-box-open"></i><p>Görev bulunamadı.</p></div>`;
    if(dashList && dashList.innerHTML === '') dashList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-mug-hot"></i><p>Bugün için bekleyen işin yok!</p></div>`;
}

function drag(ev, id) { draggedTaskId = id; ev.target.classList.add('dragging'); }
function dragEnd(ev) { ev.target.classList.remove('dragging'); draggedTaskId = null; document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('drag-over')); }
function allowDrop(ev) { ev.preventDefault(); ev.currentTarget.classList.add('drag-over'); }
function dragLeave(ev) { ev.currentTarget.classList.remove('drag-over'); }
function drop(ev, dateStr) {
    ev.preventDefault();
    ev.currentTarget.classList.remove('drag-over');
    if(draggedTaskId) {
        const task = state.tasks.find(t => t.id == draggedTaskId);
        if(task && task.date !== dateStr) {
            task.date = dateStr; task.reminded = false;
            saveData(); renderTasks(); renderCalendar(); showToast(`Görev tarihi güncellendi.`);
        }
    }
}


/* ==========================================
   6. HIZLI GÖREVLER (MİNYATÜR MASAÜSTÜ MODU)
   ========================================== */

async function toggleMiniTasks() {
    const widget = document.getElementById('miniTasksWidget');

    if (!('documentPictureInPicture' in window)) {
        alert("Tarayıcınız 'Masaüstü Widget' özelliğini desteklemiyor. Lütfen Chrome/Edge güncelleyin.");
        return;
    }

    if (window.pipWindow) {
        window.pipWindow.close();
        return;
    }

    try {
        const pipWindow = await documentPictureInPicture.requestWindow({ width: 340, height: 480 });
        window.pipWindow = pipWindow;

        // Stil kopyalama (Ana sayfadaki tüm görselliği küçük pencereye aktarır)
        [...document.styleSheets].forEach((styleSheet) => {
            try {
                const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                const style = document.createElement('style');
                style.textContent = cssRules;
                pipWindow.document.head.appendChild(style);
            } catch (e) {
                const link = document.createElement('link');
                link.rel = 'stylesheet'; link.href = styleSheet.href;
                pipWindow.document.head.appendChild(link);
            }
        });
        
        // FontAwesome kütüphanesini aktar
        pipWindow.document.head.innerHTML += `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">`;
        
        pipWindow.document.body.setAttribute('data-theme', state.theme);
        pipWindow.document.body.style.backgroundColor = 'var(--bg-color)';
        pipWindow.document.body.style.overflow = 'hidden';
        
        widget.style.display = 'flex';
        widget.style.width = '100vw';
        widget.style.height = '100vh';
        widget.style.borderRadius = '0';
        
        pipWindow.document.body.appendChild(widget);
        renderMiniTasks();
        
        // Input odaklanma fixi
        setTimeout(() => {
            const pipInput = pipWindow.document.getElementById('quickTaskInput');
            if(pipInput) pipInput.focus();
        }, 300);

        // Widget penceresi kapandığında elemanı ana sayfaya geri al
        pipWindow.addEventListener('pagehide', () => {
            widget.style.display = 'none';
            document.body.appendChild(widget);
            window.pipWindow = null;
            renderTasks(); // Ana sayfayı tazele
        });

    } catch (error) { console.error("PiP Hatası:", error); }
}

function renderMiniTasks() {
    // Aktif pencerenin document nesnesini belirle
    const targetDoc = window.pipWindow ? window.pipWindow.document : document;
    const list = targetDoc.getElementById('mini-tasks-list');
    if(!list) return;

    const tasks = [...state.tasks].sort((a,b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
    list.innerHTML = '';
    
    tasks.forEach(task => {
        const item = targetDoc.createElement('div');
        item.className = `mini-task-item ${task.completed ? 'completed' : ''}`;
        
        item.innerHTML = `
            <div class="mini-task-checkbox" onclick="window.toggleMiniTask(${task.id})"></div>
            <div class="mini-task-title" onclick="this.classList.toggle('expanded')" title="Tamamını görmek için tıklayın">
                ${task.title}
            </div>
            <i class="fa-solid fa-chevron-right" style="font-size: 10px; opacity: 0.3;"></i>
        `;
        list.appendChild(item);
    });

    if(tasks.length === 0) list.innerHTML = `<div style="text-align:center; padding: 40px 10px; color:var(--text-muted);">Görev listeniz boş.</div>`;
}

// PENCERELER ARASI FONKSİYON BAĞLANTILARI (Fix)
window.toggleMiniTask = function(id) {
    toggleTask(id); // Ana logic
    renderMiniTasks(); // Mini arayüzü güncelle
};

window.handleQuickTaskAdd = function(e) {
    if (e.key === 'Enter') {
        const targetDoc = window.pipWindow ? window.pipWindow.document : document;
        const input = targetDoc.getElementById('quickTaskInput');
        const title = input.value.trim();
        
        if (title) {
            const firstCategory = state.categories.length > 0 ? state.categories[0].name : 'Kişisel';
            state.tasks.push({
                id: Date.now(), title: title, desc: '', category: firstCategory, priority: 'med',
                date: getTodayStr(), time: '', recurrence: 'none', reminder: false, reminderDate: '', reminderTime: '',
                reminded: false, completed: false, completedDate: null
            });
            
            saveData();
            renderTasks();
            renderCalendar();
            renderMiniTasks();
            input.value = '';
        }
    }
};
/* ==========================================
   7. TAKVİM
   ========================================== */
let currentCalDate = new Date();
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    grid.innerHTML = `<div class="day-name">Pzt</div><div class="day-name">Sal</div><div class="day-name">Çar</div><div class="day-name">Per</div><div class="day-name">Cum</div><div class="day-name">Cmt</div><div class="day-name">Paz</div>`;
    
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    document.getElementById('currentMonthYear').innerText = `${monthNames[month]} ${year}`;

    let firstDayIndex = new Date(year, month, 1).getDay();
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const todayStr = getTodayStr();

    for(let i = offset; i > 0; i--) { grid.innerHTML += `<div class="calendar-day other-month"><div class="date-number">${prevMonthDays - i + 1}</div></div>`; }

    for(let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const isToday = dateStr === todayStr;
        
        let dayTasks = state.tasks.filter(t => t.date === dateStr).sort((a,b) => (a.time || "24:00").localeCompare(b.time || "24:00"));
        let taskHTML = dayTasks.map(t => {
            const cat = getCategoryDetails(t.category);
            const bellIcon = t.reminder && !t.completed && !t.reminded ? `<i class="fa-solid fa-bell" style="font-size: 8px; margin-right:2px; color:#8E44AD;"></i>` : '';
            return `<div class="cal-task" style="background:${cat.color}${t.completed ? '50' : ''}; text-decoration:${t.completed ? 'line-through' : 'none'}" onclick="event.stopPropagation(); openTaskModal(${t.id})" title="${t.title}">${bellIcon}${t.time ? `<b>${t.time}</b>` : cat.emoji} ${t.title}</div>`;
        }).join('');

        grid.innerHTML += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="document.getElementById('taskDate').value='${dateStr}'; openModal('taskModal');" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event, '${dateStr}')"><div class="date-number">${i}</div>${taskHTML}</div>`;
    }

    const totalCells = offset + daysInMonth;
    const remaining = (Math.ceil(totalCells / 7) * 7) - totalCells;
    for(let i = 1; i <= remaining; i++) { grid.innerHTML += `<div class="calendar-day other-month"><div class="date-number">${i}</div></div>`; }
}
function changeMonth(dir) { currentCalDate.setMonth(currentCalDate.getMonth() + dir); renderCalendar(); }


/* ==========================================
   8. ALIŞKANLIKLAR
   ========================================== */
function handleHabitSubmit(e) {
    e.preventDefault();
    state.habits.push({ id: Date.now(), name: document.getElementById('habitName').value, emoji: document.getElementById('habitEmoji').value, streak: 0, maxStreak: 0, totalDays: 0, lastDone: '', history: [] });
    saveData(); renderHabits(); closeModal('habitModal'); showToast('Alışkanlık başlatıldı!');
}
function checkHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    const today = getTodayStr();
    if(habit.lastDone !== today) {
        let yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
        if(habit.lastDone === yesterday.toLocaleDateString('en-CA')) habit.streak++; else habit.streak = 1;
        if(habit.streak > habit.maxStreak) habit.maxStreak = habit.streak;
        habit.totalDays++; habit.lastDone = today; habit.history.push(today);
        saveData(); renderHabits(); showToast(`${habit.name} serisi güncellendi! 🔥`);
    }
}
function deleteHabit(id) { if(confirm('Emin misiniz?')) { state.habits = state.habits.filter(h => h.id !== id); saveData(); renderHabits(); } }
function renderHabits() {
    const grid = document.getElementById('habit-grid'); const dashList = document.getElementById('dash-habit-list');
    const today = getTodayStr();
    if(grid) grid.innerHTML = ''; if(dashList) dashList.innerHTML = '';
    state.habits.forEach(habit => {
        const isDoneToday = habit.lastDone === today;
        if(grid) grid.innerHTML += `<div class="habit-card glass"><div style="position:absolute; top:16px; right:16px; cursor:pointer;" onclick="deleteHabit(${habit.id})"><i class="fa-solid fa-trash hover-danger"></i></div><div class="habit-header"><div class="habit-icon">${habit.emoji}</div><div class="habit-info"><h3>${habit.name}</h3><p>Son: ${habit.lastDone || 'Hiç'}</p></div></div><div class="streak-badge"><i class="fa-solid fa-fire"></i> ${habit.streak} Gün</div><div class="habit-stats"><div><span style="font-size:11px">Toplam</span><strong>${habit.totalDays || 0}</strong></div><div><span style="font-size:11px">En İyi</span><strong>${habit.maxStreak || 0}</strong></div></div><button class="habit-btn ${isDoneToday ? 'done' : ''}" onclick="checkHabit(${habit.id})" ${isDoneToday ? 'disabled' : ''}>${isDoneToday ? 'Tamamlandı' : 'Bugün Yaptım'}</button></div>`;
        if(dashList) dashList.innerHTML += `<div class="habit-compact-item"><div style="display:flex; align-items:center; gap:12px; font-weight:500;"><span style="font-size:24px;">${habit.emoji}</span><span>${habit.name}</span></div><div style="display:flex; align-items:center; gap:16px;"><span style="color:var(--warning); font-weight:700;"><i class="fa-solid fa-fire"></i> ${habit.streak}</span>${isDoneToday ? '<i class="fa-solid fa-circle-check" style="color:var(--success); font-size:24px;"></i>' : `<button class="btn-icon" style="background:var(--success); color:white; padding:6px 12px; border-radius:8px;" onclick="checkHabit(${habit.id})">Yap</button>`}</div></div>`;
    });
    if(grid && grid.innerHTML === '') grid.innerHTML = '<div class="empty-state w-full" style="grid-column: 1/-1"><p>Takip edilen bir alışkanlık yok.</p></div>';
}

/* ==========================================
   9. POMODORO (ANTI-DRIFT)
   ========================================== */
let pomoTimer = null; 
let targetTime = 0; 
let initialDuration = 25 * 60; 
let isRunning = false;

function toggleCustomTimer() { const div = document.getElementById('customTimerDiv'); div.style.display = div.style.display === 'none' ? 'flex' : 'none'; }

function updateTimerDisplay(secondsLeft) {
    if(secondsLeft < 0) secondsLeft = 0;
    const m = Math.floor(secondsLeft / 60); const s = secondsLeft % 60;
    document.getElementById('time-display').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    
    if(isRunning) document.title = `(${m}:${s.toString().padStart(2,'0')}) Odaklan!`; else document.title = "Proxima";
    
    const percent = ((initialDuration - secondsLeft) / initialDuration) * 100;
    const circle = document.getElementById('timerCircle');
    if(circle) {
        const typeText = document.getElementById('timer-type').innerText;
        const color = typeText.includes('MOLA') ? 'rgba(46, 213, 115, 0.4)' : 'rgba(79, 140, 255, 0.4)';
        circle.style.boxShadow = `inset 0 -${percent * 3.2}px 0 0 ${color}, 0 0 40px rgba(0,0,0,0.1)`;
    }
}

function setTimer(minutes, typeName, btnElement) {
    clearInterval(pomoTimer); isRunning = false; 
    document.getElementById('startTimerBtn').innerHTML = '<i class="fa-solid fa-play"></i> Başlat'; 
    initialDuration = minutes * 60; targetTime = Date.now() + (initialDuration * 1000); 
    document.getElementById('timer-type').innerText = typeName.toUpperCase(); 
    document.querySelectorAll('.btn-timer-opt').forEach(b => b.classList.remove('active')); 
    if(btnElement) btnElement.classList.add('active'); 
    updateTimerDisplay(initialDuration); 
}

function setCustomTimer() { 
    const m = parseInt(document.getElementById('customMin').value) || 0; 
    const s = parseInt(document.getElementById('customSec').value) || 0; 
    if(m===0 && s===0) return; 
    setTimer(m + (s/60), 'ÖZEL SÜRE', null); 
    document.getElementById('customTimerDiv').style.display = 'none'; 
}

function toggleTimer() {
    const btn = document.getElementById('startTimerBtn');
    if(isRunning) { 
        clearInterval(pomoTimer); 
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Devam Et'; 
        let left = Math.round((targetTime - Date.now()) / 1000);
        initialDuration = left > 0 ? left : 0;
    } else {
        targetTime = Date.now() + (initialDuration * 1000);
        pomoTimer = setInterval(() => {
            let left = Math.round((targetTime - Date.now()) / 1000);
            updateTimerDisplay(left);
            
            if(left <= 0) {
                clearInterval(pomoTimer);
                if(document.getElementById('timer-type').innerText === 'POMODORO') { state.stats.pomodoroSessions++; saveData(); }
                showToast('Zaman doldu! Harika.', 'info');
                try { new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play(); } catch(e) {}
                resetTimer();
            }
        }, 1000);
        btn.innerHTML = '<i class="fa-solid fa-pause"></i> Duraklat';
    }
    isRunning = !isRunning;
}

function resetTimer() { 
    clearInterval(pomoTimer); isRunning = false; 
    document.getElementById('startTimerBtn').innerHTML = '<i class="fa-solid fa-play"></i> Başlat'; 
    updateTimerDisplay(initialDuration); 
}

/* ==========================================
   10. İSTATİSTİKLER VE GRAFİK (CHART)
   ========================================== */
function updateDashboardStats() {
    const pendingTasks = state.tasks.filter(t => !t.completed).length;
    
    if(document.getElementById('stat-completed')) document.getElementById('stat-completed').innerText = state.stats.completedTasks;
    if(document.getElementById('stat-pending')) document.getElementById('stat-pending').innerText = pendingTasks;
    if(document.getElementById('stat-pomo')) document.getElementById('stat-pomo').innerText = state.stats.pomodoroSessions;
    
    renderProductivityChart();
}

function renderProductivityChart() {
    const chartDiv = document.getElementById('weekly-chart');
    if(!chartDiv) return;
    
    chartDiv.innerHTML = '';
    const daysArr = [];
    const counts = [];
    
    for(let i=6; i>=0; i--) {
        let d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA');
        daysArr.push({ str: dateStr, label: d.toLocaleDateString('tr-TR', {weekday:'short'}) });
        const count = state.tasks.filter(t => t.completed && t.completedDate === dateStr).length;
        counts.push(count);
    }
    
    const maxCount = Math.max(...counts, 1);
    
    counts.forEach((c, index) => {
        let height = (c / maxCount) * 90;
        if (c === 0) height = 5; 
        
        chartDiv.innerHTML += `
            <div class="chart-col">
                <div class="chart-bar" style="height: ${height}%;" data-val="${c}"></div>
                <div class="chart-label">${daysArr[index].label}</div>
            </div>
        `;
    });
}