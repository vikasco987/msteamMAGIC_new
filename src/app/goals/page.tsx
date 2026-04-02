import GoalForm from "../components/forms/GoalForm";

export default function GoalsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Set Monthly/Weekly Goals</h1>
      <GoalForm />
    </div>
  );
}
