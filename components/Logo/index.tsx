import Link from "next/link";
import Image from "@/components/Image";

type TestProps = {
  className?: string;
  dark?: boolean;
};

const Test = ({ className, dark }: TestProps) => (
  <Link className={`flex w-[15rem] ml-0 pl-0 mr-5 ${className}`} href="/">
    <Image
      className="w-full h-auto"
      src={dark ? "/images/logo-dark.png" : "/images/logo-dark.png"}
      width={190}
      height={40}
      alt="Brainwave"
    />
  </Link>
);

export default Test;
