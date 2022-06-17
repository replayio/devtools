import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { setShowVideoPanel } from "ui/actions/layout";
import { getShowVideoPanel } from "ui/reducers/layout";
import Icon from "../shared/Icon";

interface ToolboxButtonProps {
  title?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const ToolboxButton = ({ children, title, onClick = () => {} }: ToolboxButtonProps) => {
  return (
    <button
      className="toolbox-options flex items-center p-2 text-iconColor hover:text-gray-600"
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const ShowVideoButton = () => {
  const dispatch = useAppDispatch();
  const showVideoPanel = useAppSelector(getShowVideoPanel);

  const onClick = () => {
    dispatch(setShowVideoPanel(true));
  };

  if (showVideoPanel) {
    return null;
  }

  return (
    <ToolboxButton title="Show Video" onClick={onClick}>
      <Icon filename="video" className="bg-iconColor" size="small" />
    </ToolboxButton>
  );
};
