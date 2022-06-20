import { TaskType } from '../interfaces/interfaces';
import SidebarAccordion from './SidebarAccordion';

function Sidebar({
  setScrolled,
  currentTaskType,
  setCurrentTaskType,
}: {
  setScrolled?: (value: number | null) => void;
  currentTaskType?: TaskType;
  setCurrentTaskType?: (value: TaskType) => void;
}) {
  return (
    <div className="sidebar">
      <SidebarAccordion
        setScrolled={setScrolled}
        currentTaskType={currentTaskType}
        setCurrentTaskType={setCurrentTaskType}
      />
    </div>
  );
}

export default Sidebar;
