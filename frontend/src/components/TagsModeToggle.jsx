import { useTranslation } from "react-i18next";

import SegmentedControl from "@/components/SegmentedControl";

export default function TagsModeToggle({ value, onChange }) {
    const { t } = useTranslation();

    return (
        <SegmentedControl
            label={t("tagsModeToggle.label")}
            value={value}
            onChange={onChange}
            className="w-full md:w-auto"
            options={[
                {
                    value: "any",
                    label: t("tagsModeToggle.any"),
                    title: t("tagsModeToggle.matchAny"),
                },
                {
                    value: "all",
                    label: t("tagsModeToggle.all"),
                    title: t("tagsModeToggle.matchAll"),
                },
            ]}
        />
    );
}
