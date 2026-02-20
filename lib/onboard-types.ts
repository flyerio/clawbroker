export type OnboardStepId = "account" | "assign" | "start" | "configure";
export type StepStatus = "pending" | "running" | "done" | "error";

export interface OnboardStep {
  id: OnboardStepId;
  label: string;
  doneLabel: string;
  endpoint: string;
}

export const ONBOARD_STEPS: OnboardStep[] = [
  { id: "account", label: "Creating account...", doneLabel: "Account created", endpoint: "/api/onboard/account" },
  { id: "assign", label: "Assigning agent...", doneLabel: "Agent assigned", endpoint: "/api/onboard/assign" },
  { id: "start", label: "Starting VM...", doneLabel: "VM started", endpoint: "/api/onboard/start" },
  { id: "configure", label: "Configuring agent...", doneLabel: "Agent configured", endpoint: "/api/onboard/configure" },
];
