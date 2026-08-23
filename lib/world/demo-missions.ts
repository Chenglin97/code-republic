import type { Mission } from "./types";

export function createDemoMissions(): Mission[] {
  return [
    { id: "msn_reproduction", title: "Pin the primitive-array reproduction", capability: "Repository Evidence", status: "available", dependsOn: [] },
    { id: "msn_contract", title: "Define valid resource item shapes", capability: "API Contracts", status: "available", dependsOn: [] },
    { id: "msn_tests", title: "Lock startup regression cases", capability: "Testing", status: "available", dependsOn: [] },
    { id: "msn_validation", title: "Implement fail-fast validation", capability: "TypeScript", status: "blocked", dependsOn: ["msn_reproduction", "msn_contract", "msn_tests"] },
    { id: "msn_diagnostics", title: "Verify actionable diagnostics", capability: "Developer Experience", status: "blocked", dependsOn: ["msn_validation"] },
    { id: "msn_regression", title: "Run object-resource regression suite", capability: "Integration", status: "blocked", dependsOn: ["msn_validation"] },
    { id: "msn_review", title: "Run independent patch review", capability: "Code Review", status: "blocked", dependsOn: ["msn_diagnostics", "msn_regression"] },
    { id: "msn_release", title: "Run clean-checkout verifier", capability: "Release", status: "blocked", dependsOn: ["msn_review"] },
  ];
}
