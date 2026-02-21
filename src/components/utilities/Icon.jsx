import Image from "next/image";
import React from "react";

const Icon = () => {
  return (
    <div>
      <Image src="/icon.svg" alt="Icon" height={40} width={40} />
    </div>
  );
};

export default Icon;
