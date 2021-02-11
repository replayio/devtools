import React, { useState } from "react";
import DashboardNavigation from "./DashboardNavigation";
import DashboardViewer from "./DashboardViewer";
import "./Dashboard.css";

const Dashboard = ({ recordings }) => {
  const [filter, setFilter] = useState("");

  const filteredRecordings = recordings.filter(recording => recording.url.includes(filter));

  return (
    <main className="dashboard">
      <DashboardNavigation recordings={recordings} setFilter={setFilter} filter={filter} />
      <DashboardViewer recordings={filteredRecordings} filter={filter} />
    </main>
  );
};

export default Dashboard;
