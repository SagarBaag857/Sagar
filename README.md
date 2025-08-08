# AI Recipe Generator 🍳🤖

A comprehensive AI-powered recipe generator that analyzes fridge photos to detect ingredients and creates personalized recipes with detailed nutrition analysis and budget-conscious options.

## ✨ Features

### 🎯 Core Features
- **📸 Photo Analysis**: Upload fridge photos to automatically detect available ingredients
- **🤖 AI Recipe Generation**: Generate personalized recipes using OpenAI GPT models
- **📊 Nutrition Analysis**: Comprehensive nutritional breakdown with health scores
- **💰 Budget Mode**: Cost-conscious recipe suggestions with price tracking
- **🥗 Dietary Support**: Support for vegan, keto, gluten-free, and other dietary restrictions
- **⭐ Recipe Rating & Reviews**: Community-driven recipe feedback system

### 🔧 Advanced Features
- **🍽️ Meal Planning**: Weekly meal plan generation with shopping lists
- **📱 Modern UI**: Responsive React interface with Material-UI components
- **🔐 User Authentication**: Secure JWT-based authentication system
- **📈 Usage Analytics**: Track recipe generation, cooking history, and preferences
- **🔍 Smart Search**: Advanced filtering by ingredients, cuisine, time, and cost
- **📤 Recipe Sharing**: Social features with recipe sharing and community interaction

### 🧠 AI Technologies
- **Computer Vision**: TensorFlow.js and OpenCV for ingredient detection
- **Natural Language Processing**: OpenAI GPT for recipe generation
- **Machine Learning**: Pattern recognition for ingredient combinations
- **Nutritional Intelligence**: Automated nutrition analysis and health scoring

## 🏗️ Architecture

### Backend (Node.js/Express)
```
backend/
├── server.js              # Main application server
├── models/                 # MongoDB data models
│   ├── User.js            # User model with preferences
│   └── Recipe.js          # Recipe model with nutrition data
├── routes/                 # API route handlers
│   ├── auth.js            # Authentication endpoints
│   ├── recipes.js         # Recipe CRUD operations
│   ├── users.js           # User management
│   ├── ingredients.js     # Ingredient detection
│   ├── nutrition.js       # Nutrition analysis
│   ├── images.js          # Image processing
│   ├── sharing.js         # Social features
│   └── budget.js          # Budget analysis
├── services/              # Core business logic
│   ├── visionService.js   # Computer vision & image analysis
│   ├── aiService.js       # Recipe generation AI
│   └── nutritionService.js # Nutrition calculations
├── middleware/            # Express middleware
│   ├── auth.js            # Authentication & authorization
│   └── errorHandler.js    # Error handling
└── uploads/               # File storage directory
```

### Frontend (React)
```
frontend/src/
├── App.js                 # Main application component
├── store/                 # Zustand state management
├── components/            # Reusable UI components
├── pages/                 # Page components
├── hooks/                 # Custom React hooks
├── services/              # API service functions
├── utils/                 # Utility functions
└── styles/                # CSS and styling
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **OpenAI API Key** (for recipe generation)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-recipe-generator.git
cd ai-recipe-generator
```

### 2. Install Dependencies
```bash
# Install all dependencies (backend + frontend)
npm run install-all

# Or install manually:
npm install                    # Root dependencies
cd backend && npm install      # Backend dependencies
cd ../frontend && npm install  # Frontend dependencies
```

### 3. Environment Setup

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-recipe-generator

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRE=30d

# OpenAI API (Required for AI features)
OPENAI_API_KEY=your-openai-api-key-here

# Optional: External APIs
NUTRITIONIX_APP_ID=your-nutritionix-app-id
NUTRITIONIX_API_KEY=your-nutritionix-api-key
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Setup

Start MongoDB and create the database:

```bash
# Start MongoDB service (varies by OS)
# Ubuntu/Debian:
sudo systemctl start mongod

# macOS with Homebrew:
brew services start mongodb/brew/mongodb-community

# Windows: Start MongoDB service from Services panel

# Connect to MongoDB and create database
mongosh
use ai-recipe-generator
exit
```

### 5. Start the Application

#### Development Mode (Both servers)
```bash
# From project root - starts both backend and frontend
npm run dev
```

#### Individual Services
```bash
# Backend only (from project root)
npm run server

# Frontend only (from project root)
npm run client
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 🔧 Configuration

### OpenAI API Setup
1. Create an OpenAI account at https://platform.openai.com
2. Generate an API key in your dashboard
3. Add the key to your `.env` file as `OPENAI_API_KEY`
4. Ensure you have sufficient credits for recipe generation

### Optional Integrations

#### Nutritionix API (Enhanced Nutrition Data)
1. Sign up at https://www.nutritionix.com/business/api
2. Get your App ID and API Key
3. Add to `.env` file

#### Google Cloud Vision API (Enhanced Image Recognition)
1. Create a Google Cloud project
2. Enable the Vision API
3. Create service account credentials
4. Download JSON key file and update path in `.env`

## 📱 Usage Guide

### 1. User Registration
- Navigate to `/register`
- Create account with email verification
- Set dietary preferences and restrictions

### 2. Generate Recipes from Photos
1. Go to **Recipe Generator** (`/generate`)
2. Upload a photo of your fridge/ingredients
3. Wait for AI to detect ingredients
4. Review detected ingredients and add/remove as needed
5. Set preferences (cuisine, difficulty, time, budget mode)
6. Generate recipe

### 3. Manual Recipe Generation
1. Navigate to **Recipe Generator**
2. Switch to "Manual Input" mode
3. Add ingredients one by one
4. Set cooking preferences
5. Generate personalized recipe

### 4. Nutrition Analysis
- View detailed nutrition breakdown for any recipe
- See health scores and dietary compliance
- Get recommendations for nutritional improvements
- Track daily nutrition goals

### 5. Budget Mode
- Enable budget mode for cost-conscious recipes
- Set maximum cost per serving
- View ingredient cost breakdowns
- Get money-saving suggestions

## 🧪 Development

### Project Structure
The application follows a modern full-stack architecture:

- **Backend**: RESTful API with Express.js
- **Frontend**: React with Material-UI components
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with refresh tokens
- **State Management**: Zustand for React state
- **Styling**: Material-UI with custom theming
- **File Handling**: Multer for image uploads

### API Endpoints

#### Authentication
```
POST /api/auth/register       # User registration
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
GET  /api/auth/me             # Get current user
PUT  /api/auth/me             # Update profile
POST /api/auth/change-password # Change password
```

#### Recipes
```
GET    /api/recipes           # Get all recipes (with filtering)
POST   /api/recipes           # Create new recipe
GET    /api/recipes/:id       # Get recipe by ID
PUT    /api/recipes/:id       # Update recipe
DELETE /api/recipes/:id       # Delete recipe
POST   /api/recipes/generate  # Generate from ingredients
POST   /api/recipes/generate-from-image # Generate from photo
POST   /api/recipes/:id/rate  # Rate recipe
POST   /api/recipes/:id/save  # Save to favorites
```

#### Nutrition
```
GET /api/nutrition/analyze/:recipeId  # Analyze recipe nutrition
GET /api/nutrition/daily-summary      # Get daily nutrition summary
```

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run all tests
npm run test:all
```

### Building for Production

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Dockerfile included in project root
docker build -t ai-recipe-generator .
docker run -p 5000:5000 ai-recipe-generator
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-openai-key
CORS_ORIGIN=https://your-domain.com
```

### Recommended Hosting Platforms
- **Backend**: Heroku, Railway, DigitalOcean App Platform
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: MongoDB Atlas, DigitalOcean Managed MongoDB
- **Images**: AWS S3, Cloudinary, DigitalOcean Spaces

## 🔒 Security Features

- **JWT Authentication** with secure token storage
- **Rate Limiting** to prevent API abuse
- **Input Validation** using express-validator
- **File Upload Security** with type and size restrictions
- **CORS Protection** with configurable origins
- **Helmet.js** for security headers
- **Password Hashing** with bcrypt
- **Environment Variable Protection**

## 📊 Performance Optimizations

- **Image Compression** with Sharp
- **Database Indexing** for efficient queries
- **Lazy Loading** for React components
- **API Response Caching** with appropriate headers
- **Compression Middleware** for smaller payloads
- **Optimized Bundle Splitting** in React build

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features
- Update documentation for API changes
- Ensure mobile responsiveness for UI changes

## 📋 API Documentation

### Recipe Generation
```javascript
// Generate recipe from ingredients
POST /api/recipes/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "ingredients": [
    { "name": "chicken breast", "quantity": 2, "unit": "pieces" },
    { "name": "broccoli", "quantity": 1, "unit": "head" }
  ],
  "preferences": {
    "cuisine": "italian",
    "difficulty": "medium",
    "maxTime": 45,
    "budgetMode": true,
    "dietaryRestrictions": ["gluten-free"]
  }
}
```

### Image Upload for Recipe Generation
```javascript
// Generate recipe from fridge photo
POST /api/recipes/generate-from-image
Content-Type: multipart/form-data
Authorization: Bearer <token>

// FormData with:
// - image: File (JPEG/PNG/WebP, max 10MB)
// - preferences: JSON string with user preferences
```

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB logs
sudo journalctl -u mongod
```

#### OpenAI API Errors
- Verify API key is correct and has sufficient credits
- Check OpenAI service status
- Ensure proper environment variable setup

#### Image Upload Issues
- Check file size (max 10MB)
- Verify supported formats (JPEG, PNG, WebP)
- Ensure uploads directory has write permissions

#### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT models and AI capabilities
- **TensorFlow.js** for machine learning in JavaScript
- **Material-UI** for beautiful React components
- **MongoDB** for flexible document storage
- **Express.js** for robust web framework
- **Sharp** for high-performance image processing

## 📞 Support

For support, email support@ai-recipe-generator.com or join our Discord community.

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added nutrition analysis and budget mode
- **v1.2.0** - Enhanced computer vision and mobile support
- **v1.3.0** - Social features and recipe sharing

---

**Built with ❤️ by the AI Recipe Generator Team**

*Transform your cooking experience with the power of artificial intelligence!*