// Dashboard API Integration for Hotelogix-style Interface
class DashboardManager {
    constructor() {
        this.socket = io();
        this.init();
    }
    
    async init() {
        await this.loadSystemStatus();
        await this.loadRecentRequests();
        this.setupRealTimeUpdates();
        this.setupNavigation();
    }
    
    async loadSystemStatus() {
        try {
            const response = await fetch('/api/system/status');
            const data = await response.json();
            
            if (data.success) {
                this.updateSystemMetrics(data.data);
                this.updateServiceStatus(data.data);
            }
        } catch (error) {
            console.error('Failed to load system status:', error);
            this.loadMockData();
        }
    }
    
    updateSystemMetrics(statusData) {
        // Calculate metrics from system status
        const operationalServices = statusData.filter(s => s.status === 'operational').length;
        const totalServices = statusData.length;
        const uptime = (operationalServices / totalServices * 100).toFixed(1);
        
        // Update KPI cards
        const metrics = {
            revenue: '$24,350',
            occupancy: '87%',
            alerts: statusData.filter(s => s.status !== 'operational').length.toString(),
            uptime: uptime + '%'
        };
        
        Object.entries(metrics).forEach(([key, value]) => {
            const element = document.querySelector(`[data-metric="${key}"]`);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    updateServiceStatus(statusData) {
        // Update service status indicators in sidebar
        statusData.forEach(service => {
            const indicator = document.querySelector(`[data-service="${service.serviceName.toLowerCase().replace(/\s+/g, '-')}"]`);
            if (indicator) {
                indicator.className = `status-indicator status-${service.status}`;
            }
        });
        
        // Update main dashboard grid
        const gridContainer = document.querySelector('.dashboard-grid');
        if (gridContainer) {
            this.updateDashboardGrid(statusData);
        }
    }
    
    updateDashboardGrid(statusData) {
        // Update the main status grid to show real service data
        const gridItems = document.querySelectorAll('.grid-item');
        
        statusData.forEach((service, index) => {
            if (gridItems[index]) {
                const statusBadge = gridItems[index].querySelector('.status-badge');
                const serviceName = gridItems[index].querySelector('.service-name');
                const uptimeDisplay = gridItems[index].querySelector('.uptime-display');
                
                if (statusBadge) {
                    statusBadge.className = `status-badge ${service.status}`;
                    statusBadge.textContent = service.status.charAt(0).toUpperCase() + service.status.slice(1);
                }
                
                if (serviceName) {
                    serviceName.textContent = service.serviceName;
                }
                
                if (uptimeDisplay && service.uptime) {
                    uptimeDisplay.textContent = `${service.uptime}% uptime`;
                }
            }
        });
    }
    
    async loadRecentRequests() {
        // Load recent MAC requests and support tickets
        try {
            // Mock data for now - in real implementation, would fetch from API
            const mockRequests = [
                {
                    id: 'MAC-2024-015',
                    brand: 'PVT Hostel - Main',
                    type: 'Add Service',
                    priority: 'High',
                    status: 'In Progress',
                    requester: 'Sarah Johnson',
                    created: '30 mins ago',
                    updated: '5 mins ago'
                },
                {
                    id: 'MAC-2024-012',
                    brand: 'StudioNYNE',
                    type: 'Add Service',
                    priority: 'Medium',
                    status: 'Pending',
                    requester: 'Mike Chen',
                    created: '4 hours ago',
                    updated: '1 hour ago'
                },
                {
                    id: 'TKT-2024-002',
                    brand: 'PVT Hostel - East',
                    type: 'Payment Gateway',
                    priority: 'Low',
                    status: 'Resolved',
                    requester: 'Alex Rivera',
                    created: '1 day ago',
                    updated: '6 hours ago'
                }
            ];
            
            this.renderRequestsTable(mockRequests);
            
        } catch (error) {
            console.error('Failed to load recent requests:', error);
        }
    }
    
    renderRequestsTable(requests) {
        const tableBody = document.querySelector('.recent-tickets tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = requests.map(request => `
            <tr>
                <td><strong>${request.id}</strong></td>
                <td>${request.brand}</td>
                <td>${request.type}</td>
                <td><span class="status-badge ${request.priority.toLowerCase()}">${request.priority}</span></td>
                <td><span class="status-badge ${request.status.toLowerCase().replace(' ', '-')}">${request.status}</span></td>
                <td>${request.requester}</td>
                <td>${request.created}</td>
                <td>${request.updated}</td>
            </tr>
        `).join('');
    }
    
    setupRealTimeUpdates() {
        // Listen for real-time updates via Socket.io
        this.socket.on('system-status-update', (data) => {
            this.updateSystemMetrics(data);
            this.updateServiceStatus(data);
        });
        
        this.socket.on('new-mac-request', (request) => {
            this.addRequestToTable(request);
        });
        
        this.socket.on('request-status-update', (update) => {
            this.updateRequestStatus(update);
        });
    }
    
    addRequestToTable(request) {
        const tableBody = document.querySelector('.recent-tickets tbody');
        if (!tableBody) return;
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><strong>${request.ticketNumber || request.id}</strong></td>
            <td>${request.brand || 'PVT Group'}</td>
            <td>${request.type || request.requestType}</td>
            <td><span class="status-badge ${request.priority || 'medium'}">${request.priority || 'Medium'}</span></td>
            <td><span class="status-badge ${request.status}">${request.status}</span></td>
            <td>${request.requesterName || 'Unknown'}</td>
            <td>Just now</td>
            <td>Just now</td>
        `;
        
        // Add to top of table
        tableBody.insertBefore(newRow, tableBody.firstChild);
        
        // Remove last row if table gets too long
        if (tableBody.children.length > 10) {
            tableBody.removeChild(tableBody.lastChild);
        }
    }
    
    updateRequestStatus(update) {
        // Find and update specific request in table
        const rows = document.querySelectorAll('.recent-tickets tbody tr');
        rows.forEach(row => {
            const idCell = row.querySelector('td strong');
            if (idCell && idCell.textContent === update.id) {
                const statusCell = row.querySelectorAll('td')[4];
                if (statusCell) {
                    statusCell.innerHTML = `<span class="status-badge ${update.status.toLowerCase().replace(' ', '-')}">${update.status}</span>`;
                }
                
                const updatedCell = row.querySelectorAll('td')[7];
                if (updatedCell) {
                    updatedCell.textContent = 'Just now';
                }
            }
        });
    }
    
    setupNavigation() {
        // Setup sidebar navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.getAttribute('data-page');
                if (target) {
                    this.navigateTo(target);
                }
            });
        });
    }
    
    navigateTo(page) {
        switch(page) {
            case 'dashboard':
                window.location.href = '/dashboard';
                break;
            case 'support':
                window.location.href = '/support';
                break;
            case 'index':
                window.location.href = '/index';
                break;
            case 'mac-requests':
                // Open MAC request form or list
                this.openMACRequestModal();
                break;
            default:
                console.log(`Navigate to ${page}`);
        }
    }
    
    openMACRequestModal() {
        // Create and show MAC request modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Create MAC Request</h3>
                    <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="mac-request-form">
                        <div class="form-group">
                            <label>Request Type</label>
                            <select name="requestType" required>
                                <option value="">Select Type</option>
                                <option value="move">Move</option>
                                <option value="add">Add</option>
                                <option value="change">Change</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Priority</label>
                            <select name="priority" required>
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="description" rows="4" required></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                            <button type="submit">Create Request</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#mac-request-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitMACRequest(new FormData(form));
            modal.remove();
        });
    }
    
    async submitMACRequest(formData) {
        try {
            const response = await fetch('/api/mac-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Add to table immediately
                this.addRequestToTable(result.data);
                
                // Show success notification
                this.showNotification('MAC Request created successfully', 'success');
            } else {
                this.showNotification('Failed to create MAC Request', 'error');
            }
        } catch (error) {
            console.error('Failed to submit MAC request:', error);
            this.showNotification('Failed to create MAC Request', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    loadMockData() {
        // Fallback mock data if API fails
        const mockMetrics = {
            revenue: '$24,350',
            occupancy: '87%',
            alerts: '2',
            uptime: '99.8%'
        };
        
        Object.entries(mockMetrics).forEach(([key, value]) => {
            const element = document.querySelector(`[data-metric="${key}"]`);
            if (element) {
                element.textContent = value;
            }
        });
    }
}

// Global functions for backwards compatibility
function loadDashboardData() {
    if (window.dashboardManager) {
        window.dashboardManager.loadSystemStatus();
    }
}

function updateTimeStamps() {
    // Update relative time stamps in the interface
    const timeElements = document.querySelectorAll('[data-timestamp]');
    timeElements.forEach(element => {
        const timestamp = element.getAttribute('data-timestamp');
        if (timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            // Simple relative time formatting
            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            let relativeTime;
            if (minutes < 1) {
                relativeTime = 'Just now';
            } else if (minutes < 60) {
                relativeTime = `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
            } else if (hours < 24) {
                relativeTime = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
            } else {
                relativeTime = `${days} day${days !== 1 ? 's' : ''} ago`;
            }
            
            element.textContent = relativeTime;
        }
    });
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});