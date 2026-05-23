const HARDCORE_WARNED_KEY = 'hardcore-warned';

const hardcoreCheckbox = document.getElementById('modo-hardcore');
const hardcoreModalEl = document.getElementById('hardcore-modal');
const hardcoreModal = new bootstrap.Modal(hardcoreModalEl);

function applyHardcoreStyle(checked) {
    if (checked) {
        hardcoreCheckbox.style.backgroundColor = 'var(--bs-danger)';
        hardcoreCheckbox.style.borderColor = 'var(--bs-danger)';
    } else {
        hardcoreCheckbox.style.backgroundColor = '';
        hardcoreCheckbox.style.borderColor = '';
    }
}

hardcoreCheckbox.addEventListener('change', () => {
    applyHardcoreStyle(hardcoreCheckbox.checked);

    if (hardcoreCheckbox.checked && !sessionStorage.getItem(HARDCORE_WARNED_KEY)) {
        hardcoreModal.show();
        sessionStorage.setItem(HARDCORE_WARNED_KEY, '1');
    }
});
