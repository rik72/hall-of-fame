// ===== MODAL MANAGER =====
class ModalManager {
    static setupModal(type, isEdit = false, data = null) {
        const modalConfig = CONSTANTS.MODAL_TYPES[type.toUpperCase()];
        const modalId = `add${type.charAt(0).toUpperCase() + type.slice(1)}Modal`;
        
        // Reset edit ID
        document.getElementById(`${type}-edit-id`).value = isEdit && data ? data.id : '';
        
        // Set form values
        if (type === 'player') {
            this.setupPlayerModal(isEdit, data, modalConfig);
        } else if (type === 'game') {
            this.setupGameModal(isEdit, data, modalConfig);
        } else if (type === 'tournament') {
            this.setupTournamentModal(isEdit, data, modalConfig);
        }
        
        // Update modal title and button
        document.getElementById(`${type}-modal-title`).textContent = 
            isEdit ? modalConfig.editTitle : modalConfig.addTitle;
        document.getElementById(`${type}-submit-btn`).textContent = 
            isEdit ? modalConfig.editButton : modalConfig.addButton;
        
        Utils.showModal(modalId);
    }

    static setupPlayerModal(isEdit, data, modalConfig) {
        const nameField = document.getElementById('player-name');
        const avatarField = document.getElementById('player-avatar');
        const filterField = document.getElementById('avatar-filter');
        
        if (isEdit && data) {
            nameField.value = data.name;
            filterField.value = '';
            avatarField.value = data.avatar || '😊';
        } else {
            nameField.value = '';
            filterField.value = '';
            avatarField.value = '😊';
        }
    }

    static setupGameModal(isEdit, data, modalConfig) {
        const nameField = document.getElementById('game-name');
        const typeField = document.getElementById('game-type');
        
        if (isEdit && data) {
            nameField.value = data.name;
            typeField.value = data.type;
        } else {
            nameField.value = '';
            typeField.value = 'board';
        }
    }

    static setupTournamentModal(isEdit, data, modalConfig) {
        const nameField = document.getElementById('tournament-name');
        const descriptionField = document.getElementById('tournament-description');
        const startDateField = document.getElementById('tournament-start-date');
        const endDateField = document.getElementById('tournament-end-date');
        
        if (isEdit && data) {
            nameField.value = data.name;
            descriptionField.value = data.description || '';
            startDateField.value = data.startDate || '';
            endDateField.value = data.endDate || '';
        } else {
            nameField.value = '';
            descriptionField.value = '';
            startDateField.value = '';
            endDateField.value = '';
        }
    }
} 