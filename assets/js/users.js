// Add this constant at the top of the file, before the ModalManager class
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBmaWxsPSIjZTBlMGUwIiBkPSJNMCAwaDUwdjUwSDB6Ii8+PHBhdGggZmlsbD0iIzljOWM5YyIgZD0iTTI1IDI4Yy01LjUgMC0xMCAzLjItMTIuNSA3LjVoMjVjLTIuNS00LjMtNy03LjUtMTIuNS03LjV6Ii8+PGNpcmNsZSBmaWxsPSIjOWM5YzljIiBjeD0iMjUiIGN5PSIxOCIgcj0iNyIvPjwvc3ZnPg==';

// Add this class at the top of the file, before the DOMContentLoaded event
class ModalManager {
    constructor (modalElement) {
        this.modal = modalElement;
        this.overlay = modalElement.querySelector('.modal-overlay');
        this.closeButtons = modalElement.querySelectorAll('.modal-close, [data-action="cancel"]');
        this.isOpen = false;

        this.handleKeydown = this.handleKeydown.bind(this);
        this.init();
    }

    init() {
        // Close button handlers
        this.closeButtons.forEach(button => {
            button.addEventListener('click', () => this.close());
        });

        // Overlay click handler
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
    }

    open() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this.handleKeydown);
        this.isOpen = true;

        // Focus the first focusable element
        const focusable = this.modal.querySelector('button, [href], input, select, textarea');
        if (focusable) {
            setTimeout(() => focusable.focus(), 100);
        }
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this.handleKeydown);
        this.isOpen = false;
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.close();
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Mock data for demonstration
    const mockUsers = [
        {
            id: 1,
            fullName: "John Doe",
            gender: "Male",
            email: "john.doe@example.com",
            mobile: "+1 234-567-8901",
            role: "Admin",
            status: "Active",
            avatar: "https://ui-avatars.com/api/?name=John+Doe&background=random",
            address: "123 Main St, New York, NY"
        },
        {
            id: 2,
            fullName: "Jane Smith",
            gender: "Female",
            email: "jane.smith@example.com",
            mobile: "+1 234-567-8902",
            role: "Manager",
            status: "Active",
            avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=random",
            address: "456 Park Ave, Boston, MA"
        },
        {
            id: 3,
            fullName: "Bob Wilson",
            gender: "Male",
            email: "bob.wilson@example.com",
            mobile: "+1 234-567-8903",
            role: "Staff",
            status: "Inactive",
            avatar: "https://ui-avatars.com/api/?name=Bob+Wilson&background=random",
            address: "789 Oak Rd, Chicago, IL"
        },
        // Add more mock users as needed
    ];

    // State management
    let users = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalItems = 0;
    let sortField = 'id';
    let sortDirection = 'asc';
    let filters = {
        search: '',
        gender: '',
        role: '',
        status: ''
    };

    // DOM Elements
    const userModal = document.getElementById('userModal');
    const userDetailsModal = document.getElementById('userDetailsModal');
    const userForm = document.getElementById('userForm');
    const usersTableBody = document.querySelector('.users-table tbody');
    const searchInput = document.querySelector('.search-filters .search-bar input');
    const filterSelects = document.querySelectorAll('.filter-select');
    const activeFilters = document.querySelector('.active-filters');
    const paginationInfo = document.querySelector('.pagination-info');
    const pageNumbers = document.querySelector('.page-numbers');
    const itemsPerPageSelect = document.querySelector('.items-per-page select');

    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');

    // Initialize theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.classList.toggle('active', currentTheme === 'dark');

    // Handle theme toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.classList.toggle('active');
    });

    // Initialize the page
    initializePage();

    // Event Listeners
    document.getElementById('newUserButton').addEventListener('click', () => openUserModal());

    // Search handler with debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filters.search = e.target.value;
            currentPage = 1;
            updateActiveFilters();
            loadUsers();
        }, 300);
    });

    // Filter handlers
    filterSelects.forEach(select => {
        select.addEventListener('change', () => {
            filters[select.id.replace('Filter', '')] = select.value;
            currentPage = 1;
            updateActiveFilters();
            loadUsers();
        });
    });

    // Sort handlers
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (sortField === field) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortField = field;
                sortDirection = 'asc';
            }
            updateSortIndicators(th);
            loadUsers();
        });
    });

    // Initialize modal managers
    const userModalManager = new ModalManager(userModal);
    const userDetailsModalManager = new ModalManager(userDetailsModal);

    // Update the openUserModal function
    function openUserModal(userData = null) {
        const modalTitle = userModal.querySelector('.modal-title');
        const form = userModal.querySelector('form');

        if (userData) {
            modalTitle.textContent = 'Edit User';
            populateUserForm(userData);
        } else {
            modalTitle.textContent = 'New User';
            form.reset();
            avatarPreview.src = DEFAULT_AVATAR;
        }

        userModalManager.open();
    }

    // Update the viewUser function
    window.viewUser = async function (userId) {
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
            const detailsAvatar = document.getElementById('detailsAvatar');
            const detailsFullName = document.getElementById('detailsFullName');
            const detailsGender = document.getElementById('detailsGender');
            const detailsMobile = document.getElementById('detailsMobile');
            const detailsEmail = document.getElementById('detailsEmail');
            const detailsAddress = document.getElementById('detailsAddress');

            // Store userId for edit functionality
            detailsFullName.dataset.userId = user.id;

            // Set avatar with fallback
            detailsAvatar.src = user.avatar || DEFAULT_AVATAR;
            detailsAvatar.onerror = () => {
                detailsAvatar.src = DEFAULT_AVATAR;
            };

            // Set text content
            detailsFullName.textContent = user.fullName;
            detailsGender.textContent = user.gender;
            detailsMobile.textContent = user.mobile;
            detailsEmail.textContent = user.email;
            detailsAddress.textContent = user.address || 'Not provided';

            // Update badges
            const roleBadge = userDetailsModal.querySelector('.role-badge');
            const statusBadge = userDetailsModal.querySelector('.status-badge');

            if (roleBadge && statusBadge) {
                roleBadge.className = `role-badge ${user.role.toLowerCase()}`;
                roleBadge.textContent = user.role;

                statusBadge.className = `status-badge ${user.status.toLowerCase()}`;
                statusBadge.textContent = user.status;
            }

            userDetailsModalManager.open();
        }
    };

    // Update form submission handler
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!userForm.checkValidity()) {
            showFormErrors();
            return;
        }

        const formData = new FormData(userForm);
        const userData = Object.fromEntries(formData.entries());
        const isEdit = !!userData.id;

        try {
            showLoadingState(true);
            const response = await saveUser(userData, isEdit);
            if (response.success) {
                userModalManager.close();
                showToast(isEdit ? 'User updated successfully' : 'User created successfully', 'success');
                loadUsers();
            }
        } catch (error) {
            showToast(error.message || 'An error occurred', 'error');
        } finally {
            showLoadingState(false);
        }
    });

    // Add edit button handler in details modal
    const editButtonInDetails = userDetailsModal.querySelector('[data-action="edit"]');
    editButtonInDetails.addEventListener('click', () => {
        const userId = parseInt(userDetailsModal.querySelector('#detailsFullName').dataset.userId);
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
            userDetailsModalManager.close();
            openUserModal(user);
        }
    });

    // Avatar upload handling
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');

    document.querySelector('.avatar-preview').addEventListener('click', () => {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
                avatarPreview.style.display = 'block';
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Helper Functions
    async function initializePage() {
        showLoadingState(true);
        try {
            await loadUsers();
            setupPagination();
            updateActiveFilters();
        } catch (error) {
            showToast('Failed to load users', 'error');
        } finally {
            showLoadingState(false);
        }
    }

    async function loadUsers() {
        try {
            // In real application, this would be an API call
            const response = await fetchUsers({
                page: currentPage,
                limit: itemsPerPage,
                sort: sortField,
                direction: sortDirection,
                ...filters
            });

            users = response.data;
            totalItems = response.total;
            renderUsers();
            updatePagination();
        } catch (error) {
            showToast('Failed to load users', 'error');
        }
    }

    function renderUsers() {
        usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>
                    <div class="user-avatar">
                        <img src="${user.avatar || 'assets/images/default-avatar.png'}" alt="${user.fullName}">
                    </div>
                </td>
                <td>${user.fullName}</td>
                <td>${user.gender}</td>
                <td>${user.email}</td>
                <td>${user.mobile}</td>
                <td><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></td>
                <td><span class="status-badge ${user.status.toLowerCase()}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon view" onclick="viewUser(${user.id})" title="View details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon edit" onclick="editUser(${user.id})" title="Edit user">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function updateActiveFilters() {
        const activeFiltersList = Object.entries(filters)
            .filter(([_, value]) => value)
            .map(([key, value]) => `
                <div class="filter-tag">
                    ${key}: ${value}
                    <i class="fas fa-times" onclick="removeFilter('${key}')"></i>
                </div>
            `).join('');

        activeFilters.innerHTML = activeFiltersList;
    }

    function removeFilter(key) {
        filters[key] = '';
        const filterElement = document.getElementById(`${key}Filter`);
        if (filterElement) {
            filterElement.value = '';
        }
        if (key === 'search') {
            searchInput.value = '';
        }
        currentPage = 1;
        updateActiveFilters();
        loadUsers();
    }

    function updateSortIndicators(clickedHeader) {
        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });
        clickedHeader.classList.add(`sorted-${sortDirection}`);
    }

    function updatePagination() {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(start + itemsPerPage - 1, totalItems);

        paginationInfo.innerHTML = `Showing <span>${start}-${end}</span> of <span>${totalItems}</span> users`;

        renderPageNumbers(totalPages);
    }

    function renderPageNumbers(totalPages) {
        let pages = [];
        if (totalPages <= 5) {
            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            if (currentPage <= 3) {
                pages = [1, 2, 3, 4, '...', totalPages];
            } else if (currentPage >= totalPages - 2) {
                pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
            }
        }

        pageNumbers.innerHTML = pages.map(page => {
            if (page === '...') {
                return '<span class="page-ellipsis">...</span>';
            }
            return `
                <button ${page === currentPage ? 'class="active"' : ''} 
                        onclick="goToPage(${page})">
                    ${page}
                </button>
            `;
        }).join('');
    }

    // Modal Functions
    function openUserModal(userData = null) {
        const modalTitle = userModal.querySelector('.modal-title');
        const form = userModal.querySelector('form');

        if (userData) {
            modalTitle.textContent = 'Edit User';
            populateUserForm(userData);
        } else {
            modalTitle.textContent = 'New User';
            form.reset();
            avatarPreview.src = DEFAULT_AVATAR;
        }

        userModalManager.open();
    }

    function closeModal(modal) {
        modal.classList.remove('active');
    }

    // UI Helper Functions
    function showLoadingState(loading) {
        document.body.classList.toggle('loading', loading);
        // Implement loading indicator
    }

    function showToast(message, type = 'info') {
        // Implement toast notification
    }

    function showFormErrors() {
        const invalidInputs = userForm.querySelectorAll(':invalid');
        invalidInputs.forEach(input => {
            const errorMessage = input.nextElementSibling;
            if (errorMessage && errorMessage.classList.contains('error-message')) {
                errorMessage.style.display = 'block';
            }
        });
    }

    // Mock API Functions
    async function fetchUsers(params) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        let filteredUsers = [...mockUsers];

        // Apply filters
        if (params.search) {
            const searchLower = params.search.toLowerCase();
            filteredUsers = filteredUsers.filter(user =>
                user.fullName.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                user.mobile.includes(params.search)
            );
        }

        if (params.gender) {
            filteredUsers = filteredUsers.filter(user =>
                user.gender.toLowerCase() === params.gender.toLowerCase()
            );
        }

        if (params.role) {
            filteredUsers = filteredUsers.filter(user =>
                user.role.toLowerCase() === params.role.toLowerCase()
            );
        }

        if (params.status) {
            filteredUsers = filteredUsers.filter(user =>
                user.status.toLowerCase() === params.status.toLowerCase()
            );
        }

        // Apply sorting
        filteredUsers.sort((a, b) => {
            let compareA = a[params.sort];
            let compareB = b[params.sort];

            if (typeof compareA === 'string') {
                compareA = compareA.toLowerCase();
                compareB = compareB.toLowerCase();
            }

            if (compareA < compareB) return params.direction === 'asc' ? -1 : 1;
            if (compareA > compareB) return params.direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Apply pagination
        const start = (params.page - 1) * params.limit;
        const paginatedUsers = filteredUsers.slice(start, start + params.limit);

        return {
            data: paginatedUsers,
            total: filteredUsers.length
        };
    }

    async function saveUser(userData, isEdit) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (isEdit) {
            const index = mockUsers.findIndex(user => user.id === parseInt(userData.id));
            if (index !== -1) {
                mockUsers[index] = { ...mockUsers[index], ...userData };
            }
        } else {
            const newUser = {
                id: mockUsers.length + 1,
                ...userData,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=random`
            };
            mockUsers.push(newUser);
        }

        return { success: true };
    }

    // Implement missing functions
    window.viewUser = async function (userId) {
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
            const detailsAvatar = document.getElementById('detailsAvatar');
            const detailsFullName = document.getElementById('detailsFullName');
            const detailsGender = document.getElementById('detailsGender');
            const detailsMobile = document.getElementById('detailsMobile');
            const detailsEmail = document.getElementById('detailsEmail');
            const detailsAddress = document.getElementById('detailsAddress');

            // Store userId for edit functionality
            detailsFullName.dataset.userId = user.id;

            // Set avatar with fallback
            detailsAvatar.src = user.avatar || DEFAULT_AVATAR;
            detailsAvatar.onerror = () => {
                detailsAvatar.src = DEFAULT_AVATAR;
            };

            // Set text content
            detailsFullName.textContent = user.fullName;
            detailsGender.textContent = user.gender;
            detailsMobile.textContent = user.mobile;
            detailsEmail.textContent = user.email;
            detailsAddress.textContent = user.address || 'Not provided';

            // Update badges
            const roleBadge = userDetailsModal.querySelector('.role-badge');
            const statusBadge = userDetailsModal.querySelector('.status-badge');

            if (roleBadge && statusBadge) {
                roleBadge.className = `role-badge ${user.role.toLowerCase()}`;
                roleBadge.textContent = user.role;

                statusBadge.className = `status-badge ${user.status.toLowerCase()}`;
                statusBadge.textContent = user.status;
            }

            userDetailsModalManager.open();
        }
    };

    window.editUser = async function (userId) {
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
            openUserModal(user);
        }
    };

    window.goToPage = function (page) {
        currentPage = page;
        loadUsers();
    };

    // Add items per page handler
    itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        loadUsers();
    });

    function populateUserForm(userData) {
        const form = document.getElementById('userForm');
        form.id.value = userData.id;
        form.fullName.value = userData.fullName;
        form.gender.value = userData.gender;
        form.email.value = userData.email;
        form.mobile.value = userData.mobile;
        form.address.value = userData.address || '';
        form.role.value = userData.role.toLowerCase();
        form.status.value = userData.status.toLowerCase();

        const avatarPreview = document.getElementById('avatarPreview');
        avatarPreview.src = userData.avatar;
        avatarPreview.style.display = 'block';
    }

    // Toast notification implementation
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Loading state implementation
    function showLoadingState(loading) {
        const loadingOverlay = document.querySelector('.loading-overlay') || createLoadingOverlay();
        loadingOverlay.style.display = loading ? 'flex' : 'none';
    }

    function createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    // Make functions available globally
    window.viewUser = viewUser;
    window.editUser = editUser;
    window.goToPage = goToPage;
    window.removeFilter = removeFilter;
}); 