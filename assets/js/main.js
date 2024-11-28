// Mobile sidebar functionality
class SidebarManager {
    constructor () {
        this.sidebar = document.querySelector('.sidebar');
        this.menuToggle = document.querySelector('.menu-toggle');
        this.navItems = document.querySelectorAll('.nav-item');
        this.isMobile = window.innerWidth <= 768;
        this.overlay = null;
        this.initializeEventListeners();
        this.createOverlay();
        this.handleResize(); // Initial check for mobile/desktop
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'sidebar-overlay';
        document.body.appendChild(this.overlay);

        // Add click event to overlay
        this.overlay.addEventListener('click', () => {
            this.closeSidebar();
        });
    }

    initializeEventListeners() {
        // Toggle sidebar on menu button click
        this.menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle nav item clicks on mobile
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (this.isMobile) {
                    this.closeSidebar();
                }
            });
        });
    }

    toggleSidebar() {
        const isActive = this.sidebar.classList.contains('active');

        if (!isActive) {
            // Opening sidebar
            this.sidebar.classList.add('active');
            this.menuToggle.classList.add('active');
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            // Closing sidebar
            this.closeSidebar();
        }
    }

    closeSidebar() {
        this.sidebar.classList.remove('active');
        this.menuToggle.classList.remove('active');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleResize() {
        this.isMobile = window.innerWidth <= 768;

        if (!this.isMobile) {
            // Reset everything on desktop
            this.closeSidebar();
            this.sidebar.style.transform = 'translateX(0)';
        } else {
            // Ensure proper state on mobile
            this.sidebar.style.transform = '';
            if (!this.sidebar.classList.contains('active')) {
                this.closeSidebar();
            }
        }
    }
}

class DashboardManager {
    constructor () {
        this.sidebarManager = new SidebarManager();
        this.initializeThemeToggle();
        this.initializeSearchBar();
        this.initializeLoadingStates();
        this.initializeNotifications();
        this.initializeUserProfile();
    }

    initializeThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    initializeSearchBar() {
        const searchInput = document.querySelector('.search-bar input');
        let debounceTimer;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });
    }

    handleSearch(query) {
        // Implement search functionality
        console.log('Searching for:', query);
    }

    initializeLoadingStates() {
        // Add loading states to dashboard cards
        const cards = document.querySelectorAll('.dashboard-card');
        cards.forEach(card => {
            const content = card.querySelector('.card-content');
            content.innerHTML = `
                <div class="skeleton" style="height: 2.5rem; width: 80%; margin-bottom: 0.5rem;"></div>
                <div class="skeleton" style="height: 1rem; width: 60%;"></div>
            `;

            // Simulate loading data
            setTimeout(() => {
                this.loadCardData(card);
            }, Math.random() * 1000 + 500);
        });
    }

    loadCardData(card) {
        // Simulate API call
        const data = {
            'Total Appointments': { value: 150, trend: '↑ 12%' },
            'Active Patients': { value: 85, trend: '↑ 8%' },
            'Pending Reviews': { value: 24, trend: '↓ 3%' }
        };

        const header = card.querySelector('.card-header').textContent;
        const content = card.querySelector('.card-content');

        content.innerHTML = `
            <h2>${data[header].value}</h2>
            <p>${data[header].trend}</p>
        `;

        // Add animation class
        content.classList.add('fade-in');
    }

    initializeNotifications() {
        const notificationsBtn = document.querySelector('.notifications');
        const notificationsDropdown = document.querySelector('.notifications-dropdown');
        const markAllRead = document.querySelector('.mark-all-read');
        const notificationItems = document.querySelectorAll('.notification-item');

        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsDropdown.classList.toggle('active');
            this.updateNotificationCount();
        });

        markAllRead.addEventListener('click', () => {
            notificationItems.forEach(item => {
                item.classList.remove('unread');
            });
            this.updateNotificationCount();
        });

        document.addEventListener('click', (e) => {
            if (!notificationsDropdown.contains(e.target)) {
                notificationsDropdown.classList.remove('active');
            }
        });
    }

    initializeUserProfile() {
        const userProfile = document.querySelector('.user-profile');
        const userDropdown = document.querySelector('.user-dropdown');

        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }

    updateNotificationCount() {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        const countElement = document.querySelector('.notifications-count');

        if (unreadCount === 0) {
            countElement.style.display = 'none';
        } else {
            countElement.style.display = 'block';
            countElement.textContent = unreadCount;
        }
    }
}

// Initialize only once
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
}); 