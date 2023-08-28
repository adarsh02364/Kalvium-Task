const fs = require('fs').promises;
const express = require('express');

const app = express();
const PORT = 3005;
const HISTORY_FILE = 'history.json';
const MAX_HISTORY_LENGTH = 20;

let history = [];

async function loadHistory() {
  try {
    const fileData = await fs.readFile(HISTORY_FILE, 'utf8');
    history = JSON.parse(fileData);
  } catch (error) {
    history = [];
  }
}

async function saveHistory() {
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history), 'utf8');
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/:operand1/:operator/:operand2', (req, res) => {
  const { operand1, operand2, operator } = req.params;

  const parsedOperand1 = parseFloat(operand1);
  const parsedOperand2 = parseFloat(operand2);

  if (isNaN(parsedOperand1) || isNaN(parsedOperand2)) {
    return res.status(400).json({ error: 'Invalid operands' });
  }

  let result;
  switch (operator) {
    case 'plus':
      result = parsedOperand1 + parsedOperand2;
      break;
    case 'minus':
      result = parsedOperand1 - parsedOperand2;
      break;
    case 'multiply':
      result = parsedOperand1 * parsedOperand2;
      break;
    case 'divide':
      if (parsedOperand2 === 0) {
        return res.status(400).json({ error: 'Division by zero' });
      }
      result = parsedOperand1 / parsedOperand2;
      break;
    default:
      return res.status(400).json({ error: 'Invalid operator' });
  }

  const question = `${parsedOperand1} ${operator} ${parsedOperand2}`;
  history.push(question);

  if (history.length > MAX_HISTORY_LENGTH) {
    history.shift();
  }

  saveHistory();
  res.json({ question, answer: result });
});

app.get('/history', async (req, res) => {
  await loadHistory();

  const htmlList = history.map(item => `<li>${item}</li>`).join('');

  const htmlResponse = `
    <html>
      <head><title>History of Operations</title></head>
      <body>
        <h1>History of Operations</h1>
        <ul>
          ${htmlList}
        </ul>
      </body>
    </html>
  `;

  res.send(htmlResponse);
});

app.listen(PORT, async () => {
  await loadHistory();
  console.log(`Server is running on port ${PORT}`);
});