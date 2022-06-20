import ReactPlayer from 'react-player';

const ResponsivePlayer = ({ url }: { url: string }) => {
  return (
    <div className="player-wrapper">
      <ReactPlayer
        className="react-player"
        url={url}
        width="70%"
        height="80%"
        controls
      />
    </div>
  );
};

export default ResponsivePlayer;
