import React from 'react';
import ReactDOM from 'react-dom';
import './styles/taskPage.css';
import './styles/newTestPage.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryCache, QueryClient, QueryClientProvider } from 'react-query';
import { toast } from 'react-toastify';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(`Что-то пошло не так: ${error}`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    },
  }),
});

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
