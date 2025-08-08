# AI Recipe Generator from Fridge Items

A comprehensive full-stack application that analyzes fridge contents through computer vision and generates personalized recipes with step-by-step instructions and nutritional breakdowns.

## Features

🔍 **Computer Vision**: Upload photos of your fridge and automatically detect ingredients
📝 **Manual Input**: List ingredients manually if preferred
🍳 **AI Recipe Generation**: Get personalized recipe suggestions based on available ingredients
📊 **Nutrition Analysis**: Detailed nutritional breakdown for each recipe
💰 **Budget Mode**: Find cost-effective meal options
📱 **Responsive Design**: Works seamlessly on desktop and mobile
🎨 **Modern UI**: Beautiful, intuitive interface with smooth animations

## Tech Stack

### Backend
- **FastAPI**: Modern, high-performance Python web framework
- **OpenCV**: Computer vision for ingredient detection
- **TensorFlow/Keras**: Deep learning for image recognition
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Production database
- **Redis**: Caching and session management
- **Celery**: Background task processing

### Frontend
- **React 18**: Modern React with hooks and context
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations
- **React Query**: Data fetching and caching
- **React Hook Form**: Form management
- **Axios**: HTTP client

## Project Structure

```
ai-recipe-generator/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── utils/
│   │   └── database/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize database:
```bash
python -m app.database.init_db
```

6. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

### Using Docker (Recommended)

1. Run the entire stack:
```bash
docker-compose up --build
```

## API Endpoints

- `POST /api/v1/analyze-image` - Analyze fridge image for ingredients
- `POST /api/v1/ingredients` - Add ingredients manually
- `GET /api/v1/recipes/suggestions` - Get recipe suggestions
- `GET /api/v1/recipes/{id}` - Get specific recipe details
- `POST /api/v1/recipes/generate` - Generate new recipe
- `GET /api/v1/nutrition/{recipe_id}` - Get nutrition information

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost/recipe_db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_key
SECRET_KEY=your_secret_key
ENVIRONMENT=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_ENVIRONMENT=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.