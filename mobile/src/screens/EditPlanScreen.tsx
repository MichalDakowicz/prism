import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "../state/AppStore";
import { PlanEditor } from "../components/PlanEditor";
import { Empty, Screen } from "../components/ui";
import { savePlan } from "../domain/plans";
export default function EditPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { data, commit, saving, notify } = useStore(),
    router = useRouter();
  const plan = data.plans.find((x) => x.id === id);
  if (!plan)
    return (
      <Screen title="PLAN" back>
        <Empty title="PLAN NOT FOUND" body="Choose a saved plan from Plans." />
      </Screen>
    );
  return (
    <PlanEditor
      initialPlan={plan}
      busy={saving}
      onCancel={() => router.back()}
      onSave={async (draft) => {
        await commit((current) => {
          const latest = current.plans.find((x) => x.id === plan.id);
          if (latest?.revision !== plan.revision)
            throw new Error(
              "This plan changed while editing. Reopen the editor.",
            );
          return savePlan(current, draft);
        });
        notify("Plan saved.");
        router.back();
      }}
    />
  );
}
