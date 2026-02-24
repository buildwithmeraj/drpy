import React from "react";
import { FaCircleCheck } from "react-icons/fa6";

const SuccessMsg = ({ message }) => {
  return (
    <div
      role="alert"
      className="alert alert-success alert-soft mt-2 text-lg p-4"
    >
      <FaCircleCheck className="-mr-1" size={18} />
      {message}
    </div>
  );
};

export default SuccessMsg;
