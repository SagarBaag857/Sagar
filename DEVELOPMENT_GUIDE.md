# AI Recipe Generator - Development Guide

## Project Overview

The AI Recipe Generator is a comprehensive full-stack application that combines computer vision, artificial intelligence, and modern web technologies to help users generate recipes from their fridge contents. The application features image recognition for ingredient detection, AI-powered recipe generation, nutritional analysis, and budget-conscious meal planning.

## Architecture

### Backend (FastAPI + Python)
- **Framework**: FastAPI for high-performance REST API
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with secure password hashing
- **Caching**: Redis for session management and caching
- **AI/ML**: OpenAI GPT-4 for recipe generation, TensorFlow/OpenCV for computer vision
- **Task Queue**: Celery for background image processing
- **Documentation**: Automatic OpenAPI/Swagger documentation

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query for server state, Context API for client state
- **Routing**: React Router v6 with protected routes
- **Animations**: Framer Motion for smooth interactions
- **Forms**: React Hook Form with Zod validation

## Project Structure

```
ai-recipe-generator/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI application entry point
│   │   ├── models/            # SQLAlchemy database models
│   │   │   ├── user.py        # User and profile models
│   │   │   ├── ingredient.py  # Ingredient management
│   │   │   ├── recipe.py      # Recipe models with relationships
│   │   │   ├── nutrition.py   # Nutritional data models
│   │   │   ├── image.py       # Image upload and CV detection
│   │   │   └── budget.py      # Budget tracking and pricing
│   │   ├── routers/           # API route handlers
│   │   │   ├── auth.py        # Authentication endpoints
│   │   │   ├── recipes.py     # Recipe CRUD operations
│   │   │   ├── images.py      # Image upload and processing
│   │   │   └── ai.py          # AI/CV endpoints
│   │   ├── services/          # Business logic layer
│   │   ├── utils/             # Utility functions
│   │   │   ├── config.py      # Configuration management
│   │   │   ├── security.py    # Authentication utilities
│   │   │   └── logger.py      # Structured logging
│   │   └── database/          # Database configuration
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Container configuration
│   └── .env.example          # Environment variables template
├── frontend/                  # React TypeScript frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   └── styles/           # CSS and styling
│   ├── package.json          # Node.js dependencies
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── tsconfig.json         # TypeScript configuration
├── docker-compose.yml        # Multi-container setup
├── .gitignore               # Git ignore rules
└── README.md                # Project documentation
```

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+
- Git

### Quick Setup with Docker

1. **Clone the repository**:
```bash
git clone <repository-url>
cd ai-recipe-generator
```

2. **Set up environment variables**:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

3. **Start all services with Docker**:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Set up database**:
```bash
# Create PostgreSQL database
createdb recipe_db

# Run migrations (if using Alembic)
alembic upgrade head
```

5. **Start Redis server**:
```bash
redis-server
```

6. **Start development server**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start development server**:
```bash
npm start
```

## Key Features

### 🔍 Computer Vision
- **Image Upload**: Support for multiple image formats (JPEG, PNG, WebP)
- **Ingredient Detection**: Advanced object detection using TensorFlow/OpenCV
- **Confidence Scoring**: AI confidence levels for detected ingredients
- **Manual Correction**: Users can verify and correct AI detections

### 🤖 AI Recipe Generation
- **OpenAI Integration**: GPT-4 powered recipe suggestions
- **Personalization**: Based on dietary preferences and restrictions
- **Multiple Cuisines**: Support for various cooking styles and cuisines
- **Difficulty Levels**: Recipes for all skill levels

### 📊 Nutrition Analysis
- **Detailed Breakdown**: Calories, macronutrients, vitamins, and minerals
- **Daily Value Percentages**: Based on standard 2000-calorie diet
- **Dietary Highlights**: High protein, low sodium, etc.
- **Nutrition Scoring**: Overall health score calculation

### 💰 Budget Mode
- **Cost Tracking**: Ingredient price monitoring
- **Budget Limits**: Set daily/weekly/monthly spending limits
- **Cheap Alternatives**: AI suggestions for cost-effective substitutions
- **Price Comparison**: Multi-store price tracking

### 👤 User Management
- **Secure Authentication**: JWT-based authentication system
- **User Profiles**: Dietary preferences, allergies, cooking skill level
- **Recipe Favorites**: Save and organize favorite recipes
- **Cooking History**: Track previously made recipes

## API Documentation

### Authentication Endpoints
- `POST /api/v1/register` - User registration
- `POST /api/v1/login` - User login
- `POST /api/v1/refresh` - Token refresh
- `GET /api/v1/me` - Get current user info

### Recipe Endpoints
- `GET /api/v1/recipes` - List recipes with filters
- `POST /api/v1/recipes` - Create new recipe
- `GET /api/v1/recipes/{id}` - Get recipe details
- `GET /api/v1/recipes/suggestions` - AI recipe suggestions

### Image Processing
- `POST /api/v1/images/upload` - Upload fridge image
- `POST /api/v1/ai/detect-ingredients` - Process image for ingredients

### Nutrition
- `GET /api/v1/nutrition/recipe/{id}` - Get recipe nutrition
- `POST /api/v1/nutrition/calculate` - Calculate custom nutrition

## Database Schema

### Core Tables
- **users**: User accounts and authentication
- **user_profiles**: Extended user information and preferences
- **ingredients**: Master ingredient database
- **recipes**: Recipe information and metadata
- **recipe_ingredients**: Recipe-ingredient relationships
- **recipe_steps**: Step-by-step cooking instructions
- **image_uploads**: Uploaded image metadata
- **ingredient_detections**: AI detection results

### Relationships
- Users have profiles (1:1)
- Users can have multiple recipes (1:N)
- Recipes contain multiple ingredients (N:M)
- Images can have multiple detections (1:N)

## Frontend Architecture

### Component Structure
```
components/
├── Layout/              # Page layouts and navigation
├── UI/                 # Reusable UI components (buttons, forms, etc.)
├── Recipe/             # Recipe-specific components
├── Upload/             # Image upload and processing
├── Nutrition/          # Nutrition display components
└── Auth/               # Authentication forms
```

### State Management
- **Server State**: React Query for API data caching and synchronization
- **Client State**: React Context for user preferences and UI state
- **Form State**: React Hook Form for form handling and validation

### Styling Approach
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Design System**: Consistent colors, typography, and spacing
- **Responsive Design**: Mobile-first approach with breakpoint variants
- **Dark Mode Ready**: Color scheme prepared for dark mode implementation

## Development Workflow

### Code Quality
- **TypeScript**: Strict type checking for better code quality
- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting for consistency
- **Husky**: Git hooks for pre-commit checks

### Testing
- **Backend**: pytest for API testing
- **Frontend**: Jest and React Testing Library
- **E2E**: Playwright for end-to-end testing (recommended)

### Deployment
- **Docker**: Multi-stage builds for production optimization
- **Environment Variables**: Separate configs for development/production
- **Health Checks**: Kubernetes-ready health check endpoints
- **Monitoring**: Structured logging with correlation IDs

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- Follow existing code patterns and conventions
- Write meaningful commit messages
- Add tests for new functionality
- Update documentation as needed

## Production Considerations

### Performance
- Image optimization and compression
- API response caching with Redis
- Database query optimization with indexes
- CDN for static asset delivery

### Security
- HTTPS enforcement
- CORS configuration
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure file upload handling

### Scalability
- Horizontal scaling with load balancers
- Database connection pooling
- Background job processing with Celery
- Microservices architecture consideration

## Troubleshooting

### Common Issues
1. **Database Connection**: Check PostgreSQL service and connection string
2. **Redis Connection**: Ensure Redis server is running
3. **OpenAI API**: Verify API key and rate limits
4. **File Uploads**: Check file permissions and disk space
5. **CORS Issues**: Verify frontend URL in backend CORS settings

### Logging
- Application logs: `logs/app.log`
- Error tracking with structured JSON logging
- Request/response logging for API debugging

## License

This project is licensed under the MIT License - see the LICENSE file for details.