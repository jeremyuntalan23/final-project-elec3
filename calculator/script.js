"use strict";

const exprElement = document.getElementById("expr-display");
const valueElement = document.getElementById("value-display");
const buttonContainer = document.getElementById("btn-container");

const calcState = {
  firstOperand: null,
  secondOperand: null,
  currentOperator: null,
  displayValue: "0",
  lastActionWasEquals: false,
  hasError: false,
};

const checkForError = () => {
  return calcState.hasError || calcState.displayValue === "Error";
};

const roundAndFormat = (num) => {
  if (!Number.isFinite(num)) return "Error";
  const rounded = Math.round((num + Number.EPSILON) * 1e12) / 1e12;
  return String(rounded);
};

const parseCurrentInput = () => {
  if (calcState.displayValue === "." || calcState.displayValue === "-.") return 0;
  return Number(calcState.displayValue);
};

const refreshDisplay = () => {
  const expressionParts = [];
  if (calcState.firstOperand !== null) expressionParts.push(roundAndFormat(calcState.firstOperand));
  if (calcState.currentOperator) expressionParts.push(calcState.currentOperator);
  if (calcState.secondOperand !== null && !calcState.lastActionWasEquals) {
    expressionParts.push(roundAndFormat(calcState.secondOperand));
  }

  exprElement.textContent = expressionParts.join(" ");
  valueElement.textContent = calcState.displayValue;
};

const resetCalculator = () => {
  calcState.firstOperand = null;
  calcState.secondOperand = null;
  calcState.currentOperator = null;
  calcState.displayValue = "0";
  calcState.lastActionWasEquals = false;
  calcState.hasError = false;
  refreshDisplay();
};

const clearStateForNewInput = () => {
  if (checkForError() || calcState.lastActionWasEquals) {
    calcState.firstOperand = null;
    calcState.secondOperand = null;
    calcState.currentOperator = null;
    calcState.displayValue = "0";
    calcState.lastActionWasEquals = false;
    calcState.hasError = false;
  }
};

const inputDigit = (digit) => {
  clearStateForNewInput();

  if (calcState.displayValue === "0") {
    calcState.displayValue = digit;
  } else if (calcState.displayValue === "-0") {
    calcState.displayValue = "-" + digit;
  } else {
    calcState.displayValue += digit;
  }

  refreshDisplay();
};

const inputDecimal = () => {
  clearStateForNewInput();

  if (!calcState.displayValue.includes(".")) {
    calcState.displayValue += ".";
  }
  refreshDisplay();
};

const invertSign = () => {
  if (checkForError()) return;

  if (calcState.displayValue === "0" || calcState.displayValue === "0.") return;

  if (calcState.displayValue.startsWith("-")) {
    calcState.displayValue = calcState.displayValue.slice(1);
  } else {
    calcState.displayValue = "-" + calcState.displayValue;
  }

  refreshDisplay();
};

const convertToPercent = () => {
  if (checkForError()) return;

  const num = parseCurrentInput();
  const result = num / 100;

  calcState.displayValue = roundAndFormat(result);
  if (calcState.displayValue === "Error") calcState.hasError = true;

  refreshDisplay();
};

const deleteLastChar = () => {
  if (checkForError()) return;

  if (calcState.lastActionWasEquals) return;

  if (
    calcState.displayValue.length <= 1 ||
    (calcState.displayValue.length === 2 && calcState.displayValue.startsWith("-"))
  ) {
    calcState.displayValue = "0";
  } else {
    calcState.displayValue = calcState.displayValue.slice(0, -1);
    if (calcState.displayValue === "-") calcState.displayValue = "0";
  }

  refreshDisplay();
};

const performCalculation = (firstNum, operator, secondNum) => {
  switch (operator) {
    case "+": return firstNum + secondNum;
    case "-": return firstNum - secondNum;
    case "*": return firstNum * secondNum;
    case "/": return secondNum === 0 ? NaN : firstNum / secondNum;
    default: return NaN;
  }
};

const selectOperator = (operator) => {
  if (checkForError()) return;

  const num = parseCurrentInput();

  if (calcState.lastActionWasEquals) {
    calcState.lastActionWasEquals = false;
    calcState.secondOperand = null;
  }

  if (calcState.firstOperand === null) {
    calcState.firstOperand = num;
    calcState.currentOperator = operator;
    calcState.displayValue = "0";
    refreshDisplay();
    return;
  }

  if (calcState.currentOperator && calcState.displayValue !== "0") {
    calcState.secondOperand = num;
    const result = performCalculation(calcState.firstOperand, calcState.currentOperator, calcState.secondOperand);

    if (!Number.isFinite(result)) {
      calcState.displayValue = "Error";
      calcState.hasError = true;
      calcState.firstOperand = null;
      calcState.secondOperand = null;
      calcState.currentOperator = null;
      refreshDisplay();
      return;
    }

    calcState.firstOperand = result;
    calcState.secondOperand = null;
    calcState.currentOperator = operator;
    calcState.displayValue = "0";
    refreshDisplay();
    return;
  }

  calcState.currentOperator = operator;
  refreshDisplay();
};

const calculateResult = () => {
  if (checkForError()) return;
  if (calcState.currentOperator === null || calcState.firstOperand === null) return;

  const num = parseCurrentInput();

  const operand = calcState.lastActionWasEquals
    ? (calcState.secondOperand ?? num)
    : num;

  const result = performCalculation(calcState.firstOperand, calcState.currentOperator, operand);

  if (!Number.isFinite(result)) {
    calcState.displayValue = "Error";
    calcState.hasError = true;
    calcState.firstOperand = null;
    calcState.secondOperand = null;
    calcState.currentOperator = null;
    refreshDisplay();
    return;
  }

  calcState.secondOperand = operand;
  calcState.firstOperand = result;
  calcState.displayValue = roundAndFormat(result);
  calcState.lastActionWasEquals = true;
  refreshDisplay();
};

buttonContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.number) inputDigit(button.dataset.number);
  else if (button.dataset.operator) selectOperator(button.dataset.operator);
  else if (button.dataset.cmd === "dot") inputDecimal();
  else if (button.dataset.cmd === "clear") resetCalculator();
  else if (button.dataset.cmd === "backspace") deleteLastChar();
  else if (button.dataset.cmd === "sign") invertSign();
  else if (button.dataset.cmd === "percent") convertToPercent();
  else if (button.dataset.cmd === "equals") calculateResult();
});

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (key >= "0" && key <= "9") return inputDigit(key);
  if (key === ".") return inputDecimal();
  if (key === "Enter" || key === "=") { event.preventDefault(); return calculateResult(); }
  if (key === "Backspace" || key === "Delete") return deleteLastChar();
  if (key === "Escape") return resetCalculator();

  if (key === "+" || key === "-" || key === "*" || key === "/") return selectOperator(key);
});

resetCalculator();
