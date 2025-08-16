import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export default function Button({ variant = "primary", size = "md", className, ...rest }: Props) {
  const base = "inline-flex items-center justify-center rounded-xl font-medium transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2" }[size];
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow hover:brightness-110 focus:ring-indigo-400",
    secondary: "bg-white text-gray-900 border shadow-sm hover:bg-gray-50 focus:ring-gray-300",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
  }[variant];
  return <button className={clsx(base, sizes, variants, className)} {...rest} />;
}
