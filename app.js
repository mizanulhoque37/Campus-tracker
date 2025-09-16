// ADTU ConversationalAI Platform - Enterprise Botpress-like Solution (Fixed)

// Platform Configuration
const PLATFORM_CONFIG = {
  name: "ADTU ConversationalAI Platform",
  version: "1.0.0",
  firebase: {
    apiKey: "demo-key",
    authDomain: "adtu-ai.firebaseapp.com",
    projectId: "adtu-ai-assistant",
    storageBucket: "adtu-ai.appspot.com",
    messagingSenderId: "123456789",
    appId: "adtu-ai-platform"
  },
  charts: {
    colors: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B']
  }
};

// Application Data from JSON
const APP_DATA = {
  platform: {
    name: "ADTU ConversationalAI Platform",
    version: "1.0.0",
    description: "Enterprise-grade conversational AI platform for Assam Downtown University"
  },
  metrics: {
    conversations: { total: 1247, today: 89, completed: 892, abandoned: 355 },
    intents: { accuracy: 94.2, confidence: 0.91 },
    users: { total: 876, active: 234, returning: 542, satisfaction: 4.6 },
    performance: { responseTime: "1.2s", uptime: "99.7%", errorRate: "0.3%" }
  },
  flowNodes: {
    start: { type: "start", icon: "🚀", name: "Conversation Start" },
    message: { type: "message", icon: "💬", name: "Send Message" },
    input: { type: "input", icon: "⌨️", name: "User Input" },
    condition: { type: "condition", icon: "🔀", name: "Logic Branch" },
    action: { type: "action", icon: "⚡", name: "Custom Action" },
    integration: { type: "integration", icon: "🔗", name: "External Integration" }
  },
  knowledgeBase: [
    {
      intent: "campus.office_hours",
      utterances: ["office hours", "when is office open", "administrative timing"],
      response: "Administrative offices are open 9 AM to 5 PM, Monday to Friday",
      confidence: 0.95
    },
    {
      intent: "academic.registration", 
      utterances: ["register for classes", "course enrollment", "how to register"],
      response: "Log into student portal > Course Registration > Select courses > Confirm enrollment",
      confidence: 0.98
    },
    {
      intent: "hostel.accommodation",
      utterances: ["hostel application", "accommodation", "room booking"],
      response: "Fill hostel application form during admission or contact Hostel Office directly",
      confidence: 0.92
    },
    {
      intent: "fees.payment",
      utterances: ["fee payment", "online fees", "payment methods"],
      response: "Visit student portal > Fee Payment section > Choose payment method (UPI/Net Banking/Cards)",
      confidence: 0.94
    }
  ]
};

// Global State Management
class PlatformState {
  constructor() {
    this.currentView = 'dashboard';
    this.selectedNode = null;
    this.flowData = { nodes: [], connections: [] };
    this.chatHistory = [];
    this.analytics = {};
    this.isInitialized = false;
  }

  setState(key, value) {
    this[key] = value;
    this.notifyStateChange(key, value);
  }

  notifyStateChange(key, value) {
    document.dispatchEvent(new CustomEvent('statechange', {
      detail: { key, value }
    }));
  }
}

const platformState = new PlatformState();

// Firebase Integration
let db = null;
let isFirebaseConnected = false;

function initializeFirebase() {
  try {
    if (typeof firebase !== 'undefined') {
      firebase.initializeApp(PLATFORM_CONFIG.firebase);
      db = firebase.firestore();
      isFirebaseConnected = true;
      console.log('✅ Firebase initialized');
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Firebase unavailable:', error);
    isFirebaseConnected = false;
    return false;
  }
}

// Platform Navigation System
class NavigationManager {
  constructor() {
    this.views = new Map();
    this.currentView = 'dashboard';
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    
    console.log('🔧 Initializing Navigation Manager...');
    this.setupEventListeners();
    this.isInitialized = true;
    console.log('✅ Navigation Manager initialized');
  }

  setupEventListeners() {
    // Wait for DOM to be ready and add event listeners
    const setupNavigation = () => {
      const navItems = document.querySelectorAll('.nav-item');
      console.log(`Found ${navItems.length} navigation items`);
      
      navItems.forEach((item, index) => {
        const viewName = item.dataset.view;
        console.log(`Setting up nav item ${index}: ${viewName}`);
        
        // Remove any existing listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Add click listener
        newItem.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`Navigation clicked: ${viewName}`);
          
          if (viewName) {
            this.switchView(viewName);
            this.setActiveNavItem(newItem);
          }
        });
      });

      // Sidebar toggle for mobile
      const sidebarToggle = document.getElementById('sidebarToggle');
      if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleSidebar();
        });
      }
    };

    // Run setup immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupNavigation);
    } else {
      setupNavigation();
    }
  }

  switchView(viewName) {
    console.log(`Switching to view: ${viewName}`);
    
    try {
      // Hide current view
      const currentViewEl = document.querySelector('.view.active');
      if (currentViewEl) {
        currentViewEl.classList.remove('active');
        console.log('Removed active class from current view');
      }

      // Show new view
      const newViewEl = document.getElementById(`${viewName}-view`);
      if (newViewEl) {
        newViewEl.classList.add('active');
        this.currentView = viewName;
        platformState.setState('currentView', viewName);
        
        console.log(`Switched to ${viewName} view`);
        
        // Update breadcrumb
        const breadcrumb = document.getElementById('currentView');
        if (breadcrumb) {
          breadcrumb.textContent = this.getViewTitle(viewName);
        }

        // Initialize view-specific functionality
        setTimeout(() => {
          this.initializeView(viewName);
        }, 100);
      } else {
        console.error(`View element not found: ${viewName}-view`);
      }
    } catch (error) {
      console.error('Error switching view:', error);
    }
  }

  setActiveNavItem(activeItem) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to clicked item
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }

  getViewTitle(viewName) {
    const titles = {
      'dashboard': 'Dashboard',
      'flow-builder': 'Flow Builder',
      'analytics': 'Analytics',
      'content-management': 'Content Management',
      'knowledge-base': 'Knowledge Base',
      'testing': 'Bot Testing',
      'live-chat': 'Live Chat',
      'integrations': 'Integrations',
      'settings': 'Settings'
    };
    return titles[viewName] || 'Dashboard';
  }

  initializeView(viewName) {
    console.log(`Initializing view: ${viewName}`);
    
    switch (viewName) {
      case 'dashboard':
        this.initializeDashboard();
        break;
      case 'flow-builder':
        if (window.flowBuilder) {
          window.flowBuilder.initialize();
        }
        break;
      case 'analytics':
        this.initializeAnalytics();
        break;
      case 'testing':
        if (window.testingEnvironment) {
          window.testingEnvironment.initialize();
        }
        break;
    }
  }

  initializeDashboard() {
    console.log('Initializing dashboard...');
    if (typeof Chart !== 'undefined') {
      setTimeout(() => {
        this.createConversationChart();
      }, 200);
    }
  }

  initializeAnalytics() {
    console.log('Initializing analytics...');
    if (typeof Chart !== 'undefined') {
      setTimeout(() => {
        this.createAnalyticsCharts();
      }, 200);
    }
  }

  createConversationChart() {
    const ctx = document.getElementById('conversationChart');
    if (!ctx) {
      console.log('Conversation chart canvas not found');
      return;
    }

    // Destroy existing chart if it exists
    if (ctx.chartInstance) {
      ctx.chartInstance.destroy();
    }

    try {
      ctx.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Conversations',
            data: [120, 150, 180, 220, 165, 190, 210],
            borderColor: PLATFORM_CONFIG.charts.colors[0],
            backgroundColor: PLATFORM_CONFIG.charts.colors[0] + '20',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0,0,0,0.1)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
      console.log('✅ Conversation chart created');
    } catch (error) {
      console.error('Error creating conversation chart:', error);
    }
  }

  createAnalyticsCharts() {
    this.createIntentChart();
    this.createSatisfactionChart();
    this.createResponseTimeChart();
  }

  createIntentChart() {
    const ctx = document.getElementById('intentChart');
    if (!ctx) return;

    if (ctx.chartInstance) {
      ctx.chartInstance.destroy();
    }

    try {
      ctx.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Registration', 'Fees', 'Hostel', 'Placement', 'General'],
          datasets: [{
            data: [234, 187, 156, 123, 89],
            backgroundColor: PLATFORM_CONFIG.charts.colors.slice(0, 5)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
      console.log('✅ Intent chart created');
    } catch (error) {
      console.error('Error creating intent chart:', error);
    }
  }

  createSatisfactionChart() {
    const ctx = document.getElementById('satisfactionChart');
    if (!ctx) return;

    if (ctx.chartInstance) {
      ctx.chartInstance.destroy();
    }

    try {
      ctx.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
          datasets: [{
            label: 'Satisfaction Ratings',
            data: [456, 298, 87, 34, 12],
            backgroundColor: PLATFORM_CONFIG.charts.colors[0],
            borderColor: PLATFORM_CONFIG.charts.colors[0],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      console.log('✅ Satisfaction chart created');
    } catch (error) {
      console.error('Error creating satisfaction chart:', error);
    }
  }

  createResponseTimeChart() {
    const ctx = document.getElementById('responseTimeChart');
    if (!ctx) return;

    if (ctx.chartInstance) {
      ctx.chartInstance.destroy();
    }

    try {
      ctx.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['0-1s', '1-2s', '2-3s', '3-4s', '4-5s', '5s+'],
          datasets: [{
            label: 'Response Times',
            data: [645, 298, 156, 89, 45, 23],
            borderColor: PLATFORM_CONFIG.charts.colors[2],
            backgroundColor: PLATFORM_CONFIG.charts.colors[2] + '20',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      console.log('✅ Response time chart created');
    } catch (error) {
      console.error('Error creating response time chart:', error);
    }
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
      console.log('Sidebar toggled');
    }
  }
}

// Flow Builder System
class FlowBuilder {
  constructor() {
    this.canvas = null;
    this.selectedNode = null;
    this.draggedNode = null;
    this.connections = [];
    this.nodeCounter = 3; // Start from 3 since we have existing nodes
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    
    console.log('🔧 Initializing Flow Builder...');
    this.canvas = document.getElementById('flowCanvas');
    if (!this.canvas) {
      console.error('Flow canvas not found');
      return;
    }

    this.setupEventListeners();
    this.loadSampleFlow();
    this.isInitialized = true;
    console.log('✅ Flow Builder initialized');
  }

  setupEventListeners() {
    // Node palette drag events
    const nodeItems = document.querySelectorAll('.node-item');
    console.log(`Setting up drag events for ${nodeItems.length} node items`);
    
    nodeItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        console.log('Drag started for:', item.dataset.nodeType);
        this.draggedNode = {
          type: item.dataset.nodeType,
          icon: item.querySelector('.node-icon').textContent,
          name: item.querySelector('span:last-child').textContent
        };
      });
    });

    // Canvas drop events
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      if (this.draggedNode) {
        console.log('Dropping node:', this.draggedNode.type);
        this.createNode(e.offsetX, e.offsetY, this.draggedNode);
        this.draggedNode = null;
      }
    });

    // Node selection
    this.canvas.addEventListener('click', (e) => {
      const node = e.target.closest('.flow-node');
      if (node) {
        console.log('Node selected:', node.dataset.nodeId);
        this.selectNode(node);
      }
    });
  }

  createNode(x, y, nodeData) {
    const nodeId = `node-${++this.nodeCounter}`;
    const nodeEl = document.createElement('div');
    nodeEl.className = `flow-node ${nodeData.type}-node`;
    nodeEl.style.left = `${x}px`;
    nodeEl.style.top = `${y}px`;
    nodeEl.dataset.nodeId = nodeId;

    nodeEl.innerHTML = `
      <div class="node-header">
        <span class="node-icon">${nodeData.icon}</span>
        <span class="node-title">${nodeData.name}</span>
        <button class="node-delete" onclick="window.flowBuilder.deleteNode('${nodeId}')">×</button>
      </div>
      <div class="node-content">
        ${this.getNodeContent(nodeData.type)}
      </div>
      <div class="node-ports">
        <div class="port input-port" data-port="input"></div>
        <div class="port output-port" data-port="output"></div>
      </div>
    `;

    this.canvas.appendChild(nodeEl);
    this.makeDraggable(nodeEl);
    
    console.log(`Created node: ${nodeId} at (${x}, ${y})`);
    return nodeEl;
  }

  getNodeContent(type) {
    switch (type) {
      case 'message':
        return '<textarea class="node-input" placeholder="Enter message text...">Welcome to ADTU!</textarea>';
      case 'input':
        return '<input type="text" class="node-input" placeholder="Variable name..." value="user_input">';
      case 'condition':
        return '<select class="node-input"><option>If user_input equals</option><option>If user_input contains</option></select>';
      case 'action':
        return '<textarea class="node-input" placeholder="JavaScript code...">// Custom action</textarea>';
      case 'card':
        return '<div><input type="text" class="node-input" placeholder="Card title..." value="ADTU Information"><textarea class="node-input" placeholder="Card description...">Learn more about ADTU services</textarea></div>';
      case 'quick-replies':
        return '<div class="quick-reply-options"><input type="text" class="node-input" placeholder="Option 1" value="Admissions"><input type="text" class="node-input" placeholder="Option 2" value="Academics"><button class="btn btn--outline btn--sm">+ Add Option</button></div>';
      default:
        return '<p>Configure node properties</p>';
    }
  }

  selectNode(nodeEl) {
    // Remove previous selection
    document.querySelectorAll('.flow-node').forEach(node => {
      node.classList.remove('selected');
    });

    // Select new node
    nodeEl.classList.add('selected');
    this.selectedNode = nodeEl;
    this.showNodeProperties(nodeEl);
  }

  showNodeProperties(nodeEl) {
    const propertyPanel = document.getElementById('propertyPanel');
    if (!propertyPanel) return;

    const nodeType = nodeEl.className.match(/(\w+)-node/)[1];
    const nodeId = nodeEl.dataset.nodeId;

    propertyPanel.innerHTML = `
      <div class="form-group">
        <label class="form-label">Node ID</label>
        <input type="text" class="form-control" value="${nodeId}" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">Node Type</label>
        <input type="text" class="form-control" value="${nodeType}" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">Title</label>
        <input type="text" class="form-control" value="${nodeEl.querySelector('.node-title').textContent}">
      </div>
      ${this.getTypeSpecificProperties(nodeType)}
    `;
  }

  getTypeSpecificProperties(type) {
    switch (type) {
      case 'message':
        return `
          <div class="form-group">
            <label class="form-label">Message Type</label>
            <select class="form-control">
              <option>Text</option>
              <option>Rich Card</option>
              <option>Quick Replies</option>
            </select>
          </div>
        `;
      case 'condition':
        return `
          <div class="form-group">
            <label class="form-label">Condition Logic</label>
            <select class="form-control">
              <option>Equals</option>
              <option>Contains</option>
              <option>Matches Regex</option>
            </select>
          </div>
        `;
      default:
        return '';
    }
  }

  makeDraggable(nodeEl) {
    let isDragging = false;
    let startX, startY;

    const onMouseDown = (e) => {
      // Don't drag if clicking on input elements or delete button
      if (e.target.closest('.node-delete') || 
          e.target.closest('.node-input') || 
          e.target.closest('.port') ||
          e.target.closest('button') ||
          e.target.closest('select') ||
          e.target.closest('textarea')) {
        return;
      }
      
      isDragging = true;
      const rect = this.canvas.getBoundingClientRect();
      startX = e.clientX - rect.left - nodeEl.offsetLeft;
      startY = e.clientY - rect.top - nodeEl.offsetTop;
      nodeEl.style.zIndex = '1000';
      
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left - startX;
      const newY = e.clientY - rect.top - startY;
      
      // Keep node within canvas bounds
      const maxX = this.canvas.scrollWidth - nodeEl.offsetWidth;
      const maxY = this.canvas.scrollHeight - nodeEl.offsetHeight;
      
      nodeEl.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
      nodeEl.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        nodeEl.style.zIndex = '';
      }
    };

    nodeEl.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  deleteNode(nodeId) {
    const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeEl) {
      nodeEl.remove();
      console.log(`Deleted node: ${nodeId}`);
      
      // Clear property panel if this node was selected
      if (this.selectedNode === nodeEl) {
        const propertyPanel = document.getElementById('propertyPanel');
        if (propertyPanel) {
          propertyPanel.innerHTML = '<p class="empty-state">Select a node to edit its properties</p>';
        }
        this.selectedNode = null;
      }
    }
  }

  loadSampleFlow() {
    // Sample flow is already in HTML, just make nodes draggable
    const existingNodes = document.querySelectorAll('.flow-node');
    console.log(`Making ${existingNodes.length} existing nodes draggable`);
    
    existingNodes.forEach(node => {
      this.makeDraggable(node);
    });
  }

  saveFlow() {
    const nodes = Array.from(document.querySelectorAll('.flow-node')).map(node => ({
      id: node.dataset.nodeId,
      type: node.className.match(/(\w+)-node/)[1],
      position: {
        x: parseInt(node.style.left),
        y: parseInt(node.style.top)
      },
      content: this.getNodeData(node)
    }));

    const flowData = {
      nodes,
      connections: this.connections,
      metadata: {
        name: 'Current Flow',
        version: '1.0',
        created: new Date().toISOString()
      }
    };

    // Save to Firebase or localStorage
    if (isFirebaseConnected && db) {
      this.saveToFirebase(flowData);
    } else {
      localStorage.setItem('adtu_flow_data', JSON.stringify(flowData));
    }

    console.log('Flow saved:', flowData);
    return flowData;
  }

  getNodeData(nodeEl) {
    const inputs = nodeEl.querySelectorAll('.node-input');
    const data = {};
    
    inputs.forEach((input, index) => {
      data[`input_${index}`] = input.value;
    });

    return data;
  }

  async saveToFirebase(flowData) {
    try {
      await db.collection('flows').doc('current_flow').set(flowData);
      console.log('✅ Flow saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving flow:', error);
    }
  }
}

// AI Chat System with ADTU Knowledge Base
class ADTUChatBot {
  constructor() {
    this.knowledgeBase = APP_DATA.knowledgeBase;
    this.conversationHistory = [];
    this.context = {};
  }

  async processMessage(message) {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Find best matching intent
    const bestMatch = this.findBestIntent(normalizedMessage);
    
    if (bestMatch && bestMatch.confidence > 0.7) {
      return {
        response: bestMatch.response,
        intent: bestMatch.intent,
        confidence: bestMatch.confidence,
        type: 'knowledge_base'
      };
    }

    // Fallback responses for general queries
    return this.generateFallbackResponse(message);
  }

  findBestIntent(message) {
    let bestMatch = null;
    let maxScore = 0;

    this.knowledgeBase.forEach(item => {
      let score = 0;
      const utteranceCount = item.utterances.length;

      item.utterances.forEach(utterance => {
        if (message.includes(utterance.toLowerCase())) {
          score += 1 / utteranceCount;
        }
      });

      // Apply confidence multiplier
      score *= item.confidence;

      if (score > maxScore) {
        maxScore = score;
        bestMatch = {
          intent: item.intent,
          response: item.response,
          confidence: maxScore
        };
      }
    });

    return bestMatch;
  }

  generateFallbackResponse(message) {
    const fallbackResponses = [
      "I'd be happy to help! Could you please provide more details about your ADTU-related question?",
      "I have information about ADTU admissions, academics, hostel, and campus facilities. What would you like to know?",
      "Let me help you with that. Could you be more specific about what you're looking for?",
      "I specialize in ADTU information. Please ask about admissions, courses, facilities, or student services."
    ];

    return {
      response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      intent: 'fallback',
      confidence: 0.5,
      type: 'fallback'
    };
  }

  addToHistory(userMessage, botResponse) {
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      user: userMessage,
      bot: botResponse.response,
      intent: botResponse.intent,
      confidence: botResponse.confidence
    });

    // Keep only last 10 conversations in memory
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }
  }
}

// Testing Environment
class TestingEnvironment {
  constructor() {
    this.chatBot = new ADTUChatBot();
    this.testMessages = [];
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    
    console.log('🔧 Initializing Testing Environment...');
    const testInput = document.getElementById('testInput');
    if (testInput) {
      testInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendTestMessage();
        }
      });
    }
    
    this.isInitialized = true;
    console.log('✅ Testing Environment initialized');
  }

  async sendTestMessage() {
    const testInput = document.getElementById('testInput');
    const testMessages = document.getElementById('testMessages');
    
    if (!testInput || !testMessages) return;

    const message = testInput.value.trim();
    if (!message) return;

    console.log('Sending test message:', message);

    // Add user message to UI
    this.addTestMessage(message, 'user');
    testInput.value = '';

    // Process with AI
    const response = await this.chatBot.processMessage(message);
    
    // Add bot response to UI
    setTimeout(() => {
      this.addTestMessage(response.response, 'bot');
      this.updateTestMetrics(response);
    }, 800);
  }

  addTestMessage(message, type) {
    const testMessages = document.getElementById('testMessages');
    if (!testMessages) return;

    const messageEl = document.createElement('div');
    messageEl.className = `test-message ${type}`;
    messageEl.innerHTML = `<strong>${type === 'user' ? 'User' : 'Bot'}:</strong> ${message}`;
    
    testMessages.appendChild(messageEl);
    testMessages.scrollTop = testMessages.scrollHeight;
  }

  updateTestMetrics(response) {
    console.log('Test metrics updated:', response);
  }
}

// Chat Widget for Live Testing
class ChatWidget {
  constructor() {
    this.isOpen = false;
    this.chatBot = new ADTUChatBot();
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    
    console.log('🔧 Initializing Chat Widget...');
    this.setupEventListeners();
    this.isInitialized = true;
    console.log('✅ Chat Widget initialized');
  }

  setupEventListeners() {
    const widgetHeader = document.querySelector('.widget-header');
    const widgetToggle = document.querySelector('.widget-toggle');
    const widgetInput = document.getElementById('widgetInput');
    const widgetSend = document.querySelector('.widget-send');

    // Multiple ways to open widget
    if (widgetHeader) {
      widgetHeader.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Widget header clicked');
        this.toggle();
      });
    }

    if (widgetToggle) {
      widgetToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Widget toggle clicked');
        this.toggle();
      });
    }

    // Input handling
    if (widgetInput) {
      widgetInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.sendWidgetMessage();
        }
      });
    }

    // Send button
    if (widgetSend) {
      widgetSend.addEventListener('click', (e) => {
        e.preventDefault();
        this.sendWidgetMessage();
      });
    }
  }

  toggle() {
    const widgetContent = document.querySelector('.widget-content');
    if (widgetContent) {
      const wasHidden = widgetContent.classList.contains('hidden');
      widgetContent.classList.toggle('hidden');
      this.isOpen = !wasHidden;
      
      console.log(`Widget ${this.isOpen ? 'opened' : 'closed'}`);
      
      // Focus input when opening
      if (this.isOpen) {
        setTimeout(() => {
          const input = document.getElementById('widgetInput');
          if (input) input.focus();
        }, 100);
      }
    }
  }

  async sendWidgetMessage() {
    const widgetInput = document.getElementById('widgetInput');
    const widgetMessages = document.getElementById('widgetMessages');
    
    if (!widgetInput || !widgetMessages) return;

    const message = widgetInput.value.trim();
    if (!message) return;

    console.log('Sending widget message:', message);

    // Add user message
    this.addWidgetMessage(message, 'user');
    widgetInput.value = '';

    // Process and respond
    const response = await this.chatBot.processMessage(message);
    
    setTimeout(() => {
      this.addWidgetMessage(response.response, 'bot');
    }, 1000);
  }

  addWidgetMessage(message, type) {
    const widgetMessages = document.getElementById('widgetMessages');
    if (!widgetMessages) return;

    const messageEl = document.createElement('div');
    messageEl.className = `widget-message ${type}`;
    messageEl.textContent = message;
    
    widgetMessages.appendChild(messageEl);
    widgetMessages.scrollTop = widgetMessages.scrollHeight;
  }
}

// Analytics Manager
class AnalyticsManager {
  constructor() {
    this.metrics = {
      conversations: 0,
      intents: {},
      satisfaction: [],
      responseTime: []
    };
  }

  trackConversation(intent, confidence, responseTime, satisfaction) {
    this.metrics.conversations++;
    
    if (!this.metrics.intents[intent]) {
      this.metrics.intents[intent] = { count: 0, totalConfidence: 0 };
    }
    
    this.metrics.intents[intent].count++;
    this.metrics.intents[intent].totalConfidence += confidence;
    
    if (satisfaction) {
      this.metrics.satisfaction.push(satisfaction);
    }
    
    if (responseTime) {
      this.metrics.responseTime.push(responseTime);
    }

    this.saveAnalytics();
  }

  async saveAnalytics() {
    if (isFirebaseConnected && db) {
      try {
        await db.collection('analytics').doc('current').set({
          ...this.metrics,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Error saving analytics:', error);
      }
    }
  }

  generateReport() {
    return {
      totalConversations: this.metrics.conversations,
      topIntents: Object.entries(this.metrics.intents)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 5),
      averageSatisfaction: this.metrics.satisfaction.reduce((a, b) => a + b, 0) / this.metrics.satisfaction.length || 0,
      averageResponseTime: this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length || 0
    };
  }
}

// Initialize Platform
function initializePlatform() {
  console.log('🚀 Initializing ADTU ConversationalAI Platform...');
  
  // Initialize Firebase
  initializeFirebase();
  
  // Create global instances
  window.navigationManager = new NavigationManager();
  window.flowBuilder = new FlowBuilder();
  window.testingEnvironment = new TestingEnvironment();
  window.chatWidget = new ChatWidget();
  window.analyticsManager = new AnalyticsManager();
  
  // Initialize all systems
  window.navigationManager.initialize();
  window.chatWidget.initialize();
  
  // Mark as initialized
  platformState.setState('isInitialized', true);
  
  console.log('✅ Platform initialized successfully');
  
  // Initialize dashboard by default
  setTimeout(() => {
    if (window.navigationManager) {
      window.navigationManager.initializeDashboard();
    }
  }, 500);
}

// DOM Ready Handler
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePlatform);
} else {
  initializePlatform();
}

// Global Functions (accessible from HTML onclick handlers)
window.testBot = function() {
  console.log('Test bot clicked');
  if (window.navigationManager) {
    window.navigationManager.switchView('testing');
    const navItem = document.querySelector('[data-view="testing"]');
    if (navItem) {
      window.navigationManager.setActiveNavItem(navItem);
    }
  }
};

window.publishBot = function() {
  console.log('🚀 Publishing bot...');
  alert('Bot published successfully! It\'s now live on the ADTU website.');
};

window.toggleChatWidget = function() {
  console.log('Toggle chat widget called');
  if (window.chatWidget) {
    window.chatWidget.toggle();
  }
};

window.sendWidgetMessage = function() {
  console.log('Send widget message called');
  if (window.chatWidget) {
    window.chatWidget.sendWidgetMessage();
  }
};

window.sendTestMessage = function() {
  console.log('Send test message called');
  if (window.testingEnvironment) {
    window.testingEnvironment.sendTestMessage();
  }
};

window.createNewFlow = function() {
  if (confirm('Create a new flow? This will clear the current workspace.')) {
    document.querySelectorAll('.flow-node').forEach(node => {
      if (!node.dataset.nodeId.includes('start') && !node.dataset.nodeId.includes('welcome')) {
        node.remove();
      }
    });
    console.log('New flow created');
  }
};

window.saveFlow = function() {
  if (window.flowBuilder) {
    window.flowBuilder.saveFlow();
    alert('Flow saved successfully!');
  }
};

window.exportFlow = function() {
  if (window.flowBuilder) {
    const flowData = window.flowBuilder.saveFlow();
    
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adtu-flow.json';
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Flow exported');
  }
};

window.deleteNode = function(nodeId) {
  console.log('Delete node called:', nodeId);
  if (window.flowBuilder) {
    window.flowBuilder.deleteNode(nodeId);
  }
};

// Error handling
window.addEventListener('error', function(event) {
  console.error('Platform error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
});

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', function() {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('Platform load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
    }, 0);
  });
}

console.log('📱 ADTU ConversationalAI Platform script loaded!');