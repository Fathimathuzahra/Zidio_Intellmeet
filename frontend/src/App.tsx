import './App.css'
import Router from './router'
import { Toaster } from "sonner";
import "sonner/dist/styles.css";



function App() {
  return (
    <>
      <Router />
       <Toaster 
        position="top-right"
        richColors
        closeButton
        expand={false}
        duration={4000}
        className="!font-sans"
        toastOptions={{
          className: '!rounded-xl !shadow-lg !border !border-border',
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            borderColor: 'var(--border)',
          },
        }}
      />
    </>
  )
}

export default App