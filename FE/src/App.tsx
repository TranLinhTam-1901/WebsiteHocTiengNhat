import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes';
import { Toaster } from 'react-hot-toast';
function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;