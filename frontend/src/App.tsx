import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Layout components
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Layout/AuthLayout';

// Page components
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RecipesPage from './pages/Recipes/RecipesPage';
import RecipeDetailPage from './pages/Recipes/RecipeDetailPage';
import CreateRecipePage from './pages/Recipes/CreateRecipePage';
import IngredientsPage from './pages/Ingredients/IngredientsPage';
import UploadImagePage from './pages/Upload/UploadImagePage';
import ProfilePage from './pages/Profile/ProfilePage';
import BudgetPage from './pages/Budget/BudgetPage';
import NotFoundPage from './pages/NotFoundPage';

// Providers and contexts
import { AuthProvider } from './hooks/useAuth';
import { ImageUploadProvider } from './hooks/useImageUpload';
import { RecipeProvider } from './hooks/useRecipes';

// Styles
import './styles/globals.css';
import './styles/animations.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ImageUploadProvider>
          <RecipeProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <AnimatePresence mode="wait">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Layout />}>
                      <Route index element={<HomePage />} />
                      <Route path="recipes" element={<RecipesPage />} />
                      <Route path="recipes/:id" element={<RecipeDetailPage />} />
                    </Route>

                    {/* Authentication routes */}
                    <Route path="/auth" element={<AuthLayout />}>
                      <Route path="login" element={<LoginPage />} />
                      <Route path="register" element={<RegisterPage />} />
                    </Route>

                    {/* Protected routes */}
                    <Route path="/app" element={<Layout requireAuth />}>
                      <Route index element={<DashboardPage />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="recipes">
                        <Route index element={<RecipesPage />} />
                        <Route path="create" element={<CreateRecipePage />} />
                        <Route path=":id" element={<RecipeDetailPage />} />
                        <Route path=":id/edit" element={<CreateRecipePage />} />
                      </Route>
                      <Route path="ingredients" element={<IngredientsPage />} />
                      <Route path="upload" element={<UploadImagePage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="budget" element={<BudgetPage />} />
                    </Route>

                    {/* 404 route */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </AnimatePresence>

                {/* Global toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </RecipeProvider>
        </ImageUploadProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;