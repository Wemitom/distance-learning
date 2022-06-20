import { TaskFileInterface } from '../interfaces/interfaces';
import { ReactComponent as PdfIcon } from '../icons/pdf.svg';
import { ReactComponent as WordIcon } from '../icons/word.svg';
import { ReactComponent as ZipIcon } from '../icons/zip.svg';
import { ReactComponent as ImageIcon } from '../icons/image.svg';
import { ReactComponent as PptIcon } from '../icons/ppt.svg';
import { ReactComponent as MP4Icon } from '../icons/video.svg';
import { useEffect, useState } from 'react';
import { firebaseAuth } from './Firebase';
import axios from 'axios';
import FileSaver from 'file-saver';

function TaskFile({
  fileName,
  clickable,
  fileType,
  taskId,
  uid,
  videoOpened,
  setVideoName,
  setVideoOpened,
}: TaskFileInterface) {
  const [Icon, setIcon] = useState<React.FC<
    React.SVGProps<SVGSVGElement>
  > | null>(null);

  useEffect(() => {
    const fileType = fileName.split('.')[fileName.split('.').length - 1];
    switch (fileType) {
      case 'pdf':
        setIcon(PdfIcon);
        break;
      case 'docx':
      case 'doc':
        setIcon(WordIcon);
        break;
      case 'zip':
      case 'rar':
        setIcon(ZipIcon);
        break;
      case 'png':
      case 'jpg':
        setIcon(ImageIcon);
        break;
      case 'ppt':
        setIcon(PptIcon);
        break;
      case 'mp4':
        setIcon(MP4Icon);
        break;
      default:
        setIcon(null);
        break;
    }
  }, [fileName]);

  return (
    <li className="file">
      <div
        style={{
          display: 'grid',
          justifyItems: 'center',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
        onClick={
          clickable
            ? async () => {
                const isVideo = Icon === MP4Icon;

                const idToken =
                  (await firebaseAuth.currentUser?.getIdToken(false)) || '';
                const { data } = await axios.get(
                  `http://localhost:5000/api/files/${fileType}/${taskId}/${encodeURI(
                    fileName
                  )}${!!uid ? `?userId=${uid}` : ''}`,
                  { headers: { Authorization: idToken }, responseType: 'blob' }
                );
                if (isVideo && !!setVideoName && !!setVideoOpened) {
                  setVideoName(URL.createObjectURL(data));
                  setVideoOpened(!videoOpened);
                } else {
                  FileSaver.saveAs(data, fileName);
                }
              }
            : () => {}
        }
      >
        {Icon !== null && <Icon />}
        {fileName}
      </div>
    </li>
  );
}

export default TaskFile;
