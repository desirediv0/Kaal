import React from "react";
import CreateRole from "../_components/create-role";

export const metadata = {
  title: "Create Role",
  description: "Create a new role",
};

const Role = () => {
  return (
    <div>
      <CreateRole />
    </div>
  );
};

export default Role;
