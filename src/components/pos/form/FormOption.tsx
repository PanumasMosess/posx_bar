"use client";

import { useTranslation } from "@/lib/language/LanguageContext";

export default function FormOption({
  currentOption,
  setCurrentOption,
  saveOptionGroup,
  setActiveModal,
}: any) {
  const { t } = useTranslation();
  const addChoiceRow = () =>
    setCurrentOption({
      ...currentOption,
      choices: [...currentOption.choices, { name: "", priceAdd: "0" }],
    });

  const updateChoice = (index: number, field: string, value: string) => {
    const newChoices = [...currentOption.choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setCurrentOption({ ...currentOption, choices: newChoices });
  };

  return (
    <>
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-slate-800">{t("product_form.create_option_group")}</h2>
      </div>
      <div className="p-5 overflow-y-auto custom-scroll space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t("product_form.group_name")}
          </label>
          <input
            required
            autoFocus
            type="text"
            value={currentOption.name}
            onChange={(e) =>
              setCurrentOption({ ...currentOption, name: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 bg-white placeholder:text-slate-400"
            placeholder={t("product_form.group_name_placeholder")}
          />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-900">
            <input
              type="checkbox"
              checked={currentOption.isRequired}
              onChange={(e) =>
                setCurrentOption({
                  ...currentOption,
                  isRequired: e.target.checked,
                })
              }
              className="rounded text-sky-600"
            />{" "}
            {t("product_form.required_choice")}
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-900">
            <input
              type="checkbox"
              checked={currentOption.allowMultiple}
              onChange={(e) =>
                setCurrentOption({
                  ...currentOption,
                  allowMultiple: e.target.checked,
                })
              }
              className="rounded text-sky-600"
            />{" "}
            {t("pos.choose_multiple")}
          </label>
        </div>
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t("product_form.sub_options")}
          </label>
          <div className="space-y-2">
            {currentOption.choices.map((choice: any, i: number) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t("product_form.sub_option_name_placeholder")}
                  value={choice.name}
                  onChange={(e) => updateChoice(i, "name", e.target.value)}
                  className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 bg-white placeholder:text-slate-400"
                />
                <input
                  type="number"
                  placeholder={t("product_form.sub_option_price_placeholder")}
                  value={choice.priceAdd}
                  onChange={(e) => updateChoice(i, "priceAdd", e.target.value)}
                  className="w-24 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addChoiceRow}
            className="mt-3 text-sm text-sky-600 font-medium hover:underline"
          >
            {t("product_form.add_sub_option_row")}
          </button>
        </div>
        <div className="pt-6 flex gap-3 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveModal("ADD_PRODUCT")}
            className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
          >
            {t("common.back")}
          </button>
          <button
            type="button"
            onClick={saveOptionGroup}
            disabled={!currentOption.name}
            className="flex-1 py-2 bg-sky-600 text-white rounded-xl font-bold disabled:opacity-50"
          >
            {t("product_form.confirm_option_group")}
          </button>
        </div>
      </div>
    </>
  );
}
