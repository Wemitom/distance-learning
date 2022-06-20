import { useEffect } from 'react';

const ServerErrorPage = () => {
  useEffect(() => {
    document.title = 'Ошибка подключения к серверу';
  }, []);

  return (
    <div
      className="w-100 h-100 justify-content-center align-items-center"
      style={{ display: 'inline-flex' }}
    >
      <h1>Ошибка подключения к серверу</h1>
    </div>
  );
};

export default ServerErrorPage;
