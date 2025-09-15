import { BaseComponent } from 'fiberwise-web-components';

class MultiUserApp extends BaseComponent {
    constructor() {
        super();
        this.currentUser = null;
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.getCurrentUser();
        this.render();
    }

    async getCurrentUser() {
        try {
            const response = await fetch('/api/user/current');
            this.currentUser = await response.json();
        } catch (error) {
            console.error('Failed to get current user:', error);
        }
    }

    async createMessage() {
        const messageText = this.querySelector('#messageText').value;
        const category = this.querySelector('#category').value;
        const userNote = this.querySelector('#userNote').value;

        if (!messageText) {
            this.showError('Message text is required');
            return;
        }

        try {
            const response = await fetch('/api/models/user_messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message_text: messageText,
                    message_category: category,
                    user_note: userNote
                })
            });

            if (response.ok) {
                this.showSuccess('Message created successfully!');
                this.querySelector('#messageText').value = '';
                this.querySelector('#userNote').value = '';
                this.loadUserMessages();
            } else {
                throw new Error('Failed to create message');
            }
        } catch (error) {
            this.showError('Failed to create message: ' + error.message);
        }
    }

    async loadUserMessages() {
        try {
            const response = await fetch('/api/models/user_messages');
            const messages = await response.json();
            this.renderMessages(messages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    renderMessages(messages) {
        const container = this.querySelector('#messagesContainer');
        if (!messages || messages.length === 0) {
            container.innerHTML = '<p class="text-muted">No messages yet. Create your first message!</p>';
            return;
        }

        container.innerHTML = messages.map(message => `
            <div class="card mb-2">
                <div class="card-body">
                    <h6 class="card-title">
                        ${message.message_category} 
                        <small class="text-muted">${new Date(message.created_at).toLocaleString()}</small>
                    </h6>
                    <p class="card-text">${message.message_text}</p>
                    ${message.user_note ? `<small class="text-muted">Note: ${message.user_note}</small>` : ''}
                </div>
            </div>
        `).join('');
    }

    render() {
        this.innerHTML = `
            <div class="container-fluid p-4">
                <div class="row">
                    <div class="col-12">
                        <h2>Multi-User Test App</h2>
                        <div class="alert alert-info">
                            <strong>Current User:</strong> ${this.currentUser?.email || 'Not logged in'} 
                            <small>(ID: ${this.currentUser?.id || 'unknown'})</small>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5>Create Message</h5>
                                <small class="text-muted">Messages are isolated per user (user_isolation: enforced)</small>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="messageText" class="form-label">Message Text</label>
                                    <textarea id="messageText" class="form-control" rows="3" 
                                              placeholder="Enter your message..."></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="category" class="form-label">Category</label>
                                    <select id="category" class="form-control">
                                        <option value="general">General</option>
                                        <option value="work">Work</option>
                                        <option value="personal">Personal</option>
                                        <option value="test">Test</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="userNote" class="form-label">Additional Note</label>
                                    <input type="text" id="userNote" class="form-control" 
                                           placeholder="Optional note...">
                                </div>
                                <button onclick="this.getRootNode().host.createMessage()" 
                                        class="btn btn-primary">
                                    Create Message
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5>Your Messages</h5>
                                <button onclick="this.getRootNode().host.loadUserMessages()" 
                                        class="btn btn-sm btn-outline-secondary">
                                    Refresh
                                </button>
                            </div>
                            <div class="card-body" id="messagesContainer">
                                <!-- Messages will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5>Testing Instructions</h5>
                            </div>
                            <div class="card-body">
                                <p><strong>To test user isolation:</strong></p>
                                <ol>
                                    <li>Login as User A and create some messages</li>
                                    <li>Logout and login as User B</li>
                                    <li>Create different messages as User B</li>
                                    <li>Notice that each user only sees their own messages</li>
                                    <li>Check the database - all records have different user_id values</li>
                                </ol>
                                <p class="mb-0">
                                    <strong>Expected behavior:</strong> With <code>user_isolation: "enforced"</code>, 
                                    each user's data is completely separated and they cannot access other users' messages.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="alert-container"></div>
            </div>
        `;
        
        // Load messages after render
        setTimeout(() => this.loadUserMessages(), 100);
    }

    showError(message) {
        const container = this.querySelector('#alert-container');
        container.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show mt-3">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    showSuccess(message) {
        const container = this.querySelector('#alert-container');
        container.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show mt-3">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }
}

customElements.define('multi-user-app', MultiUserApp);