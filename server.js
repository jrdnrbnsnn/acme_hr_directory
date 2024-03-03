const pg = require("pg");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});
app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees ORDER BY created_at DESC`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});
app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
    INSERT INTO employees(name, department_id)
    VALUES($1, $2)
    RETURNING *
    `;
    const { name, department_id } = req.body;
    const response = await client.query(SQL, [name, department_id]);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});
app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
    UPDATE employees
    SET name=$1, department_id=$2, updated_at= now()
    WHERE id=$3
    RETURNING *
    `;
    const { name, department_id } = req.body;
    const response = await client.query(SQL, [
      name,
      department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
    DELETE FROM employees
    WHERE id =$1
    `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  res.status(500).send({ error: err.message });
});

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);

async function init() {
  client.connect();
  const SQL = `
  DROP TABLE IF EXISTS employees;
  DROP TABLE IF EXISTS departments;

  CREATE TABLE departments(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL
  );

  INSERT INTO departments(name) VALUES('HR');
  INSERT INTO departments(name) VALUES('Accounting');
  INSERT INTO departments(name) VALUES('Marketing');
  INSERT INTO departments(name) VALUES('Software Engineering');
  
  INSERT INTO employees(name, department_id)
  VALUES('John Doe', (SELECT id FROM departments WHERE name = 'HR'));

  INSERT INTO employees(name, department_id)
  VALUES('Jane Doe', (SELECT id FROM departments WHERE name = 'Accounting'));

  INSERT INTO employees(name, department_id)
  VALUES('Mike Watts', (SELECT id FROM departments WHERE name = 'Marketing'));

  INSERT INTO employees(name, department_id)
  VALUES('Jordan Robinson', (SELECT id FROM departments WHERE name = 'Software Engineering'));
  `;

  await client.query(SQL);
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

init();
