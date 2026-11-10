import test from "node:test";
import assert from "node:assert/strict";
import { passwordStrength, validateIdentifier, validateNewPassword, validateSignIn } from "../modules/auth/schemas/auth.ts";

test("work email and employee IDs are accepted without changing employee ID case", () => {
  for (const value of ["alex@company.com", "  alex@company.com  ", "IF-2048", "employee_7", "00248"]) assert.equal(validateIdentifier(value), undefined);
  const result = validateSignIn({ email: "  IF-Ab12  ", password: "sample" });
  assert.equal(result.success, true);
  assert.equal(result.value.email, "IF-Ab12");
});

test("missing and malformed identifiers are rejected", () => {
  for (const value of ["", "  ", "alex@company", "alex@@company.com", "employee id", "a".repeat(65)]) assert.ok(validateIdentifier(value));
});

test("password creation accepts both length boundaries", () => {
  for (const password of ["Abcdef1!", "Abcdefghijklm1!"]) {
    assert.equal(validateNewPassword(password, password).success, true);
  }
});

test("password creation rejects lengths outside 8–15 and missing character categories", () => {
  for (const password of ["Abcde1!", "Abcdefghijklmn1!x", "abcdef1!", "ABCDEF1!", "Abcdefgh!", "Abcdefg1"]) {
    const result = validateNewPassword(password, password);
    assert.equal(result.success, false);
    assert.ok(result.errors.password);
  }
});

test("confirmation must match; sign-in does not impose the new-password policy", () => {
  const result = validateNewPassword("Abcdef1!", "Abcdef2!");
  assert.equal(result.success, false);
  assert.ok(result.errors.confirmation);
  assert.equal(validateSignIn({ email: "IF-2048", password: "older-password" }).success, true);
  assert.equal(validateSignIn({ email: "IF-2048", password: "" }).success, false);
});

test("strength feedback advances with variety and length, and flags repetition", () => {
  assert.equal(passwordStrength("").score, 0);
  assert.equal(passwordStrength("Ab1!").label, "Weak");
  assert.equal(passwordStrength("abcdefghijklm").label, "Fair");
  assert.equal(passwordStrength("Abcdef1!").label, "Good");
  assert.equal(passwordStrength("BlueRiver7!Q").label, "Strong");
  assert.equal(passwordStrength("Aaaaaaaa123!").label, "Weak");
});
