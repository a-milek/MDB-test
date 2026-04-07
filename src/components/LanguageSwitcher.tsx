import React from "react";

type LanguageSwitcherProps = {
  locale: "pl" | "en";
  onChange: (newLocale: "pl" | "en") => void;
};

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  locale,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as "pl" | "en");
  };

  return (
    <select value={locale} onChange={handleChange}>
      <option value="pl"> Polski</option>
      <option value="en"> English</option>
    </select>
  );
};

export default LanguageSwitcher;
