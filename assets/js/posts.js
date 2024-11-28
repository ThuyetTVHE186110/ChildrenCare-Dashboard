class PostsManager {
    constructor () {
        this.posts = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.sortField = 'id';
        this.sortDirection = 'asc';
        this.filters = {
            search: '',
            category: '',
            author: '',
            status: ''
        };
        this.isLoading = false;

        // Initialize event listeners and load posts
        this.initializeEventListeners();
        this.loadPosts();

        // Initialize theme handler
        this.initializeThemeHandler();
    }

    initializeEventListeners() {
        // Sort handlers
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => this.handleSort(header.dataset.sort));
        });

        // Filter handlers
        document.getElementById('categoryFilter')?.addEventListener('change', (e) =>
            this.updateFilter('category', e.target.value));
        document.getElementById('authorFilter')?.addEventListener('change', (e) =>
            this.updateFilter('author', e.target.value));
        document.getElementById('statusFilter')?.addEventListener('change', (e) =>
            this.updateFilter('status', e.target.value));

        // Search handler
        const searchInput = document.querySelector('.search-bar input');
        searchInput?.addEventListener('input', (e) => {
            this.updateFilter('search', e.target.value);
        });

        // Modal handlers
        this.initializeModalHandlers();
    }

    initializeModalHandlers() {
        // New Post button
        const newPostButton = document.getElementById('newPostButton');
        if (newPostButton) {
            newPostButton.addEventListener('click', () => this.openCreateModal());
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close, [data-action="cancel"]')
            .forEach(button => {
                button.addEventListener('click', () => this.closeModals());
            });

        // Form submission
        const postForm = document.getElementById('postForm');
        if (postForm) {
            postForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Image upload
        const thumbnailInput = document.getElementById('thumbnailInput');
        const imagePreview = document.querySelector('.image-preview');
        if (thumbnailInput && imagePreview) {
            imagePreview.addEventListener('click', () => thumbnailInput.click());
            thumbnailInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const postData = Object.fromEntries(formData.entries());

        // Get the current action (create/edit)
        const isEdit = form.dataset.action === 'edit';
        const postId = form.dataset.postId;

        if (isEdit) {
            this.updatePost(postId, postData);
        } else {
            this.createPost(postData);
        }
    }

    async createPost(postData) {
        try {
            const submitBtn = document.querySelector('.modal-footer [data-action="save"]');
            submitBtn.classList.add('loading');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            const newPost = {
                id: this.posts.length + 1,
                ...postData,
                featured: !!postData.featured,
                thumbnail: this.currentThumbnail || 'https://via.placeholder.com/800x600?text=No+Image'
            };

            this.posts.unshift(newPost);
            this.renderPosts();
            this.closeModals();
            this.showNotification('Post created successfully!', 'success');
        } catch (error) {
            console.error('Error creating post:', error);
            this.showNotification('Failed to create post', 'error');
        } finally {
            submitBtn?.classList.remove('loading');
        }
    }

    async updatePost(postId, postData) {
        try {
            const submitBtn = document.querySelector('.modal-footer [data-action="save"]');
            submitBtn.classList.add('loading');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            const index = this.posts.findIndex(p => p.id === Number(postId));
            if (index === -1) throw new Error('Post not found');

            this.posts[index] = {
                ...this.posts[index],
                ...postData,
                featured: !!postData.featured,
                thumbnail: this.currentThumbnail || this.posts[index].thumbnail
            };

            this.renderPosts();
            this.closeModals();
            this.showNotification('Post updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating post:', error);
            this.showNotification('Failed to update post', 'error');
        } finally {
            submitBtn?.classList.remove('loading');
        }
    }

    async handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const preview = document.getElementById('thumbnailPreview');
            if (!preview) return;

            // Simulate upload delay
            preview.classList.add('loading');
            await new Promise(resolve => setTimeout(resolve, 800));

            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentThumbnail = e.target.result;
                preview.src = e.target.result;
                preview.classList.remove('loading');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            this.showNotification('Failed to upload image', 'error');
        }
    }

    openCreateModal() {
        const modal = document.getElementById('postModal');
        if (!modal) return;

        // Reset form before showing modal
        const form = document.getElementById('postForm');
        if (form) {
            form.reset();
            form.dataset.action = 'create';
            delete form.dataset.postId;
        }

        // Reset thumbnail preview
        const preview = document.getElementById('thumbnailPreview');
        if (preview) {
            preview.src = 'https://via.placeholder.com/800x600?text=Upload+Image';
            this.currentThumbnail = null;
        }

        // Update modal title
        const title = modal.querySelector('.modal-title');
        if (title) title.textContent = 'Create New Post';

        // Show modal with animation
        this.showModal(modal);
    }

    openEditModal(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const modal = document.getElementById('postModal');
        if (!modal) return;

        // Setup form for editing
        const form = document.getElementById('postForm');
        if (form) {
            form.reset();
            form.dataset.action = 'edit';
            form.dataset.postId = postId;
        }

        // Update modal title
        const title = modal.querySelector('.modal-title');
        if (title) title.textContent = 'Edit Post';

        // Populate form fields
        this.populateFormFields(post);

        // Show modal with animation
        this.showModal(modal);
    }

    populateFormFields(post) {
        const elements = {
            title: document.getElementById('postTitle'),
            category: document.getElementById('postCategory'),
            author: document.getElementById('postAuthor'),
            brief: document.getElementById('postBrief'),
            description: document.getElementById('postDescription'),
            featured: document.getElementById('postFeatured'),
            status: document.getElementById('postStatus'),
            preview: document.getElementById('thumbnailPreview')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (!element) return;

            if (key === 'preview') {
                element.src = post.thumbnail || 'https://via.placeholder.com/800x600?text=No+Image';
                this.currentThumbnail = post.thumbnail;
            } else if (key === 'featured') {
                element.checked = post.featured;
            } else {
                element.value = post[key] || '';
            }
        });
    }

    openDetailsModal(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const modal = document.getElementById('postDetailsModal');
        if (!modal) return;

        // Populate details
        this.populateDetailsModal(post);

        // Show modal with animation
        this.showModal(modal);
    }

    updateDetailsBadges(post) {
        const badges = {
            status: document.querySelector('.post-status-badge'),
            category: document.querySelector('.post-category-badge'),
            featured: document.querySelector('.post-featured-badge')
        };

        if (badges.status) {
            badges.status.innerHTML = `<span class="status-badge ${post.status}">${post.status}</span>`;
        }
        if (badges.category) {
            badges.category.innerHTML = `<span class="badge">${post.category}</span>`;
        }
        if (badges.featured) {
            badges.featured.innerHTML = post.featured ?
                `<i class="fas fa-star featured-badge"></i>` : '';
        }
    }

    async loadPosts() {
        try {
            this.isLoading = true;
            this.renderLoadingState();

            // Simulate network delay for mock data
            await new Promise(resolve => setTimeout(resolve, 800));
            this.posts = await this.getMockPosts();
            this.renderPosts();
        } catch (error) {
            console.error('Error loading posts:', error);
            this.renderErrorState();
        } finally {
            this.isLoading = false;
        }
    }

    renderLoadingState() {
        const tbody = document.querySelector('.posts-table tbody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading posts...</p>
                </td>
            </tr>
        `;
    }

    renderErrorState() {
        const tbody = document.querySelector('.posts-table tbody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load posts. Please try again.</p>
                    <button class="btn-secondary" onclick="postsManager.loadPosts()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }

    renderPosts() {
        const tbody = document.querySelector('.posts-table tbody');
        if (!tbody) return;

        let displayPosts = this.filterPosts(this.posts);
        displayPosts = this.sortPosts(displayPosts);

        if (displayPosts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-file-alt"></i>
                        <p>No posts found${this.getEmptyStateMessage()}</p>
                        <button class="btn-primary" onclick="postsManager.openCreateModal()">
                            <i class="fas fa-plus"></i> Create New Post
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedPosts = displayPosts.slice(startIndex, endIndex);

        // Generate table rows
        tbody.innerHTML = paginatedPosts.map(post => `
            <tr>
                <td>${post.id}</td>
                <td>
                    <img src="${post.thumbnail}" alt="${post.title}" 
                         onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'" 
                         class="post-thumbnail">
                </td>
                <td>${post.title}</td>
                <td><span class="badge">${post.category}</span></td>
                <td>${post.author}</td>
                <td>${post.featured ? '<i class="fas fa-star featured-badge"></i>' : ''}</td>
                <td><span class="status-badge ${post.status}">${post.status}</span></td>
                <td class="actions">
                    <button class="btn-icon" onclick="postsManager.openDetailsModal(${post.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="postsManager.openEditModal(${post.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="postsManager.deletePost(${post.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        this.updatePagination(displayPosts.length);
    }

    filterPosts(posts) {
        return posts.filter(post => {
            const searchMatch = post.title.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                post.author.toLowerCase().includes(this.filters.search.toLowerCase());
            const categoryMatch = !this.filters.category || post.category === this.filters.category;
            const authorMatch = !this.filters.author || post.author === this.filters.author;
            const statusMatch = !this.filters.status || post.status === this.filters.status;

            return searchMatch && categoryMatch && authorMatch && statusMatch;
        });
    }

    sortPosts(posts) {
        return [...posts].sort((a, b) => {
            const aValue = a[this.sortField];
            const bValue = b[this.sortField];

            if (typeof aValue === 'string') {
                return this.sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        });
    }

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationInfo = document.querySelector('.pagination-info');
        const pageNumbers = document.querySelector('.page-numbers');

        if (paginationInfo) {
            const start = ((this.currentPage - 1) * this.itemsPerPage) + 1;
            const end = Math.min(start + this.itemsPerPage - 1, totalItems);
            paginationInfo.innerHTML = `Showing <span>${start}-${end}</span> of <span>${totalItems}</span> posts`;
        }

        if (pageNumbers) {
            pageNumbers.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
                .map(page => `
                    <button class="${page === this.currentPage ? 'active' : ''}" 
                            onclick="postsManager.goToPage(${page})">
                        ${page}
                    </button>
                `).join('');
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderPosts();
    }

    handleSort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.renderPosts();
    }

    updateFilter(type, value) {
        this.filters[type] = value;
        this.currentPage = 1;
        this.renderActiveFilters();
        this.renderPosts();
    }

    renderActiveFilters() {
        const container = document.querySelector('.active-filters');
        if (!container) return;

        const activeFilters = Object.entries(this.filters)
            .filter(([_, value]) => value)
            .map(([type, value]) => `
                <div class="filter-tag">
                    <span>${type}: ${value}</span>
                    <button onclick="postsManager.clearFilter('${type}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');

        container.innerHTML = activeFilters;
    }

    clearFilter(type) {
        this.filters[type] = '';
        const filterElement = document.getElementById(`${type}Filter`);
        if (filterElement) filterElement.value = '';
        this.renderActiveFilters();
        this.renderPosts();
    }

    async deletePost(postId) {
        const deleteBtn = document.querySelector(`button[onclick="postsManager.deletePost(${postId})"]`);
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            deleteBtn.classList.add('loading');
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
            this.posts = this.posts.filter(post => post.id !== postId);
            this.renderPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
        } finally {
            deleteBtn.classList.remove('loading');
        }
    }

    async getMockPosts() {
        return [
            {
                id: 1,
                title: 'Healthcare Tips for Summer',
                category: 'health',
                author: 'Dr. Smith',
                thumbnail: 'https://via.placeholder.com/800x600?text=Healthcare+Tips',
                brief: 'Essential healthcare tips for the summer season',
                description: 'Detailed description of summer healthcare tips...',
                featured: true,
                status: 'published'
            },
            {
                id: 2,
                title: 'Understanding Pediatric Care',
                category: 'medical',
                author: 'Dr. Johnson',
                thumbnail: 'https://via.placeholder.com/800x600?text=Pediatric+Care',
                brief: 'A guide to pediatric healthcare',
                description: 'Comprehensive guide about pediatric care...',
                featured: false,
                status: 'draft'
            }
        ];
    }

    getEmptyStateMessage() {
        const activeFilters = [];
        if (this.filters.search) activeFilters.push('search term');
        if (this.filters.category) activeFilters.push('category');
        if (this.filters.author) activeFilters.push('author');
        if (this.filters.status) activeFilters.push('status');

        return activeFilters.length > 0
            ? ` matching the selected ${activeFilters.join(', ')}`
            : '';
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');

            // Wait for animation to complete before hiding
            setTimeout(() => {
                if (!modal.classList.contains('show')) {
                    modal.style.display = 'none';
                }
            }, 300);
        });

        // Restore scrolling
        document.body.style.overflow = '';

        // Remove escape key handler
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // New helper methods for modal handling
    showModal(modal) {
        // Ensure any existing modals are closed
        this.closeModals();

        // Show the modal
        modal.style.display = 'flex';

        // Force reflow to ensure transitions work
        modal.offsetHeight;

        // Add show class for animations
        modal.classList.add('show');

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';

        // Add click handlers for overlay close
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModals();
                }
            });
        }

        // Add escape key handler
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    populateDetailsModal(post) {
        const elements = {
            thumbnail: document.getElementById('detailsThumbnail'),
            title: document.getElementById('detailsTitle'),
            author: document.getElementById('detailsAuthor'),
            brief: document.getElementById('detailsBrief'),
            description: document.getElementById('detailsDescription')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (!element) return;

            if (key === 'thumbnail') {
                element.src = post.thumbnail || 'https://via.placeholder.com/800x600?text=No+Image';
                element.onerror = () => {
                    element.src = 'https://via.placeholder.com/800x600?text=No+Image';
                };
            } else {
                element.textContent = post[key] || '';
            }
        });

        this.updateDetailsBadges(post);
    }

    initializeThemeHandler() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Initialize theme from localStorage or system preference
        this.initializeTheme();
    }

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
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Optional: Show notification
        this.showNotification(`Switched to ${newTheme} theme`, 'success');
    }
}

// Initialize the posts manager
window.addEventListener('DOMContentLoaded', () => {
    window.postsManager = new PostsManager();
});