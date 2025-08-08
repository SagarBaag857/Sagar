# 🥦 Fridge AI Recipe Generator

This project is a **full-stack demo** that combines computer vision and language AI to suggest creative recipes based on the items inside your fridge.

Features
---------
1. **Photo or text input** – Upload a photo of your fridge (or type the ingredients manually).
2. **AI-generated recipe** – Uses OpenAI to produce a full recipe, step-by-step instructions, and nutrition breakdown.
3. **Budget mode** – Toggle to receive cheaper meal suggestions with cost-saving tips.

Technology Stack
----------------
* **Frontend**: React + Vite (located in `frontend/`)
* **Backend**: Node.js + Express (located in `backend/`)
* **AI**: OpenAI Chat Completion API (optionally GPT-4o Vision for ingredient detection)

Quick Start
-----------
### 1. Clone & install
```bash
# From the project root
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configure environment variables
Copy the example file and add your OpenAI key:
```bash
cp backend/.env.example backend/.env
# then edit backend/.env in your editor
```

### 3. Run the dev servers (two terminals)
```bash
# Terminal 1 – backend
yarn --cwd backend dev # or: npm --prefix backend run dev

# Terminal 2 – frontend
npm --prefix frontend run dev
```
The frontend (http://localhost:3000) automatically proxies `\*/api` calls to the backend at port 5000.

### 4. Build for production
```bash
# Build frontend
npm --prefix frontend run build

# Serve backend (you may serve `frontend/dist` statically or host separately)
```

Project Structure
-----------------
```text
.
├── backend
│   ├── server.js
│   ├── utils
│   │   ├── openai.js
│   │   └── vision.js
│   ├── package.json
│   └── .env.example
└── frontend
    ├── src
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   └── components
    │       ├── ImageUpload.jsx
    │       ├── IngredientInput.jsx
    │       ├── RecipeDisplay.jsx
    │       └── BudgetToggle.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

Testing Tips
------------
1. **Image detection** – The default Vision implementation is mocked unless you set `OPENAI_VISION_ENABLED=1` **and** have access to a vision-capable model name (e.g. `gpt-4o`).
2. **No image?** – Skip the photo and just list ingredients manually.
3. Increase `temperature` in `openai.js` for more creative recipes.

Enjoy cooking! 🍳