const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//converting states db object to response object
const convertStateDBObjectToResponseObject = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};

//converting districts db object to response object
const convertDistrictDBObjectToResponseObject = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

//API 1 ***  Path: /states/  *** Method: GET
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    select * from state order by state_name;`;
  const statesArray = await db.all(getStatesQuery);
  /*response.send({
    stateId: statesArray["state_id"],
    stateName: statesArray["state_name"],
    population: statesArray["population"],
  });*/
  response.send(
    statesArray.map((eachState) =>
      convertStateDBObjectToResponseObject(eachState)
    )
  );
});

//API *** 2 Path: /states/:stateId/ *** Method: GET
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `select * from state where state_id=${stateId};`;
  const state = await db.get(getStateQuery);
  response.send({
    StateId: state["state_id"],
    stateName: state["state_name"],
    population: state["population"],
  });
  //response.send(state);
});

//API 3 *** Path: /districts/ *** Method: POST
/*app.post("/districts/", async (request, response) => {
  const {
    district_name,
    state_id,
    cases,
    cured,
    active,
    deaths,
  } = request.body;
  const insertDistrictQuery = `
    insert into district (district_name,state_id,cases,cured,active,deaths)
        values('${district_name}',${state_id},${cases},${cured},${active},${deaths});
    `;
  const postResult = await db.run(insertDistrictQuery);
  response.send("District Successfully Added", postResult.lastID);
});*/

// app.post("/districts/", async (request, response) => {
//   const { districtName, stateId, cases, cured, active, deaths } = request.body;
//   const postDistrictQuery = `
//   INSERT INTO
//     district ( district_name, state_id, cases, cured, active, deaths)
//   VALUES
//     ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
//   const res = await db.run(postDistrictQuery);
//   response.send("District Successfully Added");
// });

// get api-4 districts/:districtId/
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    select * from district where district_id=${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

//api-4.1 all districts
app.get("/districts/", async (request, response) => {
  const getDistrictsQuery = `
    select * from district order by district_id;`;
  const districtsArray = await db.all(getDistrictsQuery);
  response.send(
    districtsArray.map((eachDistrict) =>
      convertDistrictDBObjectToResponseObject(eachDistrict)
    )
  );
  //response.send(districtsArray);
});

//API 5 *** Path: /districts/:districtId/ *** Method: DELETE
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const delDistrictQuery = `
    delete from district where district_id=${districtId};`;
  const delResult = await db.run(delDistrictQuery);
  response.send("District Removed");
});

//API-3 inserting new district.
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  insert into district (district_name,state_id,cases,cured,active,deaths)
  values('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
  `;
  const postResult = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API 6 *** Path: /districts/:districtId/ *** Method: PUT
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const putDistrictQuery = `
    update district
    set
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    where district_id=${districtId};
    `;
  const putResult = await db.run(putDistrictQuery);
  response.send("District Details Updated");
});

//API 7 *** Path: /states/:stateId/stats/
//Method: GET
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    select SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
     from district where state_id=${stateId};
    `;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API-8 Path: /districts/:districtId/details/
//Method: GET
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
    select state_name from state
    natural join district
    where district_id=${districtId};
    `;
  const getStateArray = await db.get(getStateQuery);
  response.send({ stateName: getStateArray.state_name });
});

module.exports = app;
