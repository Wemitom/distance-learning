import Header from '../Header';
import Sidebar from '../Sidebar';
import '../../styles/chatPage.css';
import ChatMessages from '../ChatMessages';

const ChatPage = () => {
  return (
    <div>
      <Header />
      <Sidebar />
      <ChatMessages />
    </div>
  );
};

export default ChatPage;
