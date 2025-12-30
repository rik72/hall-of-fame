// ===== TOURNAMENT MANAGER =====
// Gestisce tutte le operazioni CRUD sui tornei: creazione, modifica, eliminazione, visualizzazione

class TournamentManager {
    constructor(storageManager, onDataChange = null) {
        this.storageManager = storageManager;
        this.onDataChange = onDataChange; // Callback chiamato quando i dati cambiano
        this.tournaments = [];
    }

    /**
     * Imposta i dati dei tornei
     * @param {Array} tournaments - Array dei tornei
     */
    setData(tournaments) {
        this.tournaments = tournaments || [];
    }

    /**
     * Mostra il modal per aggiungere un nuovo torneo
     */
    showAddTournamentModal() {
        ModalManager.setupModal('tournament', false);
    }

    /**
     * Aggiunge un nuovo torneo
     * @returns {boolean} - True se l'aggiunta è riuscita
     */
    addTournament() {
        const name = document.getElementById('tournament-name')?.value.trim();
        const description = document.getElementById('tournament-description')?.value.trim();
        const startDate = document.getElementById('tournament-start-date')?.value;
        const endDate = document.getElementById('tournament-end-date')?.value || null;
        
        try {
            // Validazione nome
            Utils.validateName(name, this.tournaments, null, 'torneo');
            
            // Validazione descrizione
            if (!description) {
                throw new Error(CONSTANTS.MESSAGES.EMPTY_DESCRIPTION);
            }
            
            // Validazione data di inizio
            if (!startDate) {
                throw new Error(CONSTANTS.MESSAGES.SELECT_START_DATE);
            }
            
            // Validazione data di fine (se fornita)
            if (endDate && endDate < startDate) {
                throw new Error(CONSTANTS.MESSAGES.INVALID_DATE_RANGE);
            }
        } catch (error) {
            alert(error.message);
            return false;
        }
        
        const tournament = {
            id: Date.now(),
            name,
            description,
            startDate,
            endDate
        };
        
        this.tournaments.push(tournament);
        this.saveToStorage();
        this.displayTournaments();
        
        Utils.hideModal('addTournamentModal');
        
        // Notifica il cambiamento dei dati
        if (this.onDataChange) {
            this.onDataChange('tournaments', this.tournaments);
        }
        
        return true;
    }

    /**
     * Mostra il modal per modificare un torneo esistente
     * @param {number} tournamentId - ID del torneo da modificare
     */
    showEditTournamentModal(tournamentId) {
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        if (!tournament) {
            console.error(`Torneo con ID ${tournamentId} non trovato`);
            return;
        }

        ModalManager.setupModal('tournament', true, tournament);
    }

    /**
     * Salva un torneo (nuovo o esistente basato sull'editId)
     */
    saveTournament() {
        const editId = document.getElementById('tournament-edit-id')?.value;
        
        if (editId) {
            this.editTournament();
        } else {
            this.addTournament();
        }
    }

    /**
     * Modifica un torneo esistente
     * @returns {boolean} - True se la modifica è riuscita
     */
    editTournament() {
        const editId = parseInt(document.getElementById('tournament-edit-id')?.value);
        const name = document.getElementById('tournament-name')?.value.trim();
        const description = document.getElementById('tournament-description')?.value.trim();
        const startDate = document.getElementById('tournament-start-date')?.value;
        const endDate = document.getElementById('tournament-end-date')?.value || null;
        
        try {
            // Validazione nome (escludendo il torneo corrente)
            Utils.validateName(name, this.tournaments, editId, 'torneo');
            
            // Validazione descrizione
            if (!description) {
                throw new Error(CONSTANTS.MESSAGES.EMPTY_DESCRIPTION);
            }
            
            // Validazione data di inizio
            if (!startDate) {
                throw new Error(CONSTANTS.MESSAGES.SELECT_START_DATE);
            }
            
            // Validazione data di fine (se fornita)
            if (endDate && endDate < startDate) {
                throw new Error(CONSTANTS.MESSAGES.INVALID_DATE_RANGE);
            }
        } catch (error) {
            alert(error.message);
            return false;
        }
        
        const tournamentIndex = this.tournaments.findIndex(t => t.id === editId);
        if (tournamentIndex === -1) {
            console.error(`Torneo con ID ${editId} non trovato`);
            return false;
        }
        
        // Update tournament data
        this.tournaments[tournamentIndex] = {
            ...this.tournaments[tournamentIndex],
            name,
            description,
            startDate,
            endDate
        };
        
        this.saveToStorage();
        this.displayTournaments();
        
        Utils.hideModal('addTournamentModal');
        
        // Notifica il cambiamento dei dati
        if (this.onDataChange) {
            this.onDataChange('tournaments', this.tournaments);
        }
        
        return true;
    }

    /**
     * Elimina un torneo
     * @param {number} tournamentId - ID del torneo da eliminare
     * @returns {boolean} - True se l'eliminazione è riuscita
     */
    deleteTournament(tournamentId) {
        if (!Utils.confirmDelete(CONSTANTS.MESSAGES.CONFIRM_DELETE_TOURNAMENT)) {
            return false;
        }
        
        // Rimuovi il torneo
        this.tournaments = this.tournaments.filter(t => t.id !== tournamentId);
        
        this.saveToStorage();
        this.displayTournaments();
        
        // Notifica il cambiamento dei dati
        if (this.onDataChange) {
            this.onDataChange('tournaments', this.tournaments);
        }
        
        return true;
    }

    /**
     * Visualizza la lista dei tornei
     */
    displayTournaments() {
        const container = document.getElementById('tournaments-list');
        
        if (!container) {
            console.warn('Container tournaments-list non trovato');
            return;
        }
        
        if (this.tournaments.length === 0) {
            DisplayManager.renderEmptyState(container, 'Nessun torneo aggiunto. Inizia aggiungendo i primi tornei!');
            return;
        }
        
        container.innerHTML = this.tournaments.map(tournament => {
            const startDate = new Date(tournament.startDate);
            const endDate = tournament.endDate ? new Date(tournament.endDate) : null;
            const dateRange = endDate 
                ? `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`
                : `${this.formatDate(startDate)} - ${CONSTANTS.UI_TEXT.IN_CORSO || 'In corso'}`;
            
            return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card-base game-card">
                        <div class="game-icon">
                            <i class="bi bi-trophy"></i>
                        </div>
                        <div class="card-header">
                            <h5 class="mb-0">${tournament.name}</h5>
                        </div>
                        <p class="text-muted small mb-3">${tournament.description}</p>
                        <div class="text-muted small mb-3">
                            <i class="bi bi-calendar me-1"></i>${dateRange}
                        </div>
                        <div class="card-actions">
                            ${HtmlBuilder.createActionButtons(tournament.id, 'Tournament')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Formatta una data in formato locale
     * @param {Date} date - Data da formattare
     * @returns {string} - Data formattata
     */
    formatDate(date) {
        return date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Salva i dati nel localStorage
     */
    saveToStorage() {
        if (this.storageManager) {
            this.storageManager.save('tournaments', this.tournaments);
        }
    }

    /**
     * Ottiene un torneo per ID
     * @param {number} tournamentId - ID del torneo
     * @returns {object|null} - Torneo o null se non trovato
     */
    getTournamentById(tournamentId) {
        return this.tournaments.find(t => t.id === tournamentId) || null;
    }

    /**
     * Ottiene tutti i tornei
     * @returns {Array} - Array dei tornei
     */
    getAllTournaments() {
        return [...this.tournaments];
    }

    /**
     * Verifica se un nome di torneo esiste (escludendo un ID specifico)
     * @param {string} name - Nome da verificare
     * @param {number} excludeId - ID da escludere dal controllo
     * @returns {boolean} - True se il nome esiste
     */
    isTournamentNameExists(name, excludeId = null) {
        return this.tournaments.some(t => 
            t.name.toLowerCase() === name.toLowerCase() && t.id !== excludeId
        );
    }

    /**
     * Ottiene il numero totale di tornei
     * @returns {number} - Numero di tornei
     */
    getTournamentCount() {
        return this.tournaments.length;
    }

    /**
     * Cerca tornei per nome
     * @param {string} searchTerm - Termine di ricerca
     * @returns {Array} - Array dei tornei trovati
     */
    searchTournaments(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        return this.tournaments.filter(tournament => 
            tournament.name.toLowerCase().includes(term) ||
            tournament.description.toLowerCase().includes(term)
        );
    }

    /**
     * Ottiene i tornei in corso (senza data di fine o con data di fine futura)
     * @returns {Array} - Array dei tornei in corso
     */
    getActiveTournaments() {
        const today = new Date().toISOString().split('T')[0];
        return this.tournaments.filter(tournament => {
            if (!tournament.endDate) return true;
            return tournament.endDate >= today;
        });
    }

    /**
     * Ottiene i tornei conclusi
     * @returns {Array} - Array dei tornei conclusi
     */
    getCompletedTournaments() {
        const today = new Date().toISOString().split('T')[0];
        return this.tournaments.filter(tournament => 
            tournament.endDate && tournament.endDate < today
        );
    }

    /**
     * Ottiene tutti i tornei ordinati per data di inizio (più recenti prima)
     * @returns {Array} - Array dei tornei ordinati per startDate discendente
     */
    getTournamentsSortedByStartDate() {
        return [...this.tournaments].sort((a, b) => {
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            return dateB - dateA; // Descending order (newest first)
        });
    }
}

