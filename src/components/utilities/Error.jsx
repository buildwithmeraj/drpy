import React from "react";
import { MdCancel } from "react-icons/md";

const ErrorMsg = ({ message }) => {
  return (
    <div role="alert" className="alert alert-error alert-soft mt-2 text-lg p-4">
      <MdCancel className="-mr-2" size={18} />
      {message}
    </div>
  );
};

export default ErrorMsg;
