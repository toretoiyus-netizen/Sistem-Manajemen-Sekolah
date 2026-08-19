// ========================
// To-Do List App Script
// ========================

// Local Storage Key
const STORAGE_KEY = 'todoList';
const SORT_KEY = 'todoListSort';

// DOM Elements
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const categorySelect = document.getElementById('categorySelect');
const todoContainer = document.getElementById('todoContainer');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortBtn = document.getElementById('sortBtn');
const sortModal = document.getElementById('sortModal');
const editModal = document.getElementById('editModal');
const clearCompleted = document.getElementById('clearCompleted');

// Stats Elements
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const remainingTasksEl = document.getElementById('remainingTasks');

// State
let tasks = [];
let currentFilter = 'all';
let currentSort = 'date';
let editingTaskId = null;

// ========================
// Initialization
// ========================

window.addEventListener('load', () => {
    loadTasksFromStorage();
    renderTasks();
    updateStats();
});

// ========================
// Event Listeners
// ========================

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

filterBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        e.target.closest('.filter-btn').classList.add('active');
        currentFilter = e.target.closest('.filter-btn').dataset.filter;
        renderTasks();
    });
});

sortBtn.addEventListener('click', () => {
    sortModal.classList.remove('hidden');
});

document.getElementById('sortApply').addEventListener('click', () => {
    const selected = document.querySelector('input[name="sort"]:checked');
    currentSort = selected.value;
    saveSort();
    renderTasks();
    sortModal.classList.add('hidden');
});

clearCompleted.addEventListener('click', clearCompletedTasks);

// Modal Close Buttons
document.querySelectorAll('.close-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.add('hidden');
    });
});

// Close modals on background click
[sortModal, editModal].forEach((modal) => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

// Edit Modal Buttons
document.getElementById('editCancel').addEventListener('click', () => {
    editModal.classList.add('hidden');
    editingTaskId = null;
});

document.getElementById('editSave').addEventListener('click', saveEditedTask);

// ========================
// Task Functions
// ========================

function addTask() {
    const text = taskInput.value.trim();
    const category = categorySelect.value;

    if (text === '') {
        alert('Silakan masukkan tugas terlebih dahulu!');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: text,
        category: category,
        priority: 'medium',
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasksToStorage();
    renderTasks();
    updateStats();

    // Clear input
    taskInput.value = '';
    taskInput.focus();
}

function deleteTask(id) {
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
        tasks = tasks.filter((task) => task.id !== id);
        saveTasksToStorage();
        renderTasks();
        updateStats();
    }
}

function toggleTaskComplete(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage();
        renderTasks();
        updateStats();
    }
}

function openEditModal(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    editingTaskId = id;
    document.getElementById('editTaskInput').value = task.text;
    document.getElementById('editPriority').value = task.priority;
    document.getElementById('editCategory').value = task.category;

    editModal.classList.remove('hidden');
}

function saveEditedTask() {
    const task = tasks.find((t) => t.id === editingTaskId);
    if (!task) return;

    task.text = document.getElementById('editTaskInput').value.trim();
    task.priority = document.getElementById('editPriority').value;
    task.category = document.getElementById('editCategory').value;

    if (task.text === '') {
        alert('Tugas tidak boleh kosong!');
        return;
    }

    saveTasksToStorage();
    renderTasks();
    updateStats();
    editModal.classList.add('hidden');
    editingTaskId = null;
}

function clearCompletedTasks() {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === 0) {
        alert('Tidak ada tugas yang selesai!');
        return;
    }

    if (confirm(`Hapus ${completedCount} tugas yang sudah selesai?`)) {
        tasks = tasks.filter((t) => !t.completed);
        saveTasksToStorage();
        renderTasks();
        updateStats();
    }
}

// ========================
// Render Functions
// ========================

function renderTasks() {
    // Filter tasks
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter((t) => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter((t) => t.completed);
    }

    // Sort tasks
    filteredTasks = sortTasks([...filteredTasks]);

    // Render
    if (filteredTasks.length === 0) {
        todoContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Tidak ada tugas</p>
                <small>Tambahkan tugas baru untuk memulai</small>
            </div>
        `;
        return;
    }

    todoContainer.innerHTML = filteredTasks
        .map((task) => createTaskElement(task))
        .join('');

    // Add event listeners
    document.querySelectorAll('.todo-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', (e) => {
            toggleTaskComplete(parseInt(e.target.dataset.id));
        });
    });

    document.querySelectorAll('.edit-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            openEditModal(parseInt(e.target.dataset.id));
        });
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            deleteTask(parseInt(e.target.dataset.id));
        });
    });
}

function createTaskElement(task) {
    const date = new Date(task.createdAt);
    const dateStr = date.toLocaleDateString('id-ID', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const categoryEmoji = getCategoryEmoji(task.category);
    const categoryLabel = getCategoryLabel(task.category);

    return `
        <div class="todo-item ${task.completed ? 'completed' : ''}">
            <div class="priority-badge ${task.priority}"></div>
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                data-id="${task.id}"
                ${task.completed ? 'checked' : ''}
            >
            <div class="todo-content">
                <div class="todo-header">
                    <span class="todo-text">${escapeHtml(task.text)}</span>
                    <span class="todo-category">${categoryEmoji} ${categoryLabel}</span>
                    <span class="todo-priority ${task.priority}">${getPriorityLabel(task.priority)}</span>
                </div>
                <div class="todo-date">
                    <i class="fas fa-calendar-alt"></i> ${dateStr}
                </div>
            </div>
            <div class="todo-actions">
                <button class="action-btn edit-btn" data-id="${task.id}" title="Edit tugas">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${task.id}" title="Hapus tugas">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// ========================
// Sort Functions
// ========================

function sortTasks(tasksToSort) {
    switch (currentSort) {
        case 'date':
            return tasksToSort.sort(
                (a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
            );
        case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return tasksToSort.sort(
                (a, b) =>
                    priorityOrder[a.priority] - priorityOrder[b.priority]
            );
        case 'alpha':
            return tasksToSort.sort((a, b) =>
                a.text.localeCompare(b.text)
            );
        case 'category':
            return tasksToSort.sort((a, b) =>
                a.category.localeCompare(b.category)
            );
        default:
            return tasksToSort;
    }
}

// ========================
// Stats Functions
// ========================

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const remaining = total - completed;

    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    remainingTasksEl.textContent = remaining;
}

// ========================
// Local Storage Functions
// ========================

function saveTasksToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasksFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];
}

function saveSort() {
    localStorage.setItem(SORT_KEY, currentSort);
}

function loadSort() {
    const stored = localStorage.getItem(SORT_KEY);
    currentSort = stored || 'date';
    const radioBtn = document.querySelector(`input[name="sort"][value="${currentSort}"]`);
    if (radioBtn) {
        radioBtn.checked = true;
    }
}

// ========================
// Helper Functions
// ========================

function getCategoryEmoji(category) {
    const emojis = {
        personal: '📱',
        work: '💼',
        shopping: '🛒',
        health: '🏥',
        other: '📋'
    };
    return emojis[category] || '📋';
}

function getCategoryLabel(category) {
    const labels = {
        personal: 'Personal',
        work: 'Work',
        shopping: 'Shopping',
        health: 'Health',
        other: 'Other'
    };
    return labels[category] || 'Other';
}

function getPriorityLabel(priority) {
    const labels = {
        high: '🔴 Tinggi',
        medium: '🟡 Sedang',
        low: '🟢 Rendah'
    };
    return labels[priority] || 'Sedang';
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ========================
// Initialize Sort from Storage
// ========================

loadSort();

console.log('To-Do List App initialized successfully!');
