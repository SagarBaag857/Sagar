# AI Recipe Generator - Project Structure

## Overview
A full-stack application that analyzes fridge contents through computer vision and generates personalized recipes with AI.

## Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11
- **Computer Vision**: OpenCV, YOLO, TensorFlow
- **AI/ML**: OpenAI GPT-4, Hugging Face Transformers
- **Database**: PostgreSQL, Redis (caching)
- **Authentication**: NextAuth.js
- **Deployment**: Docker, Docker Compose

## Directory Structure
```
ai-recipe-generator/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Next.js pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/             # API routes
│   │   ├── core/            # Core functionality
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── main.py          # FastAPI app entry point
│   ├── ml_models/           # Machine learning models
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile
├── docker-compose.yml       # Multi-container orchestration
├── .env.example            # Environment variables template
└── README.md               # Project documentation
```

## Features
1. **Image Upload & Analysis**: Computer vision to detect ingredients
2. **Manual Ingredient Input**: Text-based ingredient listing
3. **AI Recipe Generation**: Personalized recipes based on available ingredients
4. **Nutrition Analysis**: Detailed nutritional breakdown
5. **Budget Mode**: Cost-effective meal suggestions
6. **Recipe Sharing**: Social features for sharing recipes
7. **User Profiles**: Save favorite recipes and dietary preferences
8. **Mobile Responsive**: Works seamlessly on all devices