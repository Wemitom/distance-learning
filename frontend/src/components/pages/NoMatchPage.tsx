import { useEffect } from 'react';
import Header from '../Header';

const NoMatchPage = () => {
  useEffect(() => {
    document.title = 'Страница не найдена';
  }, []);

  return (
    <div
      className="w-100 h-100 justify-content-center align-items-center"
      style={{ display: 'inline-flex' }}
    >
      <div>
        <h1
          style={{
            borderRight: '1px solid var(--bs-body-color)',
            paddingRight: '0.5em',
          }}
        >
          404
        </h1>
      </div>
      <h3 className="ms-4">Страница не найдена</h3>
    </div>
  );
};

export default NoMatchPage;
