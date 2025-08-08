# 🍳 AI Recipe Generator

> Transform your fridge contents into delicious meals with the power of AI

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black.svg)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)

## 🌟 Features

### 📸 **Computer Vision-Powered Ingredient Detection**
- Upload photos of your fridge or pantry
- AI automatically identifies ingredients using YOLO object detection
- Manual ingredient input as backup option
- Confidence scoring for detected items

### 🤖 **AI Recipe Generation**
- GPT-4 powered recipe creation
- Personalized based on dietary restrictions and preferences
- Multiple cuisine types and difficulty levels
- Step-by-step instructions with timing

### 💰 **Budget Mode**
- Cost-conscious meal planning
- Recipes under your specified budget per serving
- Ingredient cost tracking and optimization
- Money-saving tips and substitutions

### 📊 **Comprehensive Nutrition Analysis**
- Detailed nutritional breakdown per serving
- Macronutrient tracking (protein, carbs, fats)
- Vitamin and mineral information
- Dietary compliance checking

### 🎨 **Beautiful, Responsive UI**
- Modern design with Tailwind CSS
- Smooth animations with Framer Motion
- Mobile-first responsive design
- Dark/light theme support

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Python 3.11   │    │ • User Data     │
│ • TypeScript    │    │ • Computer Vision│    │ • Recipes       │
│ • Tailwind CSS │    │ • AI Integration │    │ • Ingredients   │
│ • Framer Motion │    │ • Image Processing│   │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Caching)     │
                       │                 │
                       │ • Session Data  │
                       │ • Recipe Cache  │
                       │ • Rate Limiting │
                       └─────────────────┘
```

### Tech Stack

**Frontend:**
- **Next.js 14** - React framework with app router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Query** - Server state management
- **React Hook Form** - Form handling
- **Zustand** - Client state management

**Backend:**
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM with async support
- **Pydantic** - Data validation
- **OpenAI GPT-4** - Recipe generation
- **YOLO v8** - Computer vision
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions

**Infrastructure:**
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy
- **GitHub Actions** - CI/CD (ready)

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (Recommended)
- **OR** Node.js 18+ and Python 3.11+
- **PostgreSQL** and **Redis** (if running without Docker)

### 🐳 Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-recipe-generator.git
   cd ai-recipe-generator
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys (optional for basic functionality)
   
   # Frontend
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### 💻 Option 2: Local Development

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

4. **Start the frontend**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://postgres:password@localhost:5432/recipe_generator
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here

# Optional AI Services (app works without these)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key

# Optional External APIs
NUTRITION_API_KEY=your-nutrition-api-key
SPOONACULAR_API_KEY=your-spoonacular-api-key

# Performance & Features
MAX_UPLOAD_SIZE=10485760  # 10MB
INGREDIENT_DETECTION_CONFIDENCE=0.5
BUDGET_MODE_PRICE_THRESHOLD=15.0
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📱 Usage Guide

### 1. **Upload Your Fridge Photo**
   - Take a clear photo of your fridge contents
   - Upload via drag-and-drop or file picker
   - AI will automatically detect ingredients
   - Review and edit the detected items

### 2. **Add Manual Ingredients**
   - Type ingredient names directly
   - Use autocomplete suggestions
   - Specify quantities if desired

### 3. **Set Your Preferences**
   - Choose meal type (breakfast, lunch, dinner)
   - Select cuisine preferences
   - Set dietary restrictions
   - Adjust cooking time and serving size
   - Enable Budget Mode for cost-effective recipes

### 4. **Generate Recipes**
   - AI creates personalized recipes
   - View detailed instructions and nutrition info
   - Save favorites for later
   - Generate more variations

### 5. **Budget Mode**
   - Set your budget per serving
   - Get cost-optimized recipes
   - See price breakdown per ingredient
   - Money-saving tips included

## 🎯 API Documentation

### Key Endpoints

#### Ingredient Detection
```http
POST /api/v1/ingredients/detect-from-image
Content-Type: multipart/form-data

# Upload image file for ingredient detection
```

#### Recipe Generation
```http
POST /api/v1/recipes/generate
Content-Type: application/json

{
  "ingredients": ["chicken", "tomatoes", "onion"],
  "preferences": {
    "meal_type": "dinner",
    "cuisine_type": "italian",
    "dietary_restrictions": ["gluten_free"],
    "max_cooking_time": 60,
    "serving_size": 4
  },
  "count": 3
}
```

#### Budget Recipes
```http
POST /api/v1/recipes/generate-budget
Content-Type: application/json

{
  "ingredients": ["rice", "beans", "onion"],
  "budget_limit": 8.0,
  "preferences": {},
  "count": 3,
  "serving_size": 4
}
```

**Full API documentation available at:** http://localhost:8000/docs

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
# Using Playwright (setup required)
npx playwright test
```

## 🏗️ Development

### Code Structure

```
ai-recipe-generator/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── ml_models/          # Machine learning models
│   └── requirements.txt
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # CSS styles
│   └── package.json
├── docker-compose.yml      # Multi-container setup
└── README.md
```

### Key Features Implemented

- ✅ **Image Upload & Processing** - Drag & drop with validation
- ✅ **Computer Vision** - YOLO-based ingredient detection
- ✅ **AI Recipe Generation** - GPT-4 powered with fallbacks
- ✅ **Budget Mode** - Cost-conscious recipe suggestions
- ✅ **Nutrition Analysis** - Comprehensive nutritional data
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Real-time Updates** - Live ingredient management
- ✅ **Progressive Enhancement** - Works without AI APIs
- ✅ **Error Handling** - Graceful fallbacks
- ✅ **Performance Optimization** - Caching and compression

### Code Quality

- **TypeScript** for type safety
- **ESLint & Prettier** for code formatting
- **Pydantic** for data validation
- **SQLAlchemy** for database ORM
- **Comprehensive error handling**
- **Structured logging**
- **Health checks** for all services

## 🔒 Security

- **JWT Authentication** (ready for implementation)
- **Input validation** with Pydantic
- **SQL injection protection** with SQLAlchemy
- **File upload security** with type/size validation
- **CORS configuration** for cross-origin requests
- **Rate limiting** with Redis
- **Environment variable** protection

## 📈 Performance

### Optimizations Included

- **Redis caching** for frequently accessed data
- **Image compression** and optimization
- **Database indexing** on key fields
- **Lazy loading** for large datasets
- **Connection pooling** for database
- **CDN-ready** static asset serving
- **Compression** for API responses

### Monitoring

- **Health checks** for all services
- **Structured logging** with correlation IDs
- **Performance metrics** collection ready
- **Error tracking** with Sentry (configurable)

## 🚀 Deployment

### Production Checklist

1. **Security**
   - [ ] Change default passwords
   - [ ] Set strong SECRET_KEY
   - [ ] Configure HTTPS
   - [ ] Set up firewall rules

2. **Performance**
   - [ ] Enable Redis persistence
   - [ ] Configure database backups
   - [ ] Set up monitoring
   - [ ] Enable compression

3. **Scaling**
   - [ ] Load balancer setup
   - [ ] Database replication
   - [ ] Horizontal scaling

### Environment-Specific Configurations

#### Development
```bash
# Quick start for development
docker-compose -f docker-compose.dev.yml up
```

#### Production
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Add type hints (Python) / types (TypeScript)
- Ensure Docker builds work

## 📊 Project Stats

- **~10,000+ lines of code** across frontend and backend
- **Comprehensive type coverage** with TypeScript and Pydantic
- **20+ API endpoints** with full documentation
- **Modern architecture** with microservices approach
- **Production-ready** with Docker containerization
- **Mobile-responsive** design with 90+ performance score

## 🔄 Roadmap

### Phase 1 (Current) ✅
- Basic ingredient detection
- Recipe generation
- Budget mode
- Responsive UI

### Phase 2 (Next)
- [ ] User authentication & profiles
- [ ] Recipe saving & favorites
- [ ] Social sharing features
- [ ] Advanced nutrition tracking

### Phase 3 (Future)
- [ ] Meal planning calendar
- [ ] Shopping list generation
- [ ] Integration with grocery APIs
- [ ] Voice input support
- [ ] AR ingredient recognition

## 🐛 Known Issues & Limitations

1. **Computer Vision**: Works best with clear, well-lit images
2. **AI Dependency**: Recipe quality depends on AI API availability
3. **Cost Estimation**: Basic implementation, needs real grocery data
4. **Language**: Currently English-only interface

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API
- **Ultralytics** for YOLO models
- **FastAPI** team for the excellent framework
- **Next.js** team for the React framework
- **Tailwind CSS** for the utility-first CSS framework

## 📞 Support

- **Documentation**: Available in `/docs` endpoint
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@yourapp.com

---

## 🚀 Get Started Now!

```bash
# One-command setup
git clone https://github.com/yourusername/ai-recipe-generator.git
cd ai-recipe-generator
docker-compose up -d

# Visit http://localhost:3000 and start cooking! 🍳
```

**Made with ❤️ and AI** - Turn your ingredients into culinary magic!