const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format, compareAsc } = require("date-fns");
var isMatch = require("date-fns/isMatch");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
var isValid = require("date-fns/isValid");
var isExists = require("date-fns/isExists");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const dbObjectToResponseOb = (ob) => {
  return {
    id: ob.id,
    todo: ob.todo,
    priority: ob.priority,
    status: ob.status,
    category: ob.category,
    dueDate: ob.due_date,
  };
};

//API1
//get all rows whose status is TO DO
let statusArray = ["TO DO", "IN PROGRESS", "DONE"];
let priorityArray = ["LOW", "MEDIUM", "HIGH"];
let categoryArray = ["WORK", "HOME", "LEARNING"];
app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;

  if (status != "" && priority === "") {
    if (statusArray.includes(status)) {
      const getStatusQuery = `
              SELECT * FROM todo
              WHERE status='${status}';`;
      const todoStatus = await db.all(getStatusQuery);
      response.send(todoStatus.map((ob) => dbObjectToResponseOb(ob)));
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (status === "" && priority != "") {
    if (priorityArray.includes(priority)) {
      const getStatusQuery = `
    SELECT * FROM todo
    WHERE priority='${priority}';`;
      const todoPriority = await db.all(getStatusQuery);
      response.send(todoPriority.map((ob) => dbObjectToResponseOb(ob)));
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (status != "" && priority != "") {
    if (statusArray.includes(status)) {
      if (priorityArray.includes(priority)) {
        const getStatusQuery = `
                SELECT * FROM todo
                WHERE priority='${priority}' AND status='${status}' ;`;
        const todoPriority = await db.all(getStatusQuery);

        response.send(todoPriority.map((ob) => dbObjectToResponseOb(ob)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (status !== "" && category !== "") {
    if (statusArray.includes(status)) {
      if (categoryArray.includes(category)) {
        const getStatusQuery = `
                    SELECT * FROM todo
                    WHERE category='${category}' AND status='${status}' ;`;
        const todoPriority = await db.all(getStatusQuery);
        response.send(todoPriority.map((ob) => dbObjectToResponseOb(ob)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== "" && category !== "") {
    if (categoryArray.includes(category)) {
      if (priorityArray.includes(priority)) {
        const getStatusQuery = `
                SELECT * FROM todo
                WHERE category='${category}' AND priority='${priority}' ;`;
        const todoPriority = await db.all(getStatusQuery);
        response.send(todoPriority.map((ob) => dbObjectToResponseOb(ob)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (category != "") {
    if (categoryArray.includes(category)) {
      const getStatusQuery = `
    SELECT * FROM todo
    WHERE  category='${category}';`;
      const todoPriority = await db.all(getStatusQuery);
      response.send(todoPriority.map((ob) => dbObjectToResponseOb(ob)));
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (search_q != "") {
    const getStatusQuery = `
    SELECT * FROM todo
    WHERE todo like '%${search_q}%';`;
    const todoPriority = await db.all(getStatusQuery);
    response.send(todoPriority.map((ob) => dbObjectToResponseOb(ob)));
  }
});
//GET all todo based on todoId
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodosBasedOnTodoId = `
    SELECT * FROM todo
    WHERE id=${todoId};
    `;
  const todoItem = await db.get(getTodosBasedOnTodoId);
  let date = todoItem.due_date;
  let date1 = date.split("-");
  let y = date1[0];
  let m = date1[1] - 1;
  let d = date1[2];
  let due = format(new Date(y, m, d), "yyyy-MM-dd");
  let ob = {
    id: todoItem.id,
    todo: todoItem.todo,
    priority: todoItem.priority,
    status: todoItem.status,
    category: todoItem.category,
    dueDate: due,
  };
  response.send(ob);
});
//agenda
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  let match = isMatch(date, "yyyy-MM-dd");
  console.log(match);

  if (match) {
    let date1 = date.split("-");
    let y = parseInt(date1[0]);
    let m = parseInt(date1[1]);
    let d = parseInt(date1[2]);

    let dateValid = isExists(y, m - 1, d);

    let dueDate = format(new Date(y, m - 1, d), "yyyy-MM-dd");
    const getTodosBasedOnTodoId = `
    SELECT * FROM todo WHERE 
    due_date='${dueDate}'
    ;
    `;
    const todoItem = await db.all(getTodosBasedOnTodoId);
    response.send(todoItem.map((ob) => dbObjectToResponseOb(ob)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
// Post API
app.post("/todos/", async (request, response) => {
  let statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  let priorityArray = ["LOW", "MEDIUM", "HIGH"];
  let categoryArray = ["WORK", "HOME", "LEARNING"];
  const { id, todo, priority, status, category, dueDate } = request.body;
  let match = isMatch(dueDate, "yyyy-MM-dd");
  if (match) {
    let date1 = dueDate.split("-");
    let y = date1[0];
    let m = date1[1] - 1;
    let d = date1[2];
    let due = format(new Date(y, m, d), "yyyy-MM-dd");
    if (statusArray.includes(status)) {
      if (priorityArray.includes(priority)) {
        if (categoryArray.includes(category)) {
          const postQuery = `INSERT INTO
                    todo(id,todo,priority,status,category,due_date)
                    VALUES(
                        ${id},
                        '${todo}',
                        '${priority}',
                        '${status}',
                        '${category}',
                        '${due}'
                        );`;

          await db.run(postQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
//update todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const {
    todo = "",
    priority = "",
    status = "",
    category = "",
    dueDate = "",
  } = request.body;
  if (status != "") {
    if (statusArray.includes(status)) {
      const updateStatusQuery = `
        UPDATE todo 
        SET 
        status='${status}'
        WHERE id=${todoId};'`;
      await db.run(updateStatusQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority != "") {
    if (priorityArray.includes(priority)) {
      const updatePriorityQuery = `UPDATE todo 
        SET 
        priority='${priority}'
        WHERE id=${todoId};`;
      await db.run(updatePriorityQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (todo != "") {
    const updateTodoQuery = `
        UPDATE todo 
        SET 
        todo='${todo}'
        WHERE 
          id=${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (category != "") {
    if (categoryArray.includes(category)) {
      const updateTodoQuery = `
        UPDATE todo 
        SET 
        category='${category}'
        WHERE 
          id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (dueDate != "") {
    let match = isMatch(dueDate, "yyyy-MM-dd");
    if (match) {
      const updateTodoQuery = `
        UPDATE todo 
        SET 
        due_date='${dueDate}'
        WHERE 
          id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);

      response.send("Invalid Due Date");
    }
  }
});
//Delete Todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM todo 
  WHERE id=${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
