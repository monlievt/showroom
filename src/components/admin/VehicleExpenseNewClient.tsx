"use client";

import React from "react";
import {
  VehicleExpensesManager,
  type ExpenseRecord,
  type ExpenseVehicleSummary,
} from "@/components/admin/VehicleExpensesManager";

export function VehicleExpenseNewClient({
  vehicle,
  initialExpenses,
  initialLocked = false,
}: {
  vehicle: ExpenseVehicleSummary;
  initialExpenses?: ExpenseRecord[];
  initialLocked?: boolean;
}) {
  return (
    <VehicleExpensesManager
      vehicle={vehicle}
      initialExpenses={initialExpenses}
      initialLocked={initialLocked}
      mode="page"
    />
  );
}
