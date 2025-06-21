# BUDGETTRACKER

Empower Smarter Finances Through AI-Driven Insights

![Last Commit](https://img.shields.io/github/last-commit/Happy-Syahrul-Ramadhan/BudgedTracker?style=flat-square)
![JavaScript](https://img.shields.io/github/languages/top/Happy-Syahrul-Ramadhan/BudgedTracker?style=flat-square)
![Languages](https://img.shields.io/github/languages/count/Happy-Syahrul-Ramadhan/BudgedTracker?style=flat-square)

## Built with the tools and technologies:

![JSON](https://img.shields.io/badge/JSON-black?style=flat-square)
![npm](https://img.shields.io/badge/npm-orange?style=flat-square)
![Autoprefixer](https://img.shields.io/badge/Autoprefixer-red?style=flat-square)
![PostCSS](https://img.shields.io/badge/PostCSS-lightgrey?style=flat-square)
![Prettier](https://img.shields.io/badge/Prettier-f3a?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-yellow?style=flat-square)
![React](https://img.shields.io/badge/React-blue?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-green?style=flat-square)
![ESLint](https://img.shields.io/badge/ESLint-purple?style=flat-square)

# Budget AI - A Fun Project for Financial Decisions.

This project uses **React** and **Vite** to create a fun and interactive budget tracking application. It leverages AI to help you manage your finances and make smarter decisions.

## Technologies Used:
- **React**: A JavaScript library for building user interfaces.
- **Vite**: A fast, opinionated web build tool.
- **ESLint**: A tool for identifying and fixing problems in JavaScript code.
- **AI**: GroqAI, https://console.groq.com/keys
  
## Getting Started

1. **Clone the repository**:

   ```bash
   git clone <your-repository-url>
   cd <your-project-folder>
   
2. **install package**:
   
      ```bash
   npm install or
   yarn install

2. **run app**:
   
      ```bash
   npm run dev

3. **update API KEY**:
   
```bash
/my-react-app
│
├── /src
│   ├── /pages
│   │   ├── statistics.jsx  # Contains the API fetch and display logic
│   ├── App.js              # Main application component
│   ├── index.js            # Main entry point for the React app
│   └── /assets             # (Optional) Folder for static assets (images, icons, etc.)
├── package.json            # NPM/Yarn dependencies and scripts
└── .gitignore              # Git ignore file

update your API KEY :

   const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR-API-KEY'
        },

