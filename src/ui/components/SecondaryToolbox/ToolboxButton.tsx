import { FC } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { setShowVideoPanel } from "ui/actions/layout";
import { getShowVideoPanel } from "ui/reducers/layout";
import Icon from "../shared/Icon";

export const ToolboxButton: FC<{ title?: string; onClick?: () => void }> = ({
  children,
  title,
  onClick = () => {},
}) => {
  return (
    <button
      className="toolbox-options p-2 flex items-center text-iconColor hover:text-gray-600"
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
