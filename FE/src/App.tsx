import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes';
import { Toaster } from 'react-hot-toast';
import { useSignalR } from './hooks/useSignalR';

function App() {
  useSignalR();
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;