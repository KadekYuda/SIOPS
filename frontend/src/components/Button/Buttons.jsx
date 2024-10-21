import React from "react";

/* eslint-disable react/prop-types */
const Buttons = ({
  iconClassName = "",
  className = "",
  id = "",
  label = "",
  mode = "primary",
  size = "lg",
  icon,
  type = "button",
  onClick,
  ...props
}) => {
  const isDisabled = props.disabled;

  const buttonClass = [
    "px-6 rounded-md font-vs font-bold flex justify-center items-center leading-none",
    mode === "primary" && "bg-white border-gray-200 text-[#3B99FD]",
    mode === "secondary" && "bg-main-blue-400 border-main-blue-600 text-white",
    mode === "outline" &&
      "bg-white border-2 border-main-grayscale-300 text-[#344054] active:border-b-2",
    size === "sm" && "h-[32px] text-sm font-medium",
    size === "md" && "h-[38px]",
    size === "lg" && "h-[48px] text-base",
    size === "2xl" && "h-[72px] text-2xl",
    mode === "text-only" && !isDisabled && "px-0",
    mode !== "text-only" && "border-b-4 transition-transform duration-2000",
    mode !== "text-only" &&
      !isDisabled &&
      "focus:outline-2 focus:outline-main-blue-300",
    mode !== "text-only" &&
      !isDisabled &&
      "active:transform active:translate-y-1",
    mode !== "text-only" && mode === "outline" && !isDisabled
      ? "active:border-b-2"
      : !isDisabled && "active:border-b-0",
    isDisabled &&
      "active:border-b-4 bg-opacity-50 border-opacity-20 text-opacity-50 cursor-not-allowed",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      disabled={isDisabled}
      id={id}
      type={type}
      className={buttonClass}
      onClick={onClick}
    >
      {label}
      {icon ? <div className={iconClassName || "ml-3"}>{icon}</div> : null}
    </button>
  );
};

export default Buttons;
