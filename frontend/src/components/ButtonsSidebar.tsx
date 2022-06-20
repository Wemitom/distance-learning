import { ButtonsSidebarInterface } from '../interfaces/interfaces';

function ButtonsSidebar({
  showSelectedButton,
  currentSelectedButton,
  buttons,
}: ButtonsSidebarInterface) {
  return (
    <div
      className={`buttons-sidebar ${
        !buttons.firstButton.hide &&
        !buttons.secondButton.hide &&
        !buttons.thirdButton.hide &&
        !buttons.fourthButton.hide
          ? 'four-buttons'
          : ''
      }
      ${
        !buttons.firstButton.hide &&
        !buttons.secondButton.hide &&
        !buttons.thirdButton.hide &&
        buttons.fourthButton.hide
          ? 'three-buttons'
          : ''
      }
      ${
        !buttons.firstButton.hide &&
        !buttons.secondButton.hide &&
        buttons.thirdButton.hide &&
        buttons.fourthButton.hide
          ? 'two-buttons'
          : ''
      }
      ${
        !buttons.firstButton.hide &&
        buttons.secondButton.hide &&
        buttons.thirdButton.hide &&
        buttons.fourthButton.hide
          ? 'one-button'
          : ''
      }`}
    >
      <button
        className={`sidebar-button ${
          showSelectedButton && currentSelectedButton === buttons.firstButton.id
            ? 'current-task'
            : ''
        }`}
        onClick={() => buttons.firstButton.action(buttons.firstButton.id)}
        style={{ display: `${buttons.firstButton.hide ? 'none' : 'grid'}` }}
        type={buttons.firstButton.type}
        form={buttons.firstButton.form}
      >
        {buttons.firstButton.icon}
        {buttons.firstButton.text}
      </button>
      <button
        className={`sidebar-button ${
          showSelectedButton &&
          currentSelectedButton === buttons.secondButton.id
            ? 'current-task'
            : ''
        }`}
        onClick={() => buttons.secondButton.action(buttons.secondButton.id)}
        style={{ display: `${buttons.secondButton.hide ? 'none' : 'grid'}` }}
        form={buttons.secondButton.form}
        type={buttons.secondButton.type}
      >
        {buttons.secondButton.icon}
        {buttons.secondButton.text}
      </button>
      <button
        className={`sidebar-button ${
          showSelectedButton && currentSelectedButton === buttons.thirdButton.id
            ? 'current-task'
            : ''
        }`}
        onClick={() => buttons.thirdButton.action(buttons.thirdButton.id)}
        style={{ display: `${buttons.thirdButton.hide ? 'none' : 'grid'}` }}
        form={buttons.thirdButton.form}
        type={buttons.thirdButton.type}
      >
        {buttons.thirdButton.icon}
        {buttons.thirdButton.text}
      </button>
      <button
        className={`sidebar-button ${
          showSelectedButton &&
          currentSelectedButton === buttons.fourthButton.id
            ? 'current-task'
            : ''
        }`}
        onClick={() => buttons.fourthButton.action(buttons.fourthButton.id)}
        style={{ display: `${buttons.fourthButton.hide ? 'none' : 'grid'}` }}
        type={buttons.fourthButton.type}
        form={buttons.fourthButton.form}
      >
        {buttons.fourthButton.icon}
        {buttons.fourthButton.text}
      </button>
    </div>
  );
}

export default ButtonsSidebar;
