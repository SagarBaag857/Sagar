/**
 * Main App Component
 * 
 * Root component for the AI Recipe Generator React application.
 * Handles routing, theming, authentication state, and global providers.
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Store
import { useAuthStore } from './store/authStore';
import { usePreferencesStore } from './store/preferencesStore';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy-loaded Pages
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const RecipeGenerator = React.lazy(() => import('./pages/RecipeGenerator'));
const RecipeDetail = React.lazy(() => import('./pages/RecipeDetail'));
const RecipesList = React.lazy(() => import('./pages/RecipesList'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const NutritionAnalysis = React.lazy(() => import('./pages/NutritionAnalysis'));
const MealPlanner = React.lazy(() => import('./pages/MealPlanner'));
const ShoppingList = React.lazy(() => import('./pages/ShoppingList'));
const Community = React.lazy(() => import('./pages/Community'));
const Premium = React.lazy(() => import('./pages/Premium'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Terms = React.lazy(() => import('./pages/Terms'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Create Material-UI theme
 */
const createAppTheme = (mode, primaryColor) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryColor || '#2E7D32',
        light: '#4CAF50',
        dark: '#1B5E20',
      },
      secondary: {
        main: '#FF6F00',
        light: '#FFB74D',
        dark: '#E65100',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#333333',
        secondary: mode === 'dark' ? '#b0b0b0' : '#666666',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '8px 24px',
            fontSize: '0.875rem',
            fontWeight: 500,
          },
          contained: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            '&:hover': {
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });
};

/**
 * Loading component for Suspense fallback
 */
const PageLoader = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="50vh"
  >
    <LoadingSpinner size={60} />
  </Box>
);

/**
 * Main App Component
 */
function App() {
  const { user, isLoading, initializeAuth } = useAuthStore();
  const { preferences, loadPreferences } = usePreferencesStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth();
    loadPreferences();
  }, [initializeAuth, loadPreferences]);

  // Create theme based on user preferences
  const theme = React.useMemo(() => {
    return createAppTheme(
      preferences.theme || 'light',
      preferences.primaryColor
    );
  }, [preferences.theme, preferences.primaryColor]);

  // Show loading spinner while initializing
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <LoadingSpinner size={80} />
      </Box>
    );
  }

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            <Router>
              <Box display="flex" flexDirection="column" minHeight="100vh">
                {/* Navigation */}
                <Navbar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
                
                {/* Sidebar for authenticated users */}
                {user && (
                  <Sidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                  />
                )}

                {/* Main Content */}
                <Box
                  component="main"
                  flexGrow={1}
                  sx={{
                    marginLeft: user && sidebarOpen ? '240px' : 0,
                    transition: 'margin-left 0.3s ease',
                    minHeight: 'calc(100vh - 64px)',
                  }}
                >
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/premium" element={<Premium />} />

                      {/* Auth Routes */}
                      <Route
                        path="/login"
                        element={
                          user ? <Navigate to="/dashboard" replace /> : <Login />
                        }
                      />
                      <Route
                        path="/register"
                        element={
                          user ? <Navigate to="/dashboard" replace /> : <Register />
                        }
                      />

                      {/* Protected Routes */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/generate"
                        element={
                          <ProtectedRoute>
                            <RecipeGenerator />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/recipes"
                        element={
                          <ProtectedRoute>
                            <RecipesList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/recipes/:id"
                        element={
                          <ProtectedRoute>
                            <RecipeDetail />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/nutrition"
                        element={
                          <ProtectedRoute>
                            <NutritionAnalysis />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/meal-planner"
                        element={
                          <ProtectedRoute>
                            <MealPlanner />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/shopping-list"
                        element={
                          <ProtectedRoute>
                            <ShoppingList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/community"
                        element={
                          <ProtectedRoute>
                            <Community />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        }
                      />

                      {/* 404 Route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </Box>

                {/* Footer */}
                <Footer />
              </Box>

              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                  success: {
                    iconTheme: {
                      primary: theme.palette.success.main,
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: theme.palette.error.main,
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </Router>
          </ErrorBoundary>

          {/* React Query DevTools (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;