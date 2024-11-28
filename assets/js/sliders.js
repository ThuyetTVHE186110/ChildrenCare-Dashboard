class SlidersDataService {
    constructor () {
        this.sliders = [
            {
                id: 1,
                title: 'Welcome to Healthcare Center',
                image: 'https://picsum.photos/1920/1080?random=1',
                backlink: '/services/general',
                status: 'active',
                date: '2024-01-15'
            },
            {
                id: 2,
                title: 'Professional Medical Staff',
                image: 'https://picsum.photos/1920/1080?random=2',
                backlink: '/about/staff',
                status: 'active',
                date: '2024-01-14'
            },
            {
                id: 3,
                title: 'Modern Medical Equipment',
                image: 'https://picsum.photos/1920/1080?random=3',
                backlink: '/facilities',
                status: 'inactive',
                date: '2024-01-13'
            },
            {
                id: 4,
                title: 'Special Offers on Health Checkups',
                image: 'https://picsum.photos/1920/1080?random=4',
                backlink: '/promotions/checkup',
                status: 'active',
                date: '2024-01-12'
            },
            {
                id: 5,
                title: 'Emergency Services 24/7',
                image: 'https://picsum.photos/1920/1080?random=5',
                backlink: '/services/emergency',
                status: 'active',
                date: '2024-01-11'
            },
            {
                id: 6,
                title: 'Family Healthcare Plans',
                image: 'https://picsum.photos/1920/1080?random=6',
                backlink: '/plans/family',
                status: 'inactive',
                date: '2024-01-10'
            }
        ];
    }

    async getSliders() {
        await new Promise(resolve => setTimeout(resolve, 800));
        return [...this.sliders];
    }

    async toggleStatus(id) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const slider = this.sliders.find(s => s.id === id);
        if (slider) {
            slider.status = slider.status === 'active' ? 'inactive' : 'active';
        }
        return slider;
    }

    async saveSlider(sliderData) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const index = this.sliders.findIndex(s => s.id === sliderData.id);
        if (index !== -1) {
            this.sliders[index] = { ...this.sliders[index], ...sliderData };
        } else {
            this.sliders.unshift({ ...sliderData, id: Date.now() });
        }
        return true;
    }
}

class SlidersManager {
    constructor () {
        this.dataService = new SlidersDataService();
        this.sliders = [];
        this.currentPage = 1;
        this.itemsPerPage = 9;
        this.filters = {
            search: '',
            status: ''
        };

        this.initializeElements();
        this.initializeEventListeners();
        this.initializeModal();
        this.fetchSliders();
        this.initializeDetailsModal();
    }

    initializeElements() {
        this.slidersGrid = document.querySelector('.sliders-grid');
        this.searchInput = document.querySelector('.search-bar input');
        this.statusFilter = document.getElementById('statusFilter');
        this.activeFilters = document.querySelector('.active-filters');
        this.paginationInfo = document.querySelector('.pagination-info');
        this.pageNumbers = document.querySelector('.page-numbers');
        this.itemsPerPageSelect = document.querySelector('.items-per-page select');
    }

    initializeEventListeners() {
        // Search input handler with debounce
        this.searchInput.addEventListener('input', debounce(() => {
            this.filters.search = this.searchInput.value;
            this.currentPage = 1;
            this.updateSliders();
        }, 300));

        // Status filter handler
        this.statusFilter.addEventListener('change', () => {
            this.filters.status = this.statusFilter.value;
            this.currentPage = 1;
            this.updateActiveFilters();
            this.updateSliders();
        });

        // Items per page handler
        this.itemsPerPageSelect.addEventListener('change', () => {
            this.itemsPerPage = parseInt(this.itemsPerPageSelect.value);
            this.currentPage = 1;
            this.updateSliders();
        });
    }

    async fetchSliders() {
        try {
            this.showLoading();
            this.sliders = await this.dataService.getSliders();
            this.updateSliders();
        } catch (error) {
            console.error('Error fetching sliders:', error);
            this.showError('Failed to load sliders');
        }
    }

    showLoading() {
        this.slidersGrid.innerHTML = Array(6).fill(0).map(() => `
            <div class="slider-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-link"></div>
                </div>
            </div>
        `).join('');
    }

    showError(message) {
        this.slidersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>${message}</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }

    createSliderCard(slider) {
        return `
            <div class="slider-card">
                <div class="slider-image">
                    <img src="${slider.image}" alt="${slider.title}">
                </div>
                <div class="slider-content">
                    <div class="slider-header">
                        <h3 class="slider-title">${slider.title}</h3>
                        <span class="slider-status status-${slider.status}">
                            ${slider.status}
                        </span>
                    </div>
                    <div class="slider-backlink">
                        ${slider.backlink}
                    </div>
                    <div class="slider-actions">
                        <button class="action-btn view" onclick="slidersManager.openDetailsModal(${slider.id})">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                        <button class="action-btn edit" onclick="slidersManager.openModal(${slider.id})">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="action-btn toggle" onclick="slidersManager.toggleStatus(${slider.id})">
                            <i class="fas fa-${slider.status === 'active' ? 'eye-slash' : 'eye'}"></i>
                            ${slider.status === 'active' ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    updateSliders() {
        const filteredSliders = this.filterSliders();
        const paginatedSliders = this.paginateSliders(filteredSliders);

        if (filteredSliders.length === 0) {
            this.slidersGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-image"></i>
                    <h3>No sliders found</h3>
                    <p>Try adjusting your search or filter to find what you're looking for.</p>
                </div>
            `;
        } else {
            this.slidersGrid.innerHTML = paginatedSliders.map(slider =>
                this.createSliderCard(slider)
            ).join('');
        }

        this.updatePagination(filteredSliders.length);
    }

    filterSliders() {
        return this.sliders.filter(slider => {
            const matchesSearch = (
                slider.title.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                slider.backlink.toLowerCase().includes(this.filters.search.toLowerCase())
            );
            const matchesStatus = !this.filters.status || slider.status === this.filters.status;
            return matchesSearch && matchesStatus;
        });
    }

    paginateSliders(sliders) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return sliders.slice(start, start + this.itemsPerPage);
    }

    updatePagination(totalItems) {
        // Update pagination info
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(start + this.itemsPerPage - 1, totalItems);
        this.paginationInfo.innerHTML = `Showing <span>${start}-${end}</span> of <span>${totalItems}</span> sliders`;

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        // Update page numbers
        this.updatePageNumbers(totalPages);

        // Update navigation buttons
        const prevButton = this.pageNumbers.previousElementSibling;
        const nextButton = this.pageNumbers.nextElementSibling;

        prevButton.disabled = this.currentPage === 1;
        nextButton.disabled = this.currentPage === totalPages;

        // Add event listeners to navigation buttons
        prevButton.onclick = () => this.changePage(this.currentPage - 1);
        nextButton.onclick = () => this.changePage(this.currentPage + 1);
    }

    updatePageNumbers(totalPages) {
        let pages = [];

        // Always show first page
        pages.push(1);

        // Calculate range around current page
        let start = Math.max(2, this.currentPage - 1);
        let end = Math.min(totalPages - 1, this.currentPage + 1);

        // Add ellipsis after first page if needed
        if (start > 2) {
            pages.push('...');
        }

        // Add pages around current page
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Add ellipsis before last page if needed
        if (end < totalPages - 1) {
            pages.push('...');
        }

        // Add last page if there is more than one page
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        // Generate HTML for page numbers
        this.pageNumbers.innerHTML = pages.map(page => {
            if (page === '...') {
                return '<span>...</span>';
            }
            return `
                <button ${page === this.currentPage ? 'class="active"' : ''}>
                    ${page}
                </button>
            `;
        }).join('');

        // Add click handlers to page buttons
        this.pageNumbers.querySelectorAll('button').forEach(button => {
            button.onclick = () => this.changePage(parseInt(button.textContent));
        });
    }

    changePage(newPage) {
        if (newPage !== this.currentPage) {
            this.currentPage = newPage;
            this.updateSliders();
        }
    }

    async toggleStatus(sliderId) {
        try {
            const updatedSlider = await this.dataService.toggleStatus(sliderId);
            if (updatedSlider) {
                const index = this.sliders.findIndex(s => s.id === sliderId);
                this.sliders[index] = updatedSlider;
                this.updateSliders();
                this.showToast(`Slider ${updatedSlider.status === 'active' ? 'shown' : 'hidden'} successfully`);
            }
        } catch (error) {
            console.error('Error toggling slider status:', error);
            this.showToast('Failed to update slider status', 'error');
        }
    }

    showToast(message, type = 'success') {
        // Implement toast notification
        alert(message);
    }

    initializeModal() {
        this.modal = document.getElementById('sliderModal');
        this.modalForm = document.getElementById('sliderForm');

        // Close modal handlers
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());
        this.modal.querySelector('[data-action="cancel"]').addEventListener('click', () => this.closeModal());

        // Save handler
        this.modal.querySelector('[data-action="save"]').addEventListener('click', () => this.saveSlider());

        // Image upload handler
        const imagePreview = document.getElementById('imagePreview');
        const imageInput = document.getElementById('imageInput');

        document.querySelector('.image-preview').addEventListener('click', () => {
            imageInput.click();
        });

        imageInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    openModal(sliderId = null) {
        this.currentSliderId = sliderId;
        const slider = sliderId ? this.sliders.find(s => s.id === sliderId) : null;

        // Update modal title
        this.modal.querySelector('.modal-title').textContent = slider ? 'Edit Slider' : 'New Slider';

        // Reset form
        this.modalForm.reset();

        if (slider) {
            // Fill form with slider data
            this.modalForm.elements.title.value = slider.title;
            this.modalForm.elements.backlink.value = slider.backlink;
            this.modalForm.elements.status.checked = slider.status === 'active';
            document.getElementById('imagePreview').src = slider.image;
        } else {
            // Default values for new slider
            document.getElementById('imagePreview').src = '';
            this.modalForm.elements.status.checked = true;
        }

        // Show modal
        this.modal.style.display = 'block';
        setTimeout(() => {
            this.modal.classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.remove('active');
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300); // Match the transition duration
        document.body.style.overflow = '';
    }

    async saveSlider() {
        const formData = new FormData(this.modalForm);
        const sliderData = {
            id: this.currentSliderId || Date.now(),
            title: formData.get('title'),
            backlink: formData.get('backlink'),
            status: formData.get('status') === 'on' ? 'active' : 'inactive',
            image: document.getElementById('imagePreview').src || 'https://picsum.photos/1920/1080?random=' + Date.now(),
            date: new Date().toISOString()
        };

        try {
            await this.dataService.saveSlider(sliderData);

            if (this.currentSliderId) {
                // Update existing slider
                const index = this.sliders.findIndex(s => s.id === this.currentSliderId);
                this.sliders[index] = { ...this.sliders[index], ...sliderData };
            } else {
                // Add new slider
                this.sliders.unshift(sliderData);
            }

            this.updateSliders();
            this.closeModal();
            this.showToast(`Slider ${this.currentSliderId ? 'updated' : 'created'} successfully`);
        } catch (error) {
            console.error('Error saving slider:', error);
            this.showToast('Failed to save slider', 'error');
        }
    }

    initializeDetailsModal() {
        this.detailsModal = document.getElementById('sliderDetailsModal');

        // Close handlers
        this.detailsModal.querySelector('.modal-close').addEventListener('click', () => this.closeDetailsModal());
        this.detailsModal.querySelector('.modal-overlay').addEventListener('click', () => this.closeDetailsModal());
        this.detailsModal.querySelector('[data-action="close"]').addEventListener('click', () => this.closeDetailsModal());

        // Edit button handler
        this.detailsModal.querySelector('[data-action="edit"]').addEventListener('click', () => {
            this.closeDetailsModal();
            this.openModal(this.currentViewingSliderId);
        });
    }

    openDetailsModal(sliderId) {
        const slider = this.sliders.find(s => s.id === sliderId);
        if (!slider) return;

        this.currentViewingSliderId = sliderId;

        // Update modal content
        document.getElementById('detailsImage').src = slider.image;
        document.getElementById('detailsTitle').textContent = slider.title;

        const backlinkElement = document.getElementById('detailsBacklink');
        backlinkElement.href = slider.backlink;
        backlinkElement.textContent = slider.backlink;

        const statusBadge = this.detailsModal.querySelector('.slider-status-badge');
        statusBadge.textContent = slider.status;
        statusBadge.className = `slider-status-badge status-${slider.status}`;

        this.detailsModal.querySelector('.slider-date').textContent =
            new Date(slider.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

        // Show modal
        this.detailsModal.style.display = 'block';
        setTimeout(() => {
            this.detailsModal.classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden';
    }

    closeDetailsModal() {
        this.detailsModal.classList.remove('active');
        setTimeout(() => {
            this.detailsModal.style.display = 'none';
        }, 300); // Match the transition duration
        document.body.style.overflow = '';
        this.currentViewingSliderId = null;
    }
}

// Initialize the sliders manager
let slidersManager;
document.addEventListener('DOMContentLoaded', () => {
    slidersManager = new SlidersManager();
});

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 