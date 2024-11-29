document.addEventListener('DOMContentLoaded', function () {
    // Sample data - replace with actual API calls
    const feedbacks = [
        {
            id: 1,
            customerName: 'Sarah Johnson',
            service: 'Medical Consultation',
            rating: 5,
            feedback: 'Excellent service! Dr. Smith was very thorough and professional.',
            date: '2024-03-15',
            status: 'pending',
            response: ''
        },
        {
            id: 2,
            customerName: 'Michael Brown',
            service: 'General Checkup',
            rating: 4,
            feedback: 'Good experience overall. Wait time could be shorter.',
            date: '2024-03-14',
            status: 'responded',
            response: 'Thank you for your feedback. We are working on improving our scheduling system.'
        },
        {
            id: 3,
            customerName: 'Emily Davis',
            service: 'Dental Care',
            rating: 3,
            feedback: 'Average service, but the facility is clean and modern.',
            date: '2024-03-13',
            status: 'archived',
            response: 'We appreciate your honest feedback.'
        }
    ];

    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Initialize table
    function initializeTable() {
        const tbody = document.querySelector('.feedbacks-table tbody');
        tbody.innerHTML = ''; // Clear existing content

        feedbacks.forEach(feedback => {
            const row = createFeedbackRow(feedback);
            tbody.appendChild(row);
        });
    }

    function createFeedbackRow(feedback) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${feedback.id}</td>
            <td>${feedback.customerName}</td>
            <td>${feedback.service}</td>
            <td>${createStarRating(feedback.rating)}</td>
            <td class="feedback-preview">${feedback.feedback}</td>
            <td>${formatDate(feedback.date)}</td>
            <td><span class="status-badge ${feedback.status}">${capitalizeFirst(feedback.status)}</span></td>
            <td class="actions">
                <button class="btn-icon" title="View Details" onclick="viewFeedback(${feedback.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" title="Respond" onclick="respondToFeedback(${feedback.id})">
                    <i class="fas fa-reply"></i>
                </button>
            </td>
        `;
        return row;
    }

    // Utility functions
    function createStarRating(rating) {
        const stars = Array(5).fill('<i class="far fa-star"></i>');
        for (let i = 0; i < rating; i++) {
            stars[i] = '<i class="fas fa-star"></i>';
        }
        return `<div class="rating-stars">${stars.join('')}</div>`;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Search and Filter functionality
    const searchInput = document.querySelector('.search-filters .search-bar input');
    const filters = document.querySelectorAll('.filter-select');
    const activeFiltersContainer = document.querySelector('.active-filters');

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const serviceFilter = document.getElementById('serviceFilter').value;
        const ratingFilter = document.getElementById('ratingFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        const filteredFeedbacks = feedbacks.filter(feedback => {
            const matchesSearch = feedback.customerName.toLowerCase().includes(searchTerm) ||
                feedback.feedback.toLowerCase().includes(searchTerm);
            const matchesService = !serviceFilter || feedback.service === serviceFilter;
            const matchesRating = !ratingFilter || feedback.rating === parseInt(ratingFilter);
            const matchesStatus = !statusFilter || feedback.status === statusFilter;

            return matchesSearch && matchesService && matchesRating && matchesStatus;
        });

        updateTable(filteredFeedbacks);
        updateActiveFilters();
    }

    function updateTable(filteredFeedbacks) {
        const tbody = document.querySelector('.feedbacks-table tbody');
        tbody.innerHTML = '';

        filteredFeedbacks.forEach(feedback => {
            const row = createFeedbackRow(feedback);
            tbody.appendChild(row);
        });

        // Update pagination info
        const paginationInfo = document.querySelector('.pagination-info');
        paginationInfo.innerHTML = `Showing <span>${filteredFeedbacks.length}</span> of <span>${feedbacks.length}</span> feedbacks`;
    }

    function updateActiveFilters() {
        activeFiltersContainer.innerHTML = '';

        const activeFilters = [];
        if (searchInput.value) {
            activeFilters.push({
                type: 'search',
                value: searchInput.value,
                label: `Search: ${searchInput.value}`
            });
        }

        filters.forEach(filter => {
            if (filter.value) {
                activeFilters.push({
                    type: filter.id,
                    value: filter.value,
                    label: `${filter.options[filter.selectedIndex].text}`
                });
            }
        });

        activeFilters.forEach(filter => {
            const filterTag = document.createElement('div');
            filterTag.className = 'filter-tag';
            filterTag.innerHTML = `
                ${filter.label}
                <i class="fas fa-times" data-filter-type="${filter.type}" data-filter-value="${filter.value}"></i>
            `;
            activeFiltersContainer.appendChild(filterTag);
        });
    }

    // Event listeners
    searchInput.addEventListener('input', applyFilters);
    filters.forEach(filter => filter.addEventListener('change', applyFilters));

    activeFiltersContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'I') {
            const filterType = e.target.dataset.filterType;
            if (filterType === 'search') {
                searchInput.value = '';
            } else {
                document.getElementById(filterType).value = '';
            }
            applyFilters();
        }
    });

    // Sorting functionality
    const sortableHeaders = document.querySelectorAll('th.sortable');
    let currentSort = { column: 'id', direction: 'asc' };

    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            const direction = currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc';

            sortableHeaders.forEach(h => h.classList.remove('asc', 'desc'));
            header.classList.add(direction);

            currentSort = { column, direction };
            sortFeedbacks();
        });
    });

    function sortFeedbacks() {
        const sortedFeedbacks = [...feedbacks].sort((a, b) => {
            let comparison = 0;
            const aVal = a[currentSort.column];
            const bVal = b[currentSort.column];

            if (aVal < bVal) comparison = -1;
            if (aVal > bVal) comparison = 1;

            return currentSort.direction === 'asc' ? comparison : -comparison;
        });

        updateTable(sortedFeedbacks);
    }

    // Modal functionality
    const modal = document.getElementById('feedbackModal');
    const closeButtons = modal.querySelectorAll('.modal-close, [data-action="close"]');
    const saveButton = modal.querySelector('[data-action="save"]');

    window.viewFeedback = function (id) {
        const feedback = feedbacks.find(f => f.id === id);
        if (!feedback) return;

        document.getElementById('customerName').textContent = feedback.customerName;
        document.getElementById('serviceName').textContent = feedback.service;
        document.getElementById('ratingStars').innerHTML = createStarRating(feedback.rating);
        document.getElementById('feedbackDate').textContent = formatDate(feedback.date);
        document.getElementById('feedbackText').textContent = feedback.feedback;
        document.getElementById('feedbackStatus').value = feedback.status;
        document.getElementById('responseText').value = feedback.response || '';

        modal.classList.add('active');
    };

    window.respondToFeedback = function (id) {
        viewFeedback(id);
        document.getElementById('responseText').focus();
    };

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });

    saveButton.addEventListener('click', () => {
        const status = document.getElementById('feedbackStatus').value;
        const response = document.getElementById('responseText').value;

        // Here you would typically make an API call to save the response
        console.log('Saving response:', { status, response });

        modal.classList.remove('active');
        // Refresh the table after saving
        initializeTable();
    });

    // Initialize the table on page load
    initializeTable();
}); 