const ServicesManager = {
    services: [], // Will store all services
    currentPage: 1,
    itemsPerPage: 10,
    sortField: 'id',
    sortDirection: 'asc',
    filters: {
        search: '',
        category: '',
        status: ''
    },
    currentThumbnail: null,
    currentImages: [],

    // Initialize the module
    init() {
        console.log('Initializing ServicesManager...');
        this.initializeEventListeners();
        this.initializeModals();
        this.initializeThemeHandler();
        this.loadServices();
    },

    // Load mock services data
    async loadServices() {
        try {
            console.log('Loading services...');
            const tbody = document.querySelector('.services-table tbody');
            if (!tbody) {
                console.error('Table body not found');
                return;
            }

            tbody.innerHTML = this.getLoadingTemplate();

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // Load mock data
            this.services = [
                {
                    id: 1,
                    title: 'General Health Checkup',
                    category: 'consultation',
                    thumbnail: 'https://via.placeholder.com/60x60?text=Health',
                    listPrice: 199.99,
                    salePrice: 149.99,
                    featured: true,
                    status: 'active',
                    brief: 'Comprehensive health examination',
                    description: 'Complete physical examination including basic health metrics.'
                },
                {
                    id: 2,
                    title: 'Dental Cleaning',
                    category: 'treatment',
                    thumbnail: 'https://via.placeholder.com/60x60?text=Dental',
                    listPrice: 99.99,
                    salePrice: 79.99,
                    featured: false,
                    status: 'active',
                    brief: 'Professional dental cleaning service',
                    description: 'Thorough dental cleaning and examination.'
                },
                {
                    id: 3,
                    title: 'Physical Therapy',
                    category: 'therapy',
                    thumbnail: 'https://via.placeholder.com/60x60?text=Therapy',
                    listPrice: 149.99,
                    salePrice: null,
                    featured: false,
                    status: 'hidden',
                    brief: 'Personalized physical therapy sessions',
                    description: 'Customized physical therapy program.'
                }
            ];

            console.log('Services loaded:', this.services);
            await this.renderServices();
        } catch (error) {
            console.error('Error loading services:', error);
            const tbody = document.querySelector('.services-table tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="error-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Failed to load services. Please try again.</p>
                            <button class="btn-secondary" onclick="ServicesManager.loadServices()">
                                <i class="fas fa-redo"></i> Retry
                            </button>
                        </td>
                    </tr>
                `;
            }
        }
    },

    renderServices() {
        console.log('Rendering services...');
        const tbody = document.querySelector('.services-table tbody');
        if (!tbody) {
            console.error('Table body not found');
            return;
        }

        // Apply filters and sorting
        let displayServices = this.filterServices();
        displayServices = this.sortServices(displayServices);

        if (displayServices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>No services found${this.getEmptyStateMessage()}</p>
                        <button class="btn-primary" onclick="ServicesManager.openServiceModal()">
                            <i class="fas fa-plus"></i> Add New Service
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedServices = displayServices.slice(startIndex, endIndex);

        // Render table rows
        tbody.innerHTML = paginatedServices.map(service => `
            <tr>
                <td>${service.id}</td>
                <td>
                    <img src="${service.thumbnail}" 
                         alt="${service.title}"
                         class="service-thumbnail"
                         onerror="this.src='https://via.placeholder.com/48x48?text=Error'">
                </td>
                <td>${service.title}</td>
                <td><span class="badge">${service.category}</span></td>
                <td data-price>${this.formatPrice(service.listPrice)}</td>
                <td data-sale-price>${service.salePrice ? this.formatPrice(service.salePrice) : '-'}</td>
                <td>${service.featured ? '<i class="fas fa-star featured-badge"></i>' : ''}</td>
                <td><span class="status-badge ${service.status}">${service.status}</span></td>
                <td class="table-actions">
                    <button class="btn-icon" onclick="ServicesManager.openDetailsModal(${service.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="ServicesManager.openServiceModal(${service.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon ${service.status === 'active' ? 'delete' : ''}" 
                            onclick="ServicesManager.toggleServiceStatus(${service.id})" 
                            title="${service.status === 'active' ? 'Hide Service' : 'Show Service'}">
                        <i class="fas fa-${service.status === 'active' ? 'eye-slash' : 'eye'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Update pagination
        this.updatePagination(displayServices.length);
    },

    getLoadingTemplate() {
        return `
            <tr>
                <td colspan="9" class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading services...</p>
                </td>
            </tr>
        `;
    },

    // Initialize event listeners
    initializeEventListeners() {
        console.log('Initializing event listeners...');

        // New service button
        const newServiceBtn = document.getElementById('newServiceButton');
        if (newServiceBtn) {
            newServiceBtn.addEventListener('click', () => this.openServiceModal());
        }

        // Search input
        const searchInput = document.querySelector('.search-filters input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.renderServices();
            });
        }

        // Filter selects
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.renderServices();
        });

        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.renderServices();
        });

        // Sort headers
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                this.handleSort(field);
            });
        });
    },

    handleSort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.renderServices();
    },

    initializeModals() {
        console.log('Initializing modals...');

        // Service modal close buttons
        document.querySelectorAll('.modal-close, [data-action="cancel"]').forEach(button => {
            button.addEventListener('click', () => this.closeModals());
        });

        // Modal overlay close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeModals();
            });
        });

        // Form submission - Update this part
        const serviceForm = document.getElementById('serviceForm');
        if (serviceForm) {
            console.log('Form found, adding submit listener');
            serviceForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Form submitted');
                await this.handleFormSubmit(e);
            });
        } else {
            console.error('Service form not found');
        }
    },

    showModal(modal) {
        // Prevent any existing modals from closing
        modal.style.display = 'flex';
        // Force a reflow to ensure the transition works
        modal.offsetHeight;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    },

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (!modal.classList.contains('show')) {
                    modal.style.display = 'none';
                }
            }, 300);
        });
        document.body.style.overflow = '';
    },

    filterServices() {
        return this.services.filter(service => {
            const searchMatch = !this.filters.search ||
                service.title.toLowerCase().includes(this.filters.search.toLowerCase());

            const categoryMatch = !this.filters.category ||
                service.category === this.filters.category;

            const statusMatch = !this.filters.status ||
                service.status === this.filters.status;

            return searchMatch && categoryMatch && statusMatch;
        });
    },

    sortServices(services) {
        return [...services].sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];

            // Handle special cases
            if (this.sortField === 'price') {
                aValue = a.salePrice || a.listPrice;
                bValue = b.salePrice || b.listPrice;
            }

            // Compare values
            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    },

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    },

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationInfo = document.querySelector('.pagination-info');
        const pageNumbers = document.querySelector('.page-numbers');

        if (paginationInfo) {
            const start = (this.currentPage - 1) * this.itemsPerPage + 1;
            const end = Math.min(start + this.itemsPerPage - 1, totalItems);
            paginationInfo.innerHTML = `Showing <span>${start}-${end}</span> of <span>${totalItems}</span> services`;
        }

        if (pageNumbers) {
            pageNumbers.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
                .map(page => `
                    <button class="${page === this.currentPage ? 'active' : ''}" 
                            onclick="ServicesManager.goToPage(${page})"
                            ${page === this.currentPage ? 'disabled' : ''}>
                        ${page}
                    </button>
                `).join('');
        }

        // Update navigation buttons
        const prevBtn = document.querySelector('.pagination-controls button:first-child');
        const nextBtn = document.querySelector('.pagination-controls button:last-child');

        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;
    },

    goToPage(page) {
        this.currentPage = page;
        this.renderServices();
    },

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    initializeThemeHandler() {
        console.log('Initializing theme handler...');
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Initialize theme from localStorage or system preference
        this.initializeTheme();
    },

    getCurrentThemeIcon() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return isDark ? 'fa-sun' : 'fa-moon';
    },

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
        }
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Update theme toggle icon
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = `<i class="fas ${this.getCurrentThemeIcon()}"></i>`;
        }

        // Show notification
        this.showNotification(`Switched to ${newTheme} mode`, 'success');
    },

    openServiceModal(serviceId = null) {
        const modal = document.getElementById('serviceModal');
        if (!modal) return;

        // Reset form and images
        const form = document.getElementById('serviceForm');
        if (form) {
            form.reset();
            form.dataset.action = serviceId ? 'edit' : 'create';
            if (serviceId) {
                form.dataset.serviceId = serviceId;
            } else {
                delete form.dataset.serviceId;
            }
        }

        // Update modal title
        const title = modal.querySelector('.modal-title');
        if (title) {
            title.textContent = serviceId ? 'Edit Service' : 'New Service';
        }

        // If editing, populate form
        if (serviceId) {
            const service = this.services.find(s => s.id === serviceId);
            if (service) {
                this.populateServiceForm(service);
            }
        } else {
            // Reset image previews for new service
            this.resetImagePreviews();
        }

        this.showModal(modal);
    },

    openDetailsModal(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) return;

        const modal = document.getElementById('serviceDetailsModal');
        if (!modal) return;

        // Set service ID for edit button reference
        modal.dataset.serviceId = serviceId;

        // Populate details
        const elements = {
            thumbnail: document.getElementById('detailsThumbnail'),
            title: document.getElementById('detailsTitle'),
            listPrice: document.getElementById('detailsListPrice'),
            salePrice: document.getElementById('detailsSalePrice'),
            brief: document.getElementById('detailsBrief'),
            description: document.getElementById('detailsDescription'),
            category: document.querySelector('.service-category-badge'),
            status: document.querySelector('.service-status-badge'),
            featured: document.querySelector('.service-featured-badge')
        };

        // Update elements
        Object.entries(elements).forEach(([key, element]) => {
            if (!element) return;

            switch (key) {
                case 'thumbnail':
                    element.src = service.thumbnail;
                    element.onerror = () => {
                        element.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    };
                    break;
                case 'listPrice':
                case 'salePrice':
                    element.textContent = service[key] ? this.formatPrice(service[key]) : '-';
                    break;
                case 'category':
                    element.innerHTML = `<span class="badge">${service.category}</span>`;
                    break;
                case 'status':
                    element.innerHTML = `<span class="status-badge ${service.status}">${service.status}</span>`;
                    break;
                case 'featured':
                    element.innerHTML = service.featured ? '<i class="fas fa-star featured-badge"></i>' : '';
                    break;
                default:
                    element.textContent = service[key] || '';
            }
        });

        // Add edit button handler
        const editButton = modal.querySelector('[data-action="edit"]');
        if (editButton) {
            editButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeModals();
                setTimeout(() => this.openServiceModal(serviceId), 300);
            };
        }

        this.showModal(modal);
    },

    populateServiceForm(service) {
        const elements = {
            title: document.getElementById('serviceTitle'),
            category: document.getElementById('serviceCategory'),
            listPrice: document.getElementById('listPrice'),
            salePrice: document.getElementById('salePrice'),
            brief: document.getElementById('serviceBrief'),
            description: document.getElementById('serviceDescription'),
            featured: document.getElementById('serviceFeatured'),
            status: document.getElementById('serviceStatus'),
            thumbnail: document.getElementById('thumbnailPreview')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (!element) return;

            if (key === 'thumbnail') {
                element.src = service.thumbnail || 'https://via.placeholder.com/60x60?text=Service';
                this.currentThumbnail = service.thumbnail;
            } else if (key === 'featured') {
                element.checked = service.featured;
            } else {
                element.value = service[key] || '';
            }
        });

        // Populate additional images if they exist
        if (service.images?.length) {
            this.populateImageGallery(service.images);
        }
    },

    resetImagePreviews() {
        const thumbnail = document.getElementById('thumbnailPreview');
        if (thumbnail) {
            thumbnail.src = 'https://via.placeholder.com/60x60?text=Upload+Image';
        }

        const gallery = document.querySelector('.image-gallery');
        if (gallery) {
            gallery.innerHTML = `
                <div class="add-image-btn">
                    <i class="fas fa-plus"></i>
                </div>
            `;
        }

        this.currentThumbnail = null;
        this.currentImages = [];
    },

    populateImageGallery(images) {
        const gallery = document.querySelector('.image-gallery');
        if (!gallery) return;

        gallery.innerHTML = images.map(image => `
            <div class="image-item">
                <img src="${image}" alt="Service image">
                <button class="remove-image" onclick="event.preventDefault(); this.parentElement.remove();">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('') + `
            <div class="add-image-btn">
                <i class="fas fa-plus"></i>
            </div>
        `;
    },

    async toggleServiceStatus(serviceId) {
        try {
            // Find the service in our mock data
            const index = this.services.findIndex(s => s.id === serviceId);
            if (index === -1) throw new Error('Service not found');

            // Add loading state to the button
            const toggleBtn = document.querySelector(`button[onclick="ServicesManager.toggleServiceStatus(${serviceId})"]`);
            if (toggleBtn) {
                toggleBtn.classList.add('loading');
                toggleBtn.disabled = true;
            }

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // Toggle the status
            const currentStatus = this.services[index].status;
            this.services[index].status = currentStatus === 'active' ? 'hidden' : 'active';

            // Update the UI
            this.renderServices();
            this.showNotification(
                `Service ${this.services[index].status === 'active' ? 'activated' : 'hidden'} successfully`,
                'success'
            );
        } catch (error) {
            console.error('Error toggling service status:', error);
            this.showNotification('Error updating service status', 'error');
        } finally {
            // Remove loading state
            const toggleBtn = document.querySelector(`button[onclick="ServicesManager.toggleServiceStatus(${serviceId})"]`);
            if (toggleBtn) {
                toggleBtn.classList.remove('loading');
                toggleBtn.disabled = false;
            }
        }
    },

    async handleFormSubmit(e) {
        console.log('Handling form submission');
        const form = e.target;
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Show loading state on save button
        const submitBtn = document.querySelector('.modal-footer [data-action="save"]');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        try {
            const formData = new FormData(form);
            const serviceData = Object.fromEntries(formData.entries());
            console.log('Form data:', serviceData);

            // Convert numeric fields
            serviceData.listPrice = parseFloat(serviceData.listPrice) || 0;
            serviceData.salePrice = serviceData.salePrice ? parseFloat(serviceData.salePrice) : null;
            serviceData.numPersons = parseInt(serviceData.numPersons) || 1;
            serviceData.featured = !!serviceData.featured;

            // Add thumbnail and images
            serviceData.thumbnail = this.currentThumbnail;
            serviceData.images = this.currentImages;

            const isEdit = form.dataset.action === 'edit';
            const serviceId = parseInt(form.dataset.serviceId);

            if (isEdit) {
                await this.updateService(serviceId, serviceData);
            } else {
                await this.createService(serviceData);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Error saving service', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    },

    async createService(serviceData) {
        console.log('Creating new service:', serviceData);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const newService = {
                id: this.services.length + 1,
                ...serviceData,
                status: 'active',
                createdAt: new Date().toISOString()
            };

            console.log('New service object:', newService);
            this.services.unshift(newService);
            await this.renderServices();
            this.closeModals();
            this.showNotification('Service created successfully!', 'success');
        } catch (error) {
            console.error('Error creating service:', error);
            this.showNotification('Failed to create service', 'error');
            throw error; // Re-throw to be caught by handleFormSubmit
        }
    },

    async updateService(serviceId, serviceData) {
        console.log('Updating service:', serviceId, serviceData);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const index = this.services.findIndex(s => s.id === serviceId);
            if (index === -1) throw new Error('Service not found');

            this.services[index] = {
                ...this.services[index],
                ...serviceData,
                updatedAt: new Date().toISOString()
            };

            console.log('Updated service:', this.services[index]);
            await this.renderServices();
            this.closeModals();
            this.showNotification('Service updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating service:', error);
            this.showNotification('Failed to update service', 'error');
            throw error; // Re-throw to be caught by handleFormSubmit
        }
    }

    // ... rest of your existing methods ...
};

// Initialize the module when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ServicesManager...');
    ServicesManager.init();
}); 