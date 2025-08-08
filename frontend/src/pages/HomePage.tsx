import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHatIcon, CameraIcon, SparklesIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="container-xl section-spacing">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-6xl font-bold mb-6">
              AI Recipe Generator
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Transform your fridge contents into delicious recipes using computer vision and AI. 
              Simply upload a photo or list your ingredients, and let our AI create personalized 
              recipes with step-by-step instructions and nutritional breakdowns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/app/upload"
                className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100"
              >
                <CameraIcon className="w-5 h-5 mr-2" />
                Upload Fridge Photo
              </Link>
              <Link
                to="/app/dashboard"
                className="btn btn-lg bg-transparent border-white text-white hover:bg-white/10"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing">
        <div className="container-xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Our AI Recipe Generator?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Combining cutting-edge computer vision with advanced AI to revolutionize your cooking experience.
            </p>
          </div>

          <div className="grid-recipes">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="card text-center p-8"
            >
              <CameraIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Computer Vision</h3>
              <p className="text-gray-600">
                Advanced image recognition automatically detects ingredients from your fridge photos.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card text-center p-8"
            >
              <SparklesIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI-Powered Recipes</h3>
              <p className="text-gray-600">
                Get personalized recipe suggestions based on your available ingredients and preferences.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card text-center p-8"
            >
              <ChefHatIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Detailed Instructions</h3>
              <p className="text-gray-600">
                Step-by-step cooking instructions with nutritional information and budget estimates.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;