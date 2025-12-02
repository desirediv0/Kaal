import React from "react";
import Categories from "../_components/Categories";

export const metadata = {
  title: "Category Manage",
  description: "Manage categories",
};
const TestCase = () => {
  return (
    <div>
      <Categories
        allowCreate={true}
        allowDelete={true}
        allowEdit={true}
        allowSelect={false}
      />
    </div>
  );
};

export default TestCase;
