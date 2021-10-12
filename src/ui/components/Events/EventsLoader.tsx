import React from "react";
import MaterialIcon from "../shared/MaterialIcon";
import Spinner from "../shared/Spinner";

function EventsLoaderItem({ category, isLoading }: { category: string; isLoading: boolean }) {
  return (
    <div className="flex flex-row space-x-2 items-center overflow-hidden">
      {isLoading ? (
        <div
          className="flex flex-col items-center justify-center"
          style={{ minHeight: "22px", minWidth: "22px" }}
        >
          <Spinner className="animate-spin h-5 w-5" />
        </div>
      ) : (
        <MaterialIcon>done</MaterialIcon>
      )}
      <span>{category} events</span>
    </div>
  );
}

interface EventsLoaderProps {
  eventCategoriesLoading: { [key: string]: boolean };
}

function EventsLoader({ eventCategoriesLoading }: EventsLoaderProps) {
  return (
    <div className="space-y-3 flex flex-col w-full p-3 bg-gray-100 rounded-md">
      <strong>Loading events:</strong>
      <div className="flex flex-col w-full space-y-1">
        {Object.keys(eventCategoriesLoading).map(category => {
          return (
            <EventsLoaderItem
              category={category}
              isLoading={eventCategoriesLoading[category]}
              key={category}
            />
          );
        })}
      </div>
    </div>
  );
}

export default EventsLoader;
