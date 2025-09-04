# DeFi Agent Monitor

**io.net AI Agent System Submission**

A multi-agent DeFi monitoring system showcasing io.net's AI infrastructure capabilities. This application demonstrates cryptocurrency investment analysis through intelligent agent workflows, featuring a simplified 2-agent architecture designed specifically for io.net's distributed AI network.

## io.net Submission Highlights

**DeFi Agent Monitor** demonstrates the power and versatility of io.net's distributed AI infrastructure through:

### Advanced Multi-Agent Architecture
- **Production-Ready 2-Agent System**: Optimized for io.net with intelligent cryptocurrency analysis
- **Smart Agent Coordination**: Data flow between specialized AI agents using io.net models

### io.net Model Integration
- **Llama-3.3-70B-Instruct**: Primary analysis and decision-making agent
- **Model Specialization**: Each agent optimized for specific analytical tasks

### Technical Innovation
- **Real-time SSE Integration**: Live agent workflow progress streaming
- **Previous Context Awareness**: AI agents consider historical recommendations for intelligent decision continuity
- **Production Database Integration**: Complete MongoDB persistence with recommendation tracking

## Core Features

- **Multi-Agent AI Workflows**: Agent coordination using io.net models
- **Intelligent Investment Analysis**: Cryptocurrency market analysis and recommendation engine
- **Context-Aware Decision Making**: AI agents consider previous recommendations and portfolio history
- **Real-time Agent Monitoring**: Live workflow progress with Server-Sent Events integration
- **Production-Grade Architecture**: Complete full-stack implementation with authentication and data persistence

## io.net Technology Stack

- **AI Infrastructure**: io.net distributed computing network
- **Primary AI Models**: Llama-3.3-70B-Instruct
- **Frontend**: React.js with real-time SSE for agent workflow visualization
- **Backend**: Node.js Express API with agent orchestration
- **Database**: MongoDB with agent decision and recommendation tracking
- **Authentication**: JWT-based security system
- **Real-time Communication**: Server-Sent Events for live agent progress updates

## Project Structure

```
DeFi-Agent-Monitor/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── Dashboard.js
│   │   │   ├── LoginPage.js
│   │   │   ├── SignupPage.js
│   │   │   ├── StrategyCard.js
│   │   │   ├── StrategyDetailView.js    # Main strategy interface
│   │   │   ├── HistoryTab.js           # Activity timeline
│   │   │   ├── CreateStrategy.js
│   │   │   ├── CreateStrategyModal.js
│   │   │   ├── NotificationCard.js
│   │   │   ├── NotificationModal.js
│   │   │   ├── RecommendationModal.js
│   │   │   └── ConfirmationModal.js
│   │   ├── services/        # API integration layer
│   │   │   └── api.js      # API integration with SSE
│   │   └── styles/          # CSS files
│   │       └── App.css     # Styling
│   └── package.json        # Frontend dependencies
├── backend/                 # Backend API
│   ├── tests/              # Agent workflow systems
│   │   ├── simplified_workflow.js      # 2-Agent workflow
│   │   ├── README.md                   # Workflow documentation
│   │   └── WORKFLOW_SUCCESS_SUMMARY.md # Success summary
│   ├── config/             # Configuration
│   │   ├── database.js     # MongoDB connection
│   │   └── ionet.js        # io.net API configuration
│   ├── models/             # Data models
│   │   ├── Strategy.js     # Investment strategies
│   │   ├── User.js         # User accounts
│   │   ├── Recommendation.js # AI recommendations
│   │   └── History.js      # Activity tracking
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication
│   │   ├── strategies.js   # Strategy management
│   │   ├── ai-recommendations.js # AI workflow with SSE
│   │   ├── recommendations.js    # Recommendation management
│   │   └── history.js      # Activity history
│   ├── utils/              # Utility functions
│   │   ├── recommendationUtils.js # Database operations
│   │   └── historyLogger.js       # Activity logging
│   ├── middleware/         # Express middleware
│   │   └── auth.js         # JWT verification
│   ├── server.js           # Express server
│   └── package.json        # Backend dependencies
└── README.md              # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- io.net API key
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DeFi-Agent-Monitor
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

3. Set up environment variables in `backend/.env`:
```env
IONET_API_KEY=your_ionet_api_key_here
MONGODB_URI=mongodb://localhost:27017/iopulse
JWT_SECRET=your_jwt_secret_here
PORT=5001
```

### Running the Application

1. Start MongoDB (if using local installation)

2. Start the backend server:
```bash
cd backend
npm start
```

3. Start the frontend development server:
```bash
cd frontend  
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Testing Agent Workflows

Test the 2-agent system:

```bash
# Test the 2-agent workflow
cd backend/tests
node simplified_workflow.js

# View workflow documentation
cat README.md
```

## Database Schema

DeFi Agent Monitor uses MongoDB to track agent decisions and workflow states:

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  holdings: [{
    coin: String,
    amount: Number,
    strategy: ObjectId,
    lastUpdated: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Strategies Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  coin: String,
  initialAmount: Number,
  currentAmount: Number,
  user: ObjectId,
  status: String, // 'active', 'paused', 'stopped'
  notifications: [{
    message: String,
    recommendation: String, // 'buy', 'sell', 'hold', 'swap'
    confidence: Number,
    timestamp: Date,
    userResponse: String, // 'obeyed', 'ignored', 'pending'
    responseTimestamp: Date,
    aiAnalysisData: Object
  }],
  lastObeyedRecommendation: {
    message: String,
    recommendation: String,
    confidence: Number,
    timestamp: Date,
    amountChange: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Recommendations Collection
```javascript
{
  _id: ObjectId,
  strategy: ObjectId,
  user: ObjectId,
  recommendation: String,
  action: String, // 'HOLD', 'SWAP'
  confidence: Number,
  explanation: String,
  executionTime: Number,
  agentsUsed: Number,
  analysisData: Object,
  status: String, // 'pending', 'accepted', 'rejected'
  createdAt: Date
}
```

### History Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  strategy: ObjectId,
  eventType: String, // 'STRATEGY_CREATED', 'AI_WORKFLOW_COMPLETED', etc.
  title: String,
  description: String,
  severity: String, // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  data: Object,
  timestamp: Date
}
```

## io.net Multi-Agent Workflow Architecture

**DeFi Agent Monitor** showcases io.net's AI capabilities through a 2-agent coordination system.

### Production System: 2-Agent Workflow

**Currently Active** - Designed for io.net's infrastructure with intelligent resource management.

#### Agent Architecture
- **Analysis Agent**: `meta-llama/Llama-3.3-70B-Instruct` - Cryptocurrency market intelligence
- **Decision Agent**: `meta-llama/Llama-3.3-70B-Instruct` - Investment decision synthesis

#### io.net Integration Features
- **Smart Context Management**: Efficiently utilizes io.net API through optimized prompting
- **Previous Decision Continuity**: Agents access database to consider historical recommendations
- **Real-time Agent Monitoring**: Live SSE updates showing agent workflow progress
- **Production Database Integration**: MongoDB persistence for agent decisions
- **Pure AI Intelligence**: Leverages models' built-in cryptocurrency expertise

#### Workflow Process
```
User Strategy Input → Analysis Agent → Decision Agent → Final Recommendation
                          ↓              ↓              ↓
                   Market Analysis → Investment → HOLD/SWAP Decision
                   Current Holding    Decision      with Justification
                   Alternatives      Logic
```

#### Previous Recommendation Handling
The system tracks and considers previous recommendations:
- **Continuation Logic**: If previous recommendation was successful, may choose to hold current position
- **Performance Evaluation**: Analyzes timing and effectiveness of past recommendations  
- **Context-Aware Decisions**: Factors in duration since last recommendation
- **Database Integration**: Retrieves `lastObeyedRecommendation` from Strategy model

Example: If user previously received "Hold BTC for 2-3 weeks" and only 1 week has passed with positive performance, the AI may recommend continuing the hold rather than switching.
```
User Strategy Input → Analysis Agent → Decision Agent → Final Recommendation
                          ↓              ↓              ↓
                   Market Analysis → Investment → HOLD/SWAP Decision
                   Current Holding    Decision      with Justification
                   Alternatives      Logic
```

#### Smart Previous Recommendation Handling
The system intelligently tracks and considers previous recommendations:
- **Continuation Logic**: If previous recommendation was successful, may choose to hold current position
- **Performance Evaluation**: Analyzes timing and effectiveness of past recommendations  
- **Context-Aware Decisions**: Factors in duration since last recommendation
- **Database Integration**: Retrieves `lastObeyedRecommendation` from Strategy model

Example: If user previously received "Hold BTC for 2-3 weeks" and only 1 week has passed with positive performance, the AI may recommend continuing the hold rather than switching.

### 🎯 Ideal Implementation: Complete 5-Agent Workflow  

**Advanced System** - Full-featured workflow with external data integration (requires higher API limits).

*Note: This represents our ideal implementation with comprehensive market data tools. Due to free tier API limits we cannot afford to call the tools as frequently as we need here, we currently use the simplified 2-agent approach above. The 5-agent system can be activated with sufficient API quota.*
You can see the workflows made through [io.net's workflow editor](https://ai.io.net/ai/agentic-workflow-editor/new?fileName=Untitled) in [this](backend/workflows) folder.

#### 5-Agent Architecture (Future Enhancement)

#### Agent 1: **Investor Profile Agent**
- **Model**: `Qwen/Qwen3-235B-A22B-Thinking-2507`
- **Purpose**: Converts user's natural language investment strategy into structured profile
- **Input**: Strategy description (e.g., "Aggressive AI token hunt with high risk tolerance")
- **Output**: Structured JSON profile with risk tolerance, market cap preferences, and investment horizon

#### Agent 2: **Market Screener Agent**
- **Model**: `mistralai/Magistral-Small-2506`
- **Purpose**: Screens entire cryptocurrency market to find suitable investment candidates
- **Tools Used**: 
  - `listing_coins`: Gets comprehensive list of active cryptocurrencies
  - `get_coin_quotes`: Validates liquidity with 24h trading volume data
- **Output**: List of 15 filtered investment candidates based on profile criteria

#### Agent 3: **Quantitative Analysis Agent**
- **Model**: `Qwen/Qwen3-235B-A22B-Thinking-2507`
- **Purpose**: Performs rigorous quantitative analysis on all candidates + user's current holding
- **Tools Used**:
  - `get_coin_quotes_historical`: 90-day price history analysis
  - `get_coin_quotes`: Current 24h performance data
- **Analysis**: 90-day momentum, 30-day trends, 24-hour performance
- **Output**: Quantitative scores (0-10) for each asset including user's current position

#### Agent 4: **Qualitative Due Diligence Agent**
- **Model**: `meta-llama/Llama-3.3-70B-Instruct`
- **Purpose**: Risk assessment and fundamental analysis of top performers + current holding
- **Tools Used**:
  - `get_coin_info`: Project verification, team info, official links
  - `search_the_web`: Scans for exploits, scams, SEC issues, hacks (90-day timeframe)
- **Output**: Qualitative risk scores (0-10) identifying potential red flags

#### Agent 5: **Investment Committee Agent**
- **Model**: `Qwen/Qwen3-235B-A22B-Thinking-2507`
- **Purpose**: Final investment decision combining all data + previous recommendation context
- **Decision Matrix**: 60% Quantitative + 40% Qualitative scoring
- **Output**: Final actionable recommendation (HOLD or SWAP) with detailed justification

### � Technical Implementation

#### io.net Integration
- **Multiple AI Models**: Leverages 2-3 different io.net models for specialized tasks
- **Real-time Processing**: Live workflow execution with SSE updates
- **Scalable Architecture**: Can switch between simplified and full workflows based on API quota

#### Database Integration  
- **MongoDB Persistence**: Complete data storage with user strategies and AI recommendations
- **Recommendation Tracking**: Maintains history of all AI decisions and user responses
- **Previous Context**: `lastObeyedRecommendation` field enables intelligent follow-up decisions

#### Frontend Integration
- **Real-time Updates**: Server-Sent Events provide live workflow progress
- **Strategy Detail View**: Comprehensive interface with Overview and History tabs

## io.net Submission Summary

**DeFi Agent Monitor** demonstrates io.net's AI infrastructure through:

### Production Implementation
- **2-Agent Workflow**: Functional multi-agent system using Llama-3.3-70B-Instruct
- **Real-time Agent Monitoring**: Live SSE integration showing agent workflow progress
- **Database Integration**: MongoDB persistence for agent decisions and recommendations
- **Previous Context Awareness**: Agent memory through database integration
- **JWT Authentication**: Secure user authentication with strategy management

### Technical Excellence
- **Full-Stack Implementation**: Complete React frontend with Node.js backend
- **Production Database Schema**: MongoDB integration with agent decision tracking
- **Real-time Communication**: Server-Sent Events for live agent workflow visualization
- **Responsive UI**: Modern interface optimized for trading workflows

### io.net Integration Benefits
- **Model Utilization**: Showcases io.net AI models working in coordination
- **Efficient Resource Management**: Optimized API usage and intelligent context management
- **Real-world Application**: Practical DeFi use case with genuine market analysis value

---

**Ready for Production on io.net**

This submission showcases io.net's AI capabilities through a production-ready multi-agent system.

## Current Features

### Implemented
- **2-Agent AI Workflow**: Production system using Llama-3.3-70B-Instruct
- **Real-time Agent Monitoring**: Live SSE updates showing agent workflow progress
- **Agent Memory**: Previous recommendation awareness through database integration
- **Production Database**: MongoDB persistence with agent decision tracking
- **Secure Authentication**: JWT-based user authentication and strategy management
- **Agent Dashboard**: React interface with real-time agent workflow visualization
- **Agent Decision History**: Logging and timeline of all agent activities

## License

This project is licensed under the ISC License.

---

**Powered by io.net** - AI infrastructure for decentralized intelligence

**DeFi Agent Monitor** - Multi-agent AI systems on io.net's distributed network