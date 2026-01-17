import React from "react";
import Select from "react-select";
import { FaTags } from "react-icons/fa";

const getProductLabel = (code, products) => {
  return products.find((p) => p.code_product === code)?.name_product || "";
};

const selectStyles = {
  control: (base) => ({
    ...base,
    zIndex: 30,
    backgroundColor: "white",
    borderColor: "rgb(209, 213, 219)",
    "&:hover": {
      borderColor: "rgb(99, 102, 241)",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 40,
    position: "absolute",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 50,
  }),
};

const selectClassNames = {
  control: (state) =>
    `rounded-lg border ${
      state.isFocused
        ? "border-blue-500 ring-2 ring-blue-500"
        : "border-gray-300"
    } hover:border-blue-500 p-0.5`,
  option: (state) =>
    `${
      state.isSelected
        ? "bg-blue-500 text-white"
        : state.isFocused
        ? "bg-blue-50 text-gray-700"
        : "text-gray-700"
    } cursor-pointer`,
  menu: () => "rounded-lg border border-gray-200 shadow-lg",
  menuList: () => "rounded-lg py-1",
  input: () => "text-sm",
  placeholder: () => "text-gray-500 text-sm",
  singleValue: () => "text-gray-700 text-sm",
};

const ProductSelect = ({ index, item, products, onChange }) => {
  const value = item.code_product
    ? {
        value: item.code_product,
        label: getProductLabel(item.code_product, products),
      }
    : null;

  const options = products.map((product) => ({
    value: product.code_product,
    label: product.name_product,
  }));

  return (
    <div>
      <label
        htmlFor={`product-${index}`}
        className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"
      >
        <FaTags className="text-gray-500 text-xs" />
        Product
      </label>
      <div className="relative z-20">
        <Select
          id={`product-${index}`}
          value={value}
          onChange={(option) => onChange(index, option?.value || "")}
          options={options}
          placeholder="Search or select product..."
          menuPortalTarget={document.body}
          isClearable
          styles={selectStyles}
          className="text-sm"
          classNames={selectClassNames}
        />
      </div>
    </div>
  );
};

export default ProductSelect;
