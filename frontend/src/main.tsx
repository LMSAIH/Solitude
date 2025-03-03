import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ExpressionProvider } from './context/ExpressionContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExpressionProvider>
      <App />
    </ExpressionProvider>
  </StrictMode>,
)
