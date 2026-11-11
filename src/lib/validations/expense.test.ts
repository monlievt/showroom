import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ExpenseCategoryEnum,
  createExpenseSchema,
  updateExpenseSchema,
} from "./expense";
import {
  EXPENSE_CATEGORIES,
  getExpenseCategoryLabel,
  getExpenseCategoryShortLabel,
} from "../constants/expense-categories";

describe("Expense Validation & Category Metadata", () => {
  it("memvalidasi seluruh kategori enum memiliki label dan metadata lengkap", () => {
    const enumValues = ExpenseCategoryEnum.options;
    const mappedValues = EXPENSE_CATEGORIES.map((c) => c.value);

    assert.deepEqual(new Set(mappedValues), new Set(enumValues));
    assert.equal(EXPENSE_CATEGORIES.length, enumValues.length);

    for (const code of enumValues) {
      assert.ok(getExpenseCategoryShortLabel(code).length > 0);
      assert.ok(getExpenseCategoryLabel(code).length > 0);
    }
  });

  it("menerima input valid pada createExpenseSchema dan updateExpenseSchema", () => {
    const validId = "550e8400-e29b-41d4-a716-446655440000";

    const created = createExpenseSchema.parse({
      vehicleId: validId,
      category: "OIL_AND_SERVICE",
      vendorName: "Bengkel Maju",
      amount: "350000",
      date: "2026-11-11",
      notes: "Ganti oli mesin",
    });
    assert.equal(created.amount, 350000);

    const updated = updateExpenseSchema.parse({
      expenseId: validId,
      category: "BODY_PAINT",
      vendorName: null,
      amount: 1250000,
      date: "2026-11-11",
      notes: "Cat spet bumper",
      receiptUrl: JSON.stringify(["/uploads/vehicles/1/receipt/nota.jpg"]),
    });
    assert.equal(updated.expenseId, validId);
    assert.equal(updated.amount, 1250000);
  });

  it("menolak nominal biaya <= 0 atau ID tidak valid pada updateExpenseSchema", () => {
    assert.throws(() =>
      updateExpenseSchema.parse({
        expenseId: "bukan-uuid",
        category: "OTHER",
        amount: 50000,
      })
    );

    assert.throws(() =>
      updateExpenseSchema.parse({
        expenseId: "550e8400-e29b-41d4-a716-446655440000",
        category: "OTHER",
        amount: 0,
      })
    );
  });
});

