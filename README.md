# Budget AI - A Fun Project for Financial Decisions

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

```bash
   const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR-API-KEY'
        },

