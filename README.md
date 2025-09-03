# IoPulse - DeFi Investment Monitor

A decentralized finance (DeFi) investment monitoring application powered by io.net AI agents. This application helps users track their cryptocurrency investments and receive AI-powered trading recommendations.

## Features

- **User Authentication**: Secure login system
- **Strategy Management**: Create and manage multiple investment strategies
- **AI Recommendations**: Hourly AI-powered investment suggestions
- **Real-time Notifications**: Get notified about recommended actions
- **Dark Theme UI**: Modern, sleek dark-themed interface
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React.js with modern CSS
- **Backend**: Node.js with Express
- **AI Integration**: io.net Multi-Agent System (5 specialized agents)
- **Database**: MongoDB (to be implemented)
- **Icons**: Lucide React

## Project Structure

```
IoPulse/
├── frontend/                 # React frontend application
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── LoginPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── StrategyCard.js
│   │   │   ├── NotificationCard.js
│   │   │   └── CreateStrategyModal.js
│   │   ├── services/        # API service layer
│   │   │   └── api.js
│   │   ├── styles/          # CSS files
│   │   │   └── App.css
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── package.json        # Frontend dependencies
├── backend/                 # Backend API implementation
│   ├── tests/              # AI Agent workflow system
│   │   ├── complete_workflow.js           # Main workflow orchestrator
│   │   ├── investor_profile_agent.js      # Strategy-to-profile converter
│   │   ├── market_screener_agent.js       # Market candidate finder
│   │   ├── quantitative_analysis_agent.js # Performance analyzer
│   │   ├── qualitative_due_diligence_agent.js # Risk assessor
│   │   └── investment_committee_agent.js  # Final decision maker
│   ├── config/             # Database configuration
│   │   └── database.js
│   ├── models/             # Data models
│   │   ├── Strategy.js
│   │   └── User.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   └── strategies.js
│   ├── workflows/          # YAML workflow definitions
│   │   └── IoPulse_runInvestorProfile.yaml
│   ├── server.js           # Express server
│   └── package.json        # Backend dependencies
├── package.json            # Root package.json
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd IoPulse
```

2. Install frontend dependencies:
```bash
npm run install-frontend
```

### Running the Application

1. Start the frontend development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. For AI workflow testing, run the complete system:
```bash
cd backend/tests
node complete_workflow.js
```

### Testing the AI System

The complete 5-agent workflow can be tested independently:

```bash
# Run the complete multi-agent workflow
cd backend/tests
node complete_workflow.js

# Test individual agents
node investor_profile_agent.js
node market_screener_agent.js  
node quantitative_analysis_agent.js
node qualitative_due_diligence_agent.js
node investment_committee_agent.js
```

### Environment Setup

Create a `.env` file in the backend directory:
```env
IONET_API_KEY=your_ionet_api_key_here
```

### Default Login

For testing purposes, you can use any email and password to log in.

## Features Overview

### Login Page
- Clean, dark-themed login interface
- Email and password authentication (mock implementation)

### Dashboard
- **AI Recommendations**: View hourly AI suggestions for your investments
- **Strategy Management**: Create and view your investment strategies
- **Interactive Notifications**: Respond to AI recommendations with "I Obeyed" or "Ignore"

### Create Strategy
- Select from 20+ popular cryptocurrencies
- Define your investment strategy goals
- Set risk tolerance and preferences for AI analysis

### Supported Cryptocurrencies
- Bitcoin (BTC)
- Ethereum (ETH)
- Binance Coin (BNB)
- Cardano (ADA)
- Solana (SOL)
- Polygon (MATIC)
- Chainlink (LINK)
- Uniswap (UNI)
- Avalanche (AVAX)
- Polkadot (DOT)
- And 10+ more popular DeFi tokens

## Upcoming Features

- [ ] Database persistence integration
- [ ] Real user authentication with JWT
- [ ] Frontend-backend API integration
- [ ] Real-time price data feeds
- [ ] Portfolio tracking dashboard
- [ ] Advanced analytics and charts
- [ ] Push notifications system
- [ ] Mobile app development

## IoPulse AI-Powered Investment System

IoPulse leverages a sophisticated **5-Agent AI System** built entirely on the **io.net platform** to provide intelligent, personalized investment recommendations. The system transforms natural language investment strategies into actionable trading decisions through a comprehensive multi-stage analysis process.

### 🤖 Multi-Agent Architecture

#### Agent 1: **Investor Profile Agent**
- **Model**: `Qwen/Qwen3-235B-A22B-Thinking-2507`
- **Purpose**: Converts user's natural language investment strategy into structured profile
- **Input**: Strategy description (e.g., "Aggressive AI token hunt with high risk tolerance")
- **Output**: Structured JSON profile with risk tolerance, market cap preferences, and investment horizon
- **Example Output**:
```json
{
  "current_holding_symbol": "ETH",
  "risk_tolerance": "high",
  "desired_market_cap": "low", 
  "investment_horizon": "short-term"
}
```

#### Agent 2: **Market Screener Agent**
- **Model**: `mistralai/Magistral-Small-2506`
- **Purpose**: Screens entire cryptocurrency market to find suitable investment candidates
- **Tools Used**: 
  - `listing_coins`: Gets comprehensive list of active cryptocurrencies
  - `get_coin_quotes`: Validates liquidity with 24h trading volume data
- **Input**: Investor profile from Agent 1
- **Output**: List of 15 filtered investment candidates based on profile criteria
- **Intelligence**: Matches market cap preferences, risk tolerance, and liquidity requirements

#### Agent 3: **Quantitative Analysis Agent**
- **Model**: `Qwen/Qwen3-235B-A22B-Thinking-2507`
- **Purpose**: Performs rigorous quantitative analysis on all candidates + user's current holding
- **Tools Used**:
  - `get_coin_quotes_historical`: 90-day price history analysis
  - `get_coin_quotes`: Current 24h performance data
- **Analysis**: 
  - **90-day momentum** (50% weight)
  - **30-day trends** (30% weight) 
  - **24-hour performance** (20% weight)
- **Output**: Quantitative scores (0-10) for each asset including user's current position
- **Innovation**: Always includes user's current holding for comparative analysis

#### Agent 4: **Qualitative Due Diligence Agent**
- **Model**: `meta-llama/Llama-3.3-70B-Instruct`
- **Purpose**: Risk assessment and fundamental analysis of top performers + current holding
- **Tools Used**:
  - `get_coin_info`: Project verification, team info, official links
  - `search_the_web`: Scans for exploits, scams, SEC issues, hacks (90-day timeframe)
- **Intelligence**: Analyzes top 5 quantitative performers PLUS user's current holding regardless of rank
- **Output**: Qualitative risk scores (0-10) identifying potential red flags
- **Real-World Impact**: Prevents investments in projects with recent security issues

#### Agent 5: **Investment Committee Agent**
- **Model**: `Qwen/Qwen3-235B-A22B-Thinking-2507`
- **Purpose**: Final investment decision combining all data + previous recommendation context
- **Input**: Complete analysis + user's current holding + previous recommendation history
- **Decision Matrix**:
  - **Combined Score**: 60% Quantitative + 40% Qualitative
  - **Hold vs Swap Logic**: Compares current position against alternatives
  - **Time-Aware Decisions**: Considers previous recommendation timing and duration
- **Output**: Final actionable recommendation (HOLD or SWAP) with detailed justification

### 🔄 Complete Workflow Process

#### Stage 1: Strategy Interpretation
```
User Input: "Aggressive AI token hunt with high risk tolerance for short-term gains"
↓
Agent 1 (Investor Profile) → Structured profile with risk/horizon/preferences
```

#### Stage 2: Market Discovery  
```
Profile → Agent 2 (Market Screener) → 15 filtered candidates
Uses real-time tools to validate liquidity and market conditions
```

#### Stage 3: Performance Analysis
```
Candidates + Current Holding → Agent 3 (Quantitative) → Performance scores
Analyzes 90d/30d/24h momentum with weighted scoring system
```

#### Stage 4: Risk Assessment
```
Top Performers + Current Holding → Agent 4 (Qualitative) → Risk scores  
Real web searches for exploits, scams, regulatory issues
```

#### Stage 5: Final Decision
```
All Data + Previous Context → Agent 5 (Committee) → HOLD/SWAP recommendation
Intelligent comparison of current position vs best alternatives
```

### 📊 Real Implementation Examples

#### Example 1: ETH → MEW Recommendation
- **User Strategy**: "Aggressive AI token hunt" holding ETH
- **Analysis Results**:
  - ETH: Quant 6.61/10, Qual 9/10 (Combined: 7.57/10)
  - MEW: Quant 9.47/10, Qual 8/10 (Combined: 8.88/10)
- **Committee Decision**: **SWAP ETH for MEW**
- **Justification**: "MEW offers superior combined performance with exceptional 90-day momentum (179.18%)"

#### Example 2: USDC → MATIC Recommendation  
- **User Strategy**: "Conservative DeFi yield" holding USDC
- **Analysis Results**:
  - USDC: Quant 5/10, Qual 8.28/10 (Combined: 6.31/10)
  - MATIC: Quant 8.5/10, Qual 8.64/10 (Combined: 8.56/10)
- **Committee Decision**: **SWAP USDC for MATIC**
- **Justification**: "MATIC offers superior performance with strong 69.47% 30-day momentum"

### 🧠 Advanced Intelligence Features

#### Current Holdings Analysis
- **Always Included**: User's current token analyzed alongside market alternatives
- **Comparative Scoring**: Direct performance comparison with potential swaps
- **Hold Bias Prevention**: Objective analysis prevents unnecessary trading

#### Previous Recommendation Tracking
- **Context Awareness**: Considers timing of previous recommendations
- **Smart Hold Logic**: Respects previous "hold" decisions if insufficient time elapsed
- **Adaptive Timing**: Adjusts recommendations based on market condition changes

#### Risk Management
- **Multi-Layer Validation**: Quantitative performance + qualitative safety
- **Real-Time Risk Scanning**: Active monitoring for security issues and scams
- **Balanced Decision Making**: Prevents high-return but high-risk investments

### 🔧 Technical Implementation

#### Tool Integration
- **Real API Calls**: 30+ actual tool calls per workflow execution
- **Live Data**: Real-time price feeds, historical analysis, web sentiment scanning
- **Fallback Systems**: Robust error handling with simulated data when APIs fail

#### Model Diversity
- **3 Different AI Models**: Each agent optimized for specific tasks
- **Specialized Expertise**: Profile analysis, market screening, risk assessment
- **Collaborative Intelligence**: Agents work together for comprehensive analysis

#### Performance Metrics
- **Execution Time**: Complete workflow in ~2-3 minutes
- **Success Rate**: 66% success rate with robust fallback mechanisms
- **Decision Quality**: Intelligent hold vs swap logic with quantified reasoning

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.