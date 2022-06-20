import { Form } from 'react-bootstrap';
import { ReactComponent as SearchIcon } from '../icons/search.svg';

const Searchbar = ({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}) => {
  return (
    <div className="searchbar">
      <Form.Control
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Поиск"
      />
      <SearchIcon />
    </div>
  );
};

export default Searchbar;
