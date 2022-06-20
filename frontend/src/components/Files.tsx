import { FilesInterface } from '../interfaces/interfaces';
import TaskFile from './TaskFile';

function Files({
  taskFiles,
  clickable,
  taskFilesType,
  taskId,
  uid,
  videoOpened,
  setVideoName,
  setVideoOpened,
}: FilesInterface) {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
      className="mb-3"
    >
      <ul className="file-list">
        {taskFiles.split('|').map((fileName, index) => (
          <TaskFile
            key={index}
            fileName={fileName}
            clickable={clickable}
            fileType={taskFilesType}
            taskId={taskId}
            uid={uid}
            videoOpened={videoOpened}
            setVideoName={setVideoName}
            setVideoOpened={setVideoOpened}
          />
        ))}
      </ul>
    </div>
  );
}

export default Files;
