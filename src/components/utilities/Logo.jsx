import React from "react";
import Icon from "./Icon";
import Image from "next/image";

const Logo = () => {
  return (
    <div className="flex items-center gap-1.5">
      <Image
        src="/logo.png"
        className="w-auto h-10"
        alt="Logo"
        height={500}
        width={500}
      />
    </div>
  );
};

export default Logo;
